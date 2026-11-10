<template>
  <view class="page-container profile-page">
    <view class="navbar">
      <view style="width:36px;"></view>
      <text class="navbar-title">{{ t('profile') }}</text>
      <view style="width:36px;"></view>
    </view>

    <scroll-view scroll-y class="profile-scroll">
      <!-- 用户信息头部 -->
      <view class="user-hero gradient-primary">
        <view class="user-avatar-wrap">
          <text class="user-avatar">{{ user?.avatar || '👤' }}</text>
          <view class="avatar-edit-btn">✏️</view>
        </view>
        <text class="user-name">{{ user?.nickname || (lang === 'zh' ? '未登录用户' : 'Guest') }}</text>
        <text class="user-phone">{{ user?.phone || '' }}</text>
        <view v-if="user?.role" class="role-badge">
          <text>{{ getRoleText(user.role) }}</text>
        </view>
      </view>

      <!-- 统计数据 -->
      <view class="stats-row">
        <view class="stat-item">
          <text class="stat-value">{{ user?.orders || 0 }}</text>
          <text class="stat-label">{{ t('orders_count') }}</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-value">{{ user?.completed || 0 }}</text>
          <text class="stat-label">{{ t('completed_count') }}</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-value">{{ user?.refunds || 0 }}</text>
          <text class="stat-label">{{ t('refund_count') }}</text>
        </view>
      </view>

      <!-- 功能菜单 -->
      <view class="menu-section">
        <!-- 订单管理 -->
        <view class="menu-group card">
          <view class="menu-item" @click="goToOrders">
            <text class="menu-icon">📋</text>
            <text class="menu-label">{{ t('my_orders') }}</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="divider"></view>
          <view class="menu-item" @click="goToQueue">
            <text class="menu-icon">🚶</text>
            <text class="menu-label">{{ t('queue_history') }}</text>
            <text class="menu-arrow">›</text>
          </view>
        </view>

        <!-- 设置 -->
        <view class="menu-group card">
          <!-- 语言设置 -->
          <view class="menu-item">
            <text class="menu-icon">🌐</text>
            <text class="menu-label">{{ t('language_setting') }}</text>
            <view class="lang-switch">
              <view :class="['lang-opt', { active: lang === 'zh' }]" @click="setLang('zh')">中文</view>
              <view :class="['lang-opt', { active: lang === 'en' }]" @click="setLang('en')">EN</view>
            </view>
          </view>
          <view class="divider"></view>
          <!-- 主题设置 -->
          <view class="menu-item">
            <text class="menu-icon">{{ theme === 'light' ? '☀️' : '🌙' }}</text>
            <text class="menu-label">{{ t('theme_setting') }}</text>
            <view class="theme-switch">
              <view :class="['theme-opt', { active: theme === 'light' }]" @click="setTheme('light')">
                <text>☀️ {{ t('light_mode') }}</text>
              </view>
              <view :class="['theme-opt', { active: theme === 'dark' }]" @click="setTheme('dark')">
                <text>🌙 {{ t('dark_mode') }}</text>
              </view>
            </view>
          </view>
          <view class="divider"></view>
          <!-- 通知设置 -->
          <view class="menu-item">
            <text class="menu-icon">🔔</text>
            <text class="menu-label">{{ t('notifications') }}</text>
            <view :class="['toggle-switch', { on: notifyOn }]" @click="notifyOn = !notifyOn">
              <view class="toggle-thumb"></view>
            </view>
          </view>
        </view>

        <!-- 商家/管理员入口 -->
        <view v-if="user?.role === 'shop_admin'" class="menu-group card">
          <view class="menu-item" @click="goToMerchant">
            <text class="menu-icon">🏪</text>
            <text class="menu-label">{{ lang === 'zh' ? '进入商家管理' : 'Merchant Dashboard' }}</text>
            <text class="menu-arrow">›</text>
          </view>
        </view>

        <view v-if="user?.role === 'super_admin'" class="menu-group card">
          <view class="menu-item" @click="goToAdmin">
            <text class="menu-icon">👑</text>
            <text class="menu-label">{{ lang === 'zh' ? '进入平台管理' : 'Admin Panel' }}</text>
            <text class="menu-arrow">›</text>
          </view>
        </view>

        <!-- 关于 -->
        <view class="menu-group card">
          <view class="menu-item">
            <text class="menu-icon">🔒</text>
            <text class="menu-label">{{ t('privacy_policy') }}</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="divider"></view>
          <view class="menu-item">
            <text class="menu-icon">ℹ️</text>
            <text class="menu-label">{{ t('about_us') }}</text>
            <text class="menu-arrow">›</text>
          </view>
        </view>

        <!-- 退出登录 -->
        <view class="logout-section">
          <button class="logout-btn" @click="handleLogout">{{ t('logout') }}</button>
        </view>
      </view>

      <view style="height: 20px;"></view>
    </scroll-view>

    <TabBar current="profile" />
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { langStore, themeStore, userStore } from '../../stores/app.js'
import TabBar from '../../components/common/TabBar.vue'

