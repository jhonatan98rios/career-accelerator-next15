import { cache } from "react";
import { jwtVerify, createRemoteJWKSet, JWTVerifyResult } from "jose";
import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { log, LogLevel } from "./logger";

// Initialize the Auth0 client
export const auth0 = new Auth0Client({
  // Options are loaded from environment variables by default
  // Ensure necessary environment variables are properly set
  // domain: process.env.AUTH0_DOMAIN,
  // clientId: process.env.AUTH0_CLIENT_ID,
  // clientSecret: process.env.AUTH0_CLIENT_SECRET,
  // appBaseUrl: process.env.APP_BASE_URL,
  // secret: process.env.AUTH0_SECRET,
  authorizationParameters: {
    // In v4, the AUTH0_SCOPE and AUTH0_AUDIENCE environment variables are no longer automatically picked up by the SDK.
    // Instead, we need to provide the values explicitly.
    scope: process.env.AUTH0_SCOPE,
    audience: process.env.AUTH0_AUDIENCE,
  },
});

export const getSessionCached = cache(async () => {
  return auth0.getSession();
});

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: "token_expired" | "token_missing" | "token_invalid"
  ) {
    super(message);
    this.name = "AuthError";
  }
}

const JWKS = createRemoteJWKSet(
  new URL(`https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`)
);

export async function isAuthenticated(headers: Headers): Promise<JWTVerifyResult["payload"]> {
  try {
    const authHeader = headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthError("Authorization header missing or malformed", "token_missing");
    }

    const token = authHeader.split(" ")[1];

    const { payload } = await jwtVerify(token, JWKS, {
      audience: process.env.AUTH0_AUDIENCE,
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    });

    return payload;
  } catch (err) {
    if (err instanceof AuthError) throw err;

    const message = err instanceof Error ? err.message : String(err);
    const code = message.includes('"exp" claim timestamp check failed')
      ? "token_expired"
      : "token_invalid";

    await log(LogLevel.ERROR, "Failed to authenticate the user", {
      authError: message,
      code,
      hasAuthHeader: !!headers.get("Authorization"),
    });
    throw new AuthError(
      `Failed to authenticate the user: ${message}`,
      code as "token_expired" | "token_invalid"
    );
  }
}
