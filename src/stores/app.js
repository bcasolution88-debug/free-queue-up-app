// QueueGo 全局状态管理
const STORAGE_KEYS = {
  THEME: 'queuego_theme',
  LANG: 'queuego_lang',
  USER: 'queuego_user',
  CART: 'queuego_cart',
  ORDERS: 'queuego_orders',
  QUEUES: 'queuego_queues',
}

// ===== 主题管理 =====
export const themeStore = {
  _theme: localStorage.getItem(STORAGE_KEYS.THEME) || 'light',

  get theme() { return this._theme },

  setTheme(theme) {
    this._theme = theme
    localStorage.setItem(STORAGE_KEYS.THEME, theme)
    document.documentElement.setAttribute('data-theme', theme)
  },

  toggle() {
    this.setTheme(this._theme === 'light' ? 'dark' : 'light')
  },

  init() {
    document.documentElement.setAttribute('data-theme', this._theme)
  }
}

// ===== 语言管理 =====
export const langStore = {
  _lang: localStorage.getItem(STORAGE_KEYS.LANG) || 'zh',

  get lang() { return this._lang },

  setLang(lang) {
    this._lang = lang
    localStorage.setItem(STORAGE_KEYS.LANG, lang)
    document.documentElement.setAttribute('lang', lang)
    window.dispatchEvent(new CustomEvent('lang-change', { detail: lang }))
  },

  toggle() {
    this.setLang(this._lang === 'zh' ? 'en' : 'zh')
  },

  t(key) {
    const messages = window.__i18n_messages__
    if (!messages) return key
    const msg = messages[this._lang] || messages['zh']
    return msg[key] || key
  }
}

// ===== 用户状态 =====
export const userStore = {
  _user: null,

  get user() {
    if (!this._user) {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.USER)
        if (saved) this._user = JSON.parse(saved)
      } catch(e) {}
    }
    return this._user
  },

  get isLoggedIn() { return !!this.user },

  setUser(user) {
    this._user = user
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
  },

  clearUser() {
    this._user = null
    localStorage.removeItem(STORAGE_KEYS.USER)
  },

  // 演示用：模拟登录
  mockLogin(role = 'user') {
    const users = {
      user: { id: 'u001', nickname: '张小明', phone: '138****8888', avatar: '👤', role: 'user', orders: 28, completed: 25, refunds: 1 },
      shop: { id: 's001', nickname: '外婆家商家', phone: '139****9999', avatar: '🏪', role: 'shop_admin', shopId: 'shop001', shopName: '外婆家' },
      admin: { id: 'a001', nickname: '平台管理员', phone: '137****7777', avatar: '👑', role: 'super_admin' },
    }
    this.setUser(users[role] || users.user)
    return users[role]
  }
}

// ===== 购物车 =====
export const cartStore = {
  _items: [],
  _shopId: null,
  _shopName: '',

  get items() {
    if (!this._items.length) {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.CART)
        if (saved) {
          const data = JSON.parse(saved)
          this._items = data.items || []
          this._shopId = data.shopId
          this._shopName = data.shopName
        }
      } catch(e) {}
    }
    return this._items
  },

  get shopId() { return this._shopId },
  get shopName() { return this._shopName },

  get total() {
    return this._items.reduce((sum, item) => sum + item.price * item.qty, 0)
  },

  get count() {
    return this._items.reduce((sum, item) => sum + item.qty, 0)
  },

  addItem(shopId, shopName, product) {
    // 不同商家清空购物车
    if (this._shopId && this._shopId !== shopId) {
      if (!confirm('购物车中有其他商家的商品，是否清空？')) return false
      this.clear()
    }
    this._shopId = shopId
    this._shopName = shopName

    const existing = this._items.find(i => i.id === product.id)
    if (existing) {
      existing.qty++
    } else {
      this._items.push({ ...product, qty: 1 })
    }
    this._save()
    return true
  },

  updateQty(productId, qty) {
    const item = this._items.find(i => i.id === productId)
    if (item) {
      if (qty <= 0) {
        this._items = this._items.filter(i => i.id !== productId)
      } else {
        item.qty = qty
      }
      this._save()
    }
  },

  clear() {
    this._items = []
    this._shopId = null
    this._shopName = ''
    localStorage.removeItem(STORAGE_KEYS.CART)
  },

  _save() {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify({
      items: this._items,
      shopId: this._shopId,
      shopName: this._shopName
    }))
  }
}

