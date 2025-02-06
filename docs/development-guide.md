# 开发指南

## 技术栈

- **前端框架**: React + TypeScript
- **构建工具**: Vite
- **包管理**: PNPM
- **样式方案**: TailwindCSS
- **UI组件**: Shadcn/ui

## 开发环境设置

### 必要工具
- Node.js >= 18
- pnpm >= 8.0
- VS Code（推荐）

### VS Code 推荐插件
- ESLint
- Prettier
- Tailwind CSS IntelliSense

### 开发流程

1. 安装依赖
```bash
pnpm install
```

2. 开发服务器
```bash
# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

## 项目结构

```
src/
├── components/         # 组件目录
│   ├── agent/         # Agent相关组件
│   ├── chat/          # 聊天相关组件
│   ├── discussion/    # 讨论相关组件
│   └── ui/            # 通用UI组件
├── services/          # 服务层
├── types/             # TypeScript类型定义
├── styles/            # 全局样式
└── lib/              # 工具函数和通用逻辑
```

## 环境变量

项目使用 `.env` 文件配置环境变量：

```bash
# AI Provider 配置
VITE_AI_PROVIDER=dashscope  # 可选值: dashscope, deepseek, dobrain, moonshot, openai
VITE_AI_USE_PROXY=false
VITE_AI_PROXY_URL=https://api.deepseek.com

# 根据选择的 AI 提供商，配置对应的 API Key 和其他参数
# DeepSeek
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key

# Moonshot
VITE_MOONSHOT_API_KEY=your_moonshot_api_key

# 豆包
VITE_DOBRAIN_API_KEY=your_dobrain_api_key

# OpenAI
VITE_OPENAI_API_KEY=your_openai_api_key

# 阿里云 DashScope
VITE_DASHSCOPE_API_KEY=your_dashscope_api_key
```

其他配置参数可参考 `.env.example` 文件。

## 代码规范

### Git 提交规范

```bash
# 提交格式
<type>(<scope>): <subject>

# 示例
feat(discussion): 添加讨论主题输入
fix(chat): 修复消息滚动问题
style(ui): 优化按钮样式
```

## 常见问题

### 1. 开发环境配置问题

问题：启动开发服务器失败
解决：检查 Node.js 版本，确保使用 v18 或更高版本

### 2. 样式问题

问题：暗色模式样式不生效
解决：确保正确使用 Tailwind 的暗色模式类名 