<script setup lang="ts">
import AppIcon from '@/components/AppIcon/AppIcon.vue'

defineOptions({ name: 'AppCallout' })

type CalloutTone = 'info' | 'success' | 'warning' | 'error'

const props = withDefaults(defineProps<{
  tone?: CalloutTone
  icon?: string
  title?: string
}>(), {
  tone: 'info',
  icon: '',
  title: '',
})

const toneConfig: Record<CalloutTone, { defaultIcon: string, iconColor: string, bg: string }> = {
  info: { defaultIcon: 'info', iconColor: '#4A7FB5', bg: '#E4F0FA' },
  success: { defaultIcon: 'circle-check', iconColor: '#3D7A4D', bg: '#E4F5DF' },
  warning: { defaultIcon: 'triangle-alert', iconColor: '#C15B2D', bg: '#FFF0DF' },
  error: { defaultIcon: 'circle-x', iconColor: '#D94B71', bg: '#FFE6ED' },
}
const config = toneConfig[props.tone]
const iconName = props.icon || config.defaultIcon
</script>

<template>
  <view class="callout" :style="{ background: config.bg }">
    <view class="calloutIcon">
      <AppIcon :name="iconName" :size="30" :color="config.iconColor" />
    </view>
    <view class="calloutBody">
      <text v-if="title" class="calloutTitle" :style="{ color: config.iconColor }">{{ title }}</text>
      <slot />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.callout {
  display: flex;
  gap: $spacing-sm;
  padding: $spacing-md;
  border-radius: $radius-md;
}

.calloutIcon {
  padding-top: 2rpx;
}

.calloutBody {
  flex: 1;
  min-width: 0;
}

.calloutTitle {
  display: block;
  margin-bottom: 4rpx;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
}
</style>
