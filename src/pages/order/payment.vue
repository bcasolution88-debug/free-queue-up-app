<template>
  <view class="page-container payment-page">
    <view class="navbar">
      <view class="navbar-back" @click="goBack">←</view>
      <text class="navbar-title">{{ t('payment') }}</text>
      <view style="width:36px;"></view>
    </view>

    <scroll-view scroll-y class="payment-scroll">
      <!-- 金额展示 -->
      <view class="amount-section">
        <view class="amount-card gradient-primary">
          <text class="amount-label">{{ t('order_total') }}</text>
          <text class="amount-value">¥{{ order?.totalAmount?.toFixed(2) }}</text>
          <text class="order-id">{{ t('order_no') }}: {{ order?.id }}</text>
          <view class="queue-info-row">
            <view class="queue-chip">
              <text>🎫 {{ t('queue_no') }}: {{ order?.queueNo }}</text>
            </view>
            <view class="queue-chip">
              <text>⏰ {{ t('pickup_time_label') }}: {{ order?.pickupTime }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 支付方式 -->
      <view class="section-card card">
        <text class="section-title">{{ t('payment_method') }}</text>
        <view 
          :class="['pay-option', { active: payMethod === 'wechat' }]"
          @click="payMethod = 'wechat'"
        >
          <text class="pay-icon">💬</text>
          <text class="pay-name">{{ t('wechat_pay') }}</text>
          <view class="pay-radio">
            <view v-if="payMethod === 'wechat'" class="radio-dot"></view>
          </view>
        </view>
        <view 
          :class="['pay-option', { active: payMethod === 'alipay' }]"
          @click="payMethod = 'alipay'"
        >
          <text class="pay-icon">💙</text>
          <text class="pay-name">{{ t('alipay') }}</text>
          <view class="pay-radio">
            <view v-if="payMethod === 'alipay'" class="radio-dot"></view>
          </view>
        </view>
      </view>

      <!-- 退款政策 -->
      <view class="notice-card">
        <view class="notice-bar warning">
          <text class="notice-icon">⚠️</text>
          <view class="notice-text">
            <text class="notice-title">{{ t('refund_policy') }}</text>
            <text class="notice-desc">{{ t('refund_policy_text') }}</text>
          </view>
        </view>
      </view>

      <!-- 爽约赔款说明 -->
      <view class="penalty-card card">
        <text class="penalty-title">{{ t('no_show_penalty') }}</text>
        <view class="penalty-row">
          <text class="penalty-label">{{ lang === 'zh' ? '超时2小时未取货' : 'Not picked up within 2 hours' }}</text>
          <text class="penalty-value success">{{ lang === 'zh' ? '全额退款' : 'Full Refund' }}</text>
        </view>
        <view class="penalty-row">
          <text class="penalty-label">{{ lang === 'zh' ? '主动取消订单' : 'Cancel order actively' }}</text>
          <text class="penalty-value warning">{{ lang === 'zh' ? '扣除20%违约金' : '20% penalty deducted' }}</text>
        </view>
        <view class="penalty-row">
          <text class="penalty-label">{{ lang === 'zh' ? '商家备货后取消' : 'Cancel after preparation' }}</text>
          <text class="penalty-value error">{{ lang === 'zh' ? '扣除50%违约金' : '50% penalty deducted' }}</text>
        </view>
      </view>

      <view style="height: 100px;"></view>
    </scroll-view>

    <!-- 支付按钮 -->
    <view class="pay-action-bar">
      <button class="btn btn-ghost cancel-btn" @click="cancelOrder">{{ t('cancel_payment') }}</button>
      <button class="btn btn-primary pay-btn" @click="handlePay" :disabled="loading">
        <text v-if="loading" class="spinner-text">{{ t('processing') }}</text>
        <text v-else>{{ t('pay_now') }} ¥{{ order?.totalAmount?.toFixed(2) }}</text>
      </button>
    </view>

    <!-- 支付处理中遮罩 -->
    <view v-if="loading" class="pay-loading-overlay">
      <view class="pay-loading-card">
        <view class="pay-spinner"></view>
        <text class="pay-loading-text">{{ t('processing') }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { langStore, orderStore } from '../../stores/app.js'

const lang = ref(langStore.lang)
const payMethod = ref('wechat')
const loading = ref(false)
const order = ref(null)
const orderId = ref('')

const t = (key) => langStore.t(key)

onMounted(() => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  orderId.value = page.$route?.query?.orderId || page.options?.orderId || ''
  
  if (orderId.value) {
    order.value = orderStore.getOrder(orderId.value)
  }
  
  if (!order.value) {
    // 演示用默认订单
    order.value = {
      id: 'ORD' + Date.now(),
      totalAmount: 86,
      queueNo: 'A098',
      pickupTime: '14:30'
    }
  }
})

const handlePay = async () => {
  loading.value = true
  
  // 模拟支付流程
  await new Promise(r => setTimeout(r, 2000))
  
  // 更新订单状态
  if (orderId.value) {
    orderStore.updateOrder(orderId.value, { status: 'paid' })
  }
  
  loading.value = false
  
  // 跳转支付成功页
  uni.redirectTo({ url: `/pages/order/success?orderId=${orderId.value}&queueNo=${order.value?.queueNo}` })
}

const cancelOrder = () => {
  uni.showModal({
    title: lang.value === 'zh' ? '取消支付' : 'Cancel Payment',
    content: lang.value === 'zh' ? '确定要取消本次支付吗？' : 'Are you sure to cancel?',
    success: (res) => {
      if (res.confirm) {
        if (orderId.value) {
          orderStore.updateOrder(orderId.value, { status: 'cancelled' })
        }
        uni.navigateBack()
      }
    }
  })
}

const goBack = () => {
  uni.navigateBack()
}
</script>

<style scoped>
.payment-page { background: var(--bg-page); }

.navbar {
  display: flex;
  align-items: center;
  height: 54px;
  padding: 0 16px;
  background: var(--navbar-bg);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
}
.navbar-back { font-size: 24px; color: var(--text-primary); cursor: pointer; font-weight: 300; }
.navbar-title { flex: 1; font-size: 17px; font-weight: 700; color: var(--text-primary); text-align: center; }

.payment-scroll { height: calc(100vh - 54px - 70px); }

/* 金额卡片 */
.amount-section { padding: 16px; }

.amount-card {
  border-radius: 16px;
  padding: 24px 20px;
  text-align: center;
}

.amount-label {
  display: block;
  font-size: 13px;
  color: rgba(255,255,255,0.8);
  margin-bottom: 8px;
}

.amount-value {
  display: block;
  font-size: 42px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 8px;
}

.order-id {
  display: block;
  font-size: 11px;
  color: rgba(255,255,255,0.7);
  margin-bottom: 14px;
}

.queue-info-row {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.queue-chip {
  background: rgba(255,255,255,0.2);
  padding: 5px 12px;
  border-radius: 12px;
  font-size: 11px;
  color: #fff;
  font-weight: 600;
}

/* 支付方式 */
.section-card {
  margin: 0 16px 12px;
  padding: 14px;
}

.section-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.pay-option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border: 2px solid var(--border-input);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 10px;
  background: var(--bg-input);
}

.pay-option:last-child { margin-bottom: 0; }

.pay-option.active {
  border-color: var(--primary);
  background: var(--primary-bg);
}

.pay-icon { font-size: 28px; }

.pay-name {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.pay-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--border-input);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pay-option.active .pay-radio { border-color: var(--primary); }

.radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--primary);
}

