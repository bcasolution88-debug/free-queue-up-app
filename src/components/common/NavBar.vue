<template>
  <view class="navbar" :class="{ 'dark': theme === 'dark' }">
    <view class="navbar-back" v-if="showBack" @click="goBack">
      <text class="icon-back">←</text>
    </view>
    <view class="navbar-action" v-else-if="showLogo">
      <view class="logo-circle">Q</view>
    </view>
    
    <text class="navbar-title">{{ title }}</text>
    
    <view class="navbar-right">
      <view class="action-btn" v-if="showThemeToggle" @click="toggleTheme">
        <text class="icon">{{ theme === 'light' ? '🌙' : '☀️' }}</text>
      </view>
      <view class="action-btn lang-toggle" v-if="showLangToggle" @click="toggleLang">
        <text :class="{ active: lang === 'zh' }">中</text>
        <text class="separator">/</text>
        <text :class="{ active: lang === 'en' }">EN</text>
      </view>
      <slot name="right"></slot>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { themeStore, langStore } from '../../stores/app.js'

const props = defineProps({
  title: { type: String, default: '' },
  showBack: { type: Boolean, default: false },
  showLogo: { type: Boolean, default: false },
  showThemeToggle: { type: Boolean, default: false },
  showLangToggle: { type: Boolean, default: false },
  customBack: { type: Function, default: null }
})

const theme = ref(themeStore.theme)
const lang = ref(langStore.lang)

const toggleTheme = () => {
  themeStore.toggle()
  theme.value = themeStore.theme
}

const toggleLang = () => {
  langStore.toggle()
  lang.value = langStore.lang
  // 触发页面强制更新以应用新语言
  uni.$emit('lang-changed')
}

const goBack = () => {
  if (props.customBack) {
    props.customBack()
  } else {
    uni.navigateBack({ delta: 1 })
  }
}

// 监听全局事件
const handleLangChange = (e) => {
  lang.value = e.detail
}

onMounted(() => {
  window.addEventListener('lang-change', handleLangChange)
})

onUnmounted(() => {
  window.removeEventListener('lang-change', handleLangChange)
})
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  height: 54px;
  padding: 0 16px;
  background: var(--navbar-bg);
  box-shadow: var(--shadow-sm);
}

.navbar-back {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;
}

.icon-back {
  font-size: 24px;
  color: var(--text-primary);
  font-weight: 300;
}

.logo-circle {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
}

.navbar-title {
  flex: 1;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 10px;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 36px;
  justify-content: flex-end;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.lang-toggle {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-hint);
  background: var(--bg-input);
  padding: 4px 8px;
  border-radius: 12px;
}

.lang-toggle .active {
  color: var(--primary);
}

.lang-toggle .separator {
  margin: 0 4px;
  font-weight: 400;
}
</style>
