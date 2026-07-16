<script setup lang="ts">
import { apiDemoGroups } from '~/config/api-demos'

const activeGroupId = ref(apiDemoGroups[0]?.id ?? 'payments')
const activeGroup = computed(() => apiDemoGroups.find(g => g.id === activeGroupId.value))
</script>

<template>
  <div style="font-family: Arial, sans-serif; max-width: 1000px; margin: 40px auto; padding: 24px;">
    <DemoSessionPanel />

    <!-- Route group tabs -->
    <div style="display: flex; gap: 8px; margin-bottom: 28px; border-bottom: 2px solid #e5e7eb; padding-bottom: 0;">
      <button
        v-for="group in apiDemoGroups"
        :key="group.id"
        @click="activeGroupId = group.id"
        :style="`
          padding: 10px 20px; border: none; border-radius: 8px 8px 0 0; cursor: pointer;
          font-family: inherit; font-size: 15px; font-weight: ${activeGroupId === group.id ? '700' : '500'};
          background: ${activeGroupId === group.id ? '#111' : 'transparent'};
          color: ${activeGroupId === group.id ? '#fff' : '#555'};
          margin-bottom: -2px;
        `"
      >
        {{ group.title }}
      </button>
    </div>

    <DemoApiGroupPanel v-if="activeGroup" :group="activeGroup" />
  </div>
</template>
