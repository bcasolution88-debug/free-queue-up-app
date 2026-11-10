<template>
  <view class="page-container home-page">
    <!-- 顶部导航栏 -->
    <view class="home-navbar">
      <view class="navbar-left">
        <view class="logo-mark">Q</view>
        <view class="app-title-wrap">
          <text class="app-title">QueueGo</text>
          <text class="app-subtitle">{{ t('app_name') }}</text>
        </view>
      </view>
      <view class="navbar-actions">
        <view class="action-icon" @click="toggleTheme">
          <text>{{ theme === 'light' ? '🌙' : '☀️' }}</text>
        </view>
        <view class="lang-btn" @click="toggleLang">
          <text :class="{ active: lang === 'zh' }">中</text>
          <text class="sep">/</text>
          <text :class="{ active: lang === 'en' }">EN</text>
        </view>
      </view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-section">
      <view class="search-bar" @click="focusSearch">
        <text class="search-icon">🔍</text>
        <input 
          v-model="searchKeyword"
          :placeholder="t('search_shops')"
          class="search-input"
          @input="handleSearch"
        />
        <text v-if="searchKeyword" class="clear-btn" @click.stop="clearSearch">✕</text>
      </view>
    </view>

    <!-- 主内容区 -->
    <scroll-view scroll-y class="main-scroll" @scrolltolower="loadMore">
      
      <!-- 轮播图 -->
      <view class="banner-section">
        <swiper class="banner-swiper" autoplay circular :interval="3000" indicator-dots indicator-color="rgba(255,255,255,0.5)" indicator-active-color="#fff">
          <swiper-item v-for="banner in banners" :key="banner.id">
            <view class="banner-item" :style="{ background: banner.color }">
              <view class="banner-content">
                <text class="banner-title">{{ lang === 'zh' ? banner.title : banner.titleEn }}</text>
                <text class="banner-tag">{{ lang === 'zh' ? '立即体验' : 'Try Now' }}</text>
              </view>
              <text class="banner-emoji">{{ banner.emoji }}</text>
            </view>
          </swiper-item>
        </swiper>
      </view>

      <!-- 分类导航 -->
      <view class="category-section">
        <view 
          v-for="cat in categories" 
          :key="cat.key"
          :class="['cat-item', { active: activeCategory === cat.key }]"
          @click="switchCategory(cat.key)"
        >
          <view class="cat-icon-wrap" :style="{ background: cat.bg }">
            <text class="cat-icon">{{ cat.icon }}</text>
          </view>
          <text class="cat-name">{{ lang === 'zh' ? cat.name : cat.nameEn }}</text>
        </view>
      </view>

      <!-- 商家列表标题 -->
      <view class="section-header">
        <text class="section-title">
          {{ activeCategory === 'all' ? t('nearby_shops') : (lang === 'zh' ? categories.find(c=>c.key===activeCategory)?.name : categories.find(c=>c.key===activeCategory)?.nameEn) }}
        </text>
        <text class="section-count">{{ filteredShops.length }}{{ lang === 'zh' ? '家' : ' shops' }}</text>
      </view>

      <!-- 商家卡片列表 -->
      <view class="shops-list">
        <view 
          v-for="shop in filteredShops" 
          :key="shop.id"
          class="shop-card"
          @click="goToShop(shop)"
        >
          <!-- 商家图片 -->
          <view class="shop-img-wrap">
            <image 
              :src="shop.banner" 
              class="shop-img" 
              mode="aspectFill"
              :onerror="() => shop.imgError = true"
            />
            <view v-if="shop.imgError" class="shop-img-fallback">
              <text class="fallback-emoji">{{ shop.logo }}</text>
            </view>
            <view :class="['status-badge', shop.status]">
              {{ shop.status === 'open' ? t('open') : shop.status === 'closed' ? t('closed') : t('maintenance') }}
            </view>
          </view>

          <!-- 商家信息 -->
          <view class="shop-info">
            <view class="shop-name-row">
              <text class="shop-name">{{ lang === 'zh' ? shop.name : shop.nameEn }}</text>
              <view class="rating-badge">
                <text class="star">⭐</text>
                <text class="rating">{{ shop.rating }}</text>
              </view>
            </view>

            <view class="shop-tags">
              <text v-for="tag in shop.tags.slice(0,3)" :key="tag" class="tag">{{ tag }}</text>
            </view>

            <view class="shop-meta">
              <text class="meta-item">📍 {{ shop.distance }}{{ t('km') }}</text>
              <text class="meta-item">💬 {{ shop.reviewCount }}{{ t('reviews') }}</text>
            </view>

            <!-- 双排队状态 -->
            <view class="queue-status-row">
              <view class="queue-badge online" v-if="shop.status === 'open'">
                <text class="badge-dot">●</text>
                <text class="badge-text">{{ t('online_queue') }}: {{ shop.onlineQueue }}{{ t('people') }}</text>
                <text class="badge-wait">{{ t('est_wait') }}{{ shop.estWait }}{{ t('minutes') }}</text>
              </view>
              <view class="queue-badge instore" v-if="shop.status === 'open'">
                <text class="badge-dot">●</text>
                <text class="badge-text">{{ t('instore_queue') }}: {{ shop.instoreQueue }}{{ t('people') }}</text>
              </view>
              <view class="queue-badge closed-badge" v-if="shop.status !== 'open'">
                <text>{{ t('closed') }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="filteredShops.length === 0" class="empty-state">
          <text class="empty-icon">🔍</text>
          <text class="empty-text">{{ lang === 'zh' ? '没有找到相关商家' : 'No shops found' }}</text>
        </view>
      </view>

      <!-- 底部占位 -->
      <view style="height: 20px;"></view>
    </scroll-view>

    <!-- 底部TabBar -->
    <TabBar current="home" />

    <!-- 回到顶部 -->
    <view v-if="showBackTop" class="back-top-btn" @click="scrollToTop">
      <text>↑</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { themeStore, langStore, demoData, userStore } from '../../stores/app.js'
import TabBar from '../../components/common/TabBar.vue'

const theme = ref(themeStore.theme)
const lang = ref(langStore.lang)
const searchKeyword = ref('')
const activeCategory = ref('all')
const showBackTop = ref(false)

const t = (key) => langStore.t(key)

const banners = [
  { id: 1, title: '跳过排队，在线下单', titleEn: 'Skip the Line, Order Online', color: 'linear-gradient(135deg,#FF4D4F,#FF7875)', emoji: '🚀' },
  { id: 2, title: '实时排队状态，掌握在手', titleEn: 'Real-time Queue Status', color: 'linear-gradient(135deg,#1890FF,#40A9FF)', emoji: '📱' },
  { id: 3, title: '商家提前通知，准时到店', titleEn: 'Get Notified Before Pickup', color: 'linear-gradient(135deg,#52C41A,#73D13D)', emoji: '🔔' },
]

const categories = [
  { key: 'all', name: '全部', nameEn: 'All', icon: '🏪', bg: '#FFF0F0' },
  { key: 'restaurant', name: '餐厅', nameEn: 'Restaurant', icon: '🍜', bg: '#FFF7E6' },
  { key: 'coffee', name: '咖啡', nameEn: 'Coffee', icon: '☕', bg: '#F0F5FF' },
  { key: 'tea', name: '奶茶', nameEn: 'Tea', icon: '🧋', bg: '#F6FFED' },
  { key: 'dessert', name: '甜品', nameEn: 'Dessert', icon: '🍰', bg: '#FFF0F6' },
  { key: 'bakery', name: '烘焙', nameEn: 'Bakery', icon: '🥐', bg: '#FFFBE6' },
]

const shops = ref([...demoData.shops])

const filteredShops = computed(() => {
  let list = shops.value
  if (activeCategory.value !== 'all') {
    list = list.filter(s => s.category === activeCategory.value)
  }
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(s => 
      s.name.toLowerCase().includes(kw) || 
      s.nameEn.toLowerCase().includes(kw) ||
      s.tags.some(t => t.includes(kw))
    )
  }
  return list
})

