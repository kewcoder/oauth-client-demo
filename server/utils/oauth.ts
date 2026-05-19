import crypto from "node:crypto";
import type { H3Event } from "h3";

export function generateState() {
  return crypto.randomBytes(16).toString("hex");
}

export function buildAuthorizeUrl(event: H3Event) {
  const config = useRuntimeConfig(event);
  const state = generateState();

  const url = new URL(config.hitpayAuthorizeUrl);
  url.searchParams.set("client_id", config.hitpayClientId);
  url.searchParams.set("redirect_uri", config.hitpayRedirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.hitpayScopes);
  url.searchParams.set("state", state);

  return { url: url.toString(), state };
}

function buildTokenUrl(event: H3Event) {
  const config = useRuntimeConfig(event);
  return new URL("/v1/oauth/token", config.hitpayApiBaseUrl).toString();
}

export async function refreshAccessToken(event: H3Event, refreshToken: string) {
  const config = useRuntimeConfig(event);

  return $fetch<{
    access_token: string;
    token_type?: string;
    scope?: string;
    refresh_token?: string;
    expires_in?: number;
  }>(buildTokenUrl(event), {
    method: "POST",
    body: {
      client_id: config.hitpayClientId,
      client_secret: config.hitpayClientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    },
  });
}

export async function exchangeCodeForToken(event: H3Event, code: string) {
  const config = useRuntimeConfig(event);

  const response = await $fetch<{
    access_token: string;
    token_type?: string;
    scope?: string;
    refresh_token?: string;
    expires_in?: number;
    merchant_id?: string;
  }>(buildTokenUrl(event), {
    method: "POST",
    body: {
      client_id: config.hitpayClientId,
      client_secret: config.hitpayClientSecret,
      redirect_uri: config.hitpayRedirectUri,
      code,
      grant_type: "authorization_code",
    },
  });

  return response;
}
