<script setup lang="ts">
import AppIcon from '@/components/AppIcon/AppIcon.vue'

withDefaults(defineProps<{
  description: string
  icon?: string
  actionText?: string
}>(), {
  icon: 'image-off',
  actionText: '',
})

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <view class="emptyState">
    <view class="emptyIcon">
      <AppIcon :name="icon" :size="56" color="#c9a88b" />
    </view>
    <text class="emptyDesc">{{ description }}</text>
    <view v-if="actionText" class="emptyAction" @tap="emit('action')">
      <text>{{ actionText }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.emptyState {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
  padding: 80rpx $spacing-lg;
  text-align: center;
  background: #fffdf9;
  border: 2rpx dashed #ecd9c4;
  border-radius: $radius-lg;
}

.emptyIcon {
  width: 112rpx;
  height: 112rpx;
  margin-bottom: $spacing-xs;
  @include flex-center;
  background: #fff3e4;
  border-radius: $radius-round;
}

.emptyDesc {
  color: $color-text-secondary;
  font-size: $font-size-sm;
  line-height: $line-height-normal;
}

.emptyAction {
  @include press;
  margin-top: $spacing-xs;
  padding: 16rpx 44rpx;
  color: $color-text-white;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  background: $gradient-primary;
  border-radius: $radius-button;
}
</style>
