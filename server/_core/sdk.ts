/**
 * Auth SDK — DB-based email/password authentication.
 * All Manus OAuth (OAUTH_SERVER_URL, ExchangeToken, GetUserInfo) has been removed.
 * Session tokens are signed/verified locally using JWT_SECRET.
 */
import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import { ForbiddenError } from "@shared/_core/errors";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// Utility
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  /** DB user id (numeric) stored as string for JWT compatibility */
  userId: string;
  /** User's email for display */
  email: string;
  /** User role */
  role: string;
};

/** Result of `sdk.authenticateRequest`. */
export type AuthenticatedUser = User;

class SDKServer {
  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }
    return new TextEncoder().encode(secret);
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) return new Map<string, string>();
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  /**
   * Sign a session JWT for the given user.
   * Stores userId + email + role so we can look up the DB user on each request.
   */
  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  /**
   * Verify a session JWT and return its payload, or null if invalid/expired.
   */
  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<SessionPayload | null> {
    if (!cookieValue) {
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { userId, email, role } = payload as Record<string, unknown>;

      if (!isNonEmptyString(userId) || !isNonEmptyString(email)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }

      return {
        userId,
        email,
        role: isNonEmptyString(role) ? role : "user",
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  /**
   * Authenticate an incoming Express request.
   * Reads the session cookie (or Authorization Bearer header as fallback),
   * verifies the JWT, and loads the user from the database.
   */
  async authenticateRequest(req: Request): Promise<AuthenticatedUser> {
    // 1. Prefer the session cookie
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);

    // 2. Fallback: Authorization: Bearer <token> header
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }

    const session = await this.verifySession(sessionToken);

    if (!session) {
      throw ForbiddenError("Invalid or missing session");
    }

    const userId = parseInt(session.userId, 10);
    if (isNaN(userId)) {
      throw ForbiddenError("Invalid session: bad userId");
    }

    const user = await db.getUserById(userId);

    if (!user) {
      throw ForbiddenError("User not found");
    }

    return user;
  }
}

export const sdk = new SDKServer();
