import { cache } from "react";
import { jwtVerify, createRemoteJWKSet, JWTVerifyResult } from 'jose';
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
  }
});

export const getSessionCached = cache(async () => {
  return auth0.getSession();
});


const JWKS = createRemoteJWKSet(
  new URL(`https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`)
);

export async function isAuthenticated(headers: Headers): Promise<JWTVerifyResult["payload"]> {

  try {
    const authHeader = headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Authorization header missing or malformed");
    }

    const token = authHeader.split(" ")[1];
    
    const { payload } = await jwtVerify(token, JWKS, {
      audience: process.env.AUTH0_AUDIENCE,
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    });

    return payload

  } catch (err) {
    await log(LogLevel.ERROR, `Failed to authenticate the user`, {err});
    throw new Error(`Failed to authenticate the user: ${err}`);
  }
}
