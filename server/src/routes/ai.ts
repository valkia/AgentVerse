import express from 'express';
import { OpenAI } from 'openai';
import { ChatCompletionCreateParams } from 'openai/resources/chat/completions';

const router = express.Router();

// 创建 OpenAI 客户端实例的工厂函数
function createOpenAIClient(provider: string): OpenAI {
  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`];
  const baseURL = process.env[`${provider.toUpperCase()}_API_URL`];

  if (!apiKey) {
    throw new Error(`Missing API key for provider: ${provider}`);
  }

  return new OpenAI({
    apiKey,
    baseURL,
  });
}

// 聊天补全接口
router.post('/chat', async (req, res) => {
  try {
    const { provider = 'deepseek', ...params } = req.body as ChatCompletionCreateParams & { provider?: string };
    
    const client = createOpenAIClient(provider);
    const completion = await client.chat.completions.create(params);
    
    res.json(completion);
  } catch (error: any) {
    console.error('AI API Error:', error);
    res.status(500).json({ 
      error: error.message,
      code: error.code,
      type: error.type
    });
  }
});

export { router }; 