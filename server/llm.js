import OpenAI from 'openai';
import { config } from './config.js';

let client;
if (config.openaiApiKey) client = new OpenAI({ apiKey: config.openaiApiKey, baseURL: config.openaiBaseUrl });

export function llmStatus() { return { configured: Boolean(client), model: config.openaiModel, provider: config.openaiBaseUrl ? 'compatible' : 'openai' }; }

export async function planWithLLM({ message, tools = [] }) {
  if (!client) return { text: '本地编排模式：已完成意图理解，正在按安全策略准备工具调用。配置 OPENAI_API_KEY 后将启用真实模型推理。', toolCalls: [] };
  const completion = await client.chat.completions.create({ model: config.openaiModel, temperature: 0.2, messages: [{ role: 'system', content: '你是企业级 Agent Orchestrator。遵守工具权限、真实数据和破坏性操作二次确认纪律。输出简洁、可审计。' }, { role: 'user', content: message }], tools: tools.length ? tools : undefined, tool_choice: tools.length ? 'auto' : undefined });
  const choice = completion.choices?.[0]?.message;
  return { text: choice?.content || '模型返回了工具调用计划。', toolCalls: choice?.tool_calls || [], usage: completion.usage || null };
}
