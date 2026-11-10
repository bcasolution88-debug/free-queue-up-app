<template>
  <view class="page-container merchant-page">
    <!-- 顶部导航 -->
    <view class="merchant-navbar gradient-primary">
      <view class="navbar-left">
        <text class="merchant-title">{{ t('merchant_title') }}</text>
        <text class="shop-name-sub">{{ lang === 'zh' ? '外婆家' : 'Waipojia' }}</text>
      </view>
      <view class="navbar-actions">
        <view class="action-icon" @click="toggleLang">
          <text class="lang-text">{{ lang === 'zh' ? 'EN' : '中' }}</text>
        </view>
        <view class="action-icon" @click="goToProfile">👤</view>
      </view>
    </view>

    <!-- 商家端Tab导航 -->
    <view class="merchant-tabs">
      <view 
        v-for="tab in merchantTabs" 
        :key="tab.key"
        :class="['merchant-tab', { active: activeTab === tab.key }]"
        @click="switchTab(tab.key)"
      >
        <text class="tab-icon">{{ tab.icon }}</text>
        <text class="tab-label">{{ lang === 'zh' ? tab.label : tab.labelEn }}</text>
      </view>
    </view>

    <!-- 统计概览 -->
    <view class="stats-overview">
      <view class="stat-card">
        <text class="stat-value">{{ stats.today }}</text>
        <text class="stat-label">{{ lang === 'zh' ? '今日订单' : 'Today' }}</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ stats.pending }}</text>
        <text class="stat-label">{{ lang === 'zh' ? '待处理' : 'Pending' }}</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ stats.completed }}</text>
        <text class="stat-label">{{ lang === 'zh' ? '已完成' : 'Done' }}</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">¥{{ stats.revenue }}</text>
        <text class="stat-label">{{ lang === 'zh' ? '今日营收' : 'Revenue' }}</text>
      </view>
    </view>

    <!-- 订单状态筛选 -->
    <view class="filter-bar">
      <view 
        v-for="f in orderFilters" 
        :key="f.key"
        :class="['filter-chip', { active: activeFilter === f.key }]"
        @click="activeFilter = f.key"
      >
        {{ lang === 'zh' ? f.label : f.labelEn }}
        <text v-if="f.count > 0" class="chip-count">{{ f.count }}</text>
      </view>
    </view>

    <!-- 订单列表 -->
    <scroll-view scroll-y class="orders-scroll">
      <view v-for="order in filteredOrders" :key="order.id" class="merchant-order-card card">
        <!-- 订单头 -->
        <view class="morder-header">
          <view class="customer-info">
            <text class="customer-avatar">{{ order.customerAvatar }}</text>
            <view>
              <text class="customer-name">{{ order.customerName }}</text>
              <text class="order-time">{{ order.time }}</text>
            </view>
          </view>
          <view :class="['morder-status', order.status]">
            {{ getStatusText(order.status) }}
          </view>
        </view>

        <!-- 商品 -->
        <view class="morder-items">
          <view v-for="item in order.items" :key="item.name" class="morder-item">
            <text class="item-emoji">{{ item.emoji }}</text>
            <text class="item-name">{{ item.name }}</text>
            <text class="item-qty">x{{ item.qty }}</text>
          </view>
        </view>

        <!-- 排队信息 -->
        <view class="morder-queue-row">
          <view class="queue-badge-merchant" :class="order.queueType">
            <text>🎫 {{ order.queueNo }}</text>
          </view>
          <text class="pickup-time">⏰ {{ order.pickupTime }}</text>
          <text class="order-amount">¥{{ order.amount }}</text>
        </view>

        <!-- 操作按钮 -->
        <view class="morder-actions">
          <button 
            v-if="order.status === 'paid'" 
            class="maction-btn primary"
            @click="startPrepare(order)"
          >
            {{ lang === 'zh' ? '开始备货' : 'Start Prep' }}
          </button>
          <button 
            v-if="order.status === 'preparing'" 
            class="maction-btn success"
            @click="notifyCustomer(order)"
          >
            {{ t('notify_now') }}
          </button>
          <button 
            v-if="order.status === 'ready'" 
            class="maction-btn info"
            @click="confirmPickup(order)"
          >
            {{ t('confirm_pickup') }}
          </button>
          <button 
            v-if="order.status !== 'completed' && order.status !== 'cancelled'"
            class="maction-btn ghost"
            @click="viewOrderDetail(order)"
          >
            {{ lang === 'zh' ? '详情' : 'Detail' }}
          </button>
        </view>
      </view>

      <view v-if="filteredOrders.length === 0" class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">{{ lang === 'zh' ? '暂无订单' : 'No orders' }}</text>
      </view>

      <view style="height: 20px;"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { langStore } from '../../stores/app.js'

