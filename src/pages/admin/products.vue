<template>
  <view class="page-container admin-page">
    <view class="admin-navbar gradient-dark">
      <view class="admin-brand">
        <text class="brand-icon">👑</text>
        <view>
          <text class="brand-title">{{ lang === 'zh' ? '产品管理' : 'Product Management' }}</text>
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

    <!-- 商家筛选 -->
    <view class="shop-filter-bar">
      <scroll-view scroll-x class="shop-filter-scroll">
        <view 
          v-for="shop in shopOptions" 
          :key="shop.id"
          :class="['shop-filter-chip', { active: selectedShop === shop.id }]"
          @click="selectedShop = shop.id"
        >
          <text class="chip-emoji">{{ shop.emoji }}</text>
          <text>{{ lang === 'zh' ? shop.name : shop.nameEn }}</text>
        </view>
      </scroll-view>
      <button class="add-product-btn" @click="showAddProduct">
        + {{ lang === 'zh' ? '添加产品' : 'Add' }}
      </button>
    </view>

    <!-- 产品列表 -->
    <scroll-view scroll-y class="products-scroll">
      <view v-for="product in filteredProducts" :key="product.id" class="product-admin-card card">
        <view class="product-main">
          <text class="product-emoji">{{ product.emoji }}</text>
          <view class="product-info">
            <text class="product-name">{{ lang === 'zh' ? product.name : product.nameEn }}</text>
            <text class="product-shop">{{ lang === 'zh' ? product.shopName : product.shopNameEn }}</text>
            <text class="product-desc">{{ lang === 'zh' ? product.desc : product.descEn }}</text>
          </view>
          <view class="product-right">
            <text class="product-price">¥{{ product.price }}</text>
            <view :class="['product-status', product.available ? 'on' : 'off']">
              {{ product.available ? (lang === 'zh' ? '上架' : 'On') : (lang === 'zh' ? '下架' : 'Off') }}
            </view>
          </view>
        </view>

        <view class="product-stats-row">
          <view class="pstat">
            <text class="pstat-v">{{ product.todaySold }}</text>
            <text class="pstat-l">{{ lang === 'zh' ? '今日售出' : 'Today Sold' }}</text>
          </view>
          <view class="pstat">
            <text class="pstat-v">{{ product.stock }}</text>
            <text class="pstat-l">{{ lang === 'zh' ? '剩余库存' : 'Stock' }}</text>
          </view>
          <view class="pstat">
            <text class="pstat-v">{{ product.totalSold }}</text>
            <text class="pstat-l">{{ lang === 'zh' ? '累计售出' : 'Total Sold' }}</text>
          </view>
        </view>

        <view class="product-actions">
          <button class="prod-action-btn edit" @click="editProduct(product)">
            {{ lang === 'zh' ? '编辑' : 'Edit' }}
          </button>
          <button 
            :class="['prod-action-btn', product.available ? 'takeoff' : 'puton']"
            @click="toggleProduct(product)"
          >
            {{ product.available ? (lang === 'zh' ? '下架' : 'Take Off') : (lang === 'zh' ? '上架' : 'Put On') }}
          </button>
          <button class="prod-action-btn delete" @click="deleteProduct(product)">
            {{ lang === 'zh' ? '删除' : 'Delete' }}
          </button>
        </view>
      </view>

      <view style="height: 20px;"></view>
    </scroll-view>

    <!-- 添加产品弹窗 -->
    <view v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <view class="modal-card">
        <text class="modal-title">{{ lang === 'zh' ? '添加产品' : 'Add Product' }}</text>
        <view class="form-group">
          <text class="form-label">{{ lang === 'zh' ? '产品名称' : 'Product Name' }}</text>
          <input v-model="newProduct.name" :placeholder="lang === 'zh' ? '请输入产品名称' : 'Enter product name'" class="form-input" />
        </view>
        <view class="form-group">
          <text class="form-label">{{ lang === 'zh' ? '价格' : 'Price' }}</text>
          <input v-model="newProduct.price" type="number" placeholder="0.00" class="form-input" />
        </view>
        <view class="form-group">
          <text class="form-label">{{ lang === 'zh' ? '库存数量' : 'Stock' }}</text>
          <input v-model="newProduct.stock" type="number" placeholder="100" class="form-input" />
        </view>
        <view class="modal-actions">
          <button class="modal-btn cancel" @click="showAddModal = false">{{ lang === 'zh' ? '取消' : 'Cancel' }}</button>
          <button class="modal-btn confirm" @click="confirmAddProduct">{{ lang === 'zh' ? '确认添加' : 'Confirm' }}</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { langStore } from '../../stores/app.js'

