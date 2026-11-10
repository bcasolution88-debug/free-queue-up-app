/**
 * 云函数：支付与退款
 * 功能：处理支付回调、未领取退款、爽约赔款
 */

const db = uniCloud.database()

exports.main = async (event) => {
  const { action, data } = event

  switch (action) {
    case 'callback':
      return await handlePaymentCallback(data)
    case 'refund':
      return await handleRefund(data)
    case 'noShowPenalty':
      return await handleNoShowPenalty(data)
    default:
      return { code: 400, message: '未知的操作' }
  }
}

/**
 * 处理支付回调
 */
async function handlePaymentCallback(data) {
  const { orderId, paymentId, status } = data

  try {
    const order = await db.collection('orders').doc(orderId).get()
    if (!order.data || order.data.length === 0) {
      return { code: 404, message: '订单不存在' }
    }

    if (status === 'success') {
      await db.collection('orders').doc(orderId).update({
        status: 'paid',
        payment_id: paymentId,
        updated_at: new Date()
      })
      
      // 更新队列状态为已加入
      await updateQueueStatus(order.data[0].shop_id, order.data[0].queue_type, order.data[0].queue_no, 'waiting')
      
      return { code: 0, message: '支付成功处理完毕' }
    } else {
      await db.collection('orders').doc(orderId).update({
        status: 'cancelled',
        notes: '支付失败',
        updated_at: new Date()
      })
      
      // 恢复库存
      await restoreInventory(order.data[0].items)
      
      return { code: 0, message: '支付失败处理完毕' }
    }
  } catch (error) {
    return { code: 500, message: '处理支付回调失败: ' + error.message }
  }
}

/**
 * 处理退款 (未领取)
 */
async function handleRefund(data) {
  const { orderId, reason = '未领取自动退款' } = data

  try {
    const order = await db.collection('orders').doc(orderId).get()
    if (!order.data || order.data.length === 0) {
      return { code: 404, message: '订单不存在' }
    }

    const orderData = order.data[0]
    
    // 只有已支付或待领取的订单可以退款
    if (orderData.status !== 'paid' && orderData.status !== 'ready') {
      return { code: 400, message: '当前订单状态无法退款' }
    }

    // 执行退款逻辑 (此处调用微信/支付宝退款接口)
    // const refundResult = await callWechatRefund(...)
    
    // 模拟退款成功
    await db.collection('orders').doc(orderId).update({
      status: 'refunded',
      refund_reason: reason,
      refund_amount: orderData.total_amount,
      updated_at: new Date()
    })
    
    // 恢复库存
    await restoreInventory(orderData.items)
    
    // 更新队列状态
    await updateQueueStatus(orderData.shop_id, orderData.queue_type, orderData.queue_no, 'cancelled')

    return { code: 0, message: '退款成功' }
  } catch (error) {
    return { code: 500, message: '处理退款失败: ' + error.message }
  }
}

/**
 * 处理爽约赔款
 */
async function handleNoShowPenalty(data) {
  const { orderId } = data

  try {
    const order = await db.collection('orders').doc(orderId).get()
    if (!order.data || order.data.length === 0) {
      return { code: 404, message: '订单不存在' }
    }

    const orderData = order.data[0]
    
    // 爽约赔款规则：扣除 20% 违约金
    const penaltyRate = 0.2
    const penaltyAmount = orderData.total_amount * penaltyRate
    const refundAmount = orderData.total_amount - penaltyAmount

    // 执行退款逻辑 (退还 80%)
    
    await db.collection('orders').doc(orderId).update({
      status: 'cancelled',
      refund_reason: '爽约赔款扣除',
      refund_amount: refundAmount,
      notes: `已扣除爽约金: ¥${penaltyAmount}`,
      updated_at: new Date()
    })
    
    // 恢复库存
    await restoreInventory(orderData.items)
    
    // 更新队列状态
    await updateQueueStatus(orderData.shop_id, orderData.queue_type, orderData.queue_no, 'cancelled')

    return { 
      code: 0, 
      message: '爽约处理成功',
      data: {
        penaltyAmount,
        refundAmount
      }
    }
  } catch (error) {
    return { code: 500, message: '处理爽约失败: ' + error.message }
  }
}

/**
 * 恢复库存辅助函数
 */
async function restoreInventory(items) {
  for (const item of items) {
    await db.collection('products').doc(item.product_id).update({
      inventory: db.command.inc(item.quantity)
    })
  }
}

/**
 * 更新队列状态辅助函数
 */
async function updateQueueStatus(shopId, queueType, queueNo, status) {
  const queueQuery = await db.collection('queues')
    .where({
      shop_id: shopId,
      queue_type: queueType
    })
    .get()

  if (queueQuery.data.length > 0) {
    const queueInfo = queueQuery.data[0]
    const queueList = queueInfo.queue_list
    
    const index = queueList.findIndex(q => q.queue_no === queueNo)
    if (index !== -1) {
      queueList[index].status = status
      
      await db.collection('queues').doc(queueInfo._id).update({
        queue_list: queueList,
        updated_at: new Date()
      })
    }
  }
}
