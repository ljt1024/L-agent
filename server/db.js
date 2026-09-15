import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;
let pool;
const memory = {
  runs: [], audit: [],
  agents: [
    { id: 'orchestrator', name: '主 Agent', description: '意图理解、任务拆解与结果汇总', type: 'orchestrator', status: 'running' },
    { id: 'customer-insights', name: '客户洞察', description: '读取反馈、聚类主题、生成行动建议', type: 'subagent', status: 'idle' },
    { id: 'researcher', name: '研究员', description: '竞品信息检索与周报编排', type: 'subagent', status: 'idle' },
  ],
  tasks: [
    { id: 'task-feedback', name: '客户反馈洞察', schedule: '每周一 09:00', agentId: 'customer-insights', status: 'enabled', result: '成功 12 次' },
    { id: 'task-pricing', name: '竞品价格周报', schedule: '每周五 16:30', agentId: 'researcher', status: 'enabled', result: '成功 8 次' },
  ],
  memories: [
    { id: 'mem-1', content: '用户偏好简洁输出，结论先行。', type: 'user' },
    { id: 'mem-2', content: '项目文件默认写入 /workspace/deliverables。', type: 'assistant' },
  ],
  schedules: [{ id: 'schedule-1', taskId: 'task-feedback', nextRunAt: '2026-08-20T09:00:00+08:00', status: 'enabled' }],
};

if (config.databaseUrl) pool = new Pool({ connectionString: config.databaseUrl, max: 10, idleTimeoutMillis: 30_000 });

export async function query(text, params = []) {
  if (pool) return pool.query(text, params);
  return { rows: [] };
}

export async function saveRun(run) {
  memory.runs.push(run);
  if (pool) await pool.query('INSERT INTO agent_runs(id, trace_id, input, status, payload) VALUES($1,$2,$3,$4,$5)', [run.id, run.traceId, run.input, run.status, run]);
  return run;
}

export async function listRuns() {
  if (pool) return (await pool.query('SELECT payload FROM agent_runs ORDER BY created_at DESC LIMIT 20')).rows.map(row => row.payload);
  return memory.runs.slice(-20).reverse();
}

export async function appendAudit(entry) {
  memory.audit.push(entry);
  if (pool) await pool.query('INSERT INTO audit_events(trace_id, event_type, payload) VALUES($1,$2,$3)', [entry.traceId, entry.type, entry]);
}

export const localStore = memory;