const lang = ref(langStore.lang)
const activeTab = ref('orders')
const activeFilter = ref('all')

const t = (key) => langStore.t(key)

const merchantTabs = [
  { key: 'orders', label: '订单管理', labelEn: 'Orders', icon: '📋' },
  { key: 'queue', label: '排队管理', labelEn: 'Queue', icon: '🚶' },
  { key: 'notify', label: '通知用户', labelEn: 'Notify', icon: '🔔' },
]

const stats = ref({ today: 48, pending: 12, completed: 36, revenue: '2,840' })

const orderFilters = [
  { key: 'all', label: '全部', labelEn: 'All', count: 0 },
  { key: 'paid', label: '待备货', labelEn: 'Pending', count: 5 },
  { key: 'preparing', label: '备货中', labelEn: 'Preparing', count: 4 },
  { key: 'ready', label: '待取货', labelEn: 'Ready', count: 3 },
  { key: 'completed', label: '已完成', labelEn: 'Done', count: 0 },
]

const orders = ref([
  {
    id: 'ORD001', customerName: '张小明', customerAvatar: '😊', time: '14:25',
    items: [{ emoji: '🥩', name: '东坡肉', qty: 1 }, { emoji: '🐟', name: '西湖醋鱼', qty: 1 }],
    queueNo: 'A098', queueType: 'online', pickupTime: '15:00', amount: 86, status: 'paid'
  },
  {
    id: 'ORD002', customerName: 'Alice', customerAvatar: '🙂', time: '14:18',
    items: [{ emoji: '🦐', name: '龙井虾仁', qty: 1 }],
    queueNo: 'A097', queueType: 'online', pickupTime: '14:50', amount: 68, status: 'preparing'
  },
  {
    id: 'ORD003', customerName: '李华', customerAvatar: '😋', time: '14:10',
    items: [{ emoji: '🍲', name: '宋嫂鱼羹', qty: 2 }],
    queueNo: 'B012', queueType: 'instore', pickupTime: '14:40', amount: 56, status: 'ready'
  },
  {
    id: 'ORD004', customerName: '王芳', customerAvatar: '😄', time: '13:55',
    items: [{ emoji: '🍗', name: '叫花鸡', qty: 1 }],
    queueNo: 'A096', queueType: 'online', pickupTime: '14:30', amount: 88, status: 'completed'
  },
  {
    id: 'ORD005', customerName: '陈伟', customerAvatar: '🧑', time: '13:40',
    items: [{ emoji: '🥩', name: '东坡肉', qty: 2 }],
    queueNo: 'A095', queueType: 'online', pickupTime: '14:20', amount: 76, status: 'paid'
  },
])

const filteredOrders = computed(() => {
  if (activeFilter.value === 'all') return orders.value
  return orders.value.filter(o => o.status === activeFilter.value)
})

const getStatusText = (status) => {
  const map = {
    paid: lang.value === 'zh' ? '待备货' : 'Pending',
    preparing: lang.value === 'zh' ? '备货中' : 'Preparing',
    ready: lang.value === 'zh' ? '待取货' : 'Ready',
    completed: lang.value === 'zh' ? '已完成' : 'Done',
    cancelled: lang.value === 'zh' ? '已取消' : 'Cancelled',
  }
  return map[status] || status
}

const startPrepare = (order) => {
  order.status = 'preparing'
  uni.showToast({ title: lang.value === 'zh' ? '已开始备货' : 'Preparation started', icon: 'success' })
}

const notifyCustomer = (order) => {
  order.status = 'ready'
  uni.showToast({ title: lang.value === 'zh' ? '已通知用户取货' : 'Customer notified', icon: 'success' })
}

const confirmPickup = (order) => {
  order.status = 'completed'
  uni.showToast({ title: lang.value === 'zh' ? '取货已确认' : 'Pickup confirmed', icon: 'success' })
}

const viewOrderDetail = (order) => {
  uni.showToast({ title: `${lang.value === 'zh' ? '订单' : 'Order'} ${order.id}`, icon: 'none' })
}

