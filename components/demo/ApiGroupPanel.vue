<script setup lang="ts">
import type { ApiGroupConfig } from '~/config/api-demos/types'

defineProps<{ group: ApiGroupConfig }>()
</script>

<template>
  <div>
    <div style="margin-bottom: 28px; padding: 16px 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px;">
      <h2 style="margin: 0 0 8px;">{{ group.title }}</h2>
      <p style="margin: 0 0 12px; color: #555; font-size: 14px;">{{ group.description }}</p>
      <div style="display: flex; flex-wrap: wrap; gap: 6px;">
        <code
          v-for="scope in group.scopes"
          :key="scope"
          style="background: #fff; border: 1px solid #e5e7eb; padding: 2px 8px; border-radius: 4px; font-size: 12px;"
        >{{ scope }}</code>
      </div>
    </div>

    <DemoApiResourcePanel
      v-for="resource in group.resources"
      :key="resource.id"
      :resource="resource"
    />
  </div>
</template>
