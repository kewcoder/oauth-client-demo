<script setup lang="ts">
const tokenInfo = ref<any>(null)
const result = ref<any>(null)
const loading = ref<string | null>(null)

const TOKEN_COOKIE = 'hitpay_token'

function getTokenCookie(): Record<string, any> | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${TOKEN_COOKIE}=([^;]*)`))
  if (!match) return null
  try {
    return JSON.parse(decodeURIComponent(match[1]))
  } catch {
    return null
  }
}

function clearTokenCookie() {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`
}

const loadTokenInfo = () => {
  const session = getTokenCookie()
  if (!session) return
  tokenInfo.value = {
    connected: true,
    token_type: session.token_type || null,
    scope: session.scope || null,
    expires_in: session.expires_in || null,
    business: session.business || null,
    has_access_token: Boolean(session.access_token),
  }
}

async function callHitpayResource(resource: string) {
  loading.value = resource
  result.value = null
  try {
    result.value = await $fetch(`/api/hitpay/${resource}`)
  } catch (error: any) {
    result.value = error?.data || { message: error?.message || 'Request failed' }
  } finally {
    loading.value = null
    loadTokenInfo()
  }
}

const callInfo = () => callHitpayResource('info')

const callOrders = async () => {
  await callHitpayResource('orders')
}

const getProducts = async () => {
  await callHitpayResource('products')
}

const getCharges = async () => {
  await callHitpayResource('charges')
}

const getCustomers = async () => {
  await callHitpayResource('customers')
}

const logout = () => {
  clearTokenCookie()
  window.location.href = '/'
}


onMounted(loadTokenInfo)
</script>

<template>
  <div style="font-family: Arial, sans-serif; max-width: 1000px; margin: 40px auto; padding: 24px;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h1>Connected</h1>
      <button style="padding: 8px 14px; border-radius: 8px; border: 1px solid #ddd; cursor: pointer;" @click="logout">
        Disconnect
      </button>
    </div>
    <p>The OAuth flow completed. You can now test authenticated API requests.</p>

    <div style="margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 12px;">
      <h2>Session</h2>
      <pre>{{ tokenInfo }}</pre>
    </div>

    <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px;">
      <button style="padding: 10px 14px; border-radius: 8px; border: 0; cursor: pointer;" @click="callInfo">
        {{ loading === 'info' ? 'Loading...' : 'GET /info' }}
      </button>
      <button style="padding: 10px 14px; border-radius: 8px; border: 0; cursor: pointer;" @click="callOrders">
        {{ loading === 'orders' ? 'Loading...' : 'GET /orders' }}
      </button>
      <button style="padding: 10px 14px; border-radius: 8px; border: 0; cursor: pointer;" @click="getProducts">
        {{ loading === 'products' ? 'Loading...' : 'GET /products' }}
      </button>
      <button style="padding: 10px 14px; border-radius: 8px; border: 0; background: #fee2e2; cursor: pointer;" @click="getCharges" title="Requires read:charges scope (not approved)">
        {{ loading === 'charges' ? 'Loading...' : 'GET /charges ⚠️' }}
      </button>
      <button style="padding: 10px 14px; border-radius: 8px; border: 0; background: #fee2e2; cursor: pointer;" @click="getCustomers" title="Requires read:customers scope (not approved)">
        {{ loading === 'customers' ? 'Loading...' : 'GET /customers ⚠️' }}
      </button>
    </div>

    <div style="padding: 20px; border: 1px solid #ddd; border-radius: 12px;">
      <h2>API Result</h2>
      <pre>{{ result }}</pre>
    </div>
  </div>
</template>
