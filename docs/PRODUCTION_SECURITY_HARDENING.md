# QueueGo 生产环境安全加固指南

> 适用项目：QueueGo 线上订单免排队平台
>
> 当前结论：仓库中的支付与认证代码仍是演示/预留实现，不能直接用于真实收款。完成本文的加固项、支付沙箱联调和上线验收前，禁止打开生产支付。

## 1. 先明确当前项目边界

当前仓库的 `uniCloud/` 目录保存的是早期示例文件：云函数不是 HBuilderX 默认的“每个函数一个目录、入口为 `index.js`”结构，数据库文件也不是标准的 `集合名.schema.json` 文件名。项目还没有服务空间 ID、支付商户配置、uni-id 配置或生产密钥。因此，本指南是生产实现规范，不把现有模拟代码标记为已上线能力。

uniCloud 的服务空间包含独立的云数据库、云存储和云函数资源，并通过全局唯一的 `space ID` 标识。项目必须先关联服务空间，才能上传云函数和管理云数据库。[1] [2]

## 2. 生产环境分层和密钥管理

建议至少建立 `dev`、`staging`、`prod` 三个服务空间或等价隔离环境。开发和测试数据不得进入生产空间。开发机、Git 仓库和前端包都不得保存支付私钥、API Secret、证书私钥、uni-id 密钥或云服务访问密钥。

密钥只能保存在 uniCloud 云函数的服务端配置、支付服务商的安全配置或受控的密钥管理系统中。前端只拿到短期支付参数或订单查询结果，不拿到商户私钥、APIv3 密钥、支付宝应用私钥、数据库管理员凭据或服务空间管理密钥。

推荐建立密钥轮换记录：密钥名称、环境、创建时间、负责人、过期时间、轮换时间和撤销时间。轮换时保留短暂的旧密钥兼容窗口，验证所有生产请求切换成功后再撤销旧密钥。

## 3. 身份认证：使用 uni-id，不相信客户端字段

QueueGo 应使用 `uni-id` 或基于 `uni-id-common` 的云对象认证，不要自己在前端生成用户 ID、角色或永久 token。uni-id 登录后会返回 token，客户端保存 token，并在后续 uniCloud 请求中自动携带；服务端依据 token 得到 `uid`、角色和权限。[6]

每个需要登录的方法都应在云函数/云对象入口处做认证检查：

```js
'use strict'

const uniID = require('uni-id-common')

function getAuth(event) {
  const token = event?.uniIdToken || event?.uni_id_token
  if (!token) {
    const error = new Error('UNAUTHORIZED')
    error.code = 'UNAUTHORIZED'
    throw error
  }
  return uniID.createInstance({
    context: this,
    // 从 uni-config-center 读取配置，不把 secret 写在代码中
  })
}

function requireRole(auth, roles) {
  const currentRoles = auth.role || []
  if (currentRoles.includes('admin')) return
  if (!roles.some((role) => currentRoles.includes(role))) {
    const error = new Error('FORBIDDEN')
    error.code = 'FORBIDDEN'
    throw error
  }
}
```

上例展示的是结构，不是可以直接复制上线的完整 uni-id 配置。实际项目应使用官方 uni-id 版本对应的初始化方式，并在云函数中调用 `checkToken` 或云对象的 token 方法。云对象可以通过 `getUniIdToken()` 取得调用方 token；解析 token 应交给 `uni-id-common`，不要自行拆解加密字符串。[7]

必须遵守以下授权规则：

- 用户查询订单时，查询条件必须包含服务端解析出的 `uid`；客户端传来的 `userId` 只能作为无效输入处理。
- 商家只能访问自己所属店面的订单、产品、队列和通知记录。商家身份与 `shopId` 的绑定必须由服务端查询确认。
- 管理员操作必须同时校验 `admin` 角色或明确权限，如 `SHOP_EDIT`、`PRODUCT_EDIT`、`REFUND_APPROVE`，不能只依赖前端隐藏菜单。
- 退款、赔款、改价、库存调整、叫号推进属于高风险操作，要求角色校验、参数校验、审计日志和幂等键。
- 登录接口需要限流、失败次数控制、验证码或短信二次验证策略；管理员后台应启用 MFA，并限制登录来源和会话时长。
- token 的有效期和刷新策略按平台配置。角色权限缓存到 token 后，权限变更可能在旧 token 过期前继续生效，因此高风险管理员操作应额外实时检查角色或缩短管理员 token 有效期。[6]

## 4. 数据库与 Schema 安全

uniCloud DB Schema 可以定义字段类型、必填项、值域校验、默认值、外键和权限。通过 clientDB 访问时必须认真配置 Schema 权限；如果所有业务都由云函数控制，应将前端直写权限关闭，并在云函数中完成授权。[5]

生产集合建议至少包含：

