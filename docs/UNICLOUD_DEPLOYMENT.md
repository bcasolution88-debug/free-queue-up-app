# QueueGo uniCloud 环境配置与部署指南

## 当前状态

本仓库暂未绑定 uniCloud 服务空间。当前 `uniCloud/` 目录是历史归集目录，不是可直接发行的标准 HBuilderX uniCloud 目录：云函数应按函数拆成目录并使用 `index.js` 作为入口，数据库 Schema 应使用 `集合名.schema.json`。

因此，本文件先完成可审查的部署方案；真实部署需要 DCloud 账号登录、云厂商选择和目标 `space ID`。uniCloud 服务空间包含隔离的数据库、云存储和云函数资源；项目必须先创建或关联服务空间，之后才能上传云函数和 Schema。[1]

## 需要用户提供或在 HBuilderX 中完成的输入

1. DCloud 账号登录状态。
2. 云厂商：阿里云、腾讯云或支付宝云。若没有特别要求，建议先用阿里云开发者版/测试空间进行沙箱联调。
3. 目标服务空间 ID；生产环境不要使用开发测试空间。
4. 支付渠道及其沙箱配置：微信支付或支付宝支付的应用/商户标识、平台证书/公钥和服务端密钥。密钥只能在云端配置，不要发到聊天或提交到 Git。
5. 生产前端域名、H5 跨域域名或小程序合法域名（如适用）。

## HBuilderX 配置流程

1. 安装最新版 HBuilderX，并导入 `/home/ubuntu/queuego-app`。
2. 检查 `manifest.json` 中的 DCloud AppID；没有 AppID 时在 HBuilderX 中重新获取。
3. 在项目根目录创建 uniCloud 云开发环境，选择目标云厂商。现有历史 `uniCloud/` 目录应先备份，再按目标供应商生成标准目录。
4. 右键 `uniCloud-aliyun`、`uniCloud-tcb` 或 HBuilderX 生成的供应商目录，选择“关联云服务空间”，选择目标 `space ID`。
5. 执行一次数据库初始化前的代码审查：禁止把演示订单、测试密码或真实支付密钥放进生产空间。
6. 右键云函数目录，逐个“上传并运行”或使用 uniCloud 初始化向导上传全部函数。
7. 右键 `database` 目录上传全部 Schema；Schema 在 HBuilderX 中保存不会自动上传，必须显式上传。[2] [3]
8. 在 HBuilderX 的客户端云函数控制台切换到云端，执行登录、商家列表、下单、支付沙箱、排队和退款测试。云函数本地运行时仍可能连接云端数据库，测试数据必须隔离。[4]

## 目录迁移目标

将当前历史文件迁移为类似下面的结构。迁移前不要直接覆盖原目录：

```text
uniCloud-aliyun/
├── cloudfunctions/
│   ├── order-create/
│   │   └── index.js
│   ├── queue-info/
│   │   └── index.js
│   ├── shop-list/
│   │   └── index.js
│   ├── payment/
│   │   └── index.js
│   └── shop-notify/
│       └── index.js
├── database/
│   ├── shops.schema.json
│   ├── products.schema.json
│   ├── orders.schema.json
│   └── queues.schema.json
└── cloudfunctions/common/
    └── uni-config-center/
        └── uni-id/config.json
```

入口文件名和目录结构应以当前 HBuilderX 生成模板为准。官方快速上手文档说明，JavaScript 云函数的源码入口是 `index.js`，云对象则使用 `index.obj.js`；云函数和 Schema 需要通过 HBuilderX 或发行流程上传到已关联的服务空间。[2] [3]

## 数据库初始化顺序

先创建 `uni-id` 所需集合和角色权限，再创建 QueueGo 业务集合：`shops`、`products`、`orders`、`queues`、`refunds`、`payment_notifications`、`audit_logs`。为订单号、用户 UID、商家 ID、支付单号、幂等键、队列来源和状态建立查询所需索引。

Schema 中关闭普通用户对订单、退款和支付通知的任意写入权限；涉及复杂角色和商家归属的操作统一走云函数或云对象。Schema 负责类型和值域校验，云函数负责身份、角色、商家范围和业务状态机校验。[5]

## 支付环境配置顺序

1. 先在支付服务商沙箱申请应用/商户配置。
2. 在 uniPay 配置中只保存服务端所需密钥；不要把任何私钥放入 `src/`、`manifest.json` 或前端构建产物。
3. 先创建 QueueGo 业务订单，再由服务端创建 uniPay 支付单；支付金额必须从服务端订单读取。
4. 配置异步通知，并实现签名验证、订单号验证、金额验证、商户标识验证和重复通知幂等。
5. 用沙箱完成支付成功、取消、超时、重复回调、金额篡改和退款测试后，才能切换生产商户配置。

uniPay 官方文档明确要求业务先创建自己的订单，并在支付回调中校验业务订单金额；客户端支付 API 的成功回调不是服务端付款事实。[8] [9]

## H5/小程序域名与发行

H5 使用云函数时，需要在 uniCloud 控制台配置前端安全域名；小程序还需在对应平台配置 request、uploadFile、downloadFile 等合法域名。生产体验版和正式版必须使用发行流程生成，不要把本地运行产物当成正式包。[3]

## 部署后验收

```text
[ ] 服务空间 ID 和云厂商已记录在发布记录中
[ ] 生产空间与测试空间隔离
[ ] uni-id 登录、token 续期、注销、禁用和角色校验通过
[ ] 所有云函数日志不打印 token、私钥、支付密文和完整手机号
[ ] Schema 已上传且普通用户无越权写权限
[ ] 云函数入口和依赖可在云端运行
[ ] 下单服务端重算金额和库存，重复幂等键返回同一结果
[ ] 支付沙箱回调验签和金额校验通过
[ ] 重复/乱序/伪造支付回调不会重复发货或重复扣库存
[ ] 退款和爽约扣款都有审计日志与幂等退款单号
[ ] 生产域名、白名单、告警、备份和密钥轮换已验证
```

## 本次未执行的线上动作

本环境没有可用的 HBuilderX 图形化发行工具，也没有目标 uniCloud 服务空间 ID 或 DCloud 授权会话。因此本次没有创建线上服务空间、没有上传云函数、没有写入线上集合，也没有触碰任何支付密钥。这些动作必须在用户明确选择云厂商和目标服务空间后执行，避免误部署到错误环境。

## References

[1]: https://doc.dcloud.net.cn/uniCloud/concepts/space.html "uniCloud 服务空间简介"
[2]: https://doc.dcloud.net.cn/uniCloud/quickstart.html "uniCloud 快速上手"
[3]: https://doc.dcloud.net.cn/uniCloud/publish.html "uniCloud 发行"
[4]: https://doc.dcloud.net.cn/uniCloud/rundebug.html "uniCloud 云函数/云对象运行方式介绍"
[5]: https://doc.dcloud.net.cn/uniCloud/schema.html "uniCloud DB Schema 概述"
[8]: https://doc.dcloud.net.cn/uniCloud/uni-pay/uni-app.html "uniPay uni-app 端统一支付服务"
[9]: https://uniapp.dcloud.net.cn/api/plugins/payment.html "uni.requestPayment 支付 API"
