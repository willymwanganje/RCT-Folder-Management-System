import { fileUrl } from "../services/api";

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

export default function Avatar({ user, size = 36 }) {
  const src = fileUrl(user?.profilePhotoUrl);
  if (src) {
    return (
      <img
        className="avatar"
        src={src}
        alt={user?.fullName || "User"}
        width={size}
        height={size}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span className="avatar avatar-fallback" style={{ width: size, height: size, fontSize: size * 0.34 }}>
      {initials(user?.fullName) || "U"}
    </span>
  );
}