const lang = ref(langStore.lang)
const theme = ref(themeStore.theme)
const notifyOn = ref(true)
const user = ref(null)

const t = (key) => langStore.t(key)

onMounted(() => {
  user.value = userStore.user
  if (!user.value) {
    user.value = userStore.mockLogin('user')
  }
})

const setLang = (l) => {
  langStore.setLang(l)
  lang.value = l
  uni.$emit('lang-changed')
}

const setTheme = (t) => {
  themeStore.setTheme(t)
  theme.value = t
}

const getRoleText = (role) => {
  const map = {
    user: lang.value === 'zh' ? '普通用户' : 'User',
    shop_admin: lang.value === 'zh' ? '商家管理员' : 'Merchant',
    super_admin: lang.value === 'zh' ? '平台管理员' : 'Admin',
  }
  return map[role] || role
}

const goToOrders = () => uni.navigateTo({ url: '/pages/user/orders' })
const goToQueue = () => uni.navigateTo({ url: '/pages/queue/status' })
const goToMerchant = () => uni.reLaunch({ url: '/pages/shop-admin/orders' })
const goToAdmin = () => uni.reLaunch({ url: '/pages/admin/shops' })

const handleLogout = () => {
  uni.showModal({
    title: lang.value === 'zh' ? '退出登录' : 'Logout',
    content: lang.value === 'zh' ? '确定要退出登录吗？' : 'Are you sure to logout?',
    success: (res) => {
      if (res.confirm) {
        userStore.clearUser()
        uni.reLaunch({ url: '/pages/user/login' })
      }
    }
  })
}
</script>

<style scoped>
.profile-page { background: var(--bg-page); }

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

.profile-scroll { height: calc(100vh - 54px - 60px); }

/* 用户头部 */
.user-hero {
  padding: 28px 20px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.user-avatar-wrap {
  position: relative;
  margin-bottom: 4px;
}

.user-avatar {
  font-size: 56px;
  display: block;
  width: 72px;
  height: 72px;
  background: rgba(255,255,255,0.25);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid rgba(255,255,255,0.6);
}

.avatar-edit-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 24px;
  height: 24px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
}

.user-name {
  font-size: 20px;
  font-weight: 800;
  color: #fff;
}

.user-phone {
  font-size: 13px;
  color: rgba(255,255,255,0.8);
}

.role-badge {
  background: rgba(255,255,255,0.25);
  padding: 4px 14px;
  border-radius: 12px;
}

.role-badge text {
  font-size: 12px;
  color: #fff;
  font-weight: 600;
}

/* 统计数据 */
.stats-row {
  display: flex;
  background: var(--bg-card);
  margin: 0 16px;
  border-radius: 14px;
  padding: 16px 0;
  margin-top: -14px;
  box-shadow: var(--shadow);
  position: relative;
  z-index: 10;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 22px;
  font-weight: 800;
  color: var(--primary);
  margin-bottom: 4px;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: var(--text-hint);
}

.stat-divider {
  width: 1px;
  background: var(--divider);
  margin: 4px 0;
}

/* 菜单 */
.menu-section {
  padding: 16px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.menu-group { padding: 0; }

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.menu-item:active { background: var(--bg-input); }

.menu-icon { font-size: 20px; }

.menu-label {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.menu-arrow {
  font-size: 18px;
  color: var(--text-hint);
}

.divider {
  height: 1px;
  background: var(--divider);
  margin: 0 16px;
}

/* 语言切换 */
.lang-switch {
  display: flex;
  background: var(--bg-input);
  border-radius: 10px;
  overflow: hidden;
}

.lang-opt {
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-hint);
  cursor: pointer;
  transition: all 0.2s;
}

.lang-opt.active {
  background: var(--primary);
  color: #fff;
  border-radius: 10px;
}

/* 主题切换 */
.theme-switch {
  display: flex;
  gap: 6px;
}

.theme-opt {
  padding: 5px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-hint);
  background: var(--bg-input);
  cursor: pointer;
  transition: all 0.2s;
}

.theme-opt.active {
  background: var(--primary-bg);
  color: var(--primary);
}

/* 开关 */
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

/* 退出登录 */
.logout-section { padding: 0; }

.logout-btn {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  background: var(--error-bg);
  color: var(--error);
  border: none;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}
</style>
