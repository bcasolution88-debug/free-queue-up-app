<template>
  <view class="login-page">
    <!-- 背景装饰 -->
    <view class="bg-decoration">
      <view class="circle circle-1"></view>
      <view class="circle circle-2"></view>
    </view>

    <!-- 顶部语言切换 -->
    <view class="lang-bar">
      <view class="lang-toggle" @click="toggleLang">
        <text :class="{ active: lang === 'zh' }">中文</text>
        <text class="sep">/</text>
        <text :class="{ active: lang === 'en' }">English</text>
      </view>
    </view>

    <!-- Logo区域 -->
    <view class="logo-section">
      <view class="logo-circle">Q</view>
      <text class="app-name">QueueGo 排队GO</text>
      <text class="app-slogan">{{ lang === 'zh' ? '跳过排队，享受生活' : 'Skip the Line, Enjoy Life' }}</text>
    </view>

    <!-- 登录/注册表单 -->
    <view class="form-card">
      <!-- Tab切换 -->
      <view class="tab-switch">
        <view :class="['tab-item', { active: activeTab === 'login' }]" @click="activeTab = 'login'">
          {{ t('login') }}
        </view>
        <view :class="['tab-item', { active: activeTab === 'register' }]" @click="activeTab = 'register'">
          {{ t('register') }}
        </view>
        <view class="tab-indicator" :style="{ left: activeTab === 'login' ? '0' : '50%' }"></view>
      </view>

      <!-- 登录表单 -->
      <view v-if="activeTab === 'login'" class="form-body animate-fade-in">
        <view class="form-group">
          <view class="input-wrapper">
            <text class="input-icon">📱</text>
            <input 
              v-model="loginForm.phone"
              type="tel"
              :placeholder="t('phone_placeholder')"
              class="form-input"
              maxlength="11"
            />
          </view>
        </view>
        
        <view class="form-group">
          <view class="input-wrapper">
            <text class="input-icon">🔒</text>
            <input 
              v-model="loginForm.password"
              :type="showPwd ? 'text' : 'password'"
              :placeholder="t('password_placeholder')"
              class="form-input"
            />
            <text class="pwd-toggle" @click="showPwd = !showPwd">{{ showPwd ? '🙈' : '👁️' }}</text>
          </view>
        </view>

        <view class="forgot-row">
          <text class="forgot-link">{{ t('forgot_password') }}</text>
        </view>

        <button class="btn btn-primary btn-full btn-lg login-btn" @click="handleLogin" :disabled="loading">
          {{ loading ? t('loading') : t('login') }}
        </button>

        <view class="divider-row">
          <view class="divider-line"></view>
          <text class="divider-text">{{ lang === 'zh' ? '或' : 'Or' }}</text>
          <view class="divider-line"></view>
        </view>

        <view class="social-btns">
          <button class="social-btn wechat" @click="mockLogin('user')">
            <text class="social-icon">💬</text>
            <text>{{ t('wechat_login') }}</text>
          </button>
          <button class="social-btn apple" @click="mockLogin('user')">
            <text class="social-icon">🍎</text>
            <text>{{ t('apple_login') }}</text>
          </button>
        </view>

        <!-- 演示用快速登录 -->
        <view class="demo-section">
          <text class="demo-title">{{ lang === 'zh' ? '演示快速登录' : 'Demo Quick Login' }}</text>
          <view class="demo-btns">
            <button class="demo-btn" @click="mockLogin('user')">👤 {{ lang === 'zh' ? '用户端' : 'User' }}</button>
            <button class="demo-btn" @click="mockLogin('shop')">🏪 {{ lang === 'zh' ? '商家端' : 'Merchant' }}</button>
            <button class="demo-btn" @click="mockLogin('admin')">👑 {{ lang === 'zh' ? '管理员' : 'Admin' }}</button>
          </view>
        </view>
      </view>

      <!-- 注册表单 -->
      <view v-else class="form-body animate-fade-in">
        <view class="form-group">
          <view class="input-wrapper">
            <text class="input-icon">👤</text>
            <input 
              v-model="registerForm.nickname"
              type="text"
              :placeholder="t('nickname_placeholder')"
              class="form-input"
            />
          </view>
        </view>

        <view class="form-group">
          <view class="input-wrapper">
            <text class="input-icon">📱</text>
            <input 
              v-model="registerForm.phone"
              type="tel"
              :placeholder="t('phone_placeholder')"
              class="form-input"
              maxlength="11"
            />
          </view>
        </view>

        <view class="form-group">
          <view class="input-wrapper">
            <text class="input-icon">🔑</text>
            <input 
              v-model="registerForm.code"
              type="number"
              :placeholder="t('verify_code')"
              class="form-input"
              maxlength="6"
            />
            <text class="code-btn" @click="sendCode">
              {{ countdown > 0 ? countdown + 's' : t('send_code') }}
            </text>
          </view>
        </view>

        <view class="form-group">
          <view class="input-wrapper">
            <text class="input-icon">🔒</text>
            <input 
              v-model="registerForm.password"
              :type="showPwd ? 'text' : 'password'"
              :placeholder="t('password_placeholder')"
              class="form-input"
            />
            <text class="pwd-toggle" @click="showPwd = !showPwd">{{ showPwd ? '🙈' : '👁️' }}</text>
          </view>
        </view>

        <button class="btn btn-primary btn-full btn-lg login-btn" @click="handleRegister" :disabled="loading">
          {{ loading ? t('loading') : t('register') }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { langStore, userStore } from '../../stores/app.js'

const lang = ref(langStore.lang)
const activeTab = ref('login')
const showPwd = ref(false)
const loading = ref(false)
const countdown = ref(0)

const loginForm = ref({ phone: '', password: '' })
const registerForm = ref({ nickname: '', phone: '', code: '', password: '' })

const t = (key) => langStore.t(key)

const toggleLang = () => {
  langStore.toggle()
  lang.value = langStore.lang
}

const handleLogin = async () => {
  if (!loginForm.value.phone || !loginForm.value.password) {
    uni.showToast({ title: lang.value === 'zh' ? '请填写手机号和密码' : 'Please fill in phone and password', icon: 'none' })
    return
  }
  loading.value = true
  await new Promise(r => setTimeout(r, 1000))
  userStore.mockLogin('user')
  loading.value = false
  uni.showToast({ title: t('login_success'), icon: 'success' })
  setTimeout(() => uni.reLaunch({ url: '/pages/index/index' }), 1200)
}

const handleRegister = async () => {
  if (!registerForm.value.phone || !registerForm.value.password) {
    uni.showToast({ title: lang.value === 'zh' ? '请填写完整信息' : 'Please fill in all fields', icon: 'none' })
    return
  }
  loading.value = true
  await new Promise(r => setTimeout(r, 1000))
  userStore.mockLogin('user')
  loading.value = false
  uni.showToast({ title: t('register_success'), icon: 'success' })
  setTimeout(() => uni.reLaunch({ url: '/pages/index/index' }), 1200)
}

const mockLogin = (role) => {
  userStore.mockLogin(role)
  uni.showToast({ title: t('login_success'), icon: 'success' })
  setTimeout(() => {
    if (role === 'shop') {
      uni.reLaunch({ url: '/pages/shop-admin/orders' })
    } else if (role === 'admin') {
      uni.reLaunch({ url: '/pages/admin/shops' })
    } else {
      uni.reLaunch({ url: '/pages/index/index' })
    }
  }, 1000)
}

const sendCode = () => {
  if (countdown.value > 0) return
  if (!registerForm.value.phone) {
    uni.showToast({ title: lang.value === 'zh' ? '请先输入手机号' : 'Enter phone first', icon: 'none' })
    return
  }
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) clearInterval(timer)
  }, 1000)
  uni.showToast({ title: lang.value === 'zh' ? '验证码已发送' : 'Code sent', icon: 'success' })
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: var(--bg-page);
  position: relative;
  overflow: hidden;
  padding: 0 20px 40px;
}

