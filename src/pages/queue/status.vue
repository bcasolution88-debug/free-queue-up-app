<template>
  <view class="page-container queue-status-page">
    <view class="navbar">
      <view class="navbar-back" @click="goBack">←</view>
      <text class="navbar-title">{{ t('queue_status') }}</text>
      <view class="refresh-btn" @click="refreshQueue">🔄</view>
    </view>

    <scroll-view scroll-y class="queue-scroll">
      <!-- 我的排队号 -->
      <view class="my-queue-card gradient-primary">
        <view class="my-queue-header">
          <text class="my-shop-name">{{ shopName }}</text>
          <view :class="['status-chip', myStatus]">
            <text>{{ statusText }}</text>
          </view>
        </view>

        <view class="my-number-display">
          <text class="my-number-label">{{ t('your_number') }}</text>
          <text class="my-number">{{ myQueueNo }}</text>
          <view class="queue-type-badge">
            <text>{{ myQueueType === 'online' ? t('online_queue') : t('instore_queue') }}</text>
          </view>
        </view>

        <view class="wait-info-row">
          <view class="wait-item">
            <text class="wait-value">{{ peopleAhead }}</text>
            <text class="wait-label">{{ t('people_ahead') }}</text>
          </view>
          <view class="wait-divider"></view>
          <view class="wait-item">
            <text class="wait-value">{{ estWait }}{{ t('minutes') }}</text>
            <text class="wait-label">{{ t('est_wait_time') }}</text>
          </view>
          <view class="wait-divider"></view>
          <view class="wait-item">
            <text class="wait-value">{{ currentCalling }}</text>
            <text class="wait-label">{{ t('current_calling') }}</text>
          </view>
        </view>
      </view>

      <!-- 通知开关 -->
      <view class="notify-card card">
        <view class="notify-row">
          <text class="notify-icon">🔔</text>
          <view class="notify-text">
            <text class="notify-title">{{ t('notify_me') }}</text>
            <text class="notify-desc">{{ lang === 'zh' ? '叫到您的号码时自动推送通知' : 'Auto notify when your number is called' }}</text>
          </view>
          <view :class="['toggle-switch', { on: notifyEnabled }]" @click="notifyEnabled = !notifyEnabled">
            <view class="toggle-thumb"></view>
          </view>
        </view>
      </view>

      <!-- 双排队列表 -->
      <view class="queue-lists-section">
        <!-- Tab切换 -->
        <view class="list-tabs">
          <view :class="['list-tab', { active: activeListTab === 'online' }]" @click="activeListTab = 'online'">
            <text>{{ t('online_queue_list') }}</text>
            <view class="tab-count">{{ onlineQueue.length }}</view>
          </view>
          <view :class="['list-tab', { active: activeListTab === 'instore' }]" @click="activeListTab = 'instore'">
            <text>{{ t('instore_queue_list') }}</text>
            <view class="tab-count">{{ instoreQueue.length }}</view>
          </view>
          <view class="list-tab-indicator" :style="{ left: activeListTab === 'online' ? '0' : '50%' }"></view>
        </view>

        <!-- 在线排队列表 -->
        <view v-if="activeListTab === 'online'" class="queue-list">
          <view 
            v-for="(item, idx) in onlineQueue" 
            :key="item.no"
            :class="['queue-list-item', { 'my-item': item.no === myQueueNo, 'called': item.status === 'called' }]"
          >
            <view class="item-rank">{{ idx + 1 }}</view>
            <view class="item-number">
              <text class="number-text">{{ item.no }}</text>
              <text v-if="item.no === myQueueNo" class="my-tag">{{ lang === 'zh' ? '我' : 'Me' }}</text>
            </view>
            <view :class="['item-status', item.status]">
              <text>{{ item.status === 'called' ? (lang === 'zh' ? '已叫号' : 'Called') : (lang === 'zh' ? '等待中' : 'Waiting') }}</text>
            </view>
            <text class="item-time">{{ formatTime(item.time) }}</text>
          </view>
        </view>

        <!-- 实体排队列表 -->
        <view v-else class="queue-list">
          <view 
            v-for="(item, idx) in instoreQueue" 
            :key="item.no"
            :class="['queue-list-item', { 'called': item.status === 'called' }]"
          >
            <view class="item-rank">{{ idx + 1 }}</view>
            <view class="item-number">
              <text class="number-text">{{ item.no }}</text>
            </view>
            <view :class="['item-status', item.status]">
              <text>{{ item.status === 'called' ? (lang === 'zh' ? '已叫号' : 'Called') : (lang === 'zh' ? '等待中' : 'Waiting') }}</text>
            </view>
            <text class="item-time">{{ formatTime(item.time) }}</text>
          </view>
        </view>
      </view>

      <view style="height: 90px;"></view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="queue-action-bar">
      <button class="btn btn-outline arrived-btn" @click="handleArrived" v-if="myStatus === 'waiting'">
        {{ t('i_arrived') }}
      </button>
      <button class="btn btn-success complete-btn" @click="handleComplete" v-if="myStatus === 'called'">
        {{ t('queue_completed') }}
      </button>
    </view>

    <TabBar current="queue" />
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { langStore, queueStore, orderStore, demoData } from '../../stores/app.js'
import TabBar from '../../components/common/TabBar.vue'

