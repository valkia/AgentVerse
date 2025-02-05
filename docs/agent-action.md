1. **AI 接口层**（与 AI 交互的格式）：
```markdown
// 单个 action
<action await>
{
    "capability": "checkSystem",
    "params": {}
}
</action>

// action group（并发执行）
<action-group await>
  <action>
    { "capability": "checkDisk" }
  </action>
  <action>
    { "capability": "checkMemory" }
  </action>
</action-group>

// flow（顺序执行）
<flow await>
  <action await>
    { "capability": "step1" }
  </action>
  <action-group await>
    <action>{ "capability": "step2a" }</action>
    <action>{ "capability": "step2b" }</action>
  </action-group>
</flow>
```

2. **内部实现**：
```typescript
// 基础接口
interface Action {
  capability: string;
  params: Record<string, unknown>;
  await?: boolean;
}

interface ActionGroup {
  actions: Action[];
  await?: boolean;
}

interface Flow {
  operations: (Action | ActionGroup)[];
  await?: boolean;
}

// 解析器
class ActionParser {
  parse(content: string): (Action | ActionGroup | Flow)[] {
    const operations = [];
    
    // 解析 flow
    const flowMatches = content.matchAll(/<flow(?:\s+await)?>([\s\S]*?)<\/flow>/g);
    for (const match of flowMatches) {
      const isAwait = match[0].includes('await');
      operations.push({
        type: 'flow',
        await: isAwait,
        operations: this.parseFlowContent(match[1])
      });
    }
    
    // 解析 action-group
    const groupMatches = content.matchAll(/<action-group(?:\s+await)?>([\s\S]*?)<\/action-group>/g);
    for (const match of groupMatches) {
      const isAwait = match[0].includes('await');
      operations.push({
        type: 'group',
        await: isAwait,
        actions: this.parseGroupContent(match[1])
      });
    }
    
    // 解析单个 action
    const actionMatches = content.matchAll(/<action(?:\s+await)?>([\s\S]*?)<\/action>/g);
    for (const match of actionMatches) {
      const isAwait = match[0].includes('await');
      const action = JSON.parse(match[1]);
      operations.push({
        ...action,
        await: isAwait
      });
    }
    
    return operations;
  }
}

// 执行器
class ActionExecutor {
  async execute(operation: Action | ActionGroup | Flow): Promise<void> {
    if (this.isFlow(operation)) {
      // 顺序执行
      for (const op of operation.operations) {
        if (operation.await) {
          await this.execute(op);
        } else {
          this.execute(op).catch(console.error);
        }
      }
    } else if (this.isGroup(operation)) {
      // 并发执行
      const promises = operation.actions.map(action => 
        this.executeAction(action)
      );
      
      if (operation.await) {
        await Promise.all(promises);
      }
    } else {
      // 单个 action
      const promise = this.executeAction(operation);
      if (operation.await) {
        await promise;
      }
    }
  }
}
```

这个方案的特点：
1. 保持了三层结构：
   - `action`: 原子操作
   - `action-group`: 并发执行组
   - `flow`: 顺序执行流

2. 每层都支持 await 控制

3. XML 风格的标记语言对 AI 友好

4. 内部实现清晰且类型安全

