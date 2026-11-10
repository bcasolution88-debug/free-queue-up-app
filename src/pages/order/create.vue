<template>
  <view class="page-container order-create-page">
    <!-- 导航栏 -->
    <view class="navbar">
      <view class="navbar-back" @click="goBack">←</view>
      <text class="navbar-title">{{ t('order_confirm') }}</text>
      <view style="width:36px;"></view>
    </view>

    <scroll-view scroll-y class="order-scroll">
      <!-- 商家信息 -->
      <view class="shop-header card">
        <text class="shop-emoji">{{ shopInfo?.logo }}</text>
        <view class="shop-text">
          <text class="shop-name">{{ lang === 'zh' ? shopInfo?.name : shopInfo?.nameEn }}</text>
          <text class="shop-addr">{{ lang === 'zh' ? shopInfo?.address : shopInfo?.addressEn }}</text>
        </view>
      </view>

      <!-- 订单商品 -->
      <view class="section-card card">
        <text class="section-title">{{ lang === 'zh' ? '订单商品' : 'Order Items' }}</text>
        <view v-for="item in cartItems" :key="item.id" class="order-item">
          <text class="item-emoji">{{ item.image }}</text>
          <view class="item-info">
            <text class="item-name">{{ lang === 'zh' ? item.name : item.nameEn }}</text>
            <text class="item-price">¥{{ item.price }}</text>
          </view>
          <view class="qty-control">
            <view class="qty-btn minus" @click="updateQty(item, -1)">−</view>
            <text class="qty-num">{{ item.qty }}</text>
            <view class="qty-btn plus" @click="updateQty(item, 1)">+</view>
          </view>
        </view>
      </view>

      <!-- 预约取货时间 -->
      <view class="section-card card">
        <text class="section-title">{{ t('pickup_time') }}</text>
        <view class="time-slots">
          <view 
            v-for="slot in timeSlots" 
            :key="slot.value"
            :class="['time-slot', { active: selectedTime === slot.value, disabled: slot.disabled }]"
            @click="!slot.disabled && (selectedTime = slot.value)"
          >
            <text class="slot-time">{{ slot.label }}</text>
            <text class="slot-remain" v-if="!slot.disabled">{{ slot.remain }}{{ lang === 'zh' ? '个名额' : ' slots' }}</text>
            <text class="slot-full" v-else>{{ lang === 'zh' ? '已满' : 'Full' }}</text>
          </view>
        </view>
      </view>

      <!-- 排队方式 -->
      <view class="section-card card">
        <text class="section-title">{{ t('queue_type') }}</text>
        <view class="queue-type-options">
          <view 
            :class="['queue-option', { active: queueType === 'online' }]"
            @click="queueType = 'online'"
          >
            <view class="option-radio">
              <view v-if="queueType === 'online'" class="radio-dot"></view>
            </view>
            <view class="option-content">
              <text class="option-title">{{ t('online_queue_opt') }}</text>
              <text class="option-desc">{{ lang === 'zh' ? '在线下单，按时到店取货' : 'Order online, pick up on time' }}</text>
            </view>
            <view class="option-badge online">
              <text>{{ shopInfo?.onlineQueue }}{{ t('people') }}</text>
            </view>
          </view>
          <view 
            :class="['queue-option', { active: queueType === 'instore' }]"
            @click="queueType = 'instore'"
          >
            <view class="option-radio">
              <view v-if="queueType === 'instore'" class="radio-dot"></view>
            </view>
            <view class="option-content">
              <text class="option-title">{{ t('instore_queue_opt') }}</text>
              <text class="option-desc">{{ lang === 'zh' ? '到店排队，现场取号' : 'Queue in store, take number on-site' }}</text>
            </view>
            <view class="option-badge instore">
              <text>{{ shopInfo?.instoreQueue }}{{ t('people') }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 备注 -->
      <view class="section-card card">
        <text class="section-title">{{ t('notes') }}</text>
        <textarea 
          v-model="notes"
          :placeholder="t('notes_placeholder')"
          class="notes-input"
          maxlength="200"
        />
      </view>

      <!-- 价格明细 -->
      <view class="price-card card">
        <view class="price-row">
          <text class="price-label">{{ t('subtotal') }}</text>
          <text class="price-value">¥{{ cartTotal.toFixed(2) }}</text>
        </view>
        <view class="price-row">
          <text class="price-label">{{ t('service_fee') }}</text>
          <text class="price-value free">{{ t('free') }}</text>
        </view>
        <view class="divider"></view>
        <view class="price-row total-row">
          <text class="total-label">{{ t('order_total') }}</text>
          <text class="total-value">¥{{ cartTotal.toFixed(2) }}</text>
        </view>
      </view>

      <view style="height: 90px;"></view>
    </scroll-view>

    <!-- 底部提交栏 -->
    <view class="submit-bar">
      <view class="total-display">
        <text class="total-text">{{ t('order_total') }}</text>
        <text class="total-amount">¥{{ cartTotal.toFixed(2) }}</text>
      </view>
      <button class="btn btn-primary submit-btn" @click="submitOrder" :disabled="loading || cartItems.length === 0">
        {{ loading ? t('loading') : t('place_order') }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { langStore, cartStore, orderStore, demoData } from '../../stores/app.js'

const lang = ref(langStore.lang)
const queueType = ref('online')
const notes = ref('')
const loading = ref(false)
const selectedTime = ref('')

const t = (key) => langStore.t(key)

const shopInfo = computed(() => {
  return demoData.shops.find(s => s.id === cartStore.shopId) || demoData.shops[0]
})

const cartItems = computed(() => cartStore.items)
const cartTotal = computed(() => cartStore.total)

// 时间段选项
const timeSlots = computed(() => {
  const now = new Date()
  const slots = []
  for (let i = 1; i <= 6; i++) {
    const time = new Date(now.getTime() + i * 30 * 60000)
    const h = time.getHours().toString().padStart(2, '0')
    const m = time.getMinutes().toString().padStart(2, '0')
    const remain = Math.floor(Math.random() * 10) + 1
    slots.push({
      value: `${h}:${m}`,
      label: `${h}:${m}`,
      remain,
      disabled: remain === 0
    })
  }
  return slots
})

onMounted(() => {
  if (timeSlots.value.length > 0) {
    selectedTime.value = timeSlots.value[0].value
  }
})

const updateQty = (item, delta) => {
  cartStore.updateQty(item.id, item.qty + delta)
}

const submitOrder = async () => {
  if (!selectedTime.value) {
    uni.showToast({ title: lang.value === 'zh' ? '请选择取货时间' : 'Please select pickup time', icon: 'none' })
    return
  }
  if (cartItems.value.length === 0) {
    uni.showToast({ title: lang.value === 'zh' ? '购物车为空' : 'Cart is empty', icon: 'none' })
    return
  }

  loading.value = true
  await new Promise(r => setTimeout(r, 800))

  // 生成订单
  const orderId = 'ORD' + Date.now()
  const queueNo = (queueType.value === 'online' ? 'A' : 'B') + String(Math.floor(Math.random() * 900) + 100)
  
  const order = {
    id: orderId,
    shopId: cartStore.shopId,
    shopName: cartStore.shopName,
    items: cartItems.value.map(i => ({ id: i.id, name: i.name, nameEn: i.nameEn, price: i.price, qty: i.qty })),
    totalAmount: cartTotal.value,
    status: 'pending',
    queueNo,
    queueType: queueType.value,
    pickupTime: selectedTime.value,
    notes: notes.value,
    createdAt: new Date().toISOString()
  }

  orderStore.addOrder(order)
  loading.value = false

  // 跳转支付页
  uni.navigateTo({ url: `/pages/order/payment?orderId=${orderId}` })
}

const goBack = () => {
  uni.navigateBack()
}
</script>

<style scoped>
.order-create-page { background: var(--bg-page); }

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

.navbar-back {
  font-size: 24px;
  color: var(--text-primary);
  cursor: pointer;
  font-weight: 300;
}

.navbar-title {
  flex: 1;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
}

.order-scroll {
  height: calc(100vh - 54px - 70px);
}

/* 商家头部 */
.shop-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px 16px;
  padding: 14px;
}

.shop-emoji { font-size: 36px; }

.shop-name {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.shop-addr {
  display: block;
  font-size: 12px;
  color: var(--text-hint);
}

/* 区块卡片 */
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

/* 订单商品 */
.order-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--divider);
}

