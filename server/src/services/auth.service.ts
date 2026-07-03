import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, UserRole } from "@prisma/client";
import { UserRepository } from "../repositories/UserRepository";
import { RegisterInput, LoginInput } from "../validators/auth.validator";
import { AppError } from "../helpers/app-error";
import { env } from "../config/env";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUserPayload {
  id: string;
  email: string;
  role: UserRole;
}

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Register a new User and their profile type.
   */
  async register(input: RegisterInput): Promise<{ user: User; tokens: AuthTokens }> {
    // 1. Check if user already exists
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw AppError.conflict("A user with this email address already exists");
    }

    // 2. Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(input.password, saltRounds);

    // 3. Save the user and profile
    const user = await this.userRepository.create({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone || null,
      avatar: null,
      bio: null,
      role: input.role,
      isActive: true,
      lastLoginAt: null,
    });

    // 4. Generate access & refresh tokens
    const tokens = this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, tokens };
  }

  /**
   * Verify login credentials and generate authentication tokens.
   */
  async login(input: LoginInput): Promise<{ user: User; tokens: AuthTokens }> {
    // 1. Find user by email
    const user = await this.userRepository.findByEmail(input.email);
    if (!user || !user.isActive) {
      // Return generic error message to prevent account enumeration
      throw AppError.unauthorized("Invalid email or password");
    }

    // 2. Validate password
    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw AppError.unauthorized("Invalid email or password");
    }

    // 3. Update last login time asynchronously
    this.userRepository.update(user.id, { lastLoginAt: new Date() }).catch((err) => {
      // Log error but do not block successful login
      console.error(`Failed to update lastLoginAt for user ${user.id}:`, err);
    });

    // 4. Generate tokens
    const tokens = this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, tokens };
  }

  /**
   * Re-issue access and refresh tokens using a valid refresh token.
   */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    try {
      // 1. Verify the refresh token signature and expiry
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as AuthUserPayload;

      // 2. Ensure the user still exists and is active
      const user = await this.userRepository.findById(decoded.id);
      if (!user || !user.isActive) {
        throw AppError.unauthorized("User is inactive or no longer exists");
      }

      // 3. Issue new access and refresh token pair (Refresh Token Rotation)
      return this.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
      });
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw AppError.unauthorized("Invalid or expired refresh token");
    }
  }

  /**
   * Helper to sign access and refresh tokens.
   */
  private generateTokens(payload: AuthUserPayload): AuthTokens {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    });

    return { accessToken, refreshToken };
  }
}