- `shops`：商家状态、营业时间、管理员 UID 列表。
- `products`：商家 ID、服务端价格、库存、上下架状态和版本号。
- `orders`：用户 UID、商家 ID、订单金额（分）、状态、支付单号、幂等键和时间戳。
- `queues`：商家 ID、在线/到店来源、当前号、预计时间、版本号。
- `refunds`：订单号、退款金额、原因、审核人、支付退款单号和状态机。
- `audit_logs`：操作者 UID、角色、动作、目标对象、脱敏摘要、请求 ID 和时间。

价格、库存、排队号和退款金额都必须由服务端计算。金额统一以整数分保存，禁止使用浮点数。Schema 校验不能替代云函数授权；云函数也不能把客户端传入的商品名称、价格、用户 UID 当作可信数据。

## 5. 支付下单：先创建业务订单，再创建支付订单

正确流程是：

1. 客户端提交商品 ID、数量、商家 ID 和幂等键。
2. 云函数从数据库读取商品当前价格和库存，重新计算订单明细与总金额。
3. 在一次受控事务或等价的并发安全流程中锁定/扣减库存，创建 `orders` 业务订单，状态为 `待支付`。
4. 服务端以业务订单号 `order_no` 创建 uniPay 支付订单，金额使用数据库计算值。
5. 客户端只接收拉起支付所需的短期参数，调用 `uni.requestPayment`；支付 API 统一封装了各平台客户端支付，但服务端仍必须完成支付配置和回调处理。[9]
6. 支付成功页面只展示“正在确认”，不能把前端成功回调直接当作付款事实。最终状态以服务端异步通知或服务端主动查询为准。

uniPay 文档特别指出，支付金额若由前端传入可能被篡改，回调业务必须把 `total_fee` 与业务订单金额比较，不一致就拒绝处理。[8] 因此 QueueGo 的接口不得允许客户端传入最终应付金额覆盖服务端金额。

建议订单状态机固定为：

```text
待支付 -> 支付确认中 -> 已支付 -> 制作中 -> 待领取 -> 已领取
待支付 -> 已关闭
已支付 -> 退款处理中 -> 部分退款/已退款
待领取 -> 爽约审核中 -> 爽约扣款/人工豁免
```

状态只能按允许的方向迁移，任何重复通知、重复支付、重复退款都必须返回幂等结果而不是再次扣库存或重复记账。

## 6. 支付回调验签与幂等实现

### 6.1 通用原则

支付回调入口只能由支付服务商调用。服务端应完成：原始请求体保留、签名/证书验证、商户应用和商户号验证、业务订单号验证、金额验证、支付状态验证、重复通知去重和快速响应。

回调处理应尽量只做必要的订单状态更新。uniPay 文档提示回调逻辑应在较短时间内完成，耗时的通知、返佣或统计任务应异步处理；回调成功后再由队列任务处理非关键副作用。[8]

建议使用 `payment_notifications` 集合，以支付方通知唯一 ID 或 `(provider, transaction_id, event_type)` 建唯一索引。处理伪代码如下：

```js
async function handlePaymentNotification(notification) {
  await verifyProviderSignature(notification.rawBody, notification.headers)

  const event = normalizeProviderEvent(notification)
  const order = await getOrderByMerchantOrderNo(event.outTradeNo)

  assert(order, 'ORDER_NOT_FOUND')
  assert(order.amountFen === event.amountFen, 'AMOUNT_MISMATCH')
  assert(order.provider === event.provider, 'PROVIDER_MISMATCH')
  assert(isSuccessStatus(event.status), 'PAYMENT_NOT_SUCCESS')

  const alreadyProcessed = await hasNotification(event.uniqueId)
  if (alreadyProcessed) return 'success'

  await transaction(async (tx) => {
    await tx.insertNotificationOnce(event.uniqueId, event)
    await tx.updateOrderIfState(order._id, ['待支付', '支付确认中'], {
      status: '已支付',
      paidAt: Date.now(),
      providerTradeNo: event.transactionId
    })
  })

  return 'success'
}
```

注意：`assert` 代表失败时拒绝更新订单；实际回调返回体必须符合对应支付平台或 uniPay 的成功响应格式。

### 6.2 微信支付

如果选择微信支付，应使用 uniPay 对应的微信支付配置和官方 SDK/验签能力。验签前保存平台回调要求的原始报文和请求头，使用平台证书或公钥验证签名，并用 APIv3 密钥解密通知密文；不要先把 JSON 重新序列化后再拿重排后的字符串验签。验签通过后仍必须检查商户订单号、金额、商户号、应用标识和交易状态。

### 6.3 支付宝支付

支付宝异步通知应使用官方 SDK 完成 RSA2 验签。支付宝官方说明要求排除 `sign`、`sign_type` 后对其余参数 URL 解码并排序形成待签名字符串，再用支付宝公钥验签；验签后还要检查 `out_trade_no`、`total_amount`、`seller_id`/`seller_email` 和 `app_id`，并过滤重复通知。只有 `TRADE_SUCCESS` 或 `TRADE_FINISHED` 才能认定付款成功。[10]

