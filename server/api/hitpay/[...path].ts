import { hitpayFetch } from "../../utils/hitpay-client";

const ALLOWED_RESOURCES = new Set(["info"]);
const PAYMENT_REQUESTS_RE = /^payment-requests(\/[^/]+)?$/;

function getResourcePath(event: any): string {
  const path = String(getRouterParam(event, "path") || "").replace(/^\/+|\/+$/g, "");

  if (ALLOWED_RESOURCES.has(path) || PAYMENT_REQUESTS_RE.test(path)) {
    return `/v1/${path}`;
  }

  throw createError({
    statusCode: 404,
    statusMessage: "Unsupported HitPay API resource",
  });
}

export default defineEventHandler(async (event) => {
  const path = getResourcePath(event);
  const method = getMethod(event);

  if (method === "GET") {
    const query = getQuery(event);
    const params = new URLSearchParams();
    if (query.per_page) params.set("per_page", String(query.per_page));
    if (query.current_page) params.set("current_page", String(query.current_page));
    if (query.search) params.set("search", String(query.search));
    const qs = params.toString();
    return hitpayFetch(event, qs ? `${path}?${qs}` : path);
  }

  if (method === "POST" || method === "PUT") {
    const body = await readBody(event);
    return hitpayFetch(event, path, {
      method,
      body: JSON.stringify(body),
    });
  }

  if (method === "DELETE") {
    return hitpayFetch(event, path, { method: "DELETE" });
  }

  throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
});