const switchCategory = (key) => {
  activeCategory.value = key
}

const handleSearch = () => {
  // 实时搜索，computed自动更新
}

const clearSearch = () => {
  searchKeyword.value = ''
}

const goToShop = (shop) => {
  if (!userStore.isLoggedIn) {
    uni.navigateTo({ url: '/pages/user/login' })
    return
  }
  uni.navigateTo({ url: `/pages/shop/detail?shopId=${shop.id}` })
}

const toggleTheme = () => {
  themeStore.toggle()
  theme.value = themeStore.theme
}

const toggleLang = () => {
  langStore.toggle()
  lang.value = langStore.lang
  uni.$emit('lang-changed')
}

const loadMore = () => {
  // 模拟加载更多
}

const scrollToTop = () => {
  uni.pageScrollTo({ scrollTop: 0, duration: 300 })
}

// 监听语言切换
onMounted(() => {
  uni.$on('lang-changed', () => {
    lang.value = langStore.lang
  })
  
  // 检查登录状态
  if (!userStore.isLoggedIn) {
    // 可以选择强制跳转登录，或允许游客浏览
    // uni.navigateTo({ url: '/pages/user/login' })
  }
})

onUnmounted(() => {
  uni.$off('lang-changed')
})
</script>

<style scoped>
.home-page {
  background: var(--bg-page);
}

