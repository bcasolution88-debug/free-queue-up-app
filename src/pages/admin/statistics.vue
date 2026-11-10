<template>
  <view class="page-container admin-page">
    <view class="admin-navbar gradient-dark">
      <view class="admin-brand">
        <text class="brand-icon">👑</text>
        <view>
          <text class="brand-title">{{ lang === 'zh' ? '数据统计' : 'Statistics' }}</text>
          <text class="brand-sub">QueueGo Platform</text>
        </view>
      </view>
      <view class="navbar-actions">
        <view class="action-icon" @click="toggleLang">
          <text class="lang-text">{{ lang === 'zh' ? 'EN' : '中' }}</text>
        </view>
      </view>
    </view>

    <view class="admin-tabs">
      <view v-for="tab in adminTabs" :key="tab.key" :class="['admin-tab', { active: activeTab === tab.key }]" @click="switchTab(tab.key)">
        <text class="tab-icon">{{ tab.icon }}</text>
        <text class="tab-label">{{ lang === 'zh' ? tab.label : tab.labelEn }}</text>
      </view>
    </view>

    <!-- 时间范围选择 -->
    <view class="time-range-bar">
      <view 
        v-for="r in timeRanges" 
        :key="r.key"
        :class="['range-chip', { active: activeRange === r.key }]"
        @click="activeRange = r.key"
      >
        {{ lang === 'zh' ? r.label : r.labelEn }}
      </view>
    </view>

    <scroll-view scroll-y class="stats-scroll">
      <!-- 核心指标 -->
      <view class="kpi-grid">
        <view class="kpi-card primary">
          <text class="kpi-icon">📦</text>
          <text class="kpi-value">{{ kpis.orders }}</text>
          <text class="kpi-label">{{ lang === 'zh' ? '总订单数' : 'Total Orders' }}</text>
          <text class="kpi-change up">+{{ kpis.ordersChange }}%</text>
        </view>
        <view class="kpi-card success">
          <text class="kpi-icon">💰</text>
          <text class="kpi-value">¥{{ kpis.revenue }}</text>
          <text class="kpi-label">{{ lang === 'zh' ? '平台流水' : 'Revenue' }}</text>
          <text class="kpi-change up">+{{ kpis.revenueChange }}%</text>
        </view>
        <view class="kpi-card info">
          <text class="kpi-icon">👥</text>
          <text class="kpi-value">{{ kpis.users }}</text>
          <text class="kpi-label">{{ lang === 'zh' ? '新增用户' : 'New Users' }}</text>
          <text class="kpi-change up">+{{ kpis.usersChange }}%</text>
        </view>
        <view class="kpi-card warning">
          <text class="kpi-icon">🚶</text>
          <text class="kpi-value">{{ kpis.queues }}</text>
          <text class="kpi-label">{{ lang === 'zh' ? '排队总次数' : 'Queue Count' }}</text>
          <text class="kpi-change down">-{{ kpis.queuesChange }}%</text>
        </view>
      </view>

      <!-- 订单趋势图 -->
      <view class="chart-section card">
        <text class="chart-title">{{ lang === 'zh' ? '订单趋势' : 'Order Trend' }}</text>
        <view class="bar-chart">
          <view v-for="(bar, idx) in orderTrend" :key="idx" class="bar-item">
            <view class="bar-wrap">
              <view class="bar-fill" :style="{ height: bar.height + '%' }"></view>
            </view>
            <text class="bar-label">{{ bar.label }}</text>
          </view>
        </view>
      </view>

      <!-- 商家排行 -->
      <view class="rank-section card">
        <text class="chart-title">{{ lang === 'zh' ? '商家营收排行' : 'Shop Revenue Ranking' }}</text>
        <view v-for="(shop, idx) in shopRanking" :key="shop.id" class="rank-item">
          <view :class="['rank-badge', `rank-${idx + 1}`]">{{ idx + 1 }}</view>
          <text class="rank-emoji">{{ shop.emoji }}</text>
          <view class="rank-info">
            <text class="rank-name">{{ lang === 'zh' ? shop.name : shop.nameEn }}</text>
            <view class="rank-bar-wrap">
              <view class="rank-bar-fill" :style="{ width: shop.percent + '%' }"></view>
            </view>
          </view>
          <text class="rank-revenue">¥{{ shop.revenue }}</text>
        </view>
      </view>

      <!-- 排队类型分布 -->
      <view class="distribution-section card">
        <text class="chart-title">{{ lang === 'zh' ? '排队类型分布' : 'Queue Type Distribution' }}</text>
        <view class="donut-chart-wrap">
          <view class="donut-chart">
            <view class="donut-center">
              <text class="donut-total">{{ kpis.queues }}</text>
              <text class="donut-label">{{ lang === 'zh' ? '总排队' : 'Total' }}</text>
            </view>
          </view>
          <view class="donut-legend">
            <view class="legend-item">
              <view class="legend-dot online"></view>
              <text class="legend-label">{{ lang === 'zh' ? '在线排队' : 'Online' }}</text>
              <text class="legend-value">68%</text>
            </view>
            <view class="legend-item">
              <view class="legend-dot instore"></view>
              <text class="legend-label">{{ lang === 'zh' ? '实体排队' : 'In-store' }}</text>
              <text class="legend-value">32%</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 退款统计 -->
      <view class="refund-stats-card card">
        <text class="chart-title">{{ lang === 'zh' ? '退款与爽约统计' : 'Refund & No-show Stats' }}</text>
        <view class="refund-row">
          <view class="refund-item">
            <text class="refund-value">{{ refundStats.total }}</text>
            <text class="refund-label">{{ lang === 'zh' ? '退款申请' : 'Refund Requests' }}</text>
          </view>
          <view class="refund-item">
            <text class="refund-value success">{{ refundStats.approved }}</text>
            <text class="refund-label">{{ lang === 'zh' ? '已批准' : 'Approved' }}</text>
          </view>
          <view class="refund-item">
            <text class="refund-value warning">{{ refundStats.noshow }}</text>
            <text class="refund-label">{{ lang === 'zh' ? '爽约次数' : 'No-shows' }}</text>
          </view>
          <view class="refund-item">
            <text class="refund-value error">¥{{ refundStats.penalty }}</text>
            <text class="refund-label">{{ lang === 'zh' ? '违约金收入' : 'Penalties' }}</text>
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
const activeTab = ref('statistics')
const activeRange = ref('week')

