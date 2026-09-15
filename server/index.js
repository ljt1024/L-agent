import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { config } from './config.js';
import { appendAudit, listRuns, saveRun, localStore } from './db.js';
import { llmStatus, planWithLLM } from './llm.js';
import { callMcpTool, connectMcpServer, listMcpTools } from './mcp.js';
import { executeInSandbox, sandboxStatus } from './sandbox.js';

const runs = [];
const json = (res, status, payload) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' }); res.end(JSON.stringify(payload)); };
const body = (req) => new Promise((resolve, reject) => { let raw = ''; req.on('data', c => { raw += c; }); req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); } }); req.on('error', reject); });

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type' }); return res.end(); }
  if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok: true, service: 'agent-orchestrator', version: '0.1.0', llm: llmStatus(), sandbox: sandboxStatus(), database: Boolean(config.databaseUrl) });
  if (req.method === 'GET' && url.pathname === '/api/overview') {
    const storedRuns = await listRuns();
    const activeAgents = localStore.agents.filter(agent => agent.status === 'running').length;
    const toolCalls = storedRuns.reduce((total, run) => total + (run.toolCalls?.length || 0), 0);
    return json(res, 200, {
      todayRuns: storedRuns.length,
      activeAgents,
      toolCalls,
      savedHours: Number((storedRuns.length * 0.35).toFixed(1)),
      health: 98,
    });
  }
  if (req.method === 'GET' && url.pathname === '/api/agents') return json(res, 200, { items: localStore.agents });
  if (req.method === 'GET' && url.pathname === '/api/tasks') return json(res, 200, { items: localStore.tasks });
  if (req.method === 'GET' && url.pathname === '/api/memory') return json(res, 200, { items: localStore.memories });
  if (req.method === 'GET' && url.pathname === '/api/schedules') return json(res, 200, { items: localStore.schedules });
  if (req.method === 'GET' && url.pathname === '/api/runs') return json(res, 200, { items: await listRuns() });
  if (req.method === 'GET' && url.pathname === '/api/audit') return json(res, 200, { items: localStore.audit.slice(-50).reverse() });
  if (req.method === 'POST' && url.pathname === '/api/tasks') { const input = await body(req); const item = { id: randomUUID(), ...input, status: 'enabled', result: '尚未运行', createdAt: new Date().toISOString() }; localStore.tasks.push(item); return json(res, 201, { item }); }
  if (req.method === 'POST' && url.pathname === '/api/agents') { const input = await body(req); const item = { id: randomUUID(), ...input, status: 'idle', createdAt: new Date().toISOString() }; localStore.agents.push(item); return json(res, 201, { item }); }
  if (req.method === 'POST' && url.pathname === '/api/memory') { const input = await body(req); const item = { id: randomUUID(), ...input, createdAt: new Date().toISOString() }; localStore.memories.push(item); return json(res, 201, { item }); }
  if (req.method === 'POST' && url.pathname === '/api/schedules') { const input = await body(req); const item = { id: randomUUID(), ...input, status: 'enabled', createdAt: new Date().toISOString() }; localStore.schedules.push(item); return json(res, 201, { item }); }
  if (req.method === 'GET' && url.pathname === '/api/mcp/tools') return json(res, 200, { items: await listMcpTools() });
  if (req.method === 'POST' && url.pathname === '/api/mcp/connect') { const input = await body(req); await connectMcpServer(input); return json(res, 201, { ok: true, tools: await listMcpTools() }); }
  if (req.method === 'POST' && url.pathname === '/api/mcp/call') { const input = await body(req); const result = await callMcpTool(input.serverId, input.name, input.arguments || {}); return json(res, 200, result); }
  if (req.method === 'POST' && url.pathname === '/api/sandbox/exec') { const input = await body(req); const result = await executeInSandbox(input.command, { timeoutMs: input.timeoutMs }); return json(res, 200, result); }
  if (req.method === 'POST' && url.pathname === '/api/runs') {
    const input = await body(req);
    if (typeof input.message !== 'string' || !input.message.trim()) return json(res, 400, { error: 'message 不能为空' });
    if (input.message.length > 20_000) return json(res, 413, { error: 'message 超过 20000 字符限制' });
    const traceId = `TR-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
    const run = { id: randomUUID(), traceId, input: input.message || '', status: 'running', createdAt: new Date().toISOString(), steps: ['意图理解', '加载能力目录', '等待模型决策'] };
    const tools = (await listMcpTools()).map(tool => ({ type: 'function', function: { name: `${tool.serverId}__${tool.name}`, description: tool.description || '', parameters: tool.inputSchema || { type: 'object', properties: {} } } }));
    const plan = await planWithLLM({ message: run.input, tools });
    run.steps = ['意图理解', '加载能力目录', plan.toolCalls.length ? '生成工具调用计划' : '生成最终回复'];
    run.status = 'completed';
    run.response = plan.text;
    await saveRun(run);
    await appendAudit({ traceId, type: 'run.completed', runId: run.id, toolCalls: plan.toolCalls.length });
    return json(res, 201, { run, assistant: plan.text, toolCalls: plan.toolCalls, usage: plan.usage });
  }
  return json(res, 404, { error: 'Not found' });
}
http.createServer((req, res) => route(req, res).catch(e => json(res, 400, { error: e.message }))).listen(config.port, () => console.log(`Agent API listening on http://localhost:${config.port}`));