.order-item:last-child { border-bottom: none; }

.item-emoji { font-size: 28px; }

.item-info { flex: 1; }

.item-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.item-price {
  display: block;
  font-size: 13px;
  color: var(--primary);
  font-weight: 600;
}

.qty-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qty-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
}

.qty-btn.minus {
  background: var(--bg-input);
  color: var(--text-primary);
  border: 1.5px solid var(--border-input);
}

.qty-btn.plus {
  background: var(--primary);
  color: #fff;
}

.qty-num {
  font-size: 15px;
  font-weight: 700;
  min-width: 18px;
  text-align: center;
}

/* 时间段选择 */
.time-slots {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.time-slot {
  border: 1.5px solid var(--border-input);
  border-radius: 8px;
  padding: 10px 6px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--bg-input);
}

.time-slot.active {
  border-color: var(--primary);
  background: var(--primary-bg);
}

.time-slot.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.slot-time {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 3px;
}

.time-slot.active .slot-time { color: var(--primary); }

.slot-remain {
  display: block;
  font-size: 10px;
  color: var(--success);
}

.slot-full {
  display: block;
  font-size: 10px;
  color: var(--error);
}

/* 排队方式 */
.queue-type-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.queue-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 2px solid var(--border-input);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--bg-input);
}

.queue-option.active {
  border-color: var(--primary);
  background: var(--primary-bg);
}

.option-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--border-input);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.queue-option.active .option-radio {
  border-color: var(--primary);
}

.radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--primary);
}

.option-content { flex: 1; }

.option-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 3px;
}

.option-desc {
  display: block;
  font-size: 11px;
  color: var(--text-hint);
}

.option-badge {
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.option-badge.online { background: var(--success-bg); color: var(--success); }
.option-badge.instore { background: var(--info-bg); color: var(--info); }

/* 备注 */
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

/* 价格明细 */
.price-card {
  margin: 0 16px 12px;
  padding: 14px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.price-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.price-value {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.price-value.free { color: var(--success); }

.total-row { margin-top: 4px; }

.total-label {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.total-value {
  font-size: 20px;
  font-weight: 800;
  color: var(--primary);
}

/* 提交栏 */
.submit-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-card);
  box-shadow: 0 -2px 12px rgba(0,0,0,0.1);
  border-top: 1px solid var(--divider);
}

.total-display {
  display: flex;
  flex-direction: column;
}

.total-text {
  font-size: 11px;
  color: var(--text-hint);
}

.total-amount {
  font-size: 22px;
  font-weight: 800;
  color: var(--primary);
}

.submit-btn {
  min-width: 140px;
  height: 46px;
  border-radius: 23px;
  font-size: 16px;
}
</style>
