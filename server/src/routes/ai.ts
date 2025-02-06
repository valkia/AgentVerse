import express from 'express';
import { OpenAI } from 'openai';
import { ChatCompletionCreateParams, ChatCompletionChunk } from 'openai/resources/chat/completions';
import { APIError } from 'openai/error';

const router = express.Router();

type ExtendedChatCompletionParams = ChatCompletionCreateParams & {
  provider?: string;
};

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
    const { provider = 'deepseek', ...params } = req.body as ExtendedChatCompletionParams;
    
    const client = createOpenAIClient(provider);
    const completion = await client.chat.completions.create({
      ...params,
      stream: false,
    });
    
    res.json(completion);
  } catch (error) {
    console.error('AI API Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      code: (error as APIError)?.code,
      type: (error as APIError)?.type
    });
  }
});

// 流式聊天补全接口
router.get('/chat/stream', async (req, res) => {
  try {
    const provider = req.query.provider as string || 'deepseek';
    const messages = JSON.parse(req.query.messages as string);
    const model = req.query.model as string;
    const temperature = req.query.temperature ? parseFloat(req.query.temperature as string) : undefined;
    const max_tokens = req.query.maxTokens ? parseInt(req.query.maxTokens as string, 10) : undefined;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const client = createOpenAIClient(provider);
    const stream = await client.chat.completions.create({
      messages,
      model,
      temperature,
      max_tokens,
      stream: true,
    });

    for await (const chunk of stream as AsyncIterable<ChatCompletionChunk>) {
      const data = JSON.stringify({
        choices: [{
          delta: {
            content: chunk.choices[0]?.delta?.content
          }
        }]
      });
      res.write(`data: ${data}\n\n`);
    }

    res.write('data: [DONE]\n\n');
  } catch (error) {
    console.error('AI Stream API Error:', error);
    res.write(`data: ${JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      code: (error as APIError)?.code,
      type: (error as APIError)?.type
    })}\n\n`);
  } finally {
    res.end();
  }
});

export { router }; 