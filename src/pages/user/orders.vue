<template>
  <view class="page-container orders-page">
    <view class="navbar">
      <view style="width:36px;"></view>
      <text class="navbar-title">{{ t('my_orders') }}</text>
      <view style="width:36px;"></view>
    </view>

    <!-- 状态筛选 -->
    <view class="filter-bar">
      <view 
        v-for="f in filters" 
        :key="f.key"
        :class="['filter-chip', { active: activeFilter === f.key }]"
        @click="activeFilter = f.key"
      >
        {{ lang === 'zh' ? f.label : f.labelEn }}
      </view>
    </view>

    <scroll-view scroll-y class="orders-scroll">
      <view v-if="filteredOrders.length === 0" class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">{{ lang === 'zh' ? '暂无订单' : 'No orders yet' }}</text>
      </view>

      <view v-for="order in filteredOrders" :key="order.id" class="order-card card">
        <!-- 订单头部 -->
        <view class="order-header">
          <view class="shop-info">
            <text class="shop-name">{{ order.shopName }}</text>
            <text class="order-time">{{ formatDate(order.createdAt) }}</text>
          </view>
          <view :class="['status-badge', order.status]">
            {{ getStatusText(order.status) }}
          </view>
        </view>

        <!-- 商品列表 -->
        <view class="order-items">
          <view v-for="item in order.items" :key="item.id" class="order-item-row">
            <text class="item-name">{{ lang === 'zh' ? item.name : (item.nameEn || item.name) }}</text>
            <text class="item-qty">x{{ item.qty }}</text>
            <text class="item-price">¥{{ (item.price * item.qty).toFixed(2) }}</text>
          </view>
        </view>

        <!-- 排队信息 -->
        <view class="queue-info-row">
          <view class="queue-chip" :class="order.queueType">
            <text>🎫 {{ t('queue_no') }}: {{ order.queueNo }}</text>
          </view>
          <view class="queue-chip type-chip">
            <text>{{ order.queueType === 'online' ? t('online_queue') : t('instore_queue') }}</text>
          </view>
        </view>

        <!-- 订单底部 -->
        <view class="order-footer">
          <view class="total-row">
            <text class="total-label">{{ t('order_total') }}</text>
            <text class="total-amount">¥{{ order.totalAmount.toFixed(2) }}</text>
          </view>
          <view class="action-btns">
            <button 
              v-if="order.status === 'paid' || order.status === 'ready'" 
              class="action-btn outline"
              @click="viewQueue(order)"
            >
              {{ lang === 'zh' ? '查看排队' : 'View Queue' }}
            </button>
            <button 
              v-if="order.status === 'paid' || order.status === 'ready'" 
              class="action-btn danger"
              @click="requestRefund(order)"
            >
              {{ t('request_refund') }}
            </button>
            <button 
              v-if="order.status === 'completed'" 
              class="action-btn primary"
              @click="reorder(order)"
            >
              {{ t('reorder') }}
            </button>
            <button 
              v-if="order.status === 'pending'" 
              class="action-btn primary"
              @click="payOrder(order)"
            >
              {{ lang === 'zh' ? '去支付' : 'Pay Now' }}
            </button>
          </view>
        </view>
      </view>

      <view style="height: 20px;"></view>
    </scroll-view>

    <TabBar current="orders" />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { langStore, orderStore } from '../../stores/app.js'
import TabBar from '../../components/common/TabBar.vue'

const lang = ref(langStore.lang)
const activeFilter = ref('all')

const t = (key) => langStore.t(key)

const filters = [
  { key: 'all', label: '全部', labelEn: 'All' },
  { key: 'pending', label: '待支付', labelEn: 'Pending' },
  { key: 'paid', label: '已支付', labelEn: 'Paid' },
  { key: 'ready', label: '待领取', labelEn: 'Ready' },
  { key: 'completed', label: '已完成', labelEn: 'Done' },
  { key: 'refunded', label: '已退款', labelEn: 'Refunded' },
]

const allOrders = ref([])

