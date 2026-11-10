<template>
  <view class="page-container merchant-page">
    <view class="merchant-navbar gradient-primary">
      <view class="navbar-left">
        <text class="merchant-title">{{ t('notify_customers') }}</text>
        <text class="shop-name-sub">{{ lang === 'zh' ? '外婆家' : 'Waipojia' }}</text>
      </view>
      <view class="navbar-actions">
        <view class="action-icon" @click="toggleLang">
          <text class="lang-text">{{ lang === 'zh' ? 'EN' : '中' }}</text>
        </view>
      </view>
    </view>

    <view class="merchant-tabs">
      <view v-for="tab in merchantTabs" :key="tab.key" :class="['merchant-tab', { active: activeTab === tab.key }]" @click="switchTab(tab.key)">
        <text class="tab-icon">{{ tab.icon }}</text>
        <text class="tab-label">{{ lang === 'zh' ? tab.label : tab.labelEn }}</text>
      </view>
    </view>

    <scroll-view scroll-y class="notify-scroll">
      <!-- 一键通知全部 -->
      <view class="batch-section">
        <view class="batch-card gradient-primary">
          <view class="batch-info">
            <text class="batch-title">{{ lang === 'zh' ? '待取货用户' : 'Pending Pickup' }}</text>
            <text class="batch-count">{{ readyOrders.length }}</text>
            <text class="batch-unit">{{ lang === 'zh' ? '位用户' : 'users' }}</text>
          </view>
          <button class="batch-btn" @click="notifyAll">
            <text class="batch-btn-icon">📢</text>
            <text>{{ t('notify_all') }}</text>
          </button>
        </view>
      </view>

      <!-- 通知模板 -->
      <view class="template-section card">
        <text class="section-title">{{ lang === 'zh' ? '通知内容' : 'Message Template' }}</text>
        <view class="template-list">
          <view 
            v-for="tpl in templates" 
            :key="tpl.id"
            :class="['template-item', { active: selectedTemplate === tpl.id }]"
            @click="selectedTemplate = tpl.id"
          >
            <view class="tpl-radio">
              <view v-if="selectedTemplate === tpl.id" class="radio-dot"></view>
            </view>
            <view class="tpl-content">
              <text class="tpl-title">{{ lang === 'zh' ? tpl.title : tpl.titleEn }}</text>
              <text class="tpl-preview">{{ lang === 'zh' ? tpl.preview : tpl.previewEn }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 待通知用户列表 -->
      <view class="notify-list-section">
        <view class="list-header">
          <text class="list-title">{{ lang === 'zh' ? '待取货用户列表' : 'Pickup Pending List' }}</text>
          <text class="list-count">{{ readyOrders.length }}{{ lang === 'zh' ? '人' : ' users' }}</text>
        </view>

        <view v-for="order in readyOrders" :key="order.id" class="notify-item card">
          <view class="notify-user">
            <text class="user-avatar">{{ order.avatar }}</text>
            <view class="user-info">
              <text class="user-name">{{ order.customerName }}</text>
              <text class="user-queue">{{ t('queue_no') }}: {{ order.queueNo }}</text>
            </view>
            <view class="notify-time">
              <text class="pickup-time">{{ order.pickupTime }}</text>
            </view>
          </view>
          <view class="notify-item-actions">
            <view class="order-items-preview">
              <text v-for="item in order.items" :key="item.name" class="item-tag">{{ item.emoji }}{{ item.name }}</text>
            </view>
            <button 
              :class="['notify-btn', { sent: order.notified }]"
              @click="notifyOne(order)"
            >
              {{ order.notified ? (lang === 'zh' ? '已通知' : 'Sent') : t('notify_now') }}
            </button>
          </view>
        </view>
      </view>

      <!-- 通知历史 -->
      <view class="history-section">
        <text class="section-title">{{ t('notification_history') }}</text>
        <view v-for="record in notifyHistory" :key="record.id" class="history-item">
          <view class="history-icon">📨</view>
          <view class="history-content">
            <text class="history-user">{{ record.user }}</text>
            <text class="history-msg">{{ lang === 'zh' ? record.message : record.messageEn }}</text>
          </view>
          <text class="history-time">{{ record.time }}</text>
        </view>
      </view>

      <view style="height: 20px;"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { langStore } from '../../stores/app.js'

const lang = ref(langStore.lang)
const activeTab = ref('notify')
const selectedTemplate = ref('ready')

const t = (key) => langStore.t(key)

const merchantTabs = [
  { key: 'orders', label: '订单管理', labelEn: 'Orders', icon: '📋' },
  { key: 'queue', label: '排队管理', labelEn: 'Queue', icon: '🚶' },
  { key: 'notify', label: '通知用户', labelEn: 'Notify', icon: '🔔' },
]

const templates = [
  {
    id: 'ready',
    title: '取货提醒',
    titleEn: 'Pickup Ready',
    preview: '您的订单已准备好，请在30分钟内到店取货',
    previewEn: 'Your order is ready. Please pick up within 30 minutes.'
  },
  {
    id: 'queue',
    title: '排队叫号',
    titleEn: 'Queue Call',
    preview: '您的排队号码已叫到，请立即到店取货',
    previewEn: 'Your queue number has been called. Please come now.'
  },
  {
    id: 'custom',
    title: '自定义消息',
    titleEn: 'Custom Message',
    preview: '（自定义通知内容）',
    previewEn: '(Custom notification content)'
  },
]

const readyOrders = ref([
  { id: 'ORD001', customerName: '张小明', avatar: '😊', queueNo: 'A098', pickupTime: '15:00', items: [{ emoji: '🥩', name: '东坡肉' }], notified: false },
  { id: 'ORD002', customerName: 'Alice', avatar: '🙂', queueNo: 'A097', pickupTime: '14:50', items: [{ emoji: '🦐', name: '龙井虾仁' }], notified: true },
  { id: 'ORD003', customerName: '李华', avatar: '😋', queueNo: 'B012', pickupTime: '14:40', items: [{ emoji: '🍲', name: '宋嫂鱼羹' }], notified: false },
])

const notifyHistory = ref([
  { id: 1, user: 'Alice', message: '取货提醒已发送', messageEn: 'Pickup reminder sent', time: '14:35' },
  { id: 2, user: '王芳', message: '排队叫号通知已发送', messageEn: 'Queue call notification sent', time: '14:20' },
  { id: 3, user: '陈伟', message: '取货提醒已发送', messageEn: 'Pickup reminder sent', time: '14:05' },
])

const notifyAll = () => {
  readyOrders.value.forEach(o => o.notified = true)
  notifyHistory.value.unshift({
    id: Date.now(),
    user: lang.value === 'zh' ? '全部用户' : 'All Users',
    message: `批量通知 ${readyOrders.value.length} 位用户`,
    messageEn: `Batch notified ${readyOrders.value.length} users`,
    time: new Date().toTimeString().slice(0, 5)
  })
  uni.showToast({ title: lang.value === 'zh' ? `已通知全部 ${readyOrders.value.length} 位用户` : `Notified all ${readyOrders.value.length} users`, icon: 'success' })
}

const notifyOne = (order) => {
  order.notified = true
  notifyHistory.value.unshift({
    id: Date.now(),
    user: order.customerName,
    message: '取货提醒已发送',
    messageEn: 'Pickup reminder sent',
    time: new Date().toTimeString().slice(0, 5)
  })
  uni.showToast({ title: `${lang.value === 'zh' ? '已通知' : 'Notified'} ${order.customerName}`, icon: 'success' })
}

const switchTab = (key) => {
  const routes = { orders: '/pages/shop-admin/orders', queue: '/pages/shop-admin/queue', notify: '/pages/shop-admin/notify' }
  if (routes[key]) uni.reLaunch({ url: routes[key] })
}

const toggleLang = () => { langStore.toggle(); lang.value = langStore.lang }
</script>

<style scoped>
.merchant-page { background: var(--bg-page); }
.merchant-navbar { padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; }
.merchant-title { display: block; font-size: 18px; font-weight: 800; color: #fff; }
.shop-name-sub { display: block; font-size: 12px; color: rgba(255,255,255,0.8); }
.navbar-actions { display: flex; align-items: center; gap: 12px; }
.action-icon { width: 34px; height: 34px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px; }
.lang-text { font-size: 12px; font-weight: 700; color: #fff; }
.merchant-tabs { display: flex; background: var(--bg-card); border-bottom: 1px solid var(--divider); }
.merchant-tab { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 0; cursor: pointer; color: var(--text-hint); border-bottom: 2px solid transparent; transition: all 0.2s; }
.merchant-tab.active { color: var(--primary); border-bottom-color: var(--primary); }
.tab-icon { font-size: 18px; }
.tab-label { font-size: 11px; font-weight: 600; }

.notify-scroll { height: calc(100vh - 64px - 52px); }

/* 批量通知 */
.batch-section { padding: 14px 16px; }
.batch-card { border-radius: 14px; padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; }
.batch-info { display: flex; flex-direction: column; }
.batch-title { font-size: 12px; color: rgba(255,255,255,0.8); margin-bottom: 4px; }
.batch-count { font-size: 36px; font-weight: 800; color: #fff; line-height: 1; }
.batch-unit { font-size: 13px; color: rgba(255,255,255,0.8); }
.batch-btn { background: rgba(255,255,255,0.25); border: 2px solid rgba(255,255,255,0.6); color: #fff; padding: 12px 20px; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; }
.batch-btn-icon { font-size: 20px; }

/* 模板选择 */
.template-section { margin: 0 16px 12px; padding: 14px; }
.section-title { display: block; font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 12px; }
.template-list { display: flex; flex-direction: column; gap: 8px; }
.template-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px; border: 2px solid var(--border-input); border-radius: 10px; cursor: pointer; transition: all 0.2s; background: var(--bg-input); }
.template-item.active { border-color: var(--primary); background: var(--primary-bg); }
.tpl-radio { width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--border-input); display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
.template-item.active .tpl-radio { border-color: var(--primary); }
.radio-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--primary); }
.tpl-title { display: block; font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 3px; }
.tpl-preview { display: block; font-size: 11px; color: var(--text-hint); line-height: 1.4; }

/* 通知列表 */
.notify-list-section { margin: 0 16px 12px; }
.list-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.list-title { font-size: 15px; font-weight: 700; color: var(--text-primary); }
.list-count { font-size: 12px; color: var(--text-hint); }
.notify-item { margin-bottom: 10px; padding: 12px 14px; }
.notify-user { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.user-avatar { font-size: 28px; }
.user-name { display: block; font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
.user-queue { display: block; font-size: 11px; color: var(--text-hint); }
.notify-time { margin-left: auto; }
.pickup-time { font-size: 13px; font-weight: 600; color: var(--primary); }
.notify-item-actions { display: flex; align-items: center; justify-content: space-between; }
.order-items-preview { display: flex; gap: 8px; flex-wrap: wrap; }
.item-tag { font-size: 11px; background: var(--bg-input); color: var(--text-secondary); padding: 3px 8px; border-radius: 8px; }
.notify-btn { padding: 8px 16px; border-radius: 16px; font-size: 12px; font-weight: 700; border: none; cursor: pointer; background: var(--primary); color: #fff; }
.notify-btn.sent { background: var(--success-bg); color: var(--success); }

/* 通知历史 */
.history-section { margin: 0 16px 12px; }
.history-item { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--divider); }
.history-item:last-child { border-bottom: none; }
.history-icon { font-size: 20px; }
.history-content { flex: 1; }
.history-user { display: block; font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 2px; }
.history-msg { display: block; font-size: 11px; color: var(--text-hint); }
.history-time { font-size: 11px; color: var(--text-hint); }
</style>