支付宝还建议同时接入异步通知和交易查询接口，因为网络异常时可能收不到回调。QueueGo 应由定时任务扫描“支付确认中”订单，调用支付查询接口核对状态，不能让用户无限重复支付。[10]

## 7. 退款、未领取与爽约赔款

退款不能由客户端直接改变订单状态。用户提交退款申请后，服务端根据订单状态、领取时间、商家规则和已退款金额计算可退金额。管理员或商家审核通过后，服务端调用支付退款接口，并使用唯一 `out_refund_no` 幂等。

建议把“退款金额”和“爽约赔款”拆成两个账务字段：

- `refundAmountFen`：实际退回用户的金额。
- `noShowPenaltyFen`：依据已发布规则扣除的金额。

赔款规则必须在下单前展示并让用户确认，不能在领取失败后临时修改。超过领取时间后先进入“爽约待确认”，保留申诉窗口；自动扣款前再次核对没有退款、没有商家取消、没有系统故障豁免。所有扣款和退款都写入不可变审计记录。

## 8. 防重放、并发和业务风控

订单创建、支付、退款和叫号接口必须要求幂等键。服务端保存请求哈希和结果，重复请求返回首次结果。库存扣减和在线/到店双队列更新必须使用数据库事务、条件更新或版本号，避免两个客户端拿到相同库存或相同排队号。

对以下行为做限流和告警：短时间大量下单、同一设备多账号、连续支付失败、重复退款、频繁刷新叫号、管理员批量修改价格。日志中不记录完整手机号、token、支付密文、银行卡信息或任何私钥；订单日志只记录脱敏标识和请求 ID。

## 9. 上线验收清单

- [ ] 已创建独立生产服务空间并记录 `space ID`，没有把测试数据复制到生产。
- [ ] 项目已在 HBuilderX 关联服务空间，云函数目录和入口文件符合标准结构。
- [ ] 所有集合 Schema 已上传，集合权限默认拒绝，索引已建立。
- [ ] uni-id 登录、token 刷新、注销、禁用用户和 RBAC 已通过测试。
- [ ] 普通用户不能读取他人订单，商家不能读取其他商家数据，非管理员不能审核退款。
- [ ] 服务端重新计算金额；客户端改价、改库存、改 UID 的测试全部失败。
- [ ] 微信/支付宝沙箱回调验签、金额不匹配、错误商户号、重复回调和乱序回调测试通过。
- [ ] 支付成功页面、客户端 success 回调和支付平台回调三者被明确区分。
- [ ] 退款、爽约、商家取消和系统故障豁免的状态机测试通过。
- [ ] 生产日志、告警、备份、密钥轮换和审计查询流程已演练。
- [ ] 真机、小程序/H5/App 的支付渠道和域名白名单已分别验证；uniCloud 发行时使用发行流程而不是本地运行产物。[3] [4]

## 10. 当前 QueueGo 的下一步阻塞项

本环境目前没有 DCloud/uniCloud 登录会话、目标服务空间 ID、云厂商选择、支付商户配置或 HBuilderX。因此我不能安全地替用户创建真实云资源、上传云函数、写入线上数据库或代填支付私钥。

此外，当前后端需要先做一次结构化迁移：将 `uniCloud/cloudfunctions/order-create.js` 等示例拆为标准函数目录和 `index.js` 入口；将 `uniCloud/database/*.json` 转换为对应的 `*.schema.json`；补齐 `uni-id`、`uni-pay`、索引、事务和生产配置。完成这些改造后，才能执行“关联服务空间 → 初始化数据库 → 上传 Schema → 上传云函数 → 沙箱联调 → 生产发布”。官方流程要求项目关联服务空间后再上传资源，云函数和 DB Schema 也必须单独发行。[2] [3]

## References

[1]: https://doc.dcloud.net.cn/uniCloud/concepts/space.html "uniCloud 服务空间简介"
[2]: https://doc.dcloud.net.cn/uniCloud/quickstart.html "uniCloud 快速上手"
[3]: https://doc.dcloud.net.cn/uniCloud/publish.html "uniCloud 发行"
[4]: https://doc.dcloud.net.cn/uniCloud/rundebug.html "uniCloud 云函数/云对象运行方式介绍"
[5]: https://doc.dcloud.net.cn/uniCloud/schema.html "uniCloud DB Schema 概述"
[6]: https://doc.dcloud.net.cn/uniCloud/uni-id/summary.html "uni-id 用户体系概述"
[7]: https://doc.dcloud.net.cn/uniCloud/cloud-obj.html "uniCloud 云对象获取 token 与云端信息"
[8]: https://doc.dcloud.net.cn/uniCloud/uni-pay/uni-app.html "uniPay uni-app 端统一支付服务"
[9]: https://uniapp.dcloud.net.cn/api/plugins/payment.html "uni.requestPayment 支付 API"
[10]: https://opendocs.alipay.com/open/203/105286 "支付宝手机网站支付异步通知说明"
