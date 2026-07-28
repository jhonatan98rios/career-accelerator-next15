// GA4 analytics via GTM dataLayer
// ponytail: just push to existing dataLayer, no wrapper lib needed

export type NavType =
  | "header"
  | "sidebar"
  | "hero"
  | "pricing"
  | "cta"
  | "footer"
  | "gateway"
  | "terms";

interface NavClickParams {
  nav_type: NavType;
  nav_label: string;
  nav_url: string;
  page_location: string;
}

interface Ga4Event {
  event: string;
  [key: string]: unknown;
}

function pushEvent(payload: Ga4Event): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}

export function trackNavClick(params: NavClickParams): void {
  pushEvent({ event: "nav_click", ...params });
}
