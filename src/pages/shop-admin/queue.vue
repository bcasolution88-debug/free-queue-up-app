<template>
  <view class="page-container merchant-page">
    <!-- 顶部导航 -->
    <view class="merchant-navbar gradient-primary">
      <view class="navbar-left">
        <text class="merchant-title">{{ t('queue_management') }}</text>
        <text class="shop-name-sub">{{ lang === 'zh' ? '外婆家' : 'Waipojia' }}</text>
      </view>
      <view class="navbar-actions">
        <view class="action-icon" @click="toggleLang">
          <text class="lang-text">{{ lang === 'zh' ? 'EN' : '中' }}</text>
        </view>
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

    <scroll-view scroll-y class="queue-scroll">
      <!-- 当前叫号大显示 -->
      <view class="calling-hero">
        <view class="calling-card gradient-primary">
          <text class="calling-label">{{ t('now_calling') }}</text>
          <text class="calling-number">{{ currentCalling }}</text>
          <view class="calling-actions">
            <button class="calling-btn call-next" @click="callNext">
              {{ t('call_next') }}
            </button>
            <button class="calling-btn skip" @click="skipCurrent">
              {{ t('skip_queue') }}
            </button>
          </view>
        </view>
      </view>

      <!-- 双排队统计 -->
      <view class="queue-stats-row">
        <view class="qstat-card online">
          <view class="qstat-header">
            <text class="qstat-dot">●</text>
            <text class="qstat-title">{{ t('online_queue_list') }}</text>
          </view>
          <text class="qstat-count">{{ onlineCount }}</text>
          <text class="qstat-unit">{{ t('people') }}</text>
          <view class="qstat-actions">
            <button class="qstat-btn" @click="addOnlineQueue">+1</button>
            <button class="qstat-btn minus" @click="removeOnlineQueue">-1</button>
          </view>
        </view>
        <view class="qstat-card instore">
          <view class="qstat-header">
            <text class="qstat-dot">●</text>
            <text class="qstat-title">{{ t('instore_queue_list') }}</text>
          </view>
          <text class="qstat-count">{{ instoreCount }}</text>
          <text class="qstat-unit">{{ t('people') }}</text>
          <view class="qstat-actions">
            <button class="qstat-btn" @click="addInstoreQueue">+1</button>
            <button class="qstat-btn minus" @click="removeInstoreQueue">-1</button>
          </view>
        </view>
      </view>

      <!-- 每人预估时间设置 -->
      <view class="time-setting-card card">
        <view class="setting-row">
          <text class="setting-label">{{ t('per_person_time') }}</text>
          <view class="time-control">
            <button class="time-btn" @click="perPersonTime > 1 && perPersonTime--">−</button>
            <text class="time-value">{{ perPersonTime }}{{ t('minutes') }}</text>
            <button class="time-btn" @click="perPersonTime++">+</button>
          </view>
        </view>
        <view class="est-info">
          <text class="est-text">
            {{ lang === 'zh' ? `在线预计等待: ${onlineCount * perPersonTime}分钟` : `Online Est. Wait: ${onlineCount * perPersonTime}min` }}
          </text>
          <text class="est-text">
            {{ lang === 'zh' ? `实体预计等待: ${instoreCount * perPersonTime}分钟` : `In-store Est. Wait: ${instoreCount * perPersonTime}min` }}
          </text>
        </view>
      </view>

      <!-- 在线排队列表 -->
      <view class="queue-list-section">
        <view class="list-header">
          <text class="list-title">{{ t('online_queue_list') }}</text>
          <view class="batch-notify-btn" @click="batchNotify">
            <text>📢 {{ t('batch_notify') }}</text>
          </view>
        </view>

        <view class="queue-table card">
          <view class="table-header">
            <text class="th">{{ lang === 'zh' ? '号码' : 'No.' }}</text>
            <text class="th">{{ lang === 'zh' ? '用户' : 'User' }}</text>
            <text class="th">{{ lang === 'zh' ? '预约时间' : 'Time' }}</text>
            <text class="th">{{ lang === 'zh' ? '状态' : 'Status' }}</text>
            <text class="th">{{ lang === 'zh' ? '操作' : 'Action' }}</text>
          </view>
          <view v-for="item in onlineQueueList" :key="item.no" class="table-row">
            <text class="td number">{{ item.no }}</text>
            <text class="td">{{ item.customer }}</text>
            <text class="td">{{ item.time }}</text>
            <view class="td">
              <view :class="['row-status', item.status]">
                {{ getQueueStatusText(item.status) }}
              </view>
            </view>
            <view class="td">
              <button class="row-action-btn" @click="notifyOne(item)">📢</button>
            </view>
          </view>
        </view>
      </view>

      <!-- 实体排队列表 -->
      <view class="queue-list-section">
        <view class="list-header">
          <text class="list-title">{{ t('instore_queue_list') }}</text>
        </view>

        <view class="queue-table card">
          <view class="table-header">
            <text class="th">{{ lang === 'zh' ? '号码' : 'No.' }}</text>
            <text class="th">{{ lang === 'zh' ? '取号时间' : 'Time' }}</text>
            <text class="th">{{ lang === 'zh' ? '状态' : 'Status' }}</text>
            <text class="th">{{ lang === 'zh' ? '操作' : 'Action' }}</text>
          </view>
          <view v-for="item in instoreQueueList" :key="item.no" class="table-row">
            <text class="td number">{{ item.no }}</text>
            <text class="td">{{ item.time }}</text>
            <view class="td">
              <view :class="['row-status', item.status]">
                {{ getQueueStatusText(item.status) }}
              </view>
            </view>
            <view class="td">
              <button class="row-action-btn" @click="callItem(item)">📣</button>
            </view>
          </view>
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
const activeTab = ref('queue')
const currentCalling = ref('A098')
const onlineCount = ref(12)
const instoreCount = ref(5)
const perPersonTime = ref(3)

