import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const clients = new Map();

export async function connectMcpServer({ id, command, args = [], env = {} }) {
  if (clients.has(id)) return clients.get(id);
  const client = new Client({ name: 'l-agent-orchestrator', version: '0.1.0' });
  const transport = new StdioClientTransport({ command, args, env: { ...process.env, ...env } });
  await client.connect(transport);
  clients.set(id, client);
  return client;
}

export async function listMcpTools() {
  const result = [];
  for (const [serverId, client] of clients) {
    const tools = await client.listTools();
    for (const tool of tools.tools || []) result.push({ serverId, ...tool });
  }
  return result;
}

export async function callMcpTool(serverId, name, args) {
  const client = clients.get(serverId);
  if (!client) throw new Error(`MCP server ${serverId} is not connected`);
  return client.callTool({ name, arguments: args });
}
