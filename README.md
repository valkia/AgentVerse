# AI Agent Discussion Platform

一个基于 React 和 DeepSeek API 的智能代理讨论平台，支持多个 AI 代理之间进行自主对话和讨论。

[English](./README_EN.md) | 简体中文

![演示截图](./screenshots/demo.png)

## ✨ 特性

- 🤖 支持创建和管理多个 AI 代理
- 💬 代理之间可以进行自主对话
- 🎯 可以设定讨论主题和参与者
- 🎨 现代化的 UI 设计，支持亮暗主题
- ⚡️ 基于 DeepSeek API，提供高质量的对话内容
- 📱 响应式设计，支持多种设备

## 🚀 快速开始

### 在线体验

访问我们的在线演示：[Demo Link]

### 本地运行

1. 克隆仓库
```bash
git clone https://github.com/yourusername/ai-agent-discussion.git
cd ai-agent-discussion
```

2. 安装依赖
```bash
pnpm install
```

3. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，添加你的 DeepSeek API Key
```

4. 启动开发服务器
```bash
pnpm dev
```

## 📖 使用指南

### 创建代理

1. 点击左侧面板的"添加代理"按钮
2. 填写代理名称、角色和个性特征
3. 设置是否开启自动回复

### 发起讨论

1. 在主界面输入讨论主题
2. 选择参与讨论的代理
3. 点击"开始讨论"按钮

### 管理对话

- 可以随时暂停或继续讨论
- 支持手动发送消息给特定代理
- 可以调整代理的回复频率

## 🛠 技术栈

- **前端框架**: React + TypeScript
- **构建工具**: Vite
- **UI组件**: Shadcn/ui
- **样式方案**: TailwindCSS
- **API集成**: DeepSeek API

## 🤝 贡献指南

我们欢迎任何形式的贡献！

1. Fork 本仓库
2. 创建你的特性分支 (git checkout -b feature/AmazingFeature)
3. 提交你的更改 (git commit -m 'Add some AmazingFeature')
4. 推送到分支 (git push origin feature/AmazingFeature)
5. 开启一个 Pull Request

详细的开发指南请查看 [开发文档](./docs/development-guide.md)

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [DeepSeek](https://deepseek.com) - 提供强大的 AI 模型支持
- [Shadcn/ui](https://ui.shadcn.com/) - 优秀的 UI 组件库
- [React](https://reactjs.org/) - 出色的前端框架

## 📞 联系我们

- 提交 Issue: [GitHub Issues](https://github.com/yourusername/ai-agent-discussion/issues)
- 邮件联系: your.email@example.com

## 🔗 相关链接

- [更新日志](./CHANGELOG.md)
- [贡献者](./CONTRIBUTORS.md)
- [行为准则](./CODE_OF_CONDUCT.md)
