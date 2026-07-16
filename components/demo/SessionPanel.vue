<script setup lang="ts">
const {
  tokenInfo,
  tokenData,
  infoResult,
  infoLoading,
  copied,
  tokensVisible,
  copyToClipboard,
  callInfo,
  logout,
} = useOAuthSession()
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h1>Connected</h1>
      <button style="padding: 8px 14px; border-radius: 8px; border: 1px solid #ddd; cursor: pointer;" @click="logout">
        Disconnect
      </button>
    </div>
    <p>The OAuth flow completed. You can now test authenticated API requests.</p>

    <div style="margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 12px;">
      <h2 style="margin-top: 0;">Session</h2>
      <pre style="margin: 0;">{{ tokenInfo }}</pre>
    </div>

    <div v-if="tokenData" style="margin-bottom: 24px; border: 1px solid #ddd; border-radius: 12px; overflow: hidden;">
      <button
        @click="tokensVisible = !tokensVisible"
        style="width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: none; border: none; cursor: pointer; font-size: 15px; font-weight: 600; font-family: inherit;"
      >
        <span>Tokens</span>
        <span style="font-size: 12px; color: #888;">{{ tokensVisible ? '▲ Hide' : '▼ Show' }}</span>
      </button>

      <div v-if="tokensVisible" style="padding: 0 20px 20px; border-top: 1px solid #f0f0f0;">
        <p style="font-size: 13px; color: #666; margin-bottom: 16px;">
          Use the access token as <code>Authorization: Bearer &lt;token&gt;</code> in Postman or any HTTP client.
        </p>

        <div
          v-for="row in [
            { label: 'Access Token', key: 'access', value: tokenData.access_token },
            { label: 'Authorization Header', key: 'bearer', value: 'Bearer ' + tokenData.access_token },
            ...(tokenData.refresh_token ? [{ label: 'Refresh Token', key: 'refresh', value: tokenData.refresh_token }] : []),
          ]"
          :key="row.key"
          style="margin-bottom: 14px;"
        >
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <span style="font-size: 13px; font-weight: 600;">{{ row.label }}</span>
            <button
              @click="copyToClipboard(row.value, row.key)"
              :style="`font-size: 12px; padding: 4px 12px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; background: ${copied === row.key ? '#dcfce7' : '#f9fafb'}; color: ${copied === row.key ? '#166534' : '#374151'};`"
            >{{ copied === row.key ? 'Copied!' : 'Copy' }}</button>
          </div>
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; font-family: monospace; font-size: 12px; word-break: break-all; color: #374151;">
            {{ row.value }}
          </div>
        </div>
      </div>
    </div>

    <div style="margin-bottom: 32px;">
      <button style="padding: 10px 14px; border-radius: 8px; border: 0; cursor: pointer; background: #f3f4f6;" @click="callInfo">
        {{ infoLoading ? 'Loading...' : 'GET /info' }}
      </button>
      <div v-if="infoResult" style="margin-top: 12px; padding: 16px; border: 1px solid #ddd; border-radius: 12px;">
        <pre style="margin: 0; font-size: 13px;">{{ JSON.stringify(infoResult, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>
