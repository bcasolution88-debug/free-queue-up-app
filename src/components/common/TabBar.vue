<template>
  <view class="tabbar-placeholder">
    <view class="tabbar" :class="{ 'dark': theme === 'dark' }">
      <view 
        class="tabbar-item" 
        :class="{ active: current === 'home' }"
        @click="switchTab('home', '/pages/index/index')"
      >
        <text class="tab-icon">{{ current === 'home' ? '🏠' : '🏠' }}</text>
        <text class="tab-label">{{ $t('nav_home') }}</text>
      </view>
      
      <view 
        class="tabbar-item" 
        :class="{ active: current === 'orders' }"
        @click="switchTab('orders', '/pages/user/orders')"
      >
        <text class="tab-icon">{{ current === 'orders' ? '📋' : '📋' }}</text>
        <text class="tab-label">{{ $t('nav_orders') }}</text>
      </view>
      
      <view 
        class="tabbar-item" 
        :class="{ active: current === 'queue' }"
        @click="switchTab('queue', '/pages/queue/status')"
      >
        <text class="tab-icon">{{ current === 'queue' ? '🚶' : '🚶' }}</text>
        <text class="tab-label">{{ $t('nav_queue') }}</text>
      </view>
      
      <view 
        class="tabbar-item" 
        :class="{ active: current === 'profile' }"
        @click="switchTab('profile', '/pages/user/profile')"
      >
        <text class="tab-icon">{{ current === 'profile' ? '👤' : '👤' }}</text>
        <text class="tab-label">{{ $t('nav_profile') }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { themeStore } from '../../stores/app.js'

const props = defineProps({
  current: { type: String, default: 'home' }
})

const theme = ref(themeStore.theme)

const switchTab = (tab, path) => {
  if (props.current === tab) return
  uni.reLaunch({ url: path })
}

// 监听语言切换以更新文案
const updateCounter = ref(0)
onMounted(() => {
  uni.$on('lang-changed', () => {
    updateCounter.value++
  })
})
onUnmounted(() => {
  uni.$off('lang-changed')
})
</script>

<style scoped>
.tabbar-placeholder {
  height: 60px;
  width: 100%;
}

.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  height: 60px;
  background: var(--tabbar-bg);
  border-top: 1px solid var(--tabbar-border);
  box-shadow: 0 -2px 8px rgba(0,0,0,0.06);
  padding-bottom: env(safe-area-inset-bottom);
}

@media (min-width: 480px) {
  .tabbar {
    max-width: 480px;
    left: 50%;
    transform: translateX(-50%);
  }
}

.tabbar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  color: var(--tabbar-inactive);
  transition: all 0.2s;
}

.tabbar-item.active {
  color: var(--tabbar-active);
}

.tabbar-item.active .tab-icon {
  transform: scale(1.1);
}

.tab-icon {
  font-size: 22px;
  transition: transform 0.2s;
}

.tab-label {
  font-size: 10px;
  font-weight: 500;
}
</style>
