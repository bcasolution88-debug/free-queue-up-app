<template>
  <view class="page-container refund-page">
    <view class="navbar">
      <view class="navbar-back" @click="goBack">←</view>
      <text class="navbar-title">{{ t('refund_apply') }}</text>
      <view style="width:36px;"></view>
    </view>

    <scroll-view scroll-y class="refund-scroll">
      <!-- 订单信息 -->
      <view class="order-summary card">
        <view class="summary-header">
          <text class="shop-name">{{ order?.shopName }}</text>
          <text class="order-id">{{ t('order_no') }}: {{ order?.id }}</text>
        </view>
        <view v-for="item in order?.items" :key="item.id" class="summary-item">
          <text class="item-name">{{ lang === 'zh' ? item.name : (item.nameEn || item.name) }}</text>
          <text class="item-detail">x{{ item.qty }} · ¥{{ (item.price * item.qty).toFixed(2) }}</text>
        </view>
        <view class="summary-total">
          <text class="total-label">{{ t('order_total') }}</text>
          <text class="total-value">¥{{ order?.totalAmount?.toFixed(2) }}</text>
        </view>
      </view>

      <!-- 退款原因 -->
      <view class="section-card card">
        <text class="section-title">{{ t('refund_reason') }}</text>
        <view class="reason-list">
          <view 
            v-for="reason in reasons" 
            :key="reason.key"
            :class="['reason-item', { active: selectedReason === reason.key }]"
            @click="selectedReason = reason.key"
          >
            <view class="reason-radio">
              <view v-if="selectedReason === reason.key" class="radio-dot"></view>
            </view>
            <text class="reason-text">{{ lang === 'zh' ? reason.label : reason.labelEn }}</text>
          </view>
        </view>
      </view>

      <!-- 退款金额 -->
      <view class="refund-amount-card card">
        <text class="section-title">{{ t('refund_amount') }}</text>
        <view class="amount-display">
          <text class="amount-value">¥{{ refundAmount.toFixed(2) }}</text>
          <text v-if="penaltyRate > 0" class="penalty-note">
            {{ lang === 'zh' ? `(已扣除${penaltyRate*100}%违约金)` : `(${penaltyRate*100}% penalty deducted)` }}
          </text>
        </view>
        <view class="est-time">
          <text class="est-label">{{ t('est_processing') }}</text>
          <text class="est-value">3-5 {{ t('working_days') }}</text>
        </view>
      </view>

      <!-- 爽约警告 -->
      <view v-if="showPenaltyWarning" class="warning-card">
        <view class="notice-bar warning">
          <text class="notice-icon">⚠️</text>
          <text class="notice-text">{{ t('no_show_warning') }}</text>
        </view>
      </view>

      <!-- 备注 -->
      <view class="section-card card">
        <text class="section-title">{{ lang === 'zh' ? '补充说明' : 'Additional Notes' }}</text>
        <textarea 
          v-model="refundNote"
          :placeholder="lang === 'zh' ? '请描述退款原因（选填）' : 'Describe your reason (optional)'"
          class="notes-input"
          maxlength="200"
        />
      </view>

      <view style="height: 90px;"></view>
    </scroll-view>

    <!-- 提交退款 -->
    <view class="submit-bar">
      <button class="btn btn-primary btn-full submit-btn" @click="submitRefund" :disabled="loading || !selectedReason">
        {{ loading ? t('loading') : t('submit_refund') }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { langStore, orderStore } from '../../stores/app.js'

const lang = ref(langStore.lang)
const selectedReason = ref('')
const refundNote = ref('')
const loading = ref(false)
const order = ref(null)

const t = (key) => langStore.t(key)

const reasons = [
  { key: 'not_pickup', label: '未到店取货', labelEn: 'Not picked up' },
  { key: 'merchant_error', label: '商家备货失误', labelEn: 'Merchant error' },
  { key: 'quality_issue', label: '产品质量问题', labelEn: 'Quality issue' },
  { key: 'change_mind', label: '临时改变主意', labelEn: 'Changed my mind' },
  { key: 'other', label: '其他原因', labelEn: 'Other' },
]

const penaltyRate = computed(() => {
  if (selectedReason.value === 'change_mind') return 0.2
  if (selectedReason.value === 'not_pickup') return 0
  return 0
})

const refundAmount = computed(() => {
  const total = order.value?.totalAmount || 0
  return total * (1 - penaltyRate.value)
})

const showPenaltyWarning = computed(() => penaltyRate.value > 0)

onMounted(() => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  const orderId = page.$route?.query?.orderId || page.options?.orderId

  if (orderId) {
    order.value = orderStore.getOrder(orderId)
  }

  if (!order.value) {
    order.value = {
      id: 'ORD20250601001',
      shopName: '外婆家',
      items: [{ id: 'p001', name: '东坡肉', nameEn: 'Dongpo Pork', price: 38, qty: 1 }],
      totalAmount: 86
    }
  }
})

