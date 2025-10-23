/**
 * 微信6000100错误测试和修复验证工具
 */
import Taro from '@tarojs/taro'
import { getApiConfig } from './apiConfig'
import { wechatApiRequest } from './wechatApi'

// 测试结果类型
interface TestResult {
    testName: string
    success: boolean
    message: string
    details?: any
    errorCode?: string | number
}

/**
 * 完整的6000100错误测试套件
 */
export class WeChatErrorTestSuite {
    private results: TestResult[] = []

    /**
     * 运行所有测试
     */
    async runAllTests(): Promise<TestResult[]> {
        console.log('🧪 开始运行微信6000100错误修复测试套件...')

        this.results = []

        // 测试1: 网络连接状态
        await this.testNetworkConnection()

        // 测试2: 域名配置检查
        await this.testDomainConfiguration()

        // 测试3: API请求基础功能
        await this.testBasicApiRequest()

        // 测试4: 微信登录流程
        await this.testWeChatLoginFlow()

        // 测试5: 错误处理机制
        await this.testErrorHandling()

        // 输出测试报告
        this.printTestReport()

        return this.results
    }

    /**
     * 测试1: 网络连接状态
     */
    private async testNetworkConnection(): Promise<void> {
        try {
            console.log('📡 测试网络连接状态...')

            const networkInfo = await Taro.getNetworkType()

            if (networkInfo.networkType === 'none') {
                this.addResult({
                    testName: '网络连接检查',
                    success: false,
                    message: '网络未连接',
                    details: networkInfo
                })
            } else {
                this.addResult({
                    testName: '网络连接检查',
                    success: true,
                    message: `网络已连接: ${networkInfo.networkType}`,
                    details: networkInfo
                })
            }
        } catch (error: any) {
            this.addResult({
                testName: '网络连接检查',
                success: false,
                message: `网络状态检查失败: ${error.message}`,
                details: error
            })
        }
    }

    /**
     * 测试2: 域名配置检查
     */
    private async testDomainConfiguration(): Promise<void> {
        try {
            console.log('🌐 测试域名配置...')

            const config = getApiConfig()
            const testUrl = config.baseUrl + '/test'

            // 尝试发送一个简单的请求来检查域名是否可访问
            const response = await Taro.request({
                url: testUrl,
                method: 'GET',
                timeout: 5000,
                fail: (error) => {
                    throw error
                }
            })

            this.addResult({
                testName: '域名配置检查',
                success: true,
                message: `域名可访问: ${config.baseUrl}`,
                details: {
                    baseUrl: config.baseUrl,
                    statusCode: response.statusCode
                }
            })
        } catch (error: any) {
            let message = '域名配置检查失败'
            let errorCode: string | number | undefined = undefined

            if (error.errMsg) {
                if (error.errMsg.includes('6000100')) {
                    message = '6000100错误: 请检查域名是否已在小程序管理后台配置'
                    errorCode = '6000100'
                } else if (error.errMsg.includes('url not in domain list')) {
                    message = '域名未在小程序管理后台配置'
                    errorCode = 'domain_not_whitelisted'
                } else {
                    message = `域名配置问题: ${error.errMsg}`
                }
            }

            this.addResult({
                testName: '域名配置检查',
                success: false,
                message,
                errorCode,
                details: error
            })
        }
    }

    /**
     * 测试3: API请求基础功能
     */
    private async testBasicApiRequest(): Promise<void> {
        try {
            console.log('🔧 测试API请求基础功能...')

            const result = await wechatApiRequest('/wechat/check-login', {
                method: 'POST',
                data: { openid: 'test_openid_12345' }
            })

            this.addResult({
                testName: 'API请求基础功能',
                success: true,
                message: '新的API请求工具工作正常',
                details: result
            })
        } catch (error: any) {
            this.addResult({
                testName: 'API请求基础功能',
                success: false,
                message: `API请求失败: ${error.message}`,
                errorCode: error.errno || error.statusCode,
                details: error
            })
        }
    }

    /**
     * 测试4: 微信登录流程模拟
     */
    private async testWeChatLoginFlow(): Promise<void> {
        try {
            console.log('🔐 测试微信登录流程模拟...')

            // 模拟登录请求（不需要真实的微信授权）
            const result = await wechatApiRequest('/wechat/login', {
                method: 'POST',
                data: {
                    code: 'test_code_' + Date.now(),
                    nickname: '测试用户',
                    avatar_url: 'https://example.com/avatar.jpg'
                }
            })

            this.addResult({
                testName: '微信登录流程模拟',
                success: result.success,
                message: result.success ? '登录流程正常' : `登录失败: ${result.message}`,
                details: result
            })
        } catch (error: any) {
            this.addResult({
                testName: '微信登录流程模拟',
                success: false,
                message: `登录流程测试失败: ${error.message}`,
                errorCode: error.errno || error.statusCode,
                details: error
            })
        }
    }

    /**
     * 测试5: 错误处理机制
     */
    private async testErrorHandling(): Promise<void> {
        try {
            console.log('🛡️ 测试错误处理机制...')

            // 故意发送一个会失败的请求来测试错误处理
            const result = await wechatApiRequest('/non-existent-endpoint', {
                method: 'GET'
            })

            // 如果到这里说明错误被正确处理了
            this.addResult({
                testName: '错误处理机制',
                success: true,
                message: '错误处理机制工作正常',
                details: result
            })
        } catch (error: any) {
            // 这里不应该抛出异常，如果抛出了说明错误处理有问题
            this.addResult({
                testName: '错误处理机制',
                success: false,
                message: `错误处理机制存在问题: ${error.message}`,
                details: error
            })
        }
    }

    /**
     * 添加测试结果
     */
    private addResult(result: TestResult): void {
        this.results.push(result)
        const icon = result.success ? '✅' : '❌'
        console.log(`${icon} ${result.testName}: ${result.message}`)
    }

    /**
     * 打印测试报告
     */
    private printTestReport(): void {
        console.log('\n📊 测试报告总结:')
        console.log('='.repeat(50))

        const totalTests = this.results.length
        const passedTests = this.results.filter(r => r.success).length
        const failedTests = totalTests - passedTests

        console.log(`总测试数: ${totalTests}`)
        console.log(`通过: ${passedTests}`)
        console.log(`失败: ${failedTests}`)
        console.log(`成功率: ${Math.round(passedTests / totalTests * 100)}%`)

        if (failedTests > 0) {
            console.log('\n❌ 失败的测试:')
            this.results
                .filter(r => !r.success)
                .forEach(r => {
                    console.log(`- ${r.testName}: ${r.message}`)
                    if (r.errorCode) {
                        console.log(`  错误代码: ${r.errorCode}`)
                    }
                })
        }

        console.log('='.repeat(50))
    }    /**
     * 获取测试结果
     */
    getResults(): TestResult[] {
        return this.results
    }
}

/**
 * 快速测试函数 - 用于在页面中快速调用
 */
export const quickTest6000100Fix = async (): Promise<void> => {
    const testSuite = new WeChatErrorTestSuite()
    const results = await testSuite.runAllTests()

    // 显示测试结果摘要
    const failedCount = results.filter(r => !r.success).length
    const message = failedCount === 0
        ? '🎉 所有测试通过！6000100错误修复生效'
        : `⚠️ ${failedCount}个测试失败，请检查相关配置`

    Taro.showModal({
        title: '6000100错误修复测试',
        content: message,
        showCancel: false,
        confirmText: '确定'
    })
}

export default WeChatErrorTestSuite