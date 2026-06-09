import { refreshAccessToken } from "./oauth";
import { getHitpaySessionCookie, setHitpaySessionCookie, type HitpaySession } from "./session";

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

export async function hitpayFetch(
  event: any,
  path: string,
  options: Record<string, any> = {},
) {
  const session = getHitpaySessionCookie(event);

  if (!session?.access_token) {
    throw createError({ statusCode: 401, statusMessage: "Not connected" });
  }

  const config = useRuntimeConfig(event);
  const url = new URL(path, config.hitpayApiBaseUrl).toString();

  async function doFetch(accessToken: string) {
    return $fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  try {
    return await doFetch(session.access_token);
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

    return doFetch(refreshedSession.access_token);
  }
}
