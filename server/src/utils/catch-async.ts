import { Request, Response, NextFunction } from "express";

/**
 * Catch Async Wrapper.
 *
 * WHY THIS EXISTS:
 * Express doesn't catch errors thrown in async route handlers.
 * Without this wrapper, every async controller would need its own
 * try/catch block forwarding to next(). This eliminates that
 * boilerplate entirely.
 *
 * USAGE:
 *   router.get('/users', catchAsync(userController.getAll));
 *
 * Instead of:
 *   router.get('/users', async (req, res, next) => {
 *     try { ... } catch (err) { next(err); }
 *   });
 */
type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export const catchAsync = (fn: AsyncHandler) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
