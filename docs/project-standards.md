# 项目规范文档

## 技术栈
- React 18 + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- pnpm

## 目录结构
```
src/
├── assets/        # 静态资源文件
├── components/    # 可复用组件
│   ├── ui/       # UI 基础组件
│   └── common/   # 业务通用组件
├── hooks/        # 自定义 Hooks
├── layouts/      # 布局组件
├── pages/        # 页面组件
├── services/     # API 服务
├── stores/       # 状态管理
├── styles/       # 全局样式
├── types/        # TypeScript 类型定义
└── utils/        # 工具函数
```

## 命名规范

### 文件命名
- 所有文件和目录名统一使用小写字母，单词之间用连字符（-）连接
- 组件文件：`button-primary.tsx`, `user-profile.tsx`
- 组件目录：`button/`, `user-profile/`
- 工具文件：`date-formatter.ts`, `string-utils.ts`
- 样式文件：与组件同名，`button-primary.css`
- 测试文件：与被测试文件同名，加上.test后缀，`button-primary.test.tsx`
- 服务文件：使用 `.service.ts` 后缀，如 `authentication.service.ts`

### 服务类规范
```typescript
// user.service.ts

export class UserService {
  private readonly apiUrl = '/api/users';

  constructor(private httpClient: HttpClient) {}

  async getUsers(): Promise<User[]> {
    return this.httpClient.get(this.apiUrl);
  }

  async getUserById(id: string): Promise<User> {
    return this.httpClient.get(`${this.apiUrl}/${id}`);
  }
}
```

### 组件命名规范
- 文件名：使用 kebab-case（例：`user-profile.tsx`）
- 组件名：使用 PascalCase（例：`export function UserProfile`）
- Props 接口：使用 PascalCase + Props（例：`interface UserProfileProps`）
- 目录名：使用 kebab-case（例：`user-profile/index.tsx`）

### 变量命名
- 普通变量：使用 camelCase
- 常量：使用 UPPER_SNAKE_CASE
- 私有变量：使用下划线前缀（例：`_privateVar`）

## 代码规范

### TypeScript
- 启用严格模式（`strict: true`）
- 必须声明类型，避免使用 `any`
- 优先使用 `interface` 而不是 `type`

### React 相关
- 使用函数式组件
- Props 必须定义类型接口
- 使用 ES6+ 语法
- 优先使用 Hooks 而不是 Class 组件

### 文件大小限制
- 单个 TSX/TS 文件不应超过 300 行（包含空行和注释）
- 推荐保持在 150-200 行以内
- 超过限制时的拆分原则：
  1. 将独立的 UI 组件拆分到单独文件
  2. 将复杂的业务逻辑抽离到 hooks
  3. 将类型定义移到 types 目录
  4. 将配置项移到 config 目录
  5. 将工具函数移到 utils 目录

### 样式规范
- 使用 Tailwind CSS 工具类
- 复杂样式使用 CSS Modules
- 避免内联样式
- 遵循移动优先的响应式设计原则

## Git 提交规范

提交信息格式：
```
<type>(<scope>): <subject>

<body>

<footer>
```

类型（type）：
- feat: 新功能
- fix: Bug 修复
- docs: 文档更新
- style: 代码格式（不影响代码运行的变动）
- refactor: 重构（既不是新增功能，也不是修复 bug）
- test: 增加测试
- chore: 构建过程或辅助工具的变动

## 开发流程
1. 从 main 分支创建特性分支
2. 开发完成后提交 PR
3. 代码审查通过后合并到 main 分支
4. 定期打 tag 发布版本

## 性能优化准则
- 合理使用 React.memo 和 useMemo
- 避免不必要的重渲染
- 图片资源使用适当的格式和大小
- 按需加载组件和模块 