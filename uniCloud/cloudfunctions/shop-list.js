/**
 * 云函数：获取商家列表
 * 功能：获取商家列表，支持搜索和筛选
 */

const db = uniCloud.database()

exports.main = async (event) => {
  const {
    keyword = '',
    status = 'open',
    limit = 20,
    skip = 0
  } = event

  try {
    let query = db.collection('shops')

    // 状态筛选
    if (status) {
      query = query.where({
        status: status
      })
    }

    // 关键词搜索
    if (keyword) {
      query = query.where(
        db.command.or([
          { name: db.command.regex(keyword, 'i') },
          { address: db.command.regex(keyword, 'i') }
        ])
      )
    }

    // 获取总数
    const countRes = await query.count()
    const total = countRes.total

    // 获取分页数据
    const shopsRes = await query
      .orderBy('rating', 'desc')
      .skip(skip)
      .limit(limit)
      .get()

    // 获取每个商家的队列信息
    const shopsWithQueue = await Promise.all(
      shopsRes.data.map(async (shop) => {
        const queueRes = await db.collection('queues')
          .where({
            shop_id: shop._id
          })
          .get()

        let onlineQueueCount = 0
        let inStoreQueueCount = 0

        for (const queue of queueRes.data) {
          if (queue.queue_type === 'online') {
            onlineQueueCount = queue.total_queue_count || 0
          } else if (queue.queue_type === 'instore') {
            inStoreQueueCount = queue.total_queue_count || 0
          }
        }

        return {
          ...shop,
          onlineQueueCount,
          inStoreQueueCount,
          distance: Math.random() * 5 // 模拟距离
        }
      })
    )

    return {
      code: 0,
      message: '获取商家列表成功',
      data: {
        list: shopsWithQueue,
        total: total,
        limit: limit,
        skip: skip
      }
    }
  } catch (error) {
    console.error('获取商家列表失败:', error)
    return {
      code: 500,
      message: '获取商家列表失败: ' + error.message
    }
  }
}