const submitRefund = async () => {
  if (!selectedReason.value) {
    uni.showToast({ title: lang.value === 'zh' ? '请选择退款原因' : 'Please select a reason', icon: 'none' })
    return
  }

  loading.value = true
  await new Promise(r => setTimeout(r, 1200))

  if (order.value?.id) {
    orderStore.updateOrder(order.value.id, { status: 'refunded' })
  }

  loading.value = false
  uni.showToast({ title: lang.value === 'zh' ? '退款申请已提交' : 'Refund submitted', icon: 'success' })
  setTimeout(() => uni.navigateBack(), 1500)
}

const goBack = () => uni.navigateBack()
</script>

<style scoped>
.refund-page { background: var(--bg-page); }

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

.refund-scroll { height: calc(100vh - 54px - 70px); }

.order-summary {
  margin: 12px 16px;
  padding: 14px;
}

.summary-header { margin-bottom: 10px; }

.shop-name {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 3px;
}

.order-id {
  display: block;
  font-size: 11px;
  color: var(--text-hint);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px solid var(--divider);
}

.item-name { font-size: 13px; color: var(--text-secondary); }
.item-detail { font-size: 13px; color: var(--text-primary); font-weight: 500; }

.summary-total {
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
  margin-top: 4px;
}

.total-label { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.total-value { font-size: 18px; font-weight: 800; color: var(--primary); }

.section-card { margin: 0 16px 12px; padding: 14px; }

.section-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.reason-list { display: flex; flex-direction: column; gap: 8px; }

.reason-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 2px solid var(--border-input);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--bg-input);
}

.reason-item.active {
  border-color: var(--primary);
  background: var(--primary-bg);
}

.reason-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--border-input);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.reason-item.active .reason-radio { border-color: var(--primary); }

.radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--primary);
}

.reason-text { font-size: 14px; color: var(--text-primary); font-weight: 500; }

.refund-amount-card { margin: 0 16px 12px; padding: 14px; }

.amount-display {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
}

.amount-value {
  font-size: 32px;
  font-weight: 800;
  color: var(--primary);
}

.penalty-note {
  font-size: 12px;
  color: var(--warning);
}

.est-time {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-top: 1px solid var(--divider);
}

.est-label { font-size: 13px; color: var(--text-hint); }
.est-value { font-size: 13px; color: var(--text-primary); font-weight: 600; }

.warning-card { padding: 0 16px 12px; }

.notice-bar {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
}

.notice-bar.warning { background: var(--warning-bg); }
.notice-icon { font-size: 18px; flex-shrink: 0; }
.notice-text { font-size: 12px; color: var(--warning); line-height: 1.5; }

.notes-input {
  width: 100%;
  min-height: 80px;
  background: var(--bg-input);
  border: 1.5px solid var(--border-input);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  color: var(--text-primary);
  outline: none;
  resize: none;
}

.submit-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 480px;
  margin: 0 auto;
  padding: 12px 16px;
  background: var(--bg-card);
  box-shadow: 0 -2px 12px rgba(0,0,0,0.1);
  border-top: 1px solid var(--divider);
}

.submit-btn {
  height: 48px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 700;
}
</style>