// ===== 订单管理 =====
export const orderStore = {
  _orders: null,

  get orders() {
    if (!this._orders) {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.ORDERS)
        this._orders = saved ? JSON.parse(saved) : []
      } catch(e) { this._orders = [] }
    }
    return this._orders
  },

  addOrder(order) {
    this.orders.unshift(order)
    this._save()
  },

  updateOrder(id, updates) {
    const order = this.orders.find(o => o.id === id)
    if (order) {
      Object.assign(order, updates)
      this._save()
    }
  },

  getOrder(id) {
    return this.orders.find(o => o.id === id)
  },

  _save() {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this._orders))
  },

  // 生成演示订单
  generateDemoOrders() {
    if (this.orders.length > 0) return
    const demo = [
      {
        id: 'ORD20250601001', shopId: 'shop001', shopName: '外婆家',
        items: [{ name: '东坡肉', qty: 1, price: 38 }, { name: '西湖醋鱼', qty: 1, price: 48 }],
        totalAmount: 86, status: 'ready', queueNo: 'A098', queueType: 'online',
        pickupTime: '2025-06-01 14:00', createdAt: '2025-06-01T10:30:00Z'
      },
      {
        id: 'ORD20250531002', shopId: 'shop002', shopName: '喜茶',
        items: [{ name: '多肉葡萄', qty: 2, price: 22 }],
        totalAmount: 44, status: 'completed', queueNo: 'B023', queueType: 'online',
        pickupTime: '2025-05-31 16:00', createdAt: '2025-05-31T14:00:00Z'
      },
      {
        id: 'ORD20250530003', shopId: 'shop001', shopName: '外婆家',
        items: [{ name: '龙井虾仁', qty: 1, price: 68 }],
        totalAmount: 68, status: 'refunded', queueNo: 'A045', queueType: 'instore',
        pickupTime: '2025-05-30 12:00', createdAt: '2025-05-30T10:00:00Z'
      }
    ]
    this._orders = demo
    this._save()
  }
}

// ===== 队列状态 =====
export const queueStore = {
  _queues: {},

  getQueue(shopId) {
    return this._queues[shopId] || this._generateMockQueue(shopId)
  },

  updateQueue(shopId, data) {
    this._queues[shopId] = { ...this._queues[shopId], ...data }
  },

  _generateMockQueue(shopId) {
    const base = {
      shopId,
      onlineCount: Math.floor(Math.random() * 20) + 5,
      instoreCount: Math.floor(Math.random() * 10) + 2,
      currentCallingNo: 'A0' + (Math.floor(Math.random() * 50) + 40),
      estimatedPerPerson: 3,
      onlineList: [],
      instoreList: [],
    }
    // 生成队列列表
    for (let i = 1; i <= 8; i++) {
      base.onlineList.push({
        no: 'A0' + (parseInt(base.currentCallingNo.slice(2)) + i),
        status: i === 1 ? 'called' : 'waiting',
        time: new Date(Date.now() - i * 180000).toISOString()
      })
    }
    for (let i = 1; i <= 4; i++) {
      base.instoreList.push({
        no: 'B0' + (10 + i),
        status: 'waiting',
        time: new Date(Date.now() - i * 120000).toISOString()
      })
    }
    this._queues[shopId] = base
    return base
  }
}

