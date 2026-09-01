import { hitpayFetch } from "../../utils/hitpay-client";

const ALLOWED_RESOURCES = new Set(["info"]);
const ALLOWED_RES = [
  /^payment-requests(\/[^/]+)?$/,
  /^charges(\/[^/]+)?$/,
  /^refund(\/[^/]+)?$/,
  /^recurring-billing(\/[^/]+)?(\/(pause|resume|setup-intent))?$/,
  /^recurring-billing-settings$/,
  /^subscription-plan(\/[^/]+)?$/,
  /^charge\/recurring-billing\/[^/]+$/,
  /^products(\/[^/]+)?$/,
  /^product-category(\/[^/]+)?$/,
  /^add-ons(\/[^/]+)?$/,
  /^invoice-settings$/,
  /^orders(\/[^/]+)?$/,
  /^invoices(\/[^/]+)?$/,
  /^store-settings$/,
  /^locations(\/[^/]+)?$/,
  /^coupons(\/[^/]+)?$/,
  /^discounts(\/[^/]+)?$/,
  /^shipping(\/[^/]+)?$/,
  /^pickups(\/[^/]+)?$/,
  /^taxes(\/[^/]+)?$/,
];

function getResourcePath(event: any): string {
  const path = String(getRouterParam(event, "path") || "").replace(/^\/+|\/+$/g, "");

  if (ALLOWED_RESOURCES.has(path) || ALLOWED_RES.some(re => re.test(path))) {
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
    if (query.perPage) params.set("perPage", String(query.perPage));
    if (query.current_page) params.set("current_page", String(query.current_page));
    if (query.search) params.set("search", String(query.search));
    if (query.status) params.set("status", String(query.status));
    if (query.customer_email) params.set("customer_email", String(query.customer_email));
    if (query.reference) params.set("reference", String(query.reference));
    if (query.keywords) params.set("keywords", String(query.keywords));
    const qs = params.toString();
    return hitpayFetch(event, qs ? `${path}?${qs}` : path);
  }

  if (method === "POST" || method === "PUT" || method === "PATCH") {
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
