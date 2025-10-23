# VR演唱会售票小程序

### 2. 获取演唱会详情及剩余票数
- 请求方式：GET
- 路径：`/concert/index`
- 参数：
  - `id`（演唱会ID，必填，作为查询参数传递）
- 示例：
```js
GET https://www.3fenban.com/api/concert/index?id=1
```
- 返回：
```json
{
  "id": 1,
  "name": "2025VR演唱会",
  "location": "北京",
  "venue": "北京鸟巢体育场",
  "address": "北京市朝阳区国家体育场北路1号",
  "date": "2025-10-31",
  "time": "19:30",
  "price": 380,
  "poster": "https://.../concert1.png",
  "introduction": "演唱会介绍...",
  "tags": ["官方票源", "电子票"],
  "totalTickets": 1000,
  "remainingTickets": 256
}
```
- 字段说明：
  - `totalTickets`：总票数
  - `remainingTickets`：剩余可售票数
- 错误码示例：
```json
{
  "code": 404,
  "message": "演唱会不存在"
}
```
- 前端调用示例：
```js
Taro.request({
  url: `${apiBaseUrl}/concert/index`,
  method: 'GET',
  data: { id: 1 }
}).then(res => {
  const concert = res.data
  // 可用 concert.remainingTickets, concert.totalTickets 渲染页面
})
```

### 4. 微信支付统一下单
- 请求方式：POST
- 路径：`/wechatpay/unifiedorder`
- 参数：
{
  "description": "商品描述",
  "out_trade_no": "订单号（唯一）",
  "amount": 100,           // 单位元
  "openid": "用户openid",  // JSAPI必需
  "trade_type": "JSAPI"   // JSAPI 或 NATIVE
}
```
- 返回：
```json
{
  "timeStamp": "xxx",
  "nonceStr": "xxx",
  "package": "prepay_id=xxx",
  "paySign": "xxx"
}
```
- 前端调用示例：
```js
Taro.request({
  url: `${apiBaseUrl}/wechatpay/unifiedorder`,
  method: 'POST',
  data: {
    description: ticket.concertName,
    out_trade_no: ticket.orderNumber,
    amount: ticket.price,
    openid: ticket.openid,
    trade_type: 'JSAPI'
  }
}).then(res => {
  const payData = res.data
  Taro.requestPayment({
    timeStamp: payData.timeStamp,
    nonceStr: payData.nonceStr,
    package: payData.package,
    signType: 'MD5',
    paySign: payData.paySign
  })
})
```

### 5. 用户信息与实名认证
获取用户信息：
  - GET `/user/info`
更新用户信息（微信登录）：
  - POST `/user/update`，参数：`{ username, avatar, phone }`
实名认证：
  - POST `/user/auth`，参数：`{ name, idCard }`
- H5 网页开发：

```bash
npm run dev:h5
```

3. 构建生产环境

```bash
npm run build:weapp
npm run build:h5
```

## 目录结构说明
- `src/pages/` 页面目录，每个页面包含 `index.vue`、`index.config.ts` 等
- `src/components/` 复用组件
- `src/assets/images/` 图片资源
- `config/index.ts` 项目配置及 API 地址统一管理
- `types/` TypeScript 类型声明

## 后台 API 文档

### 1. 获取演唱会列表
- 请求方式：GET
- 路径：`/concerts`
- 参数：无
- 示例：
```js
GET https://www.3fenban.com/api/concerts
```
- 返回：
```json
[
  {
    "id": 1,
    "name": "2025VR演唱会",
    "city": "北京",
    "date": "2025-10-31",
    "venue": "北京鸟巢体育场",
    "price": 380,
    "imageUrl": "https://.../concert1.png"
  }
]
```
- 错误码示例：
```json
{
  "code": 401,
  "message": "未授权"
}
```

- 请求方式：GET（页面跳转）
- 路径：`/pages/detail/index?id=票据ID`
- 参数：id（在URL上传递）
- 示例页面跳转代码：
```js
Taro.navigateTo({
  url: `/pages/detail/index?id=${ticket.id}`
})
```
- 返回：
```json
{
  "id": 123,
  "concertId": 1,
  "city": "北京",
  "concertName": "2025VR演唱会",
  "date": "2025-10-31",
  "time": "19:30",
  "venue": "北京鸟巢体育场",
  "seatArea": "A区",
  "seatNumber": "12排08座",
  "price": 580,
  "status": "confirmed",
  "purchaseTime": "2025-10-10 14:30:25",
  "orderNumber": "T202510101430001",
  "ticketNumber": "TJ202510101430001"
}
```
- 错误码示例：
```json
{
  "code": 404,
  "message": "票据不存在"
}
```

### 3. 创建订单（下单）
- 请求方式：POST
- 路径：`/order/create`
- 参数：
```json
{
  "concertId": 1,
  "sessionId": 2,
  "quantity": 2,
  "phone": "13800000000",
  "idCard": "110101199001011234" // 身份证号，必填
}
```
- 返回：
```json
{
  "orderId": "T202510101430001",
  "status": "pending"
}
```
- 错误码示例：
```json
{
  "code": 400,
  "message": "参数错误"
}
```

### 4. 用户信息与实名认证
- 获取用户信息：
  - GET `/user/info`
- 更新用户信息（微信登录）：
  - POST `/user/update`，参数：`{ username, avatar, phone }`
- 实名认证：
  - POST `/user/auth`，参数：`{ name, idCard }`

## 其他说明
- 推荐使用微信开发者工具进行小程序调试
- 图片资源建议使用 `scripts/compress-images.ts` 进行压缩优化
- 所有页面数据建议通过 API 实时获取，避免硬编码