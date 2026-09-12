<script setup lang="ts">
import { computed } from 'vue'
import { lucideIcons } from './icons'

const props = withDefaults(defineProps<{
  /** Lucide 图标名(kebab-case),见 icons.ts */
  name: string
  /** 尺寸,单位 rpx,默认 32rpx */
  size?: number
  /** 描边色；SVG 背景不继承外部文字色，默认使用暖灰 */
  color?: string
  /** 描边宽度,默认 2(Lucide 标准) */
  strokeWidth?: number
}>(), {
  size: 32,
  color: '#7C695B',
  strokeWidth: 2,
})

const svg = computed(() => {
  const inner = lucideIcons[props.name]
  if (!inner) return ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${props.color}" stroke-width="${props.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`
})

const style = computed(() => {
  const url = svg.value
    ? `url("data:image/svg+xml,${encodeURIComponent(svg.value).replace(/'/g, '%27')}")`
    : 'none'
  return {
    width: `${props.size}rpx`,
    height: `${props.size}rpx`,
    backgroundImage: url,
  }
})
</script>

<template>
  <view class="appIcon" :style="style" />
</template>

<style lang="scss" scoped>
.appIcon {
  display: inline-block;
  background-repeat: no-repeat;
  background-position: center;
  background-size: 100% 100%;
  flex-shrink: 0;
  vertical-align: middle;
}
</style>
