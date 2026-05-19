import type { H3Event } from "h3";
import { deleteCookie, getCookie, setCookie } from "h3";

export const HITPAY_TOKEN_COOKIE = "hitpay_token";
const MAX_AGE_SECONDS = 60 * 60 * 24;

export type HitpaySession = {
  access_token: string;
  token_type: string;
  scope: string;
  refresh_token: string | null;
  expires_in: number | null;
  business: {
    id: string;
    name?: string | null;
    display_name?: string | null;
    country?: string | null;
    business_type?: string | null;
    currency?: string | null;
  };
};

export function pickBusinessSummary(
  business: Record<string, any> | null | undefined,
): HitpaySession["business"] {
  if (!business?.id) {
    return { id: "" };
  }

  return {
    id: String(business.id),
    name: business.name ?? null,
    display_name: business.display_name ?? null,
    country: business.country ?? null,
    business_type: business.business_type ?? null,
    currency: business.currency ?? null,
  };
}

export function buildHitpaySession(
  token: Record<string, any>,
  business: Record<string, any> | null | undefined,
): HitpaySession {
  return {
    access_token: token.access_token,
    token_type: token.token_type || "Bearer",
    scope: token.scope || "",
    refresh_token: token.refresh_token || null,
    expires_in: token.expires_in ?? null,
    business: pickBusinessSummary(business),
  };
}

export function setHitpaySessionCookie(event: H3Event, session: HitpaySession) {
  const secure = getRequestURL(event).protocol === "https:";

  setCookie(event, HITPAY_TOKEN_COOKIE, JSON.stringify(session), {
    path: "/",
    maxAge: MAX_AGE_SECONDS,
    sameSite: "lax",
    secure,
    httpOnly: false,
  });
}

export function getHitpaySessionCookie(event: H3Event): HitpaySession | null {
  const raw = getCookie(event, HITPAY_TOKEN_COOKIE);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as HitpaySession;
  } catch {
    return null;
  }
}

export function clearHitpaySessionCookie(event: H3Event) {
  deleteCookie(event, HITPAY_TOKEN_COOKIE, { path: "/" });
}
