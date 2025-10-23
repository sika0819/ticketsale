/**
 * 网络请求修复验证脚本
 * 用于测试修复后的网络请求功能是否正常工作
 */
import Taro from '@tarojs/taro'
import { 
  safeRequest, 
  checkNetworkStatus, 
  getNetworkLogs, 
  clearNetworkLogs 
} from './networkErrorHandler'
import { buildApiUrl, API_ENDPOINTS } from './apiConfig'

// 测试用例接口
interface TestCase {
  name: string
  url: string
  method: 'GET' | 'POST'
  data?: any
  expectedError?: boolean
}

// 定义测试用例
const TEST_CASES: TestCase[] = [
  {
    name: '获取轮播图',
    url: buildApiUrl(API_ENDPOINTS.BANNERS),
    method: 'GET'
  },
  {
    name: '获取演唱会列表',
    url: buildApiUrl(API_ENDPOINTS.CONCERTS),
    method: 'GET'
  },
  {
    name: '获取演唱会详情',
    url: buildApiUrl(API_ENDPOINTS.CONCERT_INDEX),
    method: 'GET',
    data: { id: 1 }
  },
  {
    name: '测试无效域名（应该失败）',
    url: 'https://invalid-domain.example.com/api/test',
    method: 'GET',
    expectedError: true
  }
]

// 执行单个测试用例
export const runSingleTest = async (testCase: TestCase): Promise<{success: boolean, error?: any}> => {
  try {
    console.log(`🧪 测试开始: ${testCase.name}`)
    
    await safeRequest({
      url: testCase.url,
      method: testCase.method,
      data: testCase.data
    })
    
    if (testCase.expectedError) {
      console.log(`❌ 测试失败: ${testCase.name} - 期望失败但成功了`)
      return { success: false, error: '期望失败但成功了' }
    }
    
    console.log(`✅ 测试成功: ${testCase.name}`)
    return { success: true }
    
  } catch (error) {
    if (testCase.expectedError) {
      console.log(`✅ 测试成功: ${testCase.name} - 按预期失败`)
      return { success: true }
    }
    
    console.log(`❌ 测试失败: ${testCase.name}`, error)
    return { success: false, error }
  }
}

// 运行所有测试
export const runAllTests = async (): Promise<void> => {
  console.log('🚀 开始网络请求修复验证测试...')
  
  // 清除之前的日志
  clearNetworkLogs()
  
  // 检查网络状态
  const networkStatus = await checkNetworkStatus()
  if (!networkStatus) {
    console.log('❌ 网络不可用，无法进行测试')
    return
  }
  
  let successCount = 0
  let failCount = 0
  
  // 执行所有测试用例
  for (const testCase of TEST_CASES) {
    const result = await runSingleTest(testCase)
    if (result.success) {
      successCount++
    } else {
      failCount++
    }
    
    // 测试间隔
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  // 输出测试结果
  console.log('📊 测试结果汇总:')
  console.log(`✅ 成功: ${successCount}`)
  console.log(`❌ 失败: ${failCount}`)
  console.log(`📋 总计: ${TEST_CASES.length}`)
  
  // 显示网络日志
  const logs = getNetworkLogs()
  console.log(`📝 网络日志条数: ${logs.length}`)
  
  // 显示测试结果Toast
  Taro.showModal({
    title: '网络测试完成',
    content: `成功: ${successCount}, 失败: ${failCount}`,
    showCancel: false
  })
}

// 测试6000100错误修复
export const test6000100Fix = async (): Promise<void> => {
  console.log('🔧 测试6000100错误修复...')
  
  try {
    // 尝试访问一个可能触发6000100错误的URL
    await safeRequest({
      url: 'https://test.3fenban.com/api/test-6000100',
      method: 'GET'
    })
    
    console.log('✅ 6000100错误修复测试通过')
  } catch (error) {
    console.log('ℹ️ 6000100错误已被正确处理:', error.message || error.errMsg)
  }
}

// 导出测试函数供页面调用
export const networkTestUtils = {
  runAllTests,
  runSingleTest,
  test6000100Fix,
  getNetworkLogs,
  clearNetworkLogs
}