<script>
export default {
  onLaunch: function() {
    console.log('App Launch')
    // 初始化主题
    const theme = localStorage.getItem('queuego_theme') || 'light'
    document.documentElement.setAttribute('data-theme', theme)
    
    // 初始化语言
    const lang = localStorage.getItem('queuego_lang') || 'zh'
    document.documentElement.setAttribute('lang', lang)
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  }
}
</script>

<style>
/* 引入全局主题样式 */
@import './styles/theme.css';

/* 隐藏 uni-app 默认的顶部导航栏，我们使用自定义的 */
uni-page-head {
  display: none;
}
</style>
