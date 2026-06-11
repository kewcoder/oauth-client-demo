import type { H3Event } from "h3";
import { getCookie } from "h3";

export type OAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string;
};

export function getOAuthConfig(event: H3Event): OAuthConfig {
  let cookie: Record<string, string> = {};

  try {
    const raw = getCookie(event, "hitpay_config");
    if (raw) cookie = JSON.parse(raw);
  } catch {}

  return {
    clientId:     cookie.client_id     || "",
    clientSecret: cookie.client_secret || "",
    redirectUri:  cookie.redirect_uri  || "",
    scopes:       cookie.scopes        || "",
  };
}
