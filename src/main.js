import { createSSRApp } from 'vue'
import App from './App.vue'
import zh from './locale/zh.js'
import en from './locale/en.js'

export function createApp() {
  const app = createSSRApp(App)
  
  // 简易多语言实现挂载到全局
  window.__i18n_messages__ = { zh, en }
  
  app.config.globalProperties.$t = function(key) {
    const lang = localStorage.getItem('queuego_lang') || 'zh'
    const messages = window.__i18n_messages__[lang] || window.__i18n_messages__['zh']
    return messages[key] || key
  }

  return {
    app
  }
}
