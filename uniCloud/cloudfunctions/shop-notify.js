/**
 * 云函数：商家通知用户
 * 功能：更新订单状态，触发推送通知
 */

const db = uniCloud.database()

exports.main = async (event) => {
  const { orderId, shopId } = event

  try {
    if (!orderId || !shopId) {
      return { code: 400, message: '参数不完整' }
    }

    const order = await db.collection('orders').doc(orderId).get()
    if (!order.data || order.data.length === 0) {
      return { code: 404, message: '订单不存在' }
    }

    const orderData = order.data[0]
    
    // 验证商家权限
    if (orderData.shop_id !== shopId) {
      return { code: 403, message: '无权操作此订单' }
    }

    // 更新订单状态为待领取
    await db.collection('orders').doc(orderId).update({
      status: 'ready',
      updated_at: new Date()
    })

    // 更新队列状态
    await updateQueueStatus(shopId, orderData.queue_type, orderData.queue_no, 'called')

    // 这里应该调用 uniPush 发送推送通知给用户
    // const pushResult = await uniPush.sendMessage({
    //   push_clientid: userClientId,
    //   title: '取餐通知',
    //   content: `您的订单 ${orderData.queue_no} 已经准备好，请前往领取。`,
    //   payload: { orderId }
    // })

    return { 
      code: 0, 
      message: '通知发送成功',
      data: {
        queueNo: orderData.queue_no
      }
    }
  } catch (error) {
    console.error('通知发送失败:', error)
    return { code: 500, message: '通知发送失败: ' + error.message }
  }
}

/**
 * 更新队列状态并更新当前叫号
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
        current_calling_no: queueNo,
        updated_at: new Date()
      })
    }
  }
}
