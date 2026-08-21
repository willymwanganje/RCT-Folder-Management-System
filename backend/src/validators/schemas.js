const { z } = require("zod");
const ApiError = require("../utils/ApiError");

function validate(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });
    if (!parsed.success) {
      return next(parsed.error);
    }
    req.validated = parsed.data;
    if (parsed.data.body) req.body = parsed.data.body;
    if (parsed.data.params) req.params = parsed.data.params;
    if (parsed.data.query) req.query = parsed.data.query;
    next();
  };
}

const email = z.string().email().transform((v) => v.toLowerCase().trim());

const loginSchema = z.object({
  body: z.object({
    email,
    password: z.string().min(1),
  }),
});

const forgotSchema = z.object({
  body: z.object({ email }),
});

const resetSchema = z.object({
  body: z.object({
    token: z.string().min(10),
    newPassword: z.string().min(10),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(10),
  }),
});

const userCreateSchema = z.object({
  body: z.object({
    fullName: z.string().min(2),
    email,
    phone: z.string().optional().nullable(),
    password: z.string().min(10),
    roleId: z.string().uuid().optional(),
    permissionOverrides: z
      .array(
        z.object({
          permissionId: z.string().uuid(),
          granted: z.boolean(),
        })
      )
      .optional(),
  }),
});

const userUpdateSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    fullName: z.string().min(2).optional(),
    email: email.optional(),
    phone: z.string().optional().nullable(),
    roleId: z.string().uuid().optional(),
    isActive: z.boolean().optional(),
    permissionOverrides: z
      .array(
        z.object({
          permissionId: z.string().uuid(),
          granted: z.boolean(),
        })
      )
      .optional(),
  }),
});

const idParam = z.object({
  params: z.object({ id: z.string().uuid() }),
});

const categorySchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

const folderSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    parentId: z.string().uuid().optional().nullable(),
    categoryId: z.string().uuid().optional().nullable(),
  }),
});

const documentMetaSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    categoryId: z.string().uuid().optional(),
    folderId: z.string().uuid().optional(),
  }),
});

const paginationQuery = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    q: z.string().optional(),
    search: z.string().optional(),
  }).passthrough(),
});

module.exports = {
  validate,
  ApiError,
  loginSchema,
  forgotSchema,
  resetSchema,
  changePasswordSchema,
  userCreateSchema,
  userUpdateSchema,
  idParam,
  categorySchema,
  folderSchema,
  documentMetaSchema,
  paginationQuery,
};
