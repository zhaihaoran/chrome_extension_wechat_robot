# wechat-chrome-extension
微信chrome浏览器插件

### 功能

- 用于勾选多个群，按照群中好友单独私密发送自定义消息或文件
- 设定关键词或问题进行自动回复
- (todo) 批量修改群备注

### 注意事项

- 发言间隔设定至少不小于 5s
- 不可批量群发重复消息消息多次（<5）

发言间隔时间过短、大量发送重复性消息会致使账号web端被限制登陆

### 技术栈

- 主要基于wechat4u模块进行微信模拟登陆、群发消息。
- vue + webpack + chrome db 进行页面渲染、前端部署和数据储存
- chrome插件开发 涉及到插件通信、content-script中js注入的相关知识

### CLI
- app 为 chrome 应用的目录
```
<!-- 热编译 -->
npm run build
```
