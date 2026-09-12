<script setup lang="ts">
const goBack = () => uni.navigateBack()
</script>

<template>
  <view class="page">
    <view class="intro">
      <text class="eyebrow">隐私与安全</text>
      <text class="title">你的数据如何使用</text>
      <view class="metaRow">
        <text class="updated">更新日期：2026 年 8 月 29 日</text>
      </view>
      <text class="summary">“今天吃啥”以本地离线推荐为主，仅在你主动联网查询时传递必要的食材名称。</text>
    </view>

    <view class="section">
      <view class="sectionHead">
        <text class="sectionIndex">01</text>
        <text class="sectionTitle">保存在本机的数据</text>
      </view>
      <text class="paragraph">饮食目标、忌口食材、收藏菜谱、本周计划、购物清单、菜谱反馈和已打开的在线菜谱缓存保存在微信小程序本地存储中，用于过滤推荐、调整排序、恢复收藏、安排餐次和打开在线详情。</text>
      <text class="paragraph">本项目目前不要求登录，不读取通讯录、位置、相册或设备中的其他文件，也未启用 uni 统计。</text>
    </view>

    <view class="section">
      <view class="sectionHead">
        <text class="sectionIndex">02</text>
        <text class="sectionTitle">联网查询的数据</text>
      </view>
      <text class="paragraph">只有点击首页“查更多”后，最多 3 个已选食材名称才会发送到微信云函数，再由云函数请求 ShowAPI 菜谱接口。小程序冷启动、选择食材和查看本地菜谱均不会触发该请求。</text>
      <text class="paragraph">业务代码不上传饮食档案、忌口、收藏或图片，不在客户端保存 ShowAPI 密钥，也不读取或保存微信账号身份。在线服务可能按照微信云开发和 ShowAPI 的安全策略产生必要的技术日志。</text>
    </view>

    <view class="section">
      <view class="sectionHead">
        <text class="sectionIndex">03</text>
        <text class="sectionTitle">删除与控制</text>
      </view>
      <text class="paragraph">你可以在“我的 → 隐私与数据”中分别清除饮食档案、收藏、计划与购物清单、推荐反馈、在线缓存，也可以一键清除本项目管理的全部本地数据。删除后无法恢复。</text>
      <text class="paragraph">由于当前没有账号同步或云端个人资料，应用内不存在需要单独注销的账号数据。</text>
    </view>

    <view class="section healthSection">
      <view class="sectionHead">
        <text class="sectionIndex">04</text>
        <text class="sectionTitle">健康信息边界</text>
      </view>
      <text class="paragraph">本地菜谱的营养值为估算值，人群标签和饮食提醒仅作一般性参考，不构成诊断、治疗或个体化营养处方。过敏、孕期、婴幼儿、慢性病或其他特殊情况，请咨询医生或注册营养师并自行核对食材。</text>
    </view>

    <view class="footerNotice">
      <text>正式发布前，将继续按照当届比赛规则、微信小程序隐私保护指引和实际启用能力更新本说明。</text>
    </view>
    <button class="backButton" @tap="goBack">返回</button>
  </view>
</template>

<style lang="scss" scoped>
.page { min-height: 100vh; padding: $spacing-lg $spacing-lg 80rpx; background: $color-bg-page; }

.intro { @include rise; padding: $spacing-md 0 $spacing-xl; border-bottom: 2rpx solid $color-rule; }
.eyebrow, .title, .updated, .summary, .sectionIndex, .sectionTitle, .paragraph { display: block; }
.eyebrow {
  color: $color-warning;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  letter-spacing: 0.32em;
}
.title {
  margin-top: $spacing-xs;
  color: $color-text-primary;
  font-family: $font-family-serif;
  font-size: 44rpx;
  font-weight: $font-weight-bold;
  line-height: $line-height-tight;
}
.metaRow { margin-top: $spacing-sm; }
.updated {
  color: $color-text-tertiary;
  font-family: $font-family-serif;
  font-size: $font-size-xs;
  letter-spacing: 0.1em;
}
.summary { margin-top: $spacing-md; color: $color-text-secondary; font-size: $font-size-sm; line-height: $line-height-loose; }

.section { padding: $spacing-xl 0; border-bottom: 2rpx solid $color-divider; }
.sectionHead {
  display: flex;
  align-items: baseline;
  gap: $spacing-sm;
}
.sectionIndex {
  color: $color-warning;
  font-family: $font-family-serif;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  letter-spacing: 0.08em;
}
.sectionTitle {
  color: $color-text-primary;
  font-family: $font-family-serif;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  line-height: $line-height-tight;
}
.paragraph { margin-top: $spacing-md; color: $color-text-secondary; font-size: $font-size-sm; line-height: $line-height-loose; }
.healthSection { border-bottom: none; }

.footerNotice {
  padding: $spacing-md;
  color: $color-text-tertiary;
  font-size: $font-size-xs;
  line-height: $line-height-loose;
  background: $color-info-alpha-05;
  border-left: 4rpx solid $color-info;
  border-radius: $radius-sm;
}
.backButton {
  @include button-reset;
  @include press;
  width: 240rpx;
  height: $button-height-md;
  margin: $spacing-xl auto 0;
  color: $color-text-white;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  background: $color-primary;
  border-radius: $radius-button;
}
.backButton:active { background: $color-primary-dark; }
</style>
