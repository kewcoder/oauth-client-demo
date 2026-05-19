<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "nuxt/app";

const connecting = ref(false);
const route = useRoute();
const accessDenied = computed(() => route.query.error === "access_denied");

const connect = async () => {
  connecting.value = true;
  window.location.href = "/api/oauth/start";
};
</script>

<template>
  <div
    style="
      font-family: Arial, sans-serif;
      max-width: 900px;
      margin: 60px auto;
      padding: 24px;
    "
  >
    <h1>Nuxt OAuth Demo App</h1>
    <p>
      This demo shows how a merchant connects their HitPay account from a
      third-party developer app on a separate domain.
    </p>

    <div
      v-if="accessDenied"
      style="
        margin-top: 24px;
        padding: 16px 20px;
        border: 1px solid #f5c6cb;
        border-radius: 12px;
        background: #fff5f5;
        color: #c0392b;
      "
    >
      Authorization was denied. You can try connecting again.
    </div>

    <div
      style="
        margin-top: 24px;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 12px;
      "
    >
      <h2>Requested Scopes</h2>
      <ul>
        <li>read_orders</li>
        <li>read_products</li>
        <li>read:charges (not approved)</li>
        <li>read:customers (not approved)</li>
      </ul>

      <button
        style="
          margin-top: 16px;
          padding: 12px 18px;
          border: 0;
          border-radius: 8px;
          cursor: pointer;
        "
        :disabled="connecting"
        @click="connect"
      >
        {{ connecting ? "Redirecting..." : "Connect with HitPay" }}
      </button>
    </div>
  </div>
</template>
