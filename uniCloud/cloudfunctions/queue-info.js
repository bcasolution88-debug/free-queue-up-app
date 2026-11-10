/**
 * 云函数：获取队列信息
 * 功能：获取指定商家的队列状态
 */

const db = uniCloud.database()

exports.main = async (event) => {
  const { shopId, queueType = 'online' } = event

  try {
    if (!shopId) {
      return {
        code: 400,
        message: '商家 ID 不能为空'
      }
    }

    // 查询队列信息
    const queueRes = await db.collection('queues')
      .where({
        shop_id: shopId,
        queue_type: queueType
      })
      .get()

    if (queueRes.data.length === 0) {
      return {
        code: 0,
        message: '暂无队列信息',
        data: {
          currentQueueNo: '',
          totalQueueCount: 0,
          estimatedWaitTime: 0,
          queueList: []
        }
      }
    }

    const queueInfo = queueRes.data[0]
    
    // 计算预估等待时间
    const currentNo = queueInfo.current_calling_no
    let estimatedWaitTime = 0
    
    if (currentNo) {
      const currentIndex = queueInfo.queue_list.findIndex(
        item => item.queue_no === currentNo
      )
      const waitingCount = queueInfo.queue_list.length - currentIndex - 1
      estimatedWaitTime = waitingCount * (queueInfo.estimated_wait_time_per_person || 3)
    }

    return {
      code: 0,
      message: '获取队列信息成功',
      data: {
        currentQueueNo: queueInfo.current_calling_no || '',
        totalQueueCount: queueInfo.total_queue_count || 0,
        estimatedWaitTime: estimatedWaitTime,
        estimatedWaitTimePerPerson: queueInfo.estimated_wait_time_per_person || 3,
        queueList: queueInfo.queue_list || []
      }
    }
  } catch (error) {
    console.error('获取队列信息失败:', error)
    return {
      code: 500,
      message: '获取队列信息失败: ' + error.message
    }
  }
}