const lang = ref(langStore.lang)
const activeListTab = ref('online')
const notifyEnabled = ref(true)
const myQueueNo = ref('A098')
const myQueueType = ref('online')
const myStatus = ref('waiting')
const shopName = ref('外婆家')
const peopleAhead = ref(5)
const estWait = ref(15)
const currentCalling = ref('A093')
const onlineQueue = ref([])
const instoreQueue = ref([])
let refreshTimer = null

const t = (key) => langStore.t(key)

const statusText = computed(() => {
  const map = { waiting: t('waiting'), called: t('called'), completed: t('completed') }
  return map[myStatus.value] || t('waiting')
})

onMounted(() => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  const orderId = page.$route?.query?.orderId || page.options?.orderId

  if (orderId) {
    const order = orderStore.getOrder(orderId)
    if (order) {
      myQueueNo.value = order.queueNo
      myQueueType.value = order.queueType
      shopName.value = order.shopName
    }
  }

  loadQueueData()
  
  // 每10秒刷新一次
  refreshTimer = setInterval(() => {
    loadQueueData()
  }, 10000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

const loadQueueData = () => {
  const queueData = queueStore.getQueue('shop001')
  onlineQueue.value = queueData.onlineList
  instoreQueue.value = queueData.instoreList
  currentCalling.value = queueData.currentCallingNo
  
  // 计算前方人数
  const myIdx = onlineQueue.value.findIndex(i => i.no === myQueueNo.value)
  if (myIdx >= 0) {
    peopleAhead.value = myIdx
    estWait.value = myIdx * 3
  }
}

const refreshQueue = () => {
  loadQueueData()
  uni.showToast({ title: lang.value === 'zh' ? '已刷新' : 'Refreshed', icon: 'success' })
}

const handleArrived = () => {
  myStatus.value = 'called'
  uni.showToast({ title: lang.value === 'zh' ? '已通知商家您到店了！' : 'Merchant notified!', icon: 'success' })
}

const handleComplete = () => {
  myStatus.value = 'completed'
  uni.showToast({ title: lang.value === 'zh' ? '取货完成！' : 'Pickup complete!', icon: 'success' })
  setTimeout(() => uni.reLaunch({ url: '/pages/index/index' }), 1500)
}

const formatTime = (isoStr) => {
  const d = new Date(isoStr)
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}

const goBack = () => uni.navigateBack()
</script>

<style scoped>
.queue-status-page { background: var(--bg-page); }

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
.refresh-btn { font-size: 20px; cursor: pointer; padding: 4px; }

.queue-scroll { height: calc(100vh - 54px - 60px - 60px); }

/* 我的排队卡片 */
.my-queue-card {
  margin: 12px 16px;
  border-radius: 16px;
  padding: 20px;
}

.my-queue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.my-shop-name {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}

.status-chip {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-chip.waiting { background: rgba(255,255,255,0.25); color: #fff; }
.status-chip.called { background: #fff; color: var(--primary); }
.status-chip.completed { background: rgba(255,255,255,0.25); color: #fff; }

.my-number-display {
  text-align: center;
  margin-bottom: 20px;
}

.my-number-label {
  display: block;
  font-size: 12px;
  color: rgba(255,255,255,0.8);
  margin-bottom: 6px;
}

.my-number {
  display: block;
  font-size: 56px;
  font-weight: 900;
  color: #fff;
  letter-spacing: 4px;
  margin-bottom: 10px;
}

.queue-type-badge {
  display: inline-block;
  background: rgba(255,255,255,0.2);
  padding: 4px 14px;
  border-radius: 10px;
}

.queue-type-badge text {
  font-size: 12px;
  color: #fff;
  font-weight: 600;
}

.wait-info-row {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.15);
  border-radius: 12px;
  padding: 12px 0;
}

.wait-item {
  flex: 1;
  text-align: center;
}

.wait-value {
  display: block;
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 4px;
}

.wait-label {
  display: block;
  font-size: 11px;
  color: rgba(255,255,255,0.8);
}

.wait-divider {
  width: 1px;
  height: 36px;
  background: rgba(255,255,255,0.3);
}

/* 通知卡片 */
.notify-card {
  margin: 0 16px 12px;
  padding: 14px;
}

.notify-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notify-icon { font-size: 24px; }

.notify-text { flex: 1; }

.notify-title {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 3px;
}

.notify-desc {
  display: block;
  font-size: 11px;
  color: var(--text-hint);
}

.toggle-switch {
  width: 48px;
  height: 26px;
  border-radius: 13px;
  background: var(--border-input);
  position: relative;
  cursor: pointer;
  transition: background 0.3s;
}

.toggle-switch.on { background: var(--primary); }

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  transition: left 0.3s;
}

.toggle-switch.on .toggle-thumb { left: 25px; }

/* 排队列表 */
.queue-lists-section {
  margin: 0 16px 12px;
  background: var(--bg-card);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.list-tabs {
  display: flex;
  position: relative;
  border-bottom: 2px solid var(--divider);
}

.list-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 13px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-hint);
  cursor: pointer;
  position: relative;
  z-index: 1;
  transition: color 0.2s;
}

.list-tab.active { color: var(--primary); }

.tab-count {
  background: var(--bg-input);
  color: var(--text-hint);
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 10px;
  font-weight: 700;
}

.list-tab.active .tab-count {
  background: var(--primary-bg);
  color: var(--primary);
}

.list-tab-indicator {
  position: absolute;
  bottom: -2px;
  width: 50%;
  height: 2px;
  background: var(--primary);
  transition: left 0.3s;
}

.queue-list { padding: 0 14px; }

.queue-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--divider);
  transition: background 0.2s;
}

.queue-list-item:last-child { border-bottom: none; }

.queue-list-item.my-item {
  background: var(--primary-bg);
  margin: 0 -14px;
  padding: 12px 14px;
  border-radius: 8px;
}

.queue-list-item.called .number-text { color: var(--success); }

.item-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-hint);
  flex-shrink: 0;
}

.item-number {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.number-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.my-tag {
  font-size: 10px;
  background: var(--primary);
  color: #fff;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 700;
}

.item-status {
  padding: 3px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
}

.item-status.waiting { background: var(--warning-bg); color: var(--warning); }
.item-status.called { background: var(--success-bg); color: var(--success); }

.item-time {
  font-size: 11px;
  color: var(--text-hint);
  min-width: 40px;
  text-align: right;
}

/* 底部操作栏 */
.queue-action-bar {
  position: fixed;
  bottom: 60px;
  left: 0;
  right: 0;
  max-width: 480px;
  margin: 0 auto;
  padding: 10px 16px;
  background: var(--bg-card);
  border-top: 1px solid var(--divider);
}

.arrived-btn, .complete-btn {
  width: 100%;
  height: 46px;
  border-radius: 23px;
  font-size: 15px;
  font-weight: 700;
}
</style>