const lang = ref(langStore.lang)
const activeTab = ref('products')
const selectedShop = ref('all')
const showAddModal = ref(false)
const newProduct = ref({ name: '', price: '', stock: '' })

const t = (key) => langStore.t(key)

const adminTabs = [
  { key: 'shops', label: '商家管理', labelEn: 'Shops', icon: '🏪' },
  { key: 'products', label: '产品管理', labelEn: 'Products', icon: '🛒' },
  { key: 'statistics', label: '数据统计', labelEn: 'Statistics', icon: '📊' },
]

const shopOptions = ref([
  { id: 'all', emoji: '🏪', name: '全部商家', nameEn: 'All Shops' },
  { id: 's001', emoji: '🍜', name: '外婆家', nameEn: 'Waipojia' },
  { id: 's002', emoji: '🍣', name: '鮨さいとう', nameEn: 'Saito Sushi' },
  { id: 's003', emoji: '☕', name: '星巴克', nameEn: 'Starbucks' },
])

const products = ref([
  { id: 'p001', emoji: '🥩', name: '东坡肉', nameEn: 'Dongpo Pork', shopId: 's001', shopName: '外婆家', shopNameEn: 'Waipojia', desc: '经典杭帮菜，软糯鲜香', descEn: 'Classic Hangzhou braised pork', price: 38, available: true, todaySold: 24, stock: 30, totalSold: 1240 },
  { id: 'p002', emoji: '🦐', name: '龙井虾仁', nameEn: 'Longjing Shrimp', shopId: 's001', shopName: '外婆家', shopNameEn: 'Waipojia', desc: '龙井茶香配鲜虾', descEn: 'Shrimp with Longjing tea', price: 68, available: true, todaySold: 18, stock: 20, totalSold: 860 },
  { id: 'p003', emoji: '🍣', name: '大吟酿握寿司', nameEn: 'Daiginjo Nigiri', shopId: 's002', shopName: '鮨さいとう', shopNameEn: 'Saito Sushi', desc: '顶级大吟酿搭配新鲜鱼生', descEn: 'Premium sake paired with fresh sashimi', price: 128, available: true, todaySold: 12, stock: 15, totalSold: 520 },
  { id: 'p004', emoji: '☕', name: '馥芮白', nameEn: 'Flat White', shopId: 's003', shopName: '星巴克', shopNameEn: 'Starbucks', desc: '浓缩咖啡配丝滑奶泡', descEn: 'Espresso with silky microfoam', price: 38, available: false, todaySold: 0, stock: 0, totalSold: 3200 },
  { id: 'p005', emoji: '🍲', name: '宋嫂鱼羹', nameEn: 'Song Sister Fish Soup', shopId: 's001', shopName: '外婆家', shopNameEn: 'Waipojia', desc: '传统杭帮名菜', descEn: 'Traditional Hangzhou fish soup', price: 28, available: true, todaySold: 30, stock: 50, totalSold: 2100 },
])

const filteredProducts = computed(() => {
  if (selectedShop.value === 'all') return products.value
  return products.value.filter(p => p.shopId === selectedShop.value)
})

const toggleProduct = (product) => {
  product.available = !product.available
  uni.showToast({ title: product.available ? (lang.value === 'zh' ? '已上架' : 'Listed') : (lang.value === 'zh' ? '已下架' : 'Unlisted'), icon: 'success' })
}

const editProduct = (product) => {
  uni.showToast({ title: `${lang.value === 'zh' ? '编辑' : 'Edit'}: ${product.name}`, icon: 'none' })
}

const deleteProduct = (product) => {
  uni.showModal({
    title: lang.value === 'zh' ? '删除产品' : 'Delete Product',
    content: lang.value === 'zh' ? `确定删除 ${product.name}？` : `Delete ${product.nameEn}?`,
    success: (res) => {
      if (res.confirm) {
        const idx = products.value.findIndex(p => p.id === product.id)
        if (idx >= 0) products.value.splice(idx, 1)
        uni.showToast({ title: lang.value === 'zh' ? '已删除' : 'Deleted', icon: 'success' })
      }
    }
  })
}

const showAddProduct = () => { showAddModal.value = true }