onMounted(() => {
  orderStore.generateDemoOrders()
  allOrders.value = orderStore.orders
})

const filteredOrders = computed(() => {
  if (activeFilter.value === 'all') return allOrders.value
  return allOrders.value.filter(o => o.status === activeFilter.value)
})

const getStatusText = (status) => {
  const map = {
    pending: t('status_pending'),
    paid: t('status_paid'),
    ready: t('status_ready'),
    completed: t('status_completed'),
    cancelled: t('status_cancelled'),
    refunded: t('status_refunded'),
  }
  return map[status] || status
}

const formatDate = (isoStr) => {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}

const viewQueue = (order) => {
  uni.navigateTo({ url: `/pages/queue/status?orderId=${order.id}` })
}

const requestRefund = (order) => {
  uni.navigateTo({ url: `/pages/user/refund?orderId=${order.id}` })
}

const reorder = (order) => {
  uni.navigateTo({ url: `/pages/shop/detail?shopId=${order.shopId}` })
}

const payOrder = (order) => {
  uni.navigateTo({ url: `/pages/order/payment?orderId=${order.id}` })
}
</script>

<style scoped>
.orders-page { background: var(--bg-page); }

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
.navbar-title { flex: 1; font-size: 17px; font-weight: 700; color: var(--text-primary); text-align: center; }

.filter-bar {
  display: flex;
  gap: 8px;
  padding: 10px 16px;
  background: var(--bg-card);
  overflow-x: auto;
  border-bottom: 1px solid var(--divider);
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.filter-bar::-webkit-scrollbar { display: none; }

.filter-chip {
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: var(--bg-input);
  color: var(--text-secondary);
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-chip.active {
  background: var(--primary-bg);
  color: var(--primary);
  border-color: var(--primary);
}

.orders-scroll { height: calc(100vh - 54px - 46px - 60px); }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 12px;
}
.empty-icon { font-size: 52px; }
.empty-text { font-size: 14px; color: var(--text-hint); }

/* 订单卡片 */
.order-card {
  margin: 12px 16px 0;
  padding: 0;
  overflow: hidden;
}

.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px 10px;
  border-bottom: 1px solid var(--divider);
}

.shop-name {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 3px;
}

.order-time {
  display: block;
  font-size: 11px;
  color: var(--text-hint);
}

.status-badge {
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.pending { background: var(--warning-bg); color: var(--warning); }
.status-badge.paid { background: var(--info-bg); color: var(--info); }
.status-badge.ready { background: var(--primary-bg); color: var(--primary); }
.status-badge.completed { background: var(--success-bg); color: var(--success); }
.status-badge.cancelled, .status-badge.refunded { background: var(--bg-input); color: var(--text-hint); }

.order-items { padding: 10px 14px; }

.order-item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.item-name {
  flex: 1;
  font-size: 13px;
  color: var(--text-secondary);
}

.item-qty {
  font-size: 12px;
  color: var(--text-hint);
}

.item-price {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

/* 排队信息 */
.queue-info-row {
  display: flex;
  gap: 8px;
  padding: 0 14px 10px;
}

.queue-chip {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
}

.queue-chip.online { background: var(--success-bg); color: var(--success); }
.queue-chip.instore { background: var(--info-bg); color: var(--info); }
.queue-chip.type-chip { background: var(--bg-input); color: var(--text-hint); }

/* 订单底部 */
.order-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px 14px;
  border-top: 1px solid var(--divider);
}

.total-row { display: flex; flex-direction: column; }

.total-label {
  font-size: 11px;
  color: var(--text-hint);
}

.total-amount {
  font-size: 18px;
  font-weight: 800;
  color: var(--primary);
}

.action-btns {
  display: flex;
  gap: 8px;
}

.action-btn {
  height: 34px;
  padding: 0 14px;
  border-radius: 17px;
  font-size: 12px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.action-btn.primary { background: var(--primary); color: #fff; }
.action-btn.outline { background: transparent; color: var(--primary); border: 1.5px solid var(--primary); }
.action-btn.danger { background: var(--error-bg); color: var(--error); }
</style>