const t = (key) => langStore.t(key)

const merchantTabs = [
  { key: 'orders', label: '订单管理', labelEn: 'Orders', icon: '📋' },
  { key: 'queue', label: '排队管理', labelEn: 'Queue', icon: '🚶' },
  { key: 'notify', label: '通知用户', labelEn: 'Notify', icon: '🔔' },
]

const onlineQueueList = ref([
  { no: 'A098', customer: '张小明', time: '14:30', status: 'calling' },
  { no: 'A099', customer: 'Alice', time: '14:45', status: 'waiting' },
  { no: 'A100', customer: '李华', time: '15:00', status: 'waiting' },
  { no: 'A101', customer: '王芳', time: '15:15', status: 'waiting' },
  { no: 'A102', customer: '陈伟', time: '15:30', status: 'waiting' },
])

const instoreQueueList = ref([
  { no: 'B012', time: '14:20', status: 'calling' },
  { no: 'B013', time: '14:25', status: 'waiting' },
  { no: 'B014', time: '14:28', status: 'waiting' },
  { no: 'B015', time: '14:32', status: 'waiting' },
])

const getQueueStatusText = (status) => {
  const map = {
    calling: lang.value === 'zh' ? '已叫号' : 'Called',
    waiting: lang.value === 'zh' ? '等待中' : 'Waiting',
    completed: lang.value === 'zh' ? '已完成' : 'Done',
  }
  return map[status] || status
}

const callNext = () => {
  const nextNum = parseInt(currentCalling.value.slice(1)) + 1
  currentCalling.value = 'A' + String(nextNum).padStart(3, '0')
  if (onlineCount.value > 0) onlineCount.value--
  
  // 更新列表状态
  const callingItem = onlineQueueList.value.find(i => i.status === 'calling')
  if (callingItem) callingItem.status = 'completed'
  const nextItem = onlineQueueList.value.find(i => i.status === 'waiting')
  if (nextItem) nextItem.status = 'calling'
  
  uni.showToast({ title: `${lang.value === 'zh' ? '已叫号' : 'Called'}: ${currentCalling.value}`, icon: 'success' })
}

const skipCurrent = () => {
  callNext()
  uni.showToast({ title: lang.value === 'zh' ? '已跳过当前号码' : 'Skipped', icon: 'none' })
}

const addOnlineQueue = () => { onlineCount.value++ }
const removeOnlineQueue = () => { if (onlineCount.value > 0) onlineCount.value-- }
const addInstoreQueue = () => { instoreCount.value++ }
const removeInstoreQueue = () => { if (instoreCount.value > 0) instoreCount.value-- }

const notifyOne = (item) => {
  uni.showToast({ title: `${lang.value === 'zh' ? '已通知' : 'Notified'} ${item.customer}`, icon: 'success' })
}

const callItem = (item) => {
  item.status = 'calling'
  if (instoreCount.value > 0) instoreCount.value--
  uni.showToast({ title: `${lang.value === 'zh' ? '已叫号' : 'Called'}: ${item.no}`, icon: 'success' })
}

const batchNotify = () => {
  uni.showToast({ title: lang.value === 'zh' ? '已批量通知所有用户' : 'All customers notified', icon: 'success' })
}

