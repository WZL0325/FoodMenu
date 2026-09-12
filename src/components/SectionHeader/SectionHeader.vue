<script setup lang="ts">
import AppIcon from '@/components/AppIcon/AppIcon.vue'

withDefaults(defineProps<{
  index?: string
  title: string
  subtitle?: string
  actionText?: string
}>(), {
  index: '',
  subtitle: '',
  actionText: '',
})

const emit = defineEmits<{ action: [] }>()
</script>

<template>
  <view class="sectionHeader">
    <view class="titleGroup">
      <view class="titleRow">
        <view class="marker" />
        <text class="title">{{ title }}</text>
      </view>
      <text v-if="subtitle" class="subtitle">{{ subtitle }}</text>
    </view>
    <view v-if="actionText" class="action" @tap="emit('action')">
      <text class="actionText">{{ actionText }}</text>
      <AppIcon name="arrow-right" :size="26" color="#ed6a3c" />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.sectionHeader {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: $spacing-md;
  width: 100%;
  margin: $spacing-xl 0 $spacing-md;
}

.titleGroup {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.titleRow {
  display: flex;
  align-items: center;
  gap: 14rpx;
  min-width: 0;
}

.marker {
  width: 14rpx;
  height: 14rpx;
  flex-shrink: 0;
  background: $gradient-primary;
  border-radius: 6rpx;
}

.title {
  color: $color-text-primary;
  font-size: 34rpx;
  font-weight: 800;
  line-height: $line-height-tight;
  letter-spacing: -1rpx;
}

.subtitle {
  margin-top: 8rpx;
  padding-left: 28rpx;
  color: $color-text-tertiary;
  font-size: $font-size-sm;
  line-height: $line-height-normal;
  @include text-ellipsis;
}

.action {
  @include press;
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding: 8rpx 0 8rpx $spacing-md;
  flex-shrink: 0;
}

.actionText {
  color: $color-primary;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  white-space: nowrap;
}
</style>
