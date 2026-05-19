import { defineNuxtRouteMiddleware, navigateTo, useCookie } from "nuxt/app";

export default defineNuxtRouteMiddleware((to) => {
  if (to.path !== "/") {
    return;
  }

  const token = useCookie("hitpay_token");
  if (token.value) {
    return navigateTo("/connected");
  }
});
