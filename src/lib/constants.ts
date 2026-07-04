export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.aceler-ai.com";
export const STRIPE_CHECKOUT_SUCCESS_URL = `${APP_URL}/gateway?checkout=success`;
export const STRIPE_CHECKOUT_CANCEL_URL = `${APP_URL}/gateway?checkout=cancelled`;
