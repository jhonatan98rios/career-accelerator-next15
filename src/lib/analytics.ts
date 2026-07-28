// GA4 analytics via GTM dataLayer
// ponytail: just push to existing dataLayer, no wrapper lib needed

export type NavCategory =
  | "header"
  | "sidebar"
  | "hero"
  | "pricing"
  | "cta"
  | "footer"
  | "gateway"
  | "terms";

interface NavClickParams {
  category: NavCategory;
  action: string;
  label: string;
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
