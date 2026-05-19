import { refreshAccessToken } from "../../utils/oauth";
import {
  getHitpaySessionCookie,
  setHitpaySessionCookie,
  type HitpaySession,
} from "../../utils/session";

const ALLOWED_RESOURCES = new Set([
  "info",
  "orders",
  "products",
  "charges",
  "customers",
]);

function getResourcePath(event: any) {
  const path = String(getRouterParam(event, "path") || "").replace(/^\/+|\/+$/g, "");

  if (!ALLOWED_RESOURCES.has(path)) {
    throw createError({
      statusCode: 404,
      statusMessage: "Unsupported HitPay API resource",
    });
  }

  return `/v1/${path}`;
}

function buildHitpayUrl(event: any, path: string) {
  const config = useRuntimeConfig(event);
  return new URL(path, config.hitpayApiBaseUrl).toString();
}

async function fetchHitpay(event: any, path: string, accessToken: string) {
  return $fetch(buildHitpayUrl(event, path), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

function getErrorStatus(error: any) {
  return Number(error?.response?.status ?? error?.statusCode) || 500;
}

function getErrorMessage(error: any) {
  return (
    error?.response?._data?.message ||
    error?.data?.message ||
    error?.message ||
    "HitPay API request failed"
  );
}

function applyTokenRefresh(session: HitpaySession, token: Record<string, any>): HitpaySession {
  return {
    ...session,
    access_token: token.access_token,
    token_type: token.token_type || session.token_type || "Bearer",
    scope: token.scope || session.scope || "",
    refresh_token: token.refresh_token || session.refresh_token,
    expires_in: token.expires_in ?? session.expires_in,
  };
}

export default defineEventHandler(async (event) => {
  const session = getHitpaySessionCookie(event);

  if (!session?.access_token) {
    throw createError({ statusCode: 401, statusMessage: "Not connected" });
  }

  const path = getResourcePath(event);

  try {
    return await fetchHitpay(event, path, session.access_token);
  } catch (error: any) {
    if (getErrorStatus(error) !== 401 || !session.refresh_token) {
      throw createError({
        statusCode: getErrorStatus(error),
        statusMessage: String(getErrorMessage(error)),
        data: error?.response?._data ?? error?.data,
      });
    }

    const token = await refreshAccessToken(event, session.refresh_token);
    const refreshedSession = applyTokenRefresh(session, token);
    setHitpaySessionCookie(event, refreshedSession);

    return fetchHitpay(event, path, refreshedSession.access_token);
  }
});
