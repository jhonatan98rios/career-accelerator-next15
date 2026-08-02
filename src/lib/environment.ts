/**
 * Environment module — single source of truth for dev/prod gating.
 *
 * Loads ENVIRONMENT once at module load into a shared global so any
 * server-side code can gate behavior with the derived booleans:
 *
 *   import { isProduction } from "@/lib/environment";
 *   if (isProduction) { onlyInProd(); }
 *
 * Note: ENVIRONMENT has no NEXT_PUBLIC_ prefix, so it is only available
 * to server code (server components, actions, API routes, lib). Client
 * components cannot see it — pass resolved booleans as props if needed.
 */

export const environment = process.env.ENVIRONMENT ?? "development";

export const isProduction = environment === "production";
export const isDevelopment = environment === "development";
