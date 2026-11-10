<template>
  <view class="page-container shop-detail-page">
    <!-- 导航栏 -->
    <view class="shop-navbar">
      <view class="navbar-back" @click="goBack">←</view>
      <text class="navbar-title">{{ lang === 'zh' ? shop?.name : shop?.nameEn }}</text>
      <view class="navbar-share" @click="shareShop">🔗</view>
    </view>

    <scroll-view scroll-y class="detail-scroll">
      <!-- 商家头图 -->
      <view class="hero-section">
        <image :src="shop?.banner" class="hero-img" mode="aspectFill" />
        <view class="hero-overlay">
          <view class="hero-info">
            <view class="shop-logo-wrap">
              <text class="shop-logo">{{ shop?.logo }}</text>
            </view>
            <view class="hero-text">
              <text class="hero-name">{{ lang === 'zh' ? shop?.name : shop?.nameEn }}</text>
              <view class="hero-meta">
                <text class="star">⭐</text>
                <text class="rating">{{ shop?.rating }}</text>
                <text class="review-count">({{ shop?.reviewCount }}{{ t('reviews') }})</text>
                <text class="distance">📍 {{ shop?.distance }}{{ t('km') }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 商家基本信息 -->
      <view class="shop-info-card card">
        <view class="info-row">
          <text class="info-icon">🕐</text>
          <text class="info-label">{{ t('business_hours') }}</text>
          <text class="info-value">{{ shop?.hours }}</text>
        </view>
        <view class="divider"></view>
        <view class="info-row">
          <text class="info-icon">📍</text>
          <text class="info-label">{{ t('address') }}</text>
          <text class="info-value">{{ lang === 'zh' ? shop?.address : shop?.addressEn }}</text>
        </view>
        <view class="divider"></view>
        <view class="info-row">
          <text class="info-icon">📞</text>
          <text class="info-label">{{ t('phone_num') }}</text>
          <text class="info-value">{{ shop?.phone }}</text>
        </view>
      </view>

      <!-- 双排队状态卡片 -->
      <view class="queue-cards-row">
        <view class="queue-card online-card">
          <view class="qcard-header">
            <text class="qcard-dot">●</text>
            <text class="qcard-title">{{ t('online_queue') }}</text>
          </view>
          <text class="qcard-count">{{ shop?.onlineQueue }}<text class="qcard-unit">{{ t('people') }}</text></text>
          <text class="qcard-wait">{{ t('est_wait') }}{{ shop?.estWait }}{{ t('minutes') }}</text>
        </view>
        <view class="queue-card instore-card">
          <view class="qcard-header">
            <text class="qcard-dot">●</text>
            <text class="qcard-title">{{ t('instore_queue') }}</text>
          </view>
          <text class="qcard-count">{{ shop?.instoreQueue }}<text class="qcard-unit">{{ t('people') }}</text></text>
          <text class="qcard-wait">{{ t('est_wait') }}{{ Math.ceil((shop?.instoreQueue || 0) * 3) }}{{ t('minutes') }}</text>
        </view>
      </view>

      <!-- Tab切换：产品/评价 -->
      <view class="tab-bar">
        <view :class="['tab-item', { active: activeTab === 'products' }]" @click="activeTab = 'products'">
          {{ t('products') }}
        </view>
        <view :class="['tab-item', { active: activeTab === 'reviews' }]" @click="activeTab = 'reviews'">
          {{ t('reviews_tab') }}
        </view>
        <view class="tab-indicator" :style="{ left: activeTab === 'products' ? '0' : '50%' }"></view>
      </view>

      <!-- 产品列表 -->
      <view v-if="activeTab === 'products'" class="products-section">
        <view 
          v-for="product in products" 
          :key="product.id"
          class="product-item"
        >
          <view class="product-emoji-wrap">
            <text class="product-emoji">{{ product.image }}</text>
          </view>
          <view class="product-info">
            <text class="product-name">{{ lang === 'zh' ? product.name : product.nameEn }}</text>
            <text class="product-desc">{{ product.desc }}</text>
            <view class="product-bottom">
              <view class="price-row">
                <text class="price">¥{{ product.price }}</text>
                <text class="inventory">{{ t('remaining') }}: {{ product.inventory }}</text>
              </view>
              <view class="product-actions">
                <view class="qty-control" v-if="getCartQty(product.id) > 0">
                  <view class="qty-btn minus" @click.stop="updateQty(product, -1)">−</view>
                  <text class="qty-num">{{ getCartQty(product.id) }}</text>
                  <view class="qty-btn plus" @click.stop="updateQty(product, 1)">+</view>
                </view>
                <view v-else class="add-btn" @click.stop="addToCart(product)">
                  <text>+</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 评价列表 -->
      <view v-else class="reviews-section">
        <view v-for="review in mockReviews" :key="review.id" class="review-item">
          <view class="review-header">
            <text class="reviewer-avatar">{{ review.avatar }}</text>
            <view class="reviewer-info">
              <text class="reviewer-name">{{ review.name }}</text>
              <text class="review-date">{{ review.date }}</text>
            </view>
            <text class="review-stars">{{ '⭐'.repeat(review.rating) }}</text>
          </view>
          <text class="review-content">{{ review.content }}</text>
        </view>
      </view>

      <view style="height: 100px;"></view>
    </scroll-view>

    <!-- 底部购物车栏 -->
    <view class="cart-bar" v-if="cartCount > 0">
      <view class="cart-info" @click="goToCheckout">
        <view class="cart-icon-wrap">
          <text class="cart-icon">🛒</text>
          <view class="cart-badge">{{ cartCount }}</view>
        </view>
        <text class="cart-total">¥{{ cartTotal.toFixed(2) }}</text>
      </view>
      <button class="btn btn-primary checkout-btn" @click="goToCheckout">
        {{ t('checkout') }}
      </button>
    </view>

    <!-- 无购物车时的立即购买 -->
    <view class="bottom-action-bar" v-else>
      <button class="btn btn-primary btn-full btn-lg" @click="scrollToProducts">
        {{ t('buy_now') }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { langStore, cartStore, demoData } from '../../stores/app.js'

const lang = ref(langStore.lang)
const activeTab = ref('products')
const shop = ref(null)
const products = ref([])
const shopId = ref('')

const t = (key) => langStore.t(key)

const cartCount = computed(() => cartStore.count)
const cartTotal = computed(() => cartStore.total)

onMounted(() => {
  // 获取路由参数
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  shopId.value = page.$route?.query?.shopId || page.options?.shopId || 'shop001'
  
  // 加载商家数据
  shop.value = demoData.shops.find(s => s.id === shopId.value) || demoData.shops[0]
  products.value = demoData.products[shopId.value] || demoData.products['shop001']
})

const getCartQty = (productId) => {
  const item = cartStore.items.find(i => i.id === productId)
  return item ? item.qty : 0
}

const addToCart = (product) => {
  cartStore.addItem(shopId.value, shop.value?.name, product)
}

const updateQty = (product, delta) => {
  const current = getCartQty(product.id)
  cartStore.updateQty(product.id, current + delta)
}

const goToCheckout = () => {
  uni.navigateTo({ url: '/pages/order/create' })
}

const scrollToProducts = () => {
  activeTab.value = 'products'
}

const goBack = () => {
  uni.navigateBack()
}

const shareShop = () => {
  uni.showToast({ title: lang.value === 'zh' ? '分享功能开发中' : 'Share coming soon', icon: 'none' })
}

const mockReviews = [
  { id: 1, avatar: '😊', name: '张小明', date: '2025-05-30', rating: 5, content: '东坡肉真的太好吃了，入口即化！排队系统很方便，提前下单不用等。' },
  { id: 2, avatar: '🙂', name: 'Alice', date: '2025-05-28', rating: 4, content: 'Great food and the online queue system saved me a lot of time!' },
  { id: 3, avatar: '😋', name: '李华', date: '2025-05-25', rating: 5, content: '西湖醋鱼非常正宗，服务也很好。在线排队功能太实用了！' },
]
</script>

<style scoped>
.shop-detail-page {
  background: var(--bg-page);
}

.shop-navbar {
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
  padding: 4px 8px 4px 0;
  font-weight: 300;
}

.navbar-title {
  flex: 1;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
}

.navbar-share {
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
}

.detail-scroll {
  height: calc(100vh - 54px);
}

/* 头图 */
.hero-section {
  position: relative;
  height: 200px;
}

.hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  padding: 20px 16px 14px;
}

.hero-info {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.shop-logo-wrap {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: rgba(255,255,255,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
}

.hero-name {
  display: block;
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 4px;
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.star { font-size: 13px; }
.rating { font-size: 13px; font-weight: 700; color: #FAAD14; }
.review-count { font-size: 11px; color: rgba(255,255,255,0.8); }
.distance { font-size: 11px; color: rgba(255,255,255,0.8); }

/* 商家信息卡片 */
.shop-info-card {
  margin: 12px 16px;
  padding: 0 14px;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 12px 0;
  gap: 10px;
}

.info-icon { font-size: 16px; }

.info-label {
  font-size: 13px;
  color: var(--text-hint);
  width: 50px;
  flex-shrink: 0;
}

.info-value {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
  text-align: right;
}

/* 排队状态卡片 */
.queue-cards-row {
  display: flex;
  gap: 10px;
  padding: 0 16px 12px;
}

.queue-card {
  flex: 1;
  border-radius: 12px;
  padding: 14px;
}

.online-card {
  background: var(--success-bg);
  border: 1.5px solid var(--success);
}

.instore-card {
  background: var(--info-bg);
  border: 1.5px solid var(--info);
}

.qcard-header {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 8px;
}

.online-card .qcard-dot { color: var(--success); font-size: 10px; }
.instore-card .qcard-dot { color: var(--info); font-size: 10px; }

.qcard-title {
  font-size: 12px;
  font-weight: 600;
}

.online-card .qcard-title { color: var(--success); }
.instore-card .qcard-title { color: var(--info); }

.qcard-count {
  font-size: 28px;
  font-weight: 800;
  display: block;
}

.online-card .qcard-count { color: var(--success); }
.instore-card .qcard-count { color: var(--info); }

.qcard-unit {
  font-size: 13px;
  font-weight: 500;
}

.qcard-wait {
  font-size: 11px;
  color: var(--text-hint);
  display: block;
  margin-top: 4px;
}

/* Tab切换 */
.tab-bar {
  display: flex;
  background: var(--bg-card);
  position: relative;
  border-bottom: 2px solid var(--divider);
  margin: 0 16px;
  border-radius: 10px 10px 0 0;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 14px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-hint);
  cursor: pointer;
  position: relative;
  z-index: 1;
  transition: color 0.2s;
}

.tab-item.active { color: var(--primary); }

.tab-indicator {
  position: absolute;
  bottom: -2px;
  width: 50%;
  height: 2px;
  background: var(--primary);
  transition: left 0.3s;
}

/* 产品列表 */
.products-section {
  background: var(--bg-card);
  margin: 0 16px;
  border-radius: 0 0 12px 12px;
  overflow: hidden;
}

.product-item {
  display: flex;
  gap: 12px;
  padding: 14px;
  border-bottom: 1px solid var(--divider);
}

.product-item:last-child { border-bottom: none; }

.product-emoji-wrap {
  width: 80px;
  height: 80px;
  border-radius: 10px;
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.product-emoji { font-size: 42px; }

.product-info { flex: 1; }

.product-name {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.product-desc {
  display: block;
  font-size: 12px;
  color: var(--text-hint);
  margin-bottom: 8px;
  line-height: 1.4;
}

.product-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.price-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.price {
  font-size: 18px;
  font-weight: 800;
  color: var(--primary);
}

.inventory {
  font-size: 11px;
  color: var(--text-hint);
}

.product-actions { display: flex; align-items: center; }

.add-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  cursor: pointer;
  font-weight: 300;
}

.qty-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.qty-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  font-weight: 500;
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
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  min-width: 20px;
  text-align: center;
}

/* 评价 */
.reviews-section {
  background: var(--bg-card);
  margin: 0 16px;
  border-radius: 0 0 12px 12px;
}

.review-item {
  padding: 14px;
  border-bottom: 1px solid var(--divider);
}

.review-item:last-child { border-bottom: none; }

.review-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.reviewer-avatar { font-size: 28px; }

.reviewer-info { flex: 1; }

.reviewer-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.review-date {
  display: block;
  font-size: 11px;
  color: var(--text-hint);
}

.review-stars { font-size: 12px; }

.review-content {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* 底部购物车栏 */
.cart-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 480px;
  margin: 0 auto;
  background: var(--bg-card);
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 -2px 12px rgba(0,0,0,0.1);
  border-top: 1px solid var(--divider);
}

.cart-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.cart-icon-wrap {
  position: relative;
}

.cart-icon { font-size: 28px; }

.cart-badge {
  position: absolute;
  top: -4px;
  right: -6px;
  background: var(--primary);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-total {
  font-size: 18px;
  font-weight: 800;
  color: var(--primary);
}

.checkout-btn {
  min-width: 120px;
}

.bottom-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 480px;
  margin: 0 auto;
  padding: 10px 16px;
  background: var(--bg-card);
  box-shadow: 0 -2px 12px rgba(0,0,0,0.1);
}
</style>