const confirmAddProduct = () => {
  if (!newProduct.value.name) {
    uni.showToast({ title: lang.value === 'zh' ? '请输入产品名称' : 'Enter product name', icon: 'none' })
    return
  }
  products.value.push({
    id: 'p' + Date.now(),
    emoji: '🍽️',
    name: newProduct.value.name,
    nameEn: newProduct.value.name,
    shopId: selectedShop.value === 'all' ? 's001' : selectedShop.value,
    shopName: '外婆家',
    shopNameEn: 'Waipojia',
    desc: '',
    descEn: '',
    price: parseFloat(newProduct.value.price) || 0,
    available: true,
    todaySold: 0,
    stock: parseInt(newProduct.value.stock) || 100,
    totalSold: 0
  })
  showAddModal.value = false
  newProduct.value = { name: '', price: '', stock: '' }
  uni.showToast({ title: lang.value === 'zh' ? '产品已添加' : 'Product added', icon: 'success' })
}

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

/* 商家筛选 */
.shop-filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--divider);
}

.shop-filter-scroll { flex: 1; display: flex; gap: 8px; overflow-x: auto; -ms-overflow-style: none; scrollbar-width: none; }
.shop-filter-scroll::-webkit-scrollbar { display: none; }

.shop-filter-chip {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  background: var(--bg-input);
  color: var(--text-secondary);
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.shop-filter-chip.active { background: var(--primary-bg); color: var(--primary); border-color: var(--primary); }
.chip-emoji { font-size: 14px; }

.add-product-btn {
  flex-shrink: 0;
  height: 36px;
  padding: 0 14px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.products-scroll { height: calc(100vh - 64px - 52px - 58px); }

/* 产品卡片 */
.product-admin-card { margin: 10px 16px 0; padding: 0; overflow: hidden; }

.product-main {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 14px 10px;
  border-bottom: 1px solid var(--divider);
}

.product-emoji { font-size: 36px; flex-shrink: 0; }
.product-info { flex: 1; }
.product-name { display: block; font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
.product-shop { display: block; font-size: 11px; color: var(--text-hint); margin-bottom: 3px; }
.product-desc { display: block; font-size: 12px; color: var(--text-secondary); }
.product-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.product-price { font-size: 18px; font-weight: 800; color: var(--primary); }
.product-status { padding: 3px 8px; border-radius: 8px; font-size: 11px; font-weight: 600; }
.product-status.on { background: var(--success-bg); color: var(--success); }
.product-status.off { background: var(--error-bg); color: var(--error); }

.product-stats-row {
  display: flex;
  padding: 8px 14px;
  border-bottom: 1px solid var(--divider);
}

.pstat { flex: 1; text-align: center; }
.pstat-v { display: block; font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
.pstat-l { display: block; font-size: 10px; color: var(--text-hint); }

.product-actions { display: flex; gap: 8px; padding: 10px 14px 14px; }
.prod-action-btn { flex: 1; height: 32px; border-radius: 8px; font-size: 11px; font-weight: 700; border: none; cursor: pointer; }
.prod-action-btn.edit { background: var(--info-bg); color: var(--info); }
.prod-action-btn.takeoff { background: var(--warning-bg); color: var(--warning); }
.prod-action-btn.puton { background: var(--success-bg); color: var(--success); }
.prod-action-btn.delete { background: var(--error-bg); color: var(--error); }

/* 弹窗 */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: flex-end; justify-content: center; z-index: 1000; }
.modal-card { width: 100%; max-width: 480px; background: var(--bg-card); border-radius: 20px 20px 0 0; padding: 24px 20px; }
.modal-title { display: block; font-size: 18px; font-weight: 800; color: var(--text-primary); margin-bottom: 20px; }
.form-group { margin-bottom: 14px; }
.form-label { display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }
.form-input { width: 100%; height: 42px; background: var(--bg-input); border: 1.5px solid var(--border-input); border-radius: 10px; padding: 0 12px; font-size: 14px; color: var(--text-primary); outline: none; }
.modal-actions { display: flex; gap: 10px; margin-top: 20px; }
.modal-btn { flex: 1; height: 46px; border-radius: 12px; font-size: 15px; font-weight: 700; border: none; cursor: pointer; }
.modal-btn.cancel { background: var(--bg-input); color: var(--text-secondary); }
.modal-btn.confirm { background: var(--primary); color: #fff; }
</style>
