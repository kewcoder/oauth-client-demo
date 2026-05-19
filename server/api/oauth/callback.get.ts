import { exchangeCodeForToken } from "../../utils/oauth";
import {
  buildHitpaySession,
  setHitpaySessionCookie,
} from "../../utils/session";
import type { H3Event } from "h3";

async function fetchBusinessInfo(event: H3Event, accessToken: string) {
  const config = useRuntimeConfig(event);
  try {
    return await $fetch<Record<string, any>>(
      `${config.hitpayApiBaseUrl}/v1/info`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
  } catch {
    return null;
  }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const code = String(query.code || "");
  const error = String(query.error || "");
  const errorDescription = String(query.error_description || "");

  if (error === "access_denied") {
    return sendRedirect(event, "/?error=access_denied");
  }

  if (error) {
    throw createError({
      statusCode: 400,
      statusMessage: `${error}: ${errorDescription}`,
    });
  }

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing authorization code",
    });
  }

  const token = await exchangeCodeForToken(event, code);
  const business = await fetchBusinessInfo(event, token.access_token);
  const session = buildHitpaySession(token, business);

  // Keep the cookie small (browser limit ~4KB). Full business data comes from GET /v1/info.
  setHitpaySessionCookie(event, session);

  return sendRedirect(event, "/connected");
});
