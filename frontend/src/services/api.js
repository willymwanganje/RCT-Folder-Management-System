const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

export function fileUrl(pathOrUrl) {
  if (!pathOrUrl) return null;

  if (pathOrUrl.startsWith("http")) {
    return pathOrUrl;
  }

  return `${API_URL}${pathOrUrl}`;
}

export function getToken() {
  return localStorage.getItem("rct_token");
}

export function setToken(token) {
  if (token) {
    localStorage.setItem("rct_token", token);
  } else {
    localStorage.removeItem("rct_token");
  }
}

async function request(
  path,
  { method = "GET", body, isForm = false } = {}
) {
  const headers = {};
  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Do not set Content-Type manually for FormData.
  if (!isForm) {
    headers["Content-Type"] = "application/json";
  }

  let res;

  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: isForm
        ? body
        : body
          ? JSON.stringify(body)
          : undefined,
    });
  } catch (err) {
    const error = new Error(
      "Unable to connect to the server. Please check your connection and try again."
    );

    error.cause = err;
    throw error;
  }

  const contentType = res.headers.get("content-type") || "";

  /*
   * Backend response format:
   *
   * {
   *   success: true,
   *   message: "Signed in",
   *   data: {...}
   * }
   *
   * Therefore the frontend should receive:
   *
   * res.data
   *   -> token
   *   -> user
   */
  if (contentType.includes("application/json")) {
    const json = await res.json();

    if (!res.ok || json.success === false) {
      const error = new Error(
        json?.message ||
        json?.error ||
        "Request failed"
      );

      error.status = res.status;
      error.payload = json;

      throw error;
    }

    return {
      data: json.data,
      message: json.message,
      success: json.success,
      status: res.status,
    };
  }

  if (!res.ok) {
    const error = new Error(
      `Request failed with status ${res.status}`
    );

    error.status = res.status;
    throw error;
  }

  return {
    data: res,
    status: res.status,
  };
}

export const api = {
  get: (path) =>
    request(path, {
      method: "GET",
    }),

  post: (path, body) =>
    request(path, {
      method: "POST",
      body,
    }),

  put: (path, body) =>
    request(path, {
      method: "PUT",
      body,
    }),

  del: (path) =>
    request(path, {
      method: "DELETE",
    }),

  postForm: (path, formData) =>
    request(path, {
      method: "POST",
      body: formData,
      isForm: true,
    }),

  download: async (path, filename) => {
    const token = getToken();

    const res = await fetch(`${API_URL}${path}`, {
      method: "GET",
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    });

    if (!res.ok) {
      let message = "Download failed";

      const contentType =
        res.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        try {
          const json = await res.json();
          message = json?.message || message;
        } catch {
          // Keep default error message.
        }
      }

      const error = new Error(message);
      error.status = res.status;

      throw error;
    }

    if (res.redirected) {
      window.open(res.url, "_blank");
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "document";

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  },
};

export { API_URL };