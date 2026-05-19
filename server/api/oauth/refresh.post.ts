import { refreshAccessToken } from "../../utils/oauth";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const refreshToken = String(body?.refresh_token || "");

  if (!refreshToken) {
    throw createError({ statusCode: 400, statusMessage: "Missing refresh_token" });
  }

  try {
    const token = await refreshAccessToken(event, refreshToken);
    return {
      access_token: token.access_token,
      token_type: token.token_type || "Bearer",
      scope: token.scope || "",
      refresh_token: token.refresh_token || refreshToken,
      expires_in: token.expires_in || null,
    };
  } catch (err: any) {
    const status = Number(err?.response?.status ?? err?.statusCode) || 500;
    const message = err?.response?._data?.message ?? err?.message ?? "Token refresh failed";
    throw createError({ statusCode: status, statusMessage: String(message) });
  }
});