const t = (key) => langStore.t(key)

const adminTabs = [
  { key: 'shops', label: '商家管理', labelEn: 'Shops', icon: '🏪' },
  { key: 'products', label: '产品管理', labelEn: 'Products', icon: '🛒' },
  { key: 'statistics', label: '数据统计', labelEn: 'Statistics', icon: '📊' },
]

const timeRanges = [
  { key: 'today', label: '今日', labelEn: 'Today' },
  { key: 'week', label: '本周', labelEn: 'Week' },
  { key: 'month', label: '本月', labelEn: 'Month' },
  { key: 'year', label: '全年', labelEn: 'Year' },
]

const kpis = ref({ orders: '3,248', ordersChange: 12.5, revenue: '186,420', revenueChange: 18.2, users: 284, usersChange: 8.6, queues: '4,120', queuesChange: 3.2 })

const orderTrend = ref([
  { label: '周一', height: 60 },
  { label: '周二', height: 75 },
  { label: '周三', height: 55 },
  { label: '周四', height: 90 },
  { label: '周五', height: 100 },
  { label: '周六', height: 85 },
  { label: '周日', height: 70 },
])

const shopRanking = ref([
  { id: 's005', emoji: '🍔', name: '麦当劳旗舰', nameEn: "McDonald's", revenue: '56,000', percent: 100 },
  { id: 's003', emoji: '☕', name: '星巴克旗舰', nameEn: 'Starbucks', revenue: '42,000', percent: 75 },
  { id: 's002', emoji: '🍣', name: '鮨さいとう', nameEn: 'Saito Sushi', revenue: '38,000', percent: 68 },
  { id: 's001', emoji: '🍜', name: '外婆家', nameEn: 'Waipojia', revenue: '28,640', percent: 51 },
])

const refundStats = ref({ total: 48, approved: 42, noshow: 15, penalty: '1,240' })

const switchTab = (key) => {
  const routes = { shops: '/pages/admin/shops', products: '/pages/admin/products', statistics: '/pages/admin/statistics' }
  if (routes[key]) uni.reLaunch({ url: routes[key] })
}

const toggleLang = () => { langStore.toggle(); lang.value = langStore.lang }
</script>

