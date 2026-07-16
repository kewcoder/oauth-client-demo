<script setup lang="ts">
const CONFIG_COOKIE = 'hitpay_config'

const clientId = ref('')
const clientSecret = ref('')
const redirectUri = ref('')
const scopes = ref('')
const connecting = ref(false)
const accessDenied = computed(() => useRoute().query.error === 'access_denied')

onMounted(() => {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CONFIG_COOKIE}=([^;]*)`))
  if (match) {
    try {
      const cfg = JSON.parse(decodeURIComponent(match[1]))
      clientId.value = cfg.client_id || ''
      clientSecret.value = cfg.client_secret || ''
      redirectUri.value = cfg.redirect_uri || ''
      scopes.value = cfg.scopes || ''
    } catch {}
  }
  if (!redirectUri.value) {
    redirectUri.value = `${window.location.origin}/api/oauth/callback`
  }
  if (!scopes.value) {
    scopes.value = 'business:read payments payments:create payments:cancel payments:refund payments:read commerce commerce:read commerce:create commerce:update commerce:delete'
  }
})

const canConnect = computed(() =>
  clientId.value.trim() && clientSecret.value.trim() && redirectUri.value.trim() && scopes.value.trim()
)

const connect = () => {
  connecting.value = true
  const cfg = {
    client_id:     clientId.value.trim(),
    client_secret: clientSecret.value.trim(),
    redirect_uri:  redirectUri.value.trim(),
    scopes:        scopes.value.trim(),
  }
  document.cookie = `${CONFIG_COOKIE}=${encodeURIComponent(JSON.stringify(cfg))}; path=/; SameSite=Lax`
  window.location.href = '/api/oauth/start'
}
</script>

<template>
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 60px auto; padding: 24px;">
    <h1>HitPay OAuth Demo</h1>
    <p style="color: #555;">
      Enter your OAuth app credentials below. They will be saved to a browser cookie and used for the OAuth flow.
    </p>

    <div
      v-if="accessDenied"
      style="margin-bottom: 20px; padding: 14px 18px; border: 1px solid #f5c6cb; border-radius: 10px; background: #fff5f5; color: #c0392b;"
    >
      Authorization was denied. You can try connecting again.
    </div>

    <div style="display: flex; flex-direction: column; gap: 14px; padding: 24px; border: 1px solid #ddd; border-radius: 12px;">

      <label style="display: flex; flex-direction: column; gap: 5px; font-size: 14px;">
        <span>Client ID <span style="color: #ef4444;">*</span></span>
        <input
          v-model="clientId"
          type="text"
          placeholder="019dfbb3-e763-735f-a6c6-..."
          style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 8px; font-family: monospace; font-size: 13px;"
        />
      </label>

      <label style="display: flex; flex-direction: column; gap: 5px; font-size: 14px;">
        <span>Client Secret <span style="color: #ef4444;">*</span></span>
        <input
          v-model="clientSecret"
          type="password"
          placeholder="••••••••••••••••••••"
          style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 8px; font-family: monospace; font-size: 13px;"
        />
      </label>

      <label style="display: flex; flex-direction: column; gap: 5px; font-size: 14px;">
        <span>Redirect URI <span style="color: #ef4444;">*</span></span>
        <input
          v-model="redirectUri"
          type="text"
          placeholder="https://localhost:3000/api/oauth/callback"
          style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 8px; font-family: monospace; font-size: 13px;"
        />
      </label>

      <label style="display: flex; flex-direction: column; gap: 5px; font-size: 14px;">
        <span>Scopes <span style="color: #ef4444;">*</span></span>
        <input
          v-model="scopes"
          type="text"
          placeholder="business:read payments payments:create..."
          style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 13px;"
        />
        <span style="font-size: 12px; color: #888;">Space-separated list of scopes</span>
      </label>

      <button
        @click="connect"
        :disabled="!canConnect || connecting"
        :style="{
          marginTop: '6px',
          padding: '12px',
          border: 'none',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: '600',
          cursor: canConnect && !connecting ? 'pointer' : 'not-allowed',
          background: canConnect && !connecting ? '#111' : '#d1d5db',
          color: canConnect && !connecting ? '#fff' : '#9ca3af',
        }"
      >
        {{ connecting ? 'Redirecting…' : 'Connect with HitPay' }}
      </button>

    </div>
  </div>
</template>