/* 顶部导航 */
.home-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--navbar-bg);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-mark {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 800;
}

.app-title {
  display: block;
  font-size: 16px;
  font-weight: 800;
  color: var(--primary);
  line-height: 1.2;
}

.app-subtitle {
  display: block;
  font-size: 10px;
  color: var(--text-hint);
  line-height: 1.2;
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-icon {
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
}

.lang-btn {
  display: flex;
  align-items: center;
  gap: 3px;
  background: var(--bg-input);
  padding: 5px 10px;
  border-radius: 14px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-hint);
}

.lang-btn .active { color: var(--primary); }
.lang-btn .sep { color: var(--border-input); }

/* 搜索栏 */
.search-section {
  padding: 10px 16px;
  background: var(--navbar-bg);
  border-bottom: 1px solid var(--divider);
}

.search-bar {
  display: flex;
  align-items: center;
  background: var(--bg-input);
  border-radius: 22px;
  padding: 0 14px;
  height: 40px;
  gap: 8px;
  border: 1.5px solid var(--border-input);
}

.search-bar:focus-within {
  border-color: var(--primary);
}

.search-icon { font-size: 16px; }

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 14px;
  color: var(--text-primary);
}

.search-input::placeholder { color: var(--text-hint); }

.clear-btn {
  font-size: 14px;
  color: var(--text-hint);
  cursor: pointer;
  padding: 4px;
}

/* 主滚动区 */
.main-scroll {
  height: calc(100vh - 54px - 60px - 60px);
}

/* 轮播图 */
.banner-section {
  padding: 12px 16px;
}

.banner-swiper {
  height: 140px;
  border-radius: 14px;
  overflow: hidden;
}

.banner-item {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-radius: 14px;
}

.banner-content {
  flex: 1;
}

.banner-title {
  display: block;
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 10px;
  line-height: 1.3;
}

.banner-tag {
  display: inline-block;
  background: rgba(255,255,255,0.25);
  color: #fff;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
}

.banner-emoji {
  font-size: 52px;
  margin-left: 16px;
}

/* 分类导航 */
.category-section {
  display: flex;
  gap: 6px;
  padding: 4px 16px 12px;
  overflow-x: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.category-section::-webkit-scrollbar { display: none; }

.cat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 10px;
  transition: all 0.2s;
  min-width: 56px;
}

.cat-item.active .cat-icon-wrap {
  box-shadow: 0 0 0 2px var(--primary);
}

.cat-item.active .cat-name {
  color: var(--primary);
  font-weight: 700;
}

.cat-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.cat-icon { font-size: 22px; }

.cat-name {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
  white-space: nowrap;
}

/* 区块标题 */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 16px 10px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.section-count {
  font-size: 12px;
  color: var(--text-hint);
}

/* 商家列表 */
.shops-list {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.shop-card {
  background: var(--bg-card);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.shop-card:active {
  transform: scale(0.98);
  box-shadow: var(--shadow);
}

.shop-img-wrap {
  position: relative;
  height: 160px;
  background: var(--bg-input);
}

.shop-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.shop-img-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f5f5, #e8e8e8);
}

.fallback-emoji { font-size: 60px; }

.status-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
}

.status-badge.open { background: rgba(82,196,26,0.9); color: #fff; }
.status-badge.closed { background: rgba(0,0,0,0.6); color: #fff; }
.status-badge.maintenance { background: rgba(250,173,20,0.9); color: #fff; }

.shop-info { padding: 12px 14px; }

.shop-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.shop-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.rating-badge {
  display: flex;
  align-items: center;
  gap: 3px;
}

.star { font-size: 13px; }
.rating { font-size: 13px; font-weight: 700; color: #FAAD14; }

.shop-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.tag {
  font-size: 11px;
  color: var(--text-hint);
  background: var(--bg-input);
  padding: 2px 8px;
  border-radius: 8px;
}

.shop-meta {
  display: flex;
  gap: 14px;
  margin-bottom: 10px;
}

.meta-item {
  font-size: 12px;
  color: var(--text-hint);
}

/* 双排队状态 */
.queue-status-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.queue-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.queue-badge.online {
  background: var(--success-bg);
  color: var(--success);
}

.queue-badge.instore {
  background: var(--info-bg);
  color: var(--info);
}

.queue-badge.closed-badge {
  background: var(--bg-input);
  color: var(--text-hint);
}

.badge-dot { font-size: 8px; }

.badge-wait {
  color: var(--text-hint);
  font-size: 10px;
  font-weight: 400;
}

/* 回到顶部 */
.back-top-btn {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: var(--shadow);
  cursor: pointer;
  z-index: 99;
}
</style>
