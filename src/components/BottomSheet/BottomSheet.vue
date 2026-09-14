<script setup lang="ts">
import { onBeforeUnmount, watch, ref } from 'vue'
import AppIcon from '@/components/AppIcon/AppIcon.vue'

const props = withDefaults(defineProps<{
  visible: boolean
  title?: string
}>(), {
  title: '',
})

const emit = defineEmits<{
  close: []
}>()

// 双状态 class 实现进出场动画:v-if 移除前先过渡到 leave 态
const rendered = ref(props.visible)
const leaving = ref(false)
let leaveTimer: ReturnType<typeof setTimeout> | undefined
const clearLeaveTimer = () => {
  if (!leaveTimer) return
  clearTimeout(leaveTimer)
  leaveTimer = undefined
}
watch(() => props.visible, (visible) => {
  clearLeaveTimer()
  if (visible) {
    leaving.value = false
    rendered.value = true
  } else if (rendered.value) {
    leaving.value = true
    leaveTimer = setTimeout(() => {
      rendered.value = false
      leaving.value = false
      leaveTimer = undefined
    }, 280)
  }
})
onBeforeUnmount(clearLeaveTimer)
const handleMaskTap = () => emit('close')
</script>

<template>
  <view v-if="rendered" class="sheetRoot" :class="{ sheetLeaving: leaving }" @tap="handleMaskTap">
    <view class="sheetMask" @touchmove.stop.prevent />
    <view class="sheetPanel" :class="{ sheetPanelLeaving: leaving }" @tap.stop>
      <view class="sheetGrabber" />
      <view v-if="title" class="sheetHeader">
        <text class="sheetTitle">{{ title }}</text>
        <view class="sheetClose" @tap="handleMaskTap">
          <AppIcon name="x" :size="32" color="#7C695B" />
        </view>
      </view>
      <scroll-view scroll-y class="sheetContent">
        <slot />
      </scroll-view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.sheetRoot {
  position: fixed;
  inset: 0;
  z-index: 999;
}

.sheetMask {
  position: absolute;
  inset: 0;
  background: $color-scrim;
  animation: fadeIn 0.24s ease both;
}

.sheetLeaving .sheetMask {
  animation: fadeIn 0.24s ease both reverse;
}

.sheetPanel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 78vh;
  overflow: hidden;
  padding: 16rpx $spacing-lg 0;
  background: $color-bg-card;
  border-radius: $radius-xl $radius-xl 0 0;
  box-shadow: $shadow-popup;
  animation: slideUp $transition-slide both;
}

.sheetPanelLeaving {
  animation: slideDown 0.26s ease-in both;
}

@keyframes slideDown {
  from { transform: translateY(0); }
  to { transform: translateY(100%); }
}

.sheetContent {
  height: calc(78vh - 64rpx);
  padding-bottom: calc(env(safe-area-inset-bottom) + $spacing-lg);
  box-sizing: border-box;
}

.sheetGrabber {
  width: 72rpx;
  height: 8rpx;
  margin: 0 auto $spacing-sm;
  background: $color-divider;
  border-radius: $radius-round;
}

.sheetHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-md;
}

.sheetTitle {
  color: $color-text-primary;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
}

.sheetClose {
  @include press;
  width: 56rpx;
  height: 56rpx;
  @include flex-center;
  border-radius: $radius-round;
  background: $color-bg-page;
}
</style>