<style scoped>
.admin-page { background: var(--bg-page); }
.admin-navbar { padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; background: linear-gradient(135deg, #1a1a2e, #16213e); }
.admin-brand { display: flex; align-items: center; gap: 10px; }
.brand-icon { font-size: 24px; }
.brand-title { display: block; font-size: 16px; font-weight: 800; color: #fff; }
.brand-sub { display: block; font-size: 11px; color: rgba(255,255,255,0.6); }
.navbar-actions { display: flex; align-items: center; gap: 12px; }
.action-icon { width: 34px; height: 34px; background: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.lang-text { font-size: 12px; font-weight: 700; color: #fff; }
.admin-tabs { display: flex; background: var(--bg-card); border-bottom: 1px solid var(--divider); }
.admin-tab { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 0; cursor: pointer; color: var(--text-hint); border-bottom: 2px solid transparent; transition: all 0.2s; }
.admin-tab.active { color: var(--primary); border-bottom-color: var(--primary); }
.tab-icon { font-size: 18px; }
.tab-label { font-size: 11px; font-weight: 600; }

.time-range-bar { display: flex; gap: 8px; padding: 10px 16px; background: var(--bg-card); border-bottom: 1px solid var(--divider); }
.range-chip { flex: 1; text-align: center; padding: 6px 0; border-radius: 10px; font-size: 12px; font-weight: 600; background: var(--bg-input); color: var(--text-hint); cursor: pointer; transition: all 0.2s; }
.range-chip.active { background: var(--primary); color: #fff; }

.stats-scroll { height: calc(100vh - 64px - 52px - 46px); }

/* KPI网格 */
.kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 12px 16px; }

.kpi-card {
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kpi-card.primary { background: linear-gradient(135deg, var(--primary), #FF7875); }
.kpi-card.success { background: linear-gradient(135deg, var(--success), #95DE64); }
.kpi-card.info { background: linear-gradient(135deg, var(--info), #69C0FF); }
.kpi-card.warning { background: linear-gradient(135deg, var(--warning), #FFD666); }

.kpi-icon { font-size: 22px; }
.kpi-value { font-size: 22px; font-weight: 800; color: #fff; }
.kpi-label { font-size: 11px; color: rgba(255,255,255,0.8); }
.kpi-change { font-size: 11px; font-weight: 700; }
.kpi-change.up { color: rgba(255,255,255,0.9); }
.kpi-change.down { color: rgba(255,255,255,0.7); }

/* 柱状图 */
.chart-section { margin: 0 16px 12px; padding: 16px; }
.chart-title { display: block; font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 14px; }

.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 120px;
}

.bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  height: 100%;
}

.bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  background: var(--bg-input);
  border-radius: 6px;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  background: linear-gradient(to top, var(--primary), #FF7875);
  border-radius: 6px;
  transition: height 0.5s;
}

.bar-label { font-size: 10px; color: var(--text-hint); }

/* 商家排行 */
.rank-section { margin: 0 16px 12px; padding: 16px; }

.rank-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--divider);
}

.rank-item:last-child { border-bottom: none; }

.rank-badge {
  width: 24px; height: 24px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 800;
  flex-shrink: 0;
}

.rank-badge.rank-1 { background: #FFD700; color: #8B6914; }
.rank-badge.rank-2 { background: #C0C0C0; color: #666; }
.rank-badge.rank-3 { background: #CD7F32; color: #fff; }
.rank-badge.rank-4, .rank-badge.rank-5 { background: var(--bg-input); color: var(--text-hint); }

.rank-emoji { font-size: 20px; }
.rank-info { flex: 1; }
.rank-name { display: block; font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
.rank-bar-wrap { height: 6px; background: var(--bg-input); border-radius: 3px; overflow: hidden; }
.rank-bar-fill { height: 100%; background: var(--primary); border-radius: 3px; }
.rank-revenue { font-size: 13px; font-weight: 700; color: var(--primary); }

/* 排队类型分布 */
.distribution-section { margin: 0 16px 12px; padding: 16px; }

.donut-chart-wrap {
  display: flex;
  align-items: center;
  gap: 20px;
}

.donut-chart {
  width: 100px; height: 100px;
  border-radius: 50%;
  background: conic-gradient(var(--primary) 0% 68%, var(--info) 68% 100%);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.donut-center {
  width: 70px; height: 70px;
  border-radius: 50%;
  background: var(--bg-card);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}

.donut-total { font-size: 14px; font-weight: 800; color: var(--text-primary); }
.donut-label { font-size: 10px; color: var(--text-hint); }

.donut-legend { display: flex; flex-direction: column; gap: 12px; }
.legend-item { display: flex; align-items: center; gap: 8px; }
.legend-dot { width: 12px; height: 12px; border-radius: 50%; }
.legend-dot.online { background: var(--primary); }
.legend-dot.instore { background: var(--info); }
.legend-label { flex: 1; font-size: 13px; color: var(--text-secondary); }
.legend-value { font-size: 13px; font-weight: 700; color: var(--text-primary); }

/* 退款统计 */
.refund-stats-card { margin: 0 16px 12px; padding: 16px; }
.refund-row { display: flex; gap: 8px; }
.refund-item { flex: 1; text-align: center; background: var(--bg-input); border-radius: 10px; padding: 12px 6px; }
.refund-value { display: block; font-size: 18px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; }
.refund-value.success { color: var(--success); }
.refund-value.warning { color: var(--warning); }
.refund-value.error { color: var(--error); }
.refund-label { display: block; font-size: 10px; color: var(--text-hint); }
</style>