/* 通知栏 */
.notice-card { padding: 0 16px 12px; }

.notice-bar {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
}

.notice-bar.warning {
  background: var(--warning-bg);
}

.notice-icon { font-size: 18px; flex-shrink: 0; }

.notice-title {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: var(--warning);
  margin-bottom: 4px;
}

.notice-desc {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* 爽约赔款 */
.penalty-card {
  margin: 0 16px 12px;
  padding: 14px;
}

.penalty-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.penalty-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--divider);
}

.penalty-row:last-child { border-bottom: none; }

.penalty-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.penalty-value {
  font-size: 12px;
  font-weight: 700;
}

.penalty-value.success { color: var(--success); }
.penalty-value.warning { color: var(--warning); }
.penalty-value.error { color: var(--error); }

/* 支付按钮栏 */
.pay-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  background: var(--bg-card);
  box-shadow: 0 -2px 12px rgba(0,0,0,0.1);
  border-top: 1px solid var(--divider);
}

.cancel-btn {
  flex: 0 0 100px;
  height: 46px;
  border-radius: 23px;
}

.pay-btn {
  flex: 1;
  height: 46px;
  border-radius: 23px;
  font-size: 16px;
  font-weight: 700;
}

/* 支付loading遮罩 */
.pay-loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.pay-loading-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 32px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.pay-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.pay-loading-text {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}
</style>
