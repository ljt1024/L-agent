import 'dotenv/config';

export const config = {
  port: Number(process.env.AGENT_API_PORT || 8787),
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiBaseUrl: process.env.OPENAI_BASE_URL || undefined,
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  databaseUrl: process.env.DATABASE_URL || '',
  dockerSandboxEnabled: process.env.DOCKER_SANDBOX_ENABLED === 'true',
  dockerImage: process.env.DOCKER_SANDBOX_IMAGE || 'node:22-alpine',
  maxToolRounds: Number(process.env.AGENT_MAX_TOOL_ROUNDS || 12),
};
