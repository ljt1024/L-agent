export async function createRun(message) {
  let response;
  try {
    response = await fetch('/api/runs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message }) });
  } catch (error) {
    throw new Error('无法连接 Agent API，请先运行 npm run api（或 npm run dev:full）');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Agent API 不可用，请确认后端已启动');
  return data;
}

export async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(path, { headers: { 'content-type': 'application/json', ...(options.headers || {}) }, ...options });
  } catch (error) {
    throw new Error('无法连接 Agent API，请确认后端运行在 localhost:8787');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `请求失败（${response.status}）`);
  return data;
}
