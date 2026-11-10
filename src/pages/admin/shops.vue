<template>
  <view class="page-container admin-page">
    <!-- 管理员顶部导航 -->
    <view class="admin-navbar gradient-dark">
      <view class="admin-brand">
        <text class="brand-icon">👑</text>
        <view>
          <text class="brand-title">{{ lang === 'zh' ? '平台管理后台' : 'Admin Dashboard' }}</text>
          <text class="brand-sub">QueueGo Platform</text>
        </view>
      </view>
      <view class="navbar-actions">
        <view class="action-icon" @click="toggleLang">
          <text class="lang-text">{{ lang === 'zh' ? 'EN' : '中' }}</text>
        </view>
      </view>
    </view>

    <!-- 管理员Tab -->
    <view class="admin-tabs">
      <view v-for="tab in adminTabs" :key="tab.key" :class="['admin-tab', { active: activeTab === tab.key }]" @click="switchTab(tab.key)">
        <text class="tab-icon">{{ tab.icon }}</text>
        <text class="tab-label">{{ lang === 'zh' ? tab.label : tab.labelEn }}</text>
      </view>
    </view>

    <!-- 平台统计 -->
    <view class="platform-stats">
      <view class="pstat-card">
        <text class="pstat-value">{{ platformStats.shops }}</text>
        <text class="pstat-label">{{ lang === 'zh' ? '商家总数' : 'Shops' }}</text>
      </view>
      <view class="pstat-card">
        <text class="pstat-value">{{ platformStats.users }}</text>
        <text class="pstat-label">{{ lang === 'zh' ? '注册用户' : 'Users' }}</text>
      </view>
      <view class="pstat-card">
        <text class="pstat-value">{{ platformStats.orders }}</text>
        <text class="pstat-label">{{ lang === 'zh' ? '今日订单' : 'Orders' }}</text>
      </view>
      <view class="pstat-card">
        <text class="pstat-value">¥{{ platformStats.revenue }}</text>
        <text class="pstat-label">{{ lang === 'zh' ? '今日流水' : 'Revenue' }}</text>
      </view>
    </view>

    <!-- 搜索与操作栏 -->
    <view class="search-action-bar">
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <input v-model="searchText" :placeholder="lang === 'zh' ? '搜索商家名称...' : 'Search shops...'" class="search-input" />
      </view>
      <button class="add-btn" @click="showAddShop">
        <text>+ {{ lang === 'zh' ? '添加商家' : 'Add Shop' }}</text>
      </button>
    </view>

    <!-- 商家列表 -->
    <scroll-view scroll-y class="shops-scroll">
      <view v-for="shop in filteredShops" :key="shop.id" class="shop-admin-card card">
        <view class="shop-card-header">
          <text class="shop-emoji">{{ shop.emoji }}</text>
          <view class="shop-info">
            <text class="shop-name">{{ lang === 'zh' ? shop.name : shop.nameEn }</text>
            <text class="shop-category">{{ lang === 'zh' ? shop.category : shop.categoryEn }}</text>
          </view>
          <view :class="['shop-status-badge', shop.status]">
            {{ getShopStatusText(shop.status) }}
          </view>
        </view>

        <view class="shop-stats-row">
          <view class="shop-stat">
            <text class="sstat-value">{{ shop.todayOrders }}</text>
            <text class="sstat-label">{{ lang === 'zh' ? '今日订单' : 'Orders' }}</text>
          </view>
          <view class="shop-stat">
            <text class="sstat-value">{{ shop.queueCount }}</text>
            <text class="sstat-label">{{ lang === 'zh' ? '排队人数' : 'Queue' }}</text>
          </view>
          <view class="shop-stat">
            <text class="sstat-value">{{ shop.rating }}</text>
            <text class="sstat-label">{{ lang === 'zh' ? '评分' : 'Rating' }}</text>
          </view>
          <view class="shop-stat">
            <text class="sstat-value">¥{{ shop.revenue }}</text>
            <text class="sstat-label">{{ lang === 'zh' ? '今日营收' : 'Revenue' }}</text>
          </view>
        </view>

        <view class="shop-actions">
          <button class="shop-action-btn view" @click="viewShop(shop)">
            {{ lang === 'zh' ? '查看' : 'View' }}
          </button>
          <button class="shop-action-btn edit" @click="editShop(shop)">
            {{ lang === 'zh' ? '编辑' : 'Edit' }}
          </button>
          <button 
            :class="['shop-action-btn', shop.status === 'active' ? 'suspend' : 'activate']"
            @click="toggleShopStatus(shop)"
          >
            {{ shop.status === 'active' ? (lang === 'zh' ? '暂停' : 'Suspend') : (lang === 'zh' ? '激活' : 'Activate') }}
          </button>
          <button class="shop-action-btn delete" @click="deleteShop(shop)">
            {{ lang === 'zh' ? '删除' : 'Delete' }}
          </button>
        </view>
      </view>

      <view style="height: 20px;"></view>
    </scroll-view>

    <!-- 添加商家弹窗 -->
    <view v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <view class="modal-card">
        <text class="modal-title">{{ lang === 'zh' ? '添加商家' : 'Add Shop' }}</text>
        <view class="form-group">
          <text class="form-label">{{ lang === 'zh' ? '商家名称' : 'Shop Name' }}</text>
          <input v-model="newShop.name" :placeholder="lang === 'zh' ? '请输入商家名称' : 'Enter shop name'" class="form-input" />
        </view>
        <view class="form-group">
          <text class="form-label">{{ lang === 'zh' ? '商家类别' : 'Category' }}</text>
          <input v-model="newShop.category" :placeholder="lang === 'zh' ? '如：中餐、西餐、甜品' : 'e.g. Chinese, Western, Dessert'" class="form-input" />
        </view>
        <view class="form-group">
          <text class="form-label">{{ lang === 'zh' ? '联系电话' : 'Phone' }}</text>
          <input v-model="newShop.phone" placeholder="138-0000-0000" class="form-input" />
        </view>
        <view class="modal-actions">
          <button class="modal-btn cancel" @click="showAddModal = false">{{ lang === 'zh' ? '取消' : 'Cancel' }}</button>
          <button class="modal-btn confirm" @click="confirmAddShop">{{ lang === 'zh' ? '确认添加' : 'Confirm' }}</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { langStore } from '../../stores/app.js'

const lang = ref(langStore.lang)
const activeTab = ref('shops')
const searchText = ref('')
const showAddModal = ref(false)

const t = (key) => langStore.t(key)

const adminTabs = [
  { key: 'shops', label: '商家管理', labelEn: 'Shops', icon: '🏪' },
  { key: 'products', label: '产品管理', labelEn: 'Products', icon: '🛒' },
  { key: 'statistics', label: '数据统计', labelEn: 'Statistics', icon: '📊' },
]

const platformStats = ref({ shops: 24, users: 1280, orders: 486, revenue: '28,640' })

const shops = ref([
  { id: 's001', emoji: '🍜', name: '外婆家', nameEn: 'Waipojia', category: '中餐', categoryEn: 'Chinese', status: 'active', todayOrders: 48, queueCount: 12, rating: '4.8', revenue: '2,840' },
  { id: 's002', emoji: '🍣', name: '鮨さいとう', nameEn: 'Saito Sushi', category: '日料', categoryEn: 'Japanese', status: 'active', todayOrders: 32, queueCount: 8, rating: '4.9', revenue: '4,200' },
  { id: 's003', emoji: '☕', name: '星巴克旗舰店', nameEn: 'Starbucks Flagship', category: '咖啡', categoryEn: 'Coffee', status: 'active', todayOrders: 120, queueCount: 25, rating: '4.6', revenue: '3,600' },
  { id: 's004', emoji: '🥐', name: '巴黎贝甜', nameEn: 'Paris Baguette', category: '烘焙', categoryEn: 'Bakery', status: 'suspended', todayOrders: 0, queueCount: 0, rating: '4.5', revenue: '0' },
  { id: 's005', emoji: '🍔', name: '麦当劳旗舰', nameEn: 'McDonald\'s', category: '快餐', categoryEn: 'Fast Food', status: 'active', todayOrders: 200, queueCount: 40, rating: '4.3', revenue: '8,000' },
])

const newShop = ref({ name: '', category: '', phone: '' })

const filteredShops = computed(() => {
  if (!searchText.value) return shops.value
  return shops.value.filter(s => 
    s.name.includes(searchText.value) || s.nameEn.toLowerCase().includes(searchText.value.toLowerCase())
  )
})

const getShopStatusText = (status) => {
  return status === 'active' ? (lang.value === 'zh' ? '营业中' : 'Active') : (lang.value === 'zh' ? '已暂停' : 'Suspended')
}

const toggleShopStatus = (shop) => {
  shop.status = shop.status === 'active' ? 'suspended' : 'active'
  uni.showToast({ title: lang.value === 'zh' ? '状态已更新' : 'Status updated', icon: 'success' })
}

const deleteShop = (shop) => {
  uni.showModal({
    title: lang.value === 'zh' ? '删除商家' : 'Delete Shop',
    content: lang.value === 'zh' ? `确定删除 ${shop.name}？` : `Delete ${shop.nameEn}?`,
    success: (res) => {
      if (res.confirm) {
        const idx = shops.value.findIndex(s => s.id === shop.id)
        if (idx >= 0) shops.value.splice(idx, 1)
        uni.showToast({ title: lang.value === 'zh' ? '已删除' : 'Deleted', icon: 'success' })
      }
    }
  })
}

const viewShop = (shop) => {
  uni.showToast({ title: `${lang.value === 'zh' ? '查看' : 'View'}: ${shop.name}`, icon: 'none' })
}

const editShop = (shop) => {
  uni.showToast({ title: `${lang.value === 'zh' ? '编辑' : 'Edit'}: ${shop.name}`, icon: 'none' })
}

const showAddShop = () => { showAddModal.value = true }

const confirmAddShop = () => {
  if (!newShop.value.name) {
    uni.showToast({ title: lang.value === 'zh' ? '请输入商家名称' : 'Enter shop name', icon: 'none' })
    return
  }
  shops.value.push({
    id: 's' + Date.now(),
    emoji: '🏪',
    name: newShop.value.name,
    nameEn: newShop.value.name,
    category: newShop.value.category || '其他',
    categoryEn: newShop.value.category || 'Other',
    status: 'active',
    todayOrders: 0,
    queueCount: 0,
    rating: '5.0',
    revenue: '0'
  })
  showAddModal.value = false
  newShop.value = { name: '', category: '', phone: '' }
  uni.showToast({ title: lang.value === 'zh' ? '商家已添加' : 'Shop added', icon: 'success' })
}

const switchTab = (key) => {
  const routes = { shops: '/pages/admin/shops', products: '/pages/admin/products', statistics: '/pages/admin/statistics' }
  if (routes[key]) uni.reLaunch({ url: routes[key] })
}

const toggleLang = () => { langStore.toggle(); lang.value = langStore.lang }
</script>

<style scoped>
.admin-page { background: var(--bg-page); }

.admin-navbar {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
}

.admin-brand { display: flex; align-items: center; gap: 10px; }
.brand-icon { font-size: 24px; }
.brand-title { display: block; font-size: 16px; font-weight: 800; color: #fff; }
.brand-sub { display: block; font-size: 11px; color: rgba(255,255,255,0.6); }
.navbar-actions { display: flex; align-items: center; gap: 12px; }
.action-icon { width: 34px; height: 34px; background: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.lang-text { font-size: 12px; font-weight: 700; color: #fff; }

.admin-tabs {
  display: flex;
  background: var(--bg-card);
  border-bottom: 1px solid var(--divider);
}

.admin-tab {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 10px 0;
  cursor: pointer;
  color: var(--text-hint);
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.admin-tab.active { color: var(--primary); border-bottom-color: var(--primary); }
.tab-icon { font-size: 18px; }
.tab-label { font-size: 11px; font-weight: 600; }

/* 平台统计 */
.platform-stats {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--divider);
}

.pstat-card {
  flex: 1;
  text-align: center;
  background: var(--bg-input);
  border-radius: 10px;
  padding: 10px 4px;
}

.pstat-value { display: block; font-size: 16px; font-weight: 800; color: var(--primary); margin-bottom: 3px; }
.pstat-label { display: block; font-size: 10px; color: var(--text-hint); }

/* 搜索栏 */
.search-action-bar {
  display: flex;
  gap: 10px;
  padding: 10px 16px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--divider);
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-input);
  border-radius: 10px;
  padding: 0 12px;
  border: 1.5px solid var(--border-input);
}

.search-icon { font-size: 16px; }
.search-input { flex: 1; height: 38px; background: transparent; border: none; outline: none; font-size: 13px; color: var(--text-primary); }

.add-btn {
  height: 38px;
  padding: 0 16px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.shops-scroll { height: calc(100vh - 64px - 52px - 60px - 58px); }

/* 商家卡片 */
.shop-admin-card { margin: 10px 16px 0; padding: 0; overflow: hidden; }

.shop-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 14px 10px;
  border-bottom: 1px solid var(--divider);
}

.shop-emoji { font-size: 32px; }
.shop-name { display: block; font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 3px; }
.shop-category { display: block; font-size: 11px; color: var(--text-hint); }
.shop-info { flex: 1; }

.shop-status-badge {
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.shop-status-badge.active { background: var(--success-bg); color: var(--success); }
.shop-status-badge.suspended { background: var(--error-bg); color: var(--error); }

.shop-stats-row {
  display: flex;
  padding: 10px 14px;
  border-bottom: 1px solid var(--divider);
}

.shop-stat { flex: 1; text-align: center; }
.sstat-value { display: block; font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
.sstat-label { display: block; font-size: 10px; color: var(--text-hint); }

.shop-actions {
  display: flex;
  gap: 8px;
  padding: 10px 14px 14px;
}

.shop-action-btn {
  flex: 1;
  height: 32px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  border: none;
  cursor: pointer;
}

.shop-action-btn.view { background: var(--bg-input); color: var(--text-secondary); }
.shop-action-btn.edit { background: var(--info-bg); color: var(--info); }
.shop-action-btn.suspend { background: var(--warning-bg); color: var(--warning); }
.shop-action-btn.activate { background: var(--success-bg); color: var(--success); }
.shop-action-btn.delete { background: var(--error-bg); color: var(--error); }

/* 弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  width: 100%;
  max-width: 480px;
  background: var(--bg-card);
  border-radius: 20px 20px 0 0;
  padding: 24px 20px;
}

.modal-title { display: block; font-size: 18px; font-weight: 800; color: var(--text-primary); margin-bottom: 20px; }

.form-group { margin-bottom: 14px; }
.form-label { display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }
.form-input {
  width: 100%;
  height: 42px;
  background: var(--bg-input);
  border: 1.5px solid var(--border-input);
  border-radius: 10px;
  padding: 0 12px;
  font-size: 14px;
  color: var(--text-primary);
  outline: none;
}

.modal-actions { display: flex; gap: 10px; margin-top: 20px; }
.modal-btn { flex: 1; height: 46px; border-radius: 12px; font-size: 15px; font-weight: 700; border: none; cursor: pointer; }
.modal-btn.cancel { background: var(--bg-input); color: var(--text-secondary); }
.modal-btn.confirm { background: var(--primary); color: #fff; }
</style>