.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 280px;
  background: linear-gradient(160deg, #FF4D4F 0%, #FF7875 100%);
  z-index: 0;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
}
.circle-1 { width: 200px; height: 200px; top: -60px; right: -60px; }
.circle-2 { width: 140px; height: 140px; top: 100px; left: -40px; }

.lang-bar {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: flex-end;
  padding: 16px 0;
}

.lang-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255,255,255,0.2);
  padding: 6px 12px;
  border-radius: 20px;
  cursor: pointer;
}

.lang-toggle text {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
  font-weight: 500;
}

.lang-toggle .active {
  color: #fff;
  font-weight: 700;
}

.lang-toggle .sep {
  color: rgba(255,255,255,0.5);
}

.logo-section {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0 36px;
}

.logo-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255,255,255,0.25);
  border: 3px solid rgba(255,255,255,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.app-name {
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 6px;
}

.app-slogan {
  font-size: 13px;
  color: rgba(255,255,255,0.85);
}

.form-card {
  position: relative;
  z-index: 10;
  background: var(--bg-card);
  border-radius: 20px;
  padding: 0 20px 24px;
  box-shadow: var(--shadow-lg);
}

.tab-switch {
  display: flex;
  position: relative;
  border-bottom: 1px solid var(--divider);
  margin-bottom: 20px;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 16px 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-hint);
  cursor: pointer;
  transition: color 0.2s;
  position: relative;
  z-index: 1;
}