const switchTab = (key) => {
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
</script>

<style scoped>
.merchant-page { background: var(--bg-page); }

.merchant-navbar {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.merchant-title { display: block; font-size: 18px; font-weight: 800; color: #fff; }
.shop-name-sub { display: block; font-size: 12px; color: rgba(255,255,255,0.8); }

.navbar-actions { display: flex; align-items: center; gap: 12px; }

.action-icon {
  width: 34px; height: 34px;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 18px;
}

.lang-text { font-size: 12px; font-weight: 700; color: #fff; }

.merchant-tabs {
  display: flex;
  background: var(--bg-card);
  border-bottom: 1px solid var(--divider);
}

.merchant-tab {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 10px 0;
  cursor: pointer;
  color: var(--text-hint);
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.merchant-tab.active { color: var(--primary); border-bottom-color: var(--primary); }
.tab-icon { font-size: 18px; }
.tab-label { font-size: 11px; font-weight: 600; }

.queue-scroll { height: calc(100vh - 64px - 52px); }

/* 当前叫号 */
.calling-hero { padding: 14px 16px; }

.calling-card {
  border-radius: 16px;
  padding: 20px;
  text-align: center;
}

.calling-label {
  display: block;
  font-size: 13px;
  color: rgba(255,255,255,0.8);
  margin-bottom: 6px;
}

.calling-number {
  display: block;
  font-size: 60px;
  font-weight: 900;
  color: #fff;
  letter-spacing: 4px;
  margin-bottom: 16px;
}

.calling-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.calling-btn {
  padding: 10px 24px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 700;
  border: none;
  cursor: pointer;
}

.calling-btn.call-next { background: #fff; color: var(--primary); }
.calling-btn.skip { background: rgba(255,255,255,0.2); color: #fff; border: 1.5px solid rgba(255,255,255,0.5); }

/* 双排队统计 */
.queue-stats-row {
  display: flex;
  gap: 10px;
  padding: 0 16px 12px;
}

.qstat-card {
  flex: 1;
  border-radius: 12px;
  padding: 14px;
  text-align: center;
}

.qstat-card.online { background: var(--success-bg); border: 1.5px solid var(--success); }
.qstat-card.instore { background: var(--info-bg); border: 1.5px solid var(--info); }

.qstat-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin-bottom: 8px;
}

.qstat-card.online .qstat-dot { color: var(--success); font-size: 10px; }
.qstat-card.instore .qstat-dot { color: var(--info); font-size: 10px; }

.qstat-title { font-size: 12px; font-weight: 600; }
.qstat-card.online .qstat-title { color: var(--success); }
.qstat-card.instore .qstat-title { color: var(--info); }

.qstat-count {
  display: inline;
  font-size: 36px;
  font-weight: 800;
}

.qstat-card.online .qstat-count { color: var(--success); }
.qstat-card.instore .qstat-count { color: var(--info); }

.qstat-unit { font-size: 13px; color: var(--text-hint); }

.qstat-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 10px;
}

.qstat-btn {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: #fff;
  border: 1.5px solid var(--border-input);
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-primary);
}

.qstat-btn.minus { color: var(--error); border-color: var(--error); }

/* 时间设置 */
.time-setting-card {
  margin: 0 16px 12px;
  padding: 14px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.setting-label { font-size: 14px; font-weight: 600; color: var(--text-primary); }

.time-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-btn {
  width: 30px; height: 30px;
  border-radius: 50%;
  background: var(--bg-input);
  border: 1.5px solid var(--border-input);
  font-size: 18px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-primary);
}

.time-value { font-size: 16px; font-weight: 700; color: var(--primary); min-width: 50px; text-align: center; }

.est-info { display: flex; flex-direction: column; gap: 4px; }
.est-text { font-size: 12px; color: var(--text-hint); }

/* 排队列表 */
.queue-list-section { margin: 0 16px 12px; }

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.list-title { font-size: 15px; font-weight: 700; color: var(--text-primary); }

.batch-notify-btn {
  background: var(--primary-bg);
  color: var(--primary);
  padding: 5px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.queue-table { overflow: hidden; }

.table-header {
  display: flex;
  background: var(--bg-input);
  padding: 8px 12px;
  border-bottom: 1px solid var(--divider);
}

.th {
  flex: 1;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-hint);
  text-align: center;
}

.table-row {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid var(--divider);
}

.table-row:last-child { border-bottom: none; }

.td {
  flex: 1;
  font-size: 12px;
  color: var(--text-primary);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.td.number { font-weight: 700; color: var(--primary); font-size: 14px; }

.row-status {
  padding: 3px 8px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
}

.row-status.calling { background: var(--primary-bg); color: var(--primary); }
.row-status.waiting { background: var(--warning-bg); color: var(--warning); }
.row-status.completed { background: var(--success-bg); color: var(--success); }

.row-action-btn {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: var(--primary-bg);
  border: none;
  font-size: 14px;
  cursor: pointer;
}
</style>
