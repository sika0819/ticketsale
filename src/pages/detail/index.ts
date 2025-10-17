// pages/detail/index.ts
import { ref, onMounted, Ref } from 'vue'
import Taro from '@tarojs/taro'
import drawQrcode from 'weapp-qrcode'

// 定义票务数据类型
interface Ticket {
  id: number
  concertId: number
  city: string
  concertName: string
  concertImage: string
  date: string
  time: string
  venue: string
  seatArea: string
  seatNumber: string
  price: number
  status: 'pending' | 'confirmed' | 'refunded' | 'expired'
  purchaseTime: string
  orderNumber: string
  ticketNumber: string
  refundDeadline?: string
  expireTime?: string
  refundTime?: string
}

// 二维码数据类型
interface QRCodeData {
  ticketId: number
  ticketNumber: string
  orderNumber: string
  concertName: string
  date: string
  time: string
  venue: string
  seatArea: string
  seatNumber: string
  price: number
}

// 后台URL地址 - 请根据实际情况修改
const backendUrl = 'https://your-backend-domain.com/api/verify'

export function useTicketDetail() {
  const ticket: Ref<Ticket> = ref({} as Ticket)
  const qrcodeSize = ref(200)

  // 获取状态样式类
  const getStatusClass = (status: Ticket['status']): string => {
    const statusMap: Record<Ticket['status'], string> = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      refunded: 'status-refunded',
      expired: 'status-expired'
    }
    return statusMap[status] || 'status-pending'
  }

  // 获取状态文本
  const getStatusText = (status: Ticket['status']): string => {
    const statusTextMap: Record<Ticket['status'], string> = {
      pending: '待支付',
      confirmed: '待核销',
      refunded: '已退款',
      expired: '已过期'
    }
    return statusTextMap[status] || '未知状态'
  }

  // 获取状态描述
  const getStatusDesc = (status: Ticket['status']): string => {
    const descMap: Record<Ticket['status'], string> = {
      pending: '订单待支付，请尽快完成支付',
      confirmed: '票券待使用，请按时参加活动',
      refunded: '退款已处理，请注意查收',
      expired: '订单已过期，无法使用'
    }
    return descMap[status] || ''
  }

  // 获取按钮文本
  const getButtonText = (status: Ticket['status']): string => {
    const textMap: Record<Ticket['status'], string> = {
      pending: '立即支付',
      confirmed: '申请退票',
      expired: '再来一单',
      refunded: '查看退款详情'
    }
    return textMap[status] || '确定'
  }

  // 获取按钮样式类
  const getButtonClass = (status: Ticket['status']): string => {
    const classMap: Record<Ticket['status'], string> = {
      pending: 'btn-pay',
      confirmed: 'btn-refund',
      expired: 'btn-reorder',
      refunded: 'btn-detail'
    }
    return classMap[status] || 'btn-default'
  }

  // 立即支付
  const handlePay = (ticket: Ticket): void => {
    Taro.showModal({
      title: '确认支付',
      content: `确定要支付「${ticket.concertName}」的门票吗？金额：¥${ticket.price}`,
      confirmColor: '#4E37FD',
      success: (res: TaroGeneral.CallbackResult) => {
        if (res.confirm) {
          // 模拟支付成功
          ticket.status = 'confirmed'
          Taro.showToast({
            title: '支付成功',
            icon: 'success'
          })
          // 支付成功后重新生成二维码
          setTimeout(() => {
            generateQRCode()
          }, 500)
        }
      }
    })
  }

  // 申请退款
  const showRefundConfirm = (ticket: Ticket): void => {
    Taro.showModal({
      title: '确认退票',
      content: `确定要退掉「${ticket.concertName}」的门票吗？退票将收取10%手续费。`,
      confirmColor: '#4E37FD',
      success: (res: TaroGeneral.CallbackResult) => {
        if (res.confirm) {
          ticket.status = 'refunded'
          Taro.showToast({
            title: '退票申请已提交',
            icon: 'success'
          })
        }
      }
    })
  }

  // 再来一单
  const reorder = (ticket: Ticket): void => {
    Taro.navigateTo({
      url: `/pages/concert/detail?id=${ticket.concertId}`
    })
  }

  // 查看退款详情
  const viewRefundDetail = (ticket: Ticket): void => {
    Taro.showModal({
      title: '退款详情',
      content: `退款金额：¥${ticket.price * 0.9}\n退款时间：${ticket.refundTime || '暂无'}\n退款状态：已到账`,
      showCancel: false,
      confirmColor: '#4E37FD'
    })
  }

  // 处理按钮点击
  const handleAction = (ticket: Ticket): void => {
    switch (ticket.status) {
      case 'pending':
        handlePay(ticket)
        break
      case 'confirmed':
        showRefundConfirm(ticket)
        break
      case 'expired':
        reorder(ticket)
        break
      case 'refunded':
        viewRefundDetail(ticket)
        break
    }
  }

  // 生成包含后台URL的二维码
  const generateQRCode = (): void => {
    if (ticket.value.status !== 'confirmed') return
    
    try {
      // 构建二维码数据 - 包含后台URL和票务参数
      const qrData: QRCodeData = {
        ticketId: ticket.value.id,
        ticketNumber: ticket.value.ticketNumber,
        orderNumber: ticket.value.orderNumber,
        concertName: ticket.value.concertName,
        date: ticket.value.date,
        time: ticket.value.time,
        venue: ticket.value.venue,
        seatArea: ticket.value.seatArea,
        seatNumber: ticket.value.seatNumber,
        price: ticket.value.price
      }
      
      // 将参数编码为URL参数
      const params = new URLSearchParams(qrData as any).toString()
      
      // 完整的后台URL，包含所有参数
      const fullUrl = `${backendUrl}?${params}`
      
      console.log('二维码URL:', fullUrl)
      console.log('二维码参数:', qrData)
      
      // 使用 weapp-qrcode 生成二维码
      drawQrcode({
        width: qrcodeSize.value,
        height: qrcodeSize.value,
        canvasId: 'qrcodeCanvas',
        text: fullUrl, // 这里改为完整的后台URL
        correctLevel: 0, // 纠错等级
        callback: () => {
          console.log('二维码生成成功，扫描后将跳转到:', fullUrl)
        }
      })
      
    } catch (error) {
      console.error('二维码生成失败:', error)
      Taro.showToast({
        title: '二维码生成失败',
        icon: 'none'
      })
    }
  }

  // 初始化数据
  const initTicketData = (): void => {
    const eventId = Taro.getCurrentInstance().router?.params?.id
    if (eventId) {
      ticket.value = {
        id: 1,
        concertId: 1,
        city: '北京',
        concertName: '2025VR演唱会',
        concertImage: '../../assets/images/concert1.png',
        date: '2025-12-31',
        time: '19:30',
        venue: '北京鸟巢体育场',
        seatArea: 'A区',
        seatNumber: '12排08座',
        price: 580,
        status: 'confirmed',
        purchaseTime: '2025-10-10 14:30:25',
        orderNumber: 'T202510101430001',
        ticketNumber: 'TJ202510101430001',
        refundDeadline: '2025-12-25 23:59:59',
        expireTime: '2025-12-31 23:59:59'
      } as Ticket
      
      // 使用延迟确保DOM完全渲染
      setTimeout(() => {
        if (ticket.value.status === 'confirmed') {
          generateQRCode()
        }
      }, 1000)
    }
  }

  // 生命周期
  onMounted(() => {
    initTicketData()
  })

  return {
    ticket,
    qrcodeSize,
    getStatusClass,
    getStatusText,
    getStatusDesc,
    getButtonText,
    getButtonClass,
    handleAction,
    generateQRCode
  }
}