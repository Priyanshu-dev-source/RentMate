/**
 * Shared API type definitions.
 *
 * These types define the contract between server and client.
 * They can be extracted to a shared package later if needed.
 */

// ── Standard API Response ──────────────────────────────────────────

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  errors: null;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  data: null;
  errors: Record<string, unknown> | null;
}

export type ApiResponseType<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ── Pagination ─────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// ── Query Parameters ───────────────────────────────────────────────

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ── User Roles ─────────────────────────────────────────────────────

export enum UserRole {
  OWNER = "OWNER",
  TENANT = "TENANT",
  ADMIN = "ADMIN",
}

// ── Listing Status ─────────────────────────────────────────────────

export enum ListingStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  FILLED = "FILLED",
  ARCHIVED = "ARCHIVED",
}

// ── Interest Status ────────────────────────────────────────────────

export enum InterestStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  WITHDRAWN = "WITHDRAWN",
}