.tab-item.active {
  color: var(--primary);
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  width: 50%;
  height: 2px;
  background: var(--primary);
  border-radius: 2px;
  transition: left 0.3s ease;
}

.form-body { padding: 0; }

.form-group { margin-bottom: 14px; }

.input-wrapper {
  display: flex;
  align-items: center;
  background: var(--bg-input);
  border: 1.5px solid var(--border-input);
  border-radius: 10px;
  padding: 0 14px;
  height: 50px;
  gap: 10px;
  transition: border-color 0.2s;
}

.input-wrapper:focus-within {
  border-color: var(--primary);
}

.input-icon { font-size: 18px; }

.form-input {
  flex: 1;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-size: 15px;
  color: var(--text-primary);
}

.form-input::placeholder { color: var(--text-hint); }

.pwd-toggle {
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
}

.code-btn {
  font-size: 12px;
  font-weight: 600;
  color: var(--primary);
  white-space: nowrap;
  cursor: pointer;
  padding: 4px 8px;
  border-left: 1px solid var(--border-input);
}

.forgot-row {
  text-align: right;
  margin-bottom: 16px;
}

.forgot-link {
  font-size: 12px;
  color: var(--primary);
  cursor: pointer;
}

.login-btn {
  margin-bottom: 16px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
}

.divider-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: var(--divider);
}

.divider-text {
  font-size: 12px;
  color: var(--text-hint);
}

.social-btns {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.social-btn {
  flex: 1;
  height: 46px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  border: 1.5px solid var(--border-input);
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
}

.social-icon { font-size: 20px; }

.demo-section {
  border-top: 1px solid var(--divider);
  padding-top: 16px;
}

.demo-title {
  display: block;
  font-size: 11px;
  color: var(--text-hint);
  text-align: center;
  margin-bottom: 10px;
}

.demo-btns {
  display: flex;
  gap: 8px;
}

.demo-btn {
  flex: 1;
  height: 36px;
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-secondary);
  border: 1px solid var(--border-input);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.demo-btn:active {
  background: var(--primary-bg);
  color: var(--primary);
  border-color: var(--primary);
}
</style>
