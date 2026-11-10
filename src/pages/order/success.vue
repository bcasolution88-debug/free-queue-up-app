<template>
  <view class="success-page">
    <view class="success-content animate-fade-in">
      <!-- 成功图标 -->
      <view class="success-icon-wrap animate-scale-in">
        <view class="success-circle">
          <text class="check-icon">✓</text>
        </view>
        <view class="ripple ripple-1"></view>
        <view class="ripple ripple-2"></view>
      </view>

      <text class="success-title">{{ t('payment_success') }}</text>
      <text class="success-subtitle">{{ lang === 'zh' ? '您的订单已成功提交！' : 'Your order has been placed!' }}</text>

      <!-- 排队号码卡片 -->
      <view class="queue-number-card">
        <text class="queue-label">{{ t('queue_no') }}</text>
        <text class="queue-number">{{ queueNo }}</text>
        <view class="queue-type-tag">
          <text>{{ lang === 'zh' ? '在线排队' : 'Online Queue' }}</text>
        </view>
      </view>

      <!-- 订单信息 -->
      <view class="order-info-card">
        <view class="info-row">
          <text class="info-label">{{ t('order_no') }}</text>
          <text class="info-value">{{ orderId }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">{{ t('pickup_time_label') }}</text>
          <text class="info-value">{{ order?.pickupTime }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">{{ t('order_total') }}</text>
          <text class="info-value primary">¥{{ order?.totalAmount?.toFixed(2) }}</text>
        </view>
      </view>

      <!-- 等待提示 -->
      <view class="wait-notice">
        <text class="notice-icon">🔔</text>
        <text class="notice-text">{{ lang === 'zh' ? '商家备货完成后将推送通知提醒您到店取货' : 'You will be notified when your order is ready for pickup' }}</text>
      </view>

      <!-- 操作按钮 -->
      <view class="action-btns">
        <button class="btn btn-primary btn-full btn-lg" @click="viewQueueStatus">
          {{ lang === 'zh' ? '查看排队状态' : 'View Queue Status' }}
        </button>
        <button class="btn btn-outline btn-full" @click="goHome" style="margin-top:10px;">
          {{ lang === 'zh' ? '返回首页' : 'Back to Home' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { langStore, orderStore } from '../../stores/app.js'

const lang = ref(langStore.lang)
const orderId = ref('')
const queueNo = ref('A098')
const order = ref(null)

const t = (key) => langStore.t(key)

onMounted(() => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  orderId.value = page.$route?.query?.orderId || page.options?.orderId || 'ORD20250601001'
  queueNo.value = page.$route?.query?.queueNo || page.options?.queueNo || 'A098'
  
  if (orderId.value) {
    order.value = orderStore.getOrder(orderId.value)
  }
  
  if (!order.value) {
    order.value = { totalAmount: 86, pickupTime: '14:30' }
  }
})

const viewQueueStatus = () => {
  uni.navigateTo({ url: `/pages/queue/status?orderId=${orderId.value}` })
}

const goHome = () => {
  uni.reLaunch({ url: '/pages/index/index' })
}
</script>

<style scoped>
.success-page {
  min-height: 100vh;
  background: var(--bg-page);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.success-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

/* 成功图标 */
.success-icon-wrap {
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.success-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--success);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  position: relative;
}

.check-icon {
  font-size: 36px;
  color: #fff;
  font-weight: 700;
}

.ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(82, 196, 26, 0.2);
  animation: ripple 2s ease-out infinite;
}

.ripple-1 { width: 90px; height: 90px; animation-delay: 0s; }
.ripple-2 { width: 100px; height: 100px; animation-delay: 0.5s; }

@keyframes ripple {
  0% { transform: scale(0.8); opacity: 0.8; }
  100% { transform: scale(1.4); opacity: 0; }
}

.success-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-primary);
}

.success-subtitle {
  font-size: 14px;
  color: var(--text-hint);
  margin-top: -12px;
}

/* 排队号码卡片 */
.queue-number-card {
  width: 100%;
  background: linear-gradient(135deg, #FF4D4F, #FF7875);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
}

.queue-label {
  display: block;
  font-size: 13px;
  color: rgba(255,255,255,0.8);
  margin-bottom: 8px;
}

.queue-number {
  display: block;
  font-size: 52px;
  font-weight: 900;
  color: #fff;
  letter-spacing: 4px;
  margin-bottom: 12px;
}

.queue-type-tag {
  display: inline-block;
  background: rgba(255,255,255,0.25);
  padding: 5px 16px;
  border-radius: 12px;
}

.queue-type-tag text {
  font-size: 12px;
  color: #fff;
  font-weight: 600;
}

/* 订单信息 */
.order-info-card {
  width: 100%;
  background: var(--bg-card);
  border-radius: 12px;
  padding: 16px;
  box-shadow: var(--shadow-sm);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--divider);
}

.info-row:last-child { border-bottom: none; }

.info-label {
  font-size: 13px;
  color: var(--text-hint);
}

.info-value {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 600;
}

.info-value.primary { color: var(--primary); font-size: 16px; }

/* 等待提示 */
.wait-notice {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: var(--info-bg);
  padding: 12px 14px;
  border-radius: 10px;
}

.notice-icon { font-size: 18px; flex-shrink: 0; }

.notice-text {
  font-size: 12px;
  color: var(--info);
  line-height: 1.5;
}

/* 操作按钮 */
.action-btns { width: 100%; }
</style>
