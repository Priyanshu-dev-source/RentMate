/**
 * Express Request Augmentation.
 *
 * WHY THIS EXISTS:
 * After JWT authentication, we attach the decoded user payload to `req.user`.
 * TypeScript doesn't know about this custom property. This declaration
 * merges our custom type into Express's Request interface globally.
 */

export interface AuthUser {
  id: string;
  email: string;
  role: "OWNER" | "TENANT" | "ADMIN";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// This export is required to make this a module (not a script)
export {};
