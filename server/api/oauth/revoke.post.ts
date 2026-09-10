import { revokeAccessToken } from "../../utils/oauth";
import { clearHitpaySessionCookie, getHitpaySessionCookie } from "../../utils/session";

export default defineEventHandler(async (event) => {
  const session = getHitpaySessionCookie(event);

  if (!session?.access_token) {
    throw createError({ statusCode: 401, statusMessage: "Not connected" });
  }

  try {
    await revokeAccessToken(event, session.access_token);
  } catch (err: any) {
    const status = Number(err?.response?.status ?? err?.statusCode) || 500;

    if (status !== 404) {
      const message = err?.response?._data?.message ?? err?.message ?? "Token revoke failed";
      throw createError({ statusCode: status, statusMessage: String(message) });
    }
  }

  clearHitpaySessionCookie(event);

  return { revoked: true };
});
