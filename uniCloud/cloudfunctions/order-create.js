/**
 * 云函数：创建订单
 * 功能：验证库存、生成订单、分配排队号码
 */

const db = uniCloud.database()

exports.main = async (event) => {
  const {
    userId,
    shopId,
    items,
    pickupTime,
    queueType = 'online',
    paymentMethod = 'wechat'
  } = event

  try {
    // 参数验证
    if (!userId || !shopId || !items || items.length === 0) {
      return {
        code: 400,
        message: '参数不完整'
      }
    }

    // 验证库存
    for (const item of items) {
      const product = await db.collection('products').doc(item.product_id).get()
      if (!product.data || product.data.inventory < item.quantity) {
        return {
          code: 409,
          message: `产品 ${item.name} 库存不足`
        }
      }
    }

    // 计算总金额
    let totalAmount = 0
    for (const item of items) {
      totalAmount += item.price * item.quantity
    }

    // 生成排队号码
    const queueNo = await generateQueueNo(shopId, queueType)

    // 创建订单
    const orderData = {
      user_id: userId,
      shop_id: shopId,
      items,
      total_amount: totalAmount,
      status: 'pending',
      pickup_time: pickupTime,
      queue_no: queueNo,
      queue_type: queueType,
      payment_method: paymentMethod,
      created_at: new Date(),
      updated_at: new Date()
    }

    const orderRes = await db.collection('orders').add(orderData)

    // 扣减库存
    for (const item of items) {
      await db.collection('products').doc(item.product_id).update({
        inventory: db.command.inc(-item.quantity)
      })
    }

    // 更新队列信息
    await updateQueueInfo(shopId, queueType, queueNo)

    return {
      code: 0,
      message: '订单创建成功',
      data: {
        orderId: orderRes.id,
        queueNo: queueNo,
        totalAmount: totalAmount
      }
    }
  } catch (error) {
    console.error('创建订单失败:', error)
    return {
      code: 500,
      message: '创建订单失败: ' + error.message
    }
  }
}

/**
 * 生成排队号码
 */
async function generateQueueNo(shopId, queueType) {
  const today = new Date().toISOString().split('T')[0]
  const prefix = queueType === 'online' ? 'O' : 'S'
  
  // 查询今天的最大号码
  const result = await db.collection('orders')
    .where({
      shop_id: shopId,
      queue_type: queueType,
      created_at: db.command.gte(new Date(today))
    })
    .orderBy('queue_no', 'desc')
    .limit(1)
    .get()

  let nextNo = 1
  if (result.data.length > 0) {
    const lastQueueNo = result.data[0].queue_no
    const lastNo = parseInt(lastQueueNo.substring(1))
    nextNo = lastNo + 1
  }

  return `${prefix}${String(nextNo).padStart(3, '0')}`
}

/**
 * 更新队列信息
 */
async function updateQueueInfo(shopId, queueType, queueNo) {
  const queueQuery = await db.collection('queues')
    .where({
      shop_id: shopId,
      queue_type: queueType
    })
    .get()

  if (queueQuery.data.length === 0) {
    // 创建新队列记录
    await db.collection('queues').add({
      shop_id: shopId,
      queue_type: queueType,
      queue_list: [{
        queue_no: queueNo,
        status: 'waiting',
        created_at: new Date()
      }],
      current_calling_no: '',
      estimated_wait_time_per_person: 3,
      total_queue_count: 1,
      updated_at: new Date()
    })
  } else {
    // 更新现有队列记录
    const queueId = queueQuery.data[0]._id
    await db.collection('queues').doc(queueId).update({
      queue_list: db.command.push({
        queue_no: queueNo,
        status: 'waiting',
        created_at: new Date()
      }),
      total_queue_count: db.command.inc(1),
      updated_at: new Date()
    })
  }
}
