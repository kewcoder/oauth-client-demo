import crypto from "node:crypto";
import type { H3Event } from "h3";
import { getOAuthConfig } from "./oauth-config";

export function generateState() {
  return crypto.randomBytes(16).toString("hex");
}

export function buildAuthorizeUrl(event: H3Event) {
  const config = useRuntimeConfig(event);
  const oauth = getOAuthConfig(event);
  const state = generateState();

  const url = new URL(config.hitpayAuthorizeUrl);
  url.searchParams.set("client_id", oauth.clientId);
  url.searchParams.set("redirect_uri", oauth.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", oauth.scopes);
  url.searchParams.set("state", state);

  return { url: url.toString(), state };
}

function buildTokenUrl(event: H3Event) {
  const config = useRuntimeConfig(event);
  return new URL("/v1/open/oauth/token", config.hitpayApiBaseUrl).toString();
}

export function accessTokenId(accessToken: string): string | null {
  const parts = accessToken.split(".");

  if (parts.length < 2) {
    return null;
  }

  try {
    const padded = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    const payload = JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as { jti?: unknown };

    return typeof payload.jti === "string" && payload.jti !== "" ? payload.jti : null;
  } catch {
    return null;
  }
}

export async function revokeAccessToken(event: H3Event, accessToken: string) {
  const tokenId = accessTokenId(accessToken);

  if (!tokenId) {
    throw createError({ statusCode: 400, statusMessage: "Access token has no id" });
  }

  const config = useRuntimeConfig(event);
  const url = new URL(`/v1/open/oauth/tokens/${encodeURIComponent(tokenId)}`, config.hitpayApiBaseUrl).toString();

  await $fetch(url, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function refreshAccessToken(event: H3Event, refreshToken: string) {
  const oauth = getOAuthConfig(event);

  return $fetch<{
    access_token: string;
    token_type?: string;
    scope?: string;
    refresh_token?: string;
    expires_in?: number;
  }>(buildTokenUrl(event), {
    method: "POST",
    body: {
      client_id: oauth.clientId,
      client_secret: oauth.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    },
  });
}

export async function exchangeCodeForToken(event: H3Event, code: string) {
  const oauth = getOAuthConfig(event);

  return $fetch<{
    access_token: string;
    token_type?: string;
    scope?: string;
    refresh_token?: string;
    expires_in?: number;
    merchant_id?: string;
  }>(buildTokenUrl(event), {
    method: "POST",
    body: {
      client_id: oauth.clientId,
      client_secret: oauth.clientSecret,
      redirect_uri: oauth.redirectUri,
      code,
      grant_type: "authorization_code",
    },
  });
}
