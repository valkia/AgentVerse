# 开发指南

## 技术栈

- **前端框架**: React + TypeScript
- **构建工具**: Vite
- **包管理**: PNPM
- **样式方案**: TailwindCSS
- **UI组件**: Shadcn/ui
- **代码规范**: ESLint + Prettier

## 开发环境设置

### 必要工具
- Node.js >= 18
- pnpm >= 8.0
- VS Code（推荐）

### VS Code 推荐插件
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)
- GitLens

### 1. 安装依赖

```bash
# 安装依赖
pnpm install
```

### 2. 开发服务器

```bash
# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
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

## 代码规范

### 组件开发规范

1. 使用函数组件和 Hooks
2. 属性类型使用 interface 定义
3. 组件文件使用 PascalCase 命名
4. 导出的组件需要添加适当的注释

```typescript
interface ComponentProps {
  // 属性定义
}

export function Component({ prop1, prop2 }: ComponentProps) {
  // 组件实现
}
```

### 样式开发规范

1. 使用 Tailwind CSS 类名
2. 遵循移动优先的响应式设计
3. 使用主题变量而不是硬编码值
4. 使用 shadcn/ui 的设计令牌

```tsx
<div className="flex flex-col md:flex-row">
  <div className="w-full md:w-1/2 p-4">
    {/* 内容 */}
  </div>
</div>
```

### Git 提交规范

```bash
# 提交格式
<type>(<scope>): <subject>

# 示例
feat(discussion): 添加讨论主题输入
fix(chat): 修复消息滚动问题
style(ui): 优化按钮样式
```

## 发布流程

1. 版本号更新
```bash
pnpm version <major|minor|patch>
```

2. 构建检查
```bash
pnpm lint
pnpm test
pnpm build
```

3. 生成变更日志

4. 创建发布标签

## 环境变量

项目使用不同的环境变量文件：

- `.env.development` - 开发环境
- `.env.production` - 生产环境
- `.env.test` - 测试环境

必要的环境变量：

```bash
VITE_DEEPSEEK_API_KEY=your_api_key
```

## 性能优化

1. 组件优化
   - 使用 memo 避免不必要的重渲染
   - 使用 useMemo 和 useCallback 优化性能
   - 实现虚拟滚动处理长列表

2. 构建优化
   - 使用动态导入进行代码分割
   - 优化图片资源
   - 合理使用缓存策略

## 常见问题

### 1. 开发环境配置问题

问题：启动开发服务器失败
解决：检查 Node.js 版本，确保使用 v16 或更高版本

### 2. 构建问题

问题：构建产物体积过大
解决：检查依赖项，使用 `pnpm build --debug` 分析构建过程

### 3. 样式问题

问题：暗色模式样式不生效
解决：确保正确使用 Tailwind 的暗色模式类名

## 测试规范

### 单元测试
```tsx
// 组件测试示例
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct label', () => {
    render(<Button label="点击我" />);
    expect(screen.getByText('点击我')).toBeInTheDocument();
  });
});
```

## 部署流程

1. 构建检查
```bash
# 运行所有检查
pnpm lint
pnpm test
pnpm build
```

2. 环境变量配置
- 开发环境：`.env.development`
- 生产环境：`.env.production`
- 测试环境：`.env.test`

## 常见问题解决

### 1. 构建优化
- 使用动态导入进行代码分割
- 优化图片资源
- 合理使用缓存策略

### 2. 性能优化
- 使用 React.memo() 避免不必要的重渲染
- 使用 useMemo 和 useCallback 优化性能
- 实现虚拟列表处理大数据列表

### 3. 调试技巧
- 使用 React Developer Tools
- 使用 Chrome DevTools 的 Performance 面板
- 使用 console.time() 和 console.timeEnd() 测量性能 