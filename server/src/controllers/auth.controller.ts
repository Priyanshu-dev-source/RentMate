import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AuthService } from "../services/auth.service";
import { ApiResponse } from "../utils/api-response";

const authService = new AuthService();

export class AuthController {
  /**
   * Handle user registration.
   */
  static async register(req: Request, res: Response): Promise<Response> {
    const { user, tokens } = await authService.register(req.body);

    return ApiResponse.success({
      res,
      statusCode: StatusCodes.CREATED,
      message: "Registration successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        tokens,
      },
    });
  }

  /**
   * Handle user login.
   */
  static async login(req: Request, res: Response): Promise<Response> {
    const { user, tokens } = await authService.login(req.body);

    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        tokens,
      },
    });
  }

  /**
   * Handle refresh token rotation.
   */
  static async refresh(req: Request, res: Response): Promise<Response> {
    const tokens = await authService.refresh(req.body.refreshToken);

    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "Token refreshed successfully",
      data: tokens,
    });
  }

  /**
   * Handle logging out.
   * Stateless token invalidation occurs client-side. This endpoint
   * returns a standardized confirmation.
   */
  static async logout(_req: Request, res: Response): Promise<Response> {
    return ApiResponse.success({
      res,
      statusCode: StatusCodes.OK,
      message: "Logout successful",
      data: null,
    });
  }
}
