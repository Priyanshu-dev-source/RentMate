import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { StatusCodes } from "http-status-codes";

/**
 * Zod Validation Middleware Factory.
 *
 * WHY MIDDLEWARE FACTORY:
 * - Validates req.body, req.query, or req.params against a Zod schema
 * - Returns field-level errors in the standardized API response format
 * - Strips unknown fields (Zod's default) to prevent injection
 * - Replaces the parsed (typed, coerced) data back onto the request
 *
 * USAGE:
 *   router.post('/users', validate(createUserSchema), userController.create);
 *   router.get('/users', validate(listQuerySchema, 'query'), userController.list);
 */
type ValidationTarget = "body" | "query" | "params";

export function validate(schema: ZodSchema, target: ValidationTarget = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const fieldErrors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "Validation failed",
        data: null,
        errors: { fields: fieldErrors },
      });
      return;
    }

    // Replace with parsed data (stripped of unknown fields, coerced types)
    req[target] = result.data as typeof req[typeof target];
    next();
  };
}
