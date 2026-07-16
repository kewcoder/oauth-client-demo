<script setup lang="ts">
import type { ApiResourceConfig } from '~/config/api-demos/types'

const props = defineProps<{ resource: ApiResourceConfig }>()

const demo = useApiResourceDemo(props.resource)
const {
  activeTabId,
  activeTab,
  result,
  loading,
  errorMsg,
  resourceId,
  queryFields,
  bodies,
  jsonError,
  canSend,
  setTab,
  resetBody,
  send,
} = demo
</script>

<template>
  <section style="margin-bottom: 48px;">
    <h2 style="margin-bottom: 16px;">{{ resource.title }}</h2>

    <div style="display: flex; flex-direction: row; flex-wrap: nowrap; gap: 4px; border-bottom: 2px solid #e5e7eb; margin-bottom: 0; overflow-x: auto;">
      <button
        v-for="tab in resource.tabs"
        :key="tab.id"
        @click="setTab(tab.id)"
        :style="`
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border: none; border-radius: 8px 8px 0 0;
          cursor: pointer; white-space: nowrap; font-family: inherit; font-size: 14px;
          font-weight: ${activeTabId === tab.id ? '700' : '400'};
          background: ${activeTabId === tab.id ? '#fff' : 'transparent'};
          border-bottom: ${activeTabId === tab.id ? '2px solid #111' : '2px solid transparent'};
          margin-bottom: -2px;
        `"
      >
        <span :style="`font-size: 11px; font-weight: 700; color: #fff; background: ${tab.color}; border-radius: 4px; padding: 2px 5px;`">
          {{ tab.method }}
        </span>
        {{ tab.label }}
      </button>
    </div>

    <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
        <span style="font-size: 13px; color: #666;">Required scope:</span>
        <code style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-size: 13px;">{{ activeTab?.scope }}</code>
      </div>

      <p v-if="activeTab" style="margin-top: 0; color: #555;">
        <strong>{{ activeTab.method }}</strong>
        <code>{{ activeTab.apiPath }}</code>
        — {{ activeTab.description }}
      </p>

      <template v-if="activeTab?.queryFields?.length">
        <div style="display: flex; flex-direction: row; gap: 12px; flex-wrap: wrap; margin-bottom: 16px;">
          <label
            v-for="field in activeTab.queryFields"
            :key="field.key"
            style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; flex: field.key === 'search' ? 1 : undefined; min-width: 80px;"
          >
            {{ field.label }}
            <input
              v-model="queryFields[field.key]"
              :type="field.type === 'number' ? 'number' : 'text'"
              :placeholder="field.placeholder"
              style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; min-width: 80px;"
            />
          </label>
        </div>
      </template>

      <template v-if="activeTab?.needsId">
        <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; margin-bottom: 16px;">
          {{ activeTab.idLabel }} <span style="color: #ef4444;">*</span>
          <input
            v-model="resourceId"
            type="text"
            placeholder="e.g. 019dfbb3-e763-735f-a6c6-1c9f006c6ec6"
            style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-family: monospace;"
          />
        </label>
      </template>

      <template v-if="activeTab?.bodyExample !== undefined">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 13px; color: #666;">Request Body (JSON)</span>
          <button
            @click="activeTab && resetBody(activeTab)"
            style="font-size: 12px; padding: 4px 10px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; background: #f9fafb;"
          >Use Example</button>
        </div>
        <textarea
          v-if="activeTab"
          v-model="bodies[activeTab.id]"
          @input="jsonError = null"
          rows="14"
          style="width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: monospace; font-size: 13px; resize: vertical; background: #fafafa;"
        />
        <p v-if="jsonError" style="color: #ef4444; font-size: 13px; margin-top: 4px;">{{ jsonError }}</p>
      </template>

      <div
        v-if="activeTab?.warning"
        style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; font-size: 13px; color: #991b1b;"
      >
        {{ activeTab.warning }}
      </div>

      <button
        @click="send"
        :disabled="!canSend"
        :style="`margin-top: 20px; padding: 10px 24px; border-radius: 8px; border: none; font-weight: 600; font-size: 14px; font-family: inherit; cursor: ${canSend ? 'pointer' : 'not-allowed'}; background: ${canSend ? '#111' : '#d1d5db'}; color: ${canSend ? '#fff' : '#9ca3af'};`"
      >
        {{ loading ? 'Loading…' : 'Send Request' }}
      </button>
    </div>

    <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
      <h3 style="margin-top: 0;">Response</h3>
      <div v-if="errorMsg" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-bottom: 12px; font-size: 13px; color: #991b1b;">
        {{ errorMsg }}
      </div>
      <pre style="background: #f9fafb; padding: 16px; border-radius: 8px; overflow: auto; font-size: 13px; margin: 0;">{{ result !== null ? JSON.stringify(result, null, 2) : '— no response yet —' }}</pre>
    </div>
  </section>
</template>