const switchTab = (key) => {
  activeTab.value = key
  const routes = {
    orders: '/pages/shop-admin/orders',
    queue: '/pages/shop-admin/queue',
    notify: '/pages/shop-admin/notify',
  }
  if (routes[key]) uni.reLaunch({ url: routes[key] })
}

const toggleLang = () => {
  langStore.toggle()
  lang.value = langStore.lang
}

const goToProfile = () => {
  uni.navigateTo({ url: '/pages/user/profile' })
}
</script>

<style scoped>
.merchant-page { background: var(--bg-page); }

.merchant-navbar {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.merchant-title {
  display: block;
  font-size: 18px;
  font-weight: 800;
  color: #fff;
}

.shop-name-sub {
  display: block;
  font-size: 12px;
  color: rgba(255,255,255,0.8);
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-icon {
  width: 34px;
  height: 34px;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
}

.lang-text {
  font-size: 12px;
  font-weight: 700;
  color: #fff;
}

/* 商家端Tab */
.merchant-tabs {
  display: flex;
  background: var(--bg-card);
  border-bottom: 1px solid var(--divider);
}

.merchant-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 0;
  cursor: pointer;
  color: var(--text-hint);
  transition: color 0.2s;
  border-bottom: 2px solid transparent;
}

.merchant-tab.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

.tab-icon { font-size: 18px; }
.tab-label { font-size: 11px; font-weight: 600; }

/* 统计概览 */
.stats-overview {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--divider);
}

.stat-card {
  flex: 1;
  text-align: center;
  background: var(--bg-input);
  border-radius: 10px;
  padding: 10px 6px;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 800;
  color: var(--primary);
  margin-bottom: 3px;
}

.stat-label {
  display: block;
  font-size: 10px;
  color: var(--text-hint);
}

/* 筛选栏 */
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
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 16px;
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

.chip-count {
  background: var(--primary);
  color: #fff;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 8px;
}

.orders-scroll { height: calc(100vh - 64px - 52px - 60px - 46px - 46px); }

/* 商家订单卡片 */
.merchant-order-card {
  margin: 10px 16px 0;
  padding: 0;
  overflow: hidden;
}

.morder-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 10px;
  border-bottom: 1px solid var(--divider);
}

.customer-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.customer-avatar { font-size: 28px; }

.customer-name {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.order-time {
  display: block;
  font-size: 11px;
  color: var(--text-hint);
}

.morder-status {
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.morder-status.paid { background: var(--warning-bg); color: var(--warning); }
.morder-status.preparing { background: var(--info-bg); color: var(--info); }
.morder-status.ready { background: var(--primary-bg); color: var(--primary); }
.morder-status.completed { background: var(--success-bg); color: var(--success); }
.morder-status.cancelled { background: var(--bg-input); color: var(--text-hint); }

.morder-items {
  display: flex;
  gap: 14px;
  padding: 10px 14px;
  flex-wrap: wrap;
}

.morder-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.item-emoji { font-size: 20px; }
.item-name { font-size: 13px; color: var(--text-secondary); }
.item-qty { font-size: 12px; color: var(--text-hint); }

.morder-queue-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px 10px;
}

.queue-badge-merchant {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
}

.queue-badge-merchant.online { background: var(--success-bg); color: var(--success); }
.queue-badge-merchant.instore { background: var(--info-bg); color: var(--info); }

.pickup-time {
  font-size: 12px;
  color: var(--text-hint);
  flex: 1;
}

.order-amount {
  font-size: 15px;
  font-weight: 800;
  color: var(--primary);
}

.morder-actions {
  display: flex;
  gap: 8px;
  padding: 10px 14px 14px;
  border-top: 1px solid var(--divider);
}

.maction-btn {
  flex: 1;
  height: 36px;
  border-radius: 18px;
  font-size: 12px;
  font-weight: 700;
  border: none;
  cursor: pointer;
}

.maction-btn.primary { background: var(--primary); color: #fff; }
.maction-btn.success { background: var(--success); color: #fff; }
.maction-btn.info { background: var(--info); color: #fff; }
.maction-btn.ghost { background: var(--bg-input); color: var(--text-secondary); border: 1px solid var(--border-input); }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
}
.empty-icon { font-size: 48px; }
.empty-text { font-size: 14px; color: var(--text-hint); }
</style>