// ===== 演示数据 =====
export const demoData = {
  shops: [
    {
      id: 'shop001', name: '外婆家', nameEn: 'Waipojia Restaurant',
      logo: '🍜', category: 'restaurant', rating: 4.8, reviewCount: 1286,
      distance: 0.3, address: '杭州市西湖区文三路123号', addressEn: '123 Wensan Rd, Xihu, Hangzhou',
      phone: '0571-88888888', hours: '10:00-22:00', status: 'open',
      tags: ['杭帮菜', '家常菜', '人气'],
      banner: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
      onlineQueue: 12, instoreQueue: 5, estWait: 15
    },
    {
      id: 'shop002', name: '喜茶', nameEn: 'HEYTEA',
      logo: '🧋', category: 'tea', rating: 4.7, reviewCount: 2341,
      distance: 0.5, address: '杭州市西湖区延安路456号', addressEn: '456 Yanan Rd, Xihu, Hangzhou',
      phone: '0571-77777777', hours: '09:00-22:00', status: 'open',
      tags: ['奶茶', '水果茶', '芝士'],
      banner: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
      onlineQueue: 8, instoreQueue: 3, estWait: 10
    },
    {
      id: 'shop003', name: '星巴克', nameEn: 'Starbucks',
      logo: '☕', category: 'coffee', rating: 4.6, reviewCount: 986,
      distance: 0.8, address: '杭州市西湖区庆春路789号', addressEn: '789 Qingchun Rd, Xihu, Hangzhou',
      phone: '0571-66666666', hours: '07:00-22:00', status: 'open',
      tags: ['咖啡', '轻食', '甜品'],
      banner: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=800&q=80',
      onlineQueue: 3, instoreQueue: 1, estWait: 5
    },
    {
      id: 'shop004', name: '好利来', nameEn: 'Holiland',
      logo: '🎂', category: 'bakery', rating: 4.5, reviewCount: 654,
      distance: 1.2, address: '杭州市西湖区学院路321号', addressEn: '321 Xueyuan Rd, Xihu, Hangzhou',
      phone: '0571-55555555', hours: '08:00-21:00', status: 'open',
      tags: ['蛋糕', '面包', '甜品'],
      banner: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80',
      onlineQueue: 6, instoreQueue: 2, estWait: 8
    },
    {
      id: 'shop005', name: '奈雪的茶', nameEn: "Nayuki's Tea",
      logo: '🍵', category: 'tea', rating: 4.7, reviewCount: 1543,
      distance: 0.6, address: '杭州市西湖区天目山路567号', addressEn: '567 Tianmushan Rd, Xihu, Hangzhou',
      phone: '0571-44444444', hours: '09:00-22:00', status: 'closed',
      tags: ['奶茶', '欧包', '芝士'],
      banner: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80',
      onlineQueue: 0, instoreQueue: 0, estWait: 0
    },
  ],

  products: {
    shop001: [
      { id: 'p001', name: '东坡肉', nameEn: 'Dongpo Pork', price: 38, image: '🥩', desc: '肥而不腻，入口即化', inventory: 50, category: '招牌菜' },
      { id: 'p002', name: '西湖醋鱼', nameEn: 'West Lake Fish', price: 48, image: '🐟', desc: '鲜嫩可口，酸甜适中', inventory: 30, category: '招牌菜' },
      { id: 'p003', name: '龙井虾仁', nameEn: 'Longjing Shrimp', price: 68, image: '🦐', desc: '清香鲜嫩，茶香四溢', inventory: 20, category: '特色菜' },
      { id: 'p004', name: '宋嫂鱼羹', nameEn: 'Song Sister Fish Soup', price: 28, image: '🍲', desc: '浓郁鲜美，暖胃暖心', inventory: 40, category: '汤品' },
      { id: 'p005', name: '叫花鸡', nameEn: 'Beggar\'s Chicken', price: 88, image: '🍗', desc: '外酥里嫩，香气扑鼻', inventory: 15, category: '特色菜' },
    ],
    shop002: [
      { id: 'p101', name: '多肉葡萄', nameEn: 'Grape Cheese', price: 22, image: '🍇', desc: '新鲜葡萄，芝士奶盖', inventory: 100, category: '水果茶' },
      { id: 'p102', name: '芝芝莓莓', nameEn: 'Berry Cheese', price: 24, image: '🍓', desc: '草莓果肉，浓郁芝士', inventory: 80, category: '水果茶' },
      { id: 'p103', name: '纯绿妍茶后', nameEn: 'Pure Green Tea', price: 18, image: '🍵', desc: '清爽绿茶，回甘持久', inventory: 120, category: '原味茶' },
    ],
    shop003: [
      { id: 'p201', name: '拿铁', nameEn: 'Latte', price: 32, image: '☕', desc: '醇香浓郁，奶香四溢', inventory: 200, category: '咖啡' },
      { id: 'p202', name: '美式', nameEn: 'Americano', price: 26, image: '🫖', desc: '纯正咖啡，提神醒脑', inventory: 200, category: '咖啡' },
      { id: 'p203', name: '抹茶拿铁', nameEn: 'Matcha Latte', price: 35, image: '🍵', desc: '日式抹茶，清香怡人', inventory: 150, category: '特调' },
    ],
  },

  banners: [
    { id: 1, title: '跳过排队，在线下单', titleEn: 'Skip the Line, Order Online', color: '#FF4D4F' },
    { id: 2, title: '实时排队状态，掌握在手', titleEn: 'Real-time Queue Status', color: '#1890FF' },
    { id: 3, title: '商家提前通知，准时到店', titleEn: 'Get Notified Before Pickup', color: '#52C41A' },
  ]
}
