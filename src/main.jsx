import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, ArrowUpRight, Bot, BrainCircuit, CalendarClock, Check, ChevronDown,
  CircleDot, Clock3, Command, Database, FileText, Gauge, Layers3, Library,
  MessageSquare, MoreHorizontal, Network, Play, Plus, Search, Send, Settings2,
  ShieldCheck, Sparkles, TerminalSquare, Wrench, X, Zap
} from 'lucide-react';
import './styles.css';
import { apiRequest, createRun } from './api';

const navItems = [
  { id: 'overview', label: '总览', icon: Gauge },
  { id: 'workbench', label: '工作台', icon: MessageSquare },
  { id: 'agents', label: '智能体', icon: Bot },
  { id: 'tasks', label: '固化任务', icon: Layers3 },
  { id: 'skills', label: 'Skills', icon: Library },
  { id: 'memory', label: '记忆', icon: BrainCircuit },
  { id: 'schedules', label: '调度', icon: CalendarClock },
  { id: 'audit', label: '可观测性', icon: Activity },
];

const initialMessages = [
  { role: 'assistant', title: '主 Agent', text: '早上好，林嘉。你的工作区已就绪。我可以帮你拆解任务、调用工具或编排一个 Sub-agent。', time: '09:41' },
  { role: 'user', title: '你', text: '分析上周的客户反馈，并给我一份可执行的产品改进清单。', time: '09:42' },
  { role: 'assistant', title: '主 Agent', text: '收到。我会先读取反馈资料，再按主题聚类，最后把高频问题转成优先级清单。', time: '09:42', tool: 'ReadFile · customer_feedback_2026W33.csv' },
];

function App() {
  const [active, setActive] = useState('overview');
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState('');

  const pageTitle = useMemo(() => navItems.find(item => item.id === active)?.label || '总览', [active]);

  const pushMessage = async () => {
    if (!input.trim() || running) return;
    const value = input.trim();
    setMessages(prev => [...prev, { role: 'user', title: '你', text: value, time: '现在' }]);
    setInput('');
    setRunning(true);
    try {
      const result = await createRun(value);
      const plannedTool = result.toolCalls?.[0]?.function?.name;
      setMessages(prev => [...prev, { role: 'assistant', title: '主 Agent', text: result.assistant, time: '现在', tool: plannedTool ? `Tool.call · ${plannedTool}` : undefined }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', title: '系统', text: `运行失败：${error.message}`, time: '现在' }]);
    }
    setRunning(false);
  };

  const showNotice = (text) => { setNotice(text); window.setTimeout(() => setNotice(''), 2400); };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Sparkles size={16} /></div><div><strong>织核</strong><span>AGENT OPS</span></div></div>
        <div className="workspace-switch"><div className="workspace-avatar">L</div><div className="workspace-copy"><b>林嘉的工作区</b><small>个人空间 · 已同步</small></div><ChevronDown size={15} /></div>
        <div className="nav-label">OPERATE</div>
        <nav>{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={active === id ? 'nav-item active' : 'nav-item'} onClick={() => setActive(id)}><Icon size={17} /><span>{label}</span>{id === 'audit' && <em>3</em>}</button>)}</nav>
        <div className="sidebar-bottom"><div className="status-line"><span className="status-dot" />系统运行正常</div><button className="nav-item"><Settings2 size={17} /><span>设置</span></button><div className="user-card"><div className="user-avatar">LJ</div><div><b>Lin Jia</b><small>管理员</small></div><MoreHorizontal size={17} /></div></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="crumb"><span>织核</span><span>/</span><b>{pageTitle}</b></div><div className="top-actions"><div className="command-search"><Search size={15} /><span>搜索任何内容</span><kbd>⌘ K</kbd></div><button className="icon-button" title="通知" onClick={() => showNotice('暂无新的通知')}><CircleDot size={18} /></button><button className="run-button" onClick={() => setActive('workbench')}><Play size={15} fill="currentColor" /> 新建运行</button></div></header>
        <div className="content-wrap">
          {active === 'overview' && <Overview onNavigate={setActive} onNotice={showNotice} />}
          {active === 'workbench' && <Workbench messages={messages} input={input} setInput={setInput} pushMessage={pushMessage} running={running} />}
          {active === 'agents' && <DynamicAgents onNotice={showNotice} />}
          {active === 'tasks' && <DynamicTasks onNotice={showNotice} />}
          {active === 'skills' && <Skills onNotice={showNotice} />}
          {active === 'memory' && <DynamicMemory onNotice={showNotice} />}
          {active === 'schedules' && <DynamicSchedules onNotice={showNotice} />}
          {active === 'audit' && <DynamicAudit />}
        </div>
      </main>
      {notice && <div className="toast"><Check size={16} />{notice}</div>}
    </div>
  );
}

function Overview({ onNavigate, onNotice }) {
  const [metrics, setMetrics] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    apiRequest('/api/overview').then(data => { if (!cancelled) setMetrics(data); }).catch(() => {}).finally(() => { if (!cancelled) setOverviewLoading(false); });
    return () => { cancelled = true; };
  }, []);
  return <>
    <section className="hero-row"><div><p className="eyebrow">THURSDAY · 20 AUG 2026</p><h1>让复杂工作，<span>自动发生。</span></h1><p className="hero-copy">从一次对话到一套可复用的智能流程。主 Agent 正在替你编排 12 个能力节点。</p></div><div className="hero-orbit"><div className="orbit orbit-1" /><div className="orbit orbit-2" /><div className="orbit-core"><Sparkles size={25} /></div><span className="orbit-label label-a">记忆</span><span className="orbit-label label-b">工具</span><span className="orbit-label label-c">任务</span></div></section>
    <section className="metric-grid"><Metric label="今日运行" value={overviewLoading ? '—' : metrics?.todayRuns ?? 0} delta="实时统计" tone="green" icon={Zap} /><Metric label="活跃智能体" value={overviewLoading ? '—' : String(metrics?.activeAgents ?? 0).padStart(2, '0')} delta="当前运行中" tone="blue" icon={Bot} /><Metric label="工具调用" value={overviewLoading ? '—' : metrics?.toolCalls ?? 0} delta="来自运行记录" tone="amber" icon={Wrench} /><Metric label="节省时间" value={overviewLoading ? '—' : `${metrics?.savedHours ?? 0}h`} delta="估算累计" tone="violet" icon={Clock3} /></section>
    <div className="dashboard-grid"><section className="panel activity-panel"><div className="panel-head"><div><p className="eyebrow">LIVE STREAM</p><h2>运行中的会话</h2></div><button className="text-button" onClick={() => onNavigate('audit')}>查看全部 <ArrowUpRight size={14} /></button></div><div className="run-list"><RunRow color="cyan" name="客户反馈洞察" agent="主 Agent → 客户洞察" status="正在分析  ·  03:42" progress={64} /><RunRow color="orange" name="竞品价格周报" agent="主 Agent → 研究员" status="等待确认" progress={100} warning /><RunRow color="lime" name="内容发布排期" agent="内容编排器" status="已完成  ·  08:17" progress={100} done /></div></section><section className="panel quick-panel"><div className="panel-head"><div><p className="eyebrow">QUICK START</p><h2>从这里开始</h2></div><Sparkles size={18} className="muted-icon" /></div><div className="quick-list"><QuickCard icon={MessageSquare} title="开始一段对话" desc="让主 Agent 帮你拆解工作" onClick={() => onNavigate('workbench')} /><QuickCard icon={Layers3} title="创建固化任务" desc="把成功流程变成 Sub-agent" onClick={() => onNavigate('tasks')} /><QuickCard icon={Wrench} title="接入一个工具" desc="通过 MCP 扩展能力边界" onClick={() => onNavigate('skills')} /></div></section></div>
    <section className="lower-grid"><section className="panel chart-panel"><div className="panel-head"><div><p className="eyebrow">THROUGHPUT</p><h2>运行吞吐</h2></div><button className="select-button">过去 7 天 <ChevronDown size={14} /></button></div><div className="chart"><div className="chart-y"><span>40</span><span>30</span><span>20</span><span>10</span><span>0</span></div><div className="chart-area"><div className="grid-line" /><div className="grid-line" /><div className="grid-line" /><div className="grid-line" /><svg viewBox="0 0 680 180" preserveAspectRatio="none"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#4de1c1" stopOpacity=".25" /><stop offset="1" stopColor="#4de1c1" stopOpacity="0" /></linearGradient></defs><path d="M0 140 C55 130 74 100 120 112 S195 135 230 90 S300 65 340 82 S410 118 450 70 S510 80 545 54 S615 32 680 45 L680 180 L0 180 Z" fill="url(#fill)" /><path d="M0 140 C55 130 74 100 120 112 S195 135 230 90 S300 65 340 82 S410 118 450 70 S510 80 545 54 S615 32 680 45" fill="none" stroke="#4de1c1" strokeWidth="2.5" /></svg><div className="chart-x"><span>14 Aug</span><span>15 Aug</span><span>16 Aug</span><span>17 Aug</span><span>18 Aug</span><span>19 Aug</span><span>20 Aug</span></div></div></div></section><section className="panel health-panel"><div className="panel-head"><div><p className="eyebrow">SYSTEM HEALTH</p><h2>系统健康度</h2></div><span className="health-badge"><span className="status-dot" />All systems go</span></div><div className="health-score"><div className="score-ring"><strong>98</strong><span>/100</span></div><div><b>运行稳定</b><p>过去 24 小时无重大异常</p></div></div><div className="health-bars"><HealthBar label="模型推理" value="99.8%" width="99.8%" color="cyan" /><HealthBar label="工具执行" value="98.6%" width="98.6%" color="lime" /><HealthBar label="调度服务" value="97.2%" width="97.2%" color="amber" /></div></section></section>
  </>;
}

function Metric({ label, value, delta, tone, icon: Icon }) { return <div className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={17} /></div><div><span>{label}</span><strong>{value}</strong><small className={tone}>{delta}</small></div><div className="metric-spark"><i /><i /><i /><i /><i /><i /><i /></div></div>; }
function RunRow({ color, name, agent, status, progress, warning, done }) { return <div className="run-row"><span className={`run-dot ${color}`} /><div className="run-info"><b>{name}</b><small>{agent}</small></div><span className={warning ? 'run-status warning' : done ? 'run-status done' : 'run-status'}>{status}</span><div className="progress"><span style={{ width: `${progress}%` }} /></div><MoreHorizontal size={17} className="muted-icon" /></div>; }
function QuickCard({ icon: Icon, title, desc, onClick }) { return <button className="quick-card" onClick={onClick}><div className="quick-icon"><Icon size={17} /></div><div><b>{title}</b><span>{desc}</span></div><ArrowUpRight size={15} /></button>; }
function HealthBar({ label, value, width, color }) { return <div className="health-bar"><div><span>{label}</span><b>{value}</b></div><div className="bar-track"><span className={color} style={{ width }} /></div></div>; }

function Workbench({ messages, input, setInput, pushMessage, running }) { return <div className="workbench-page"><section className="conversation panel"><div className="conversation-head"><div><p className="eyebrow">PRIMARY ORCHESTRATOR</p><h1>主 Agent <span className="live-pill"><span className="status-dot" />在线</span></h1></div><div className="conversation-actions"><button className="select-button"><ShieldCheck size={14} /> 安全模式 <ChevronDown size={14} /></button><button className="icon-button"><MoreHorizontal size={18} /></button></div></div><div className="message-list">{messages.map((m, i) => <div className={`message ${m.role}`} key={i}><div className="message-avatar">{m.role === 'assistant' ? <Sparkles size={15} /> : 'L'}</div><div className="message-body"><div className="message-meta"><b>{m.title}</b><span>{m.time}</span></div><p>{m.text}</p>{m.tool && <div className="tool-chip"><TerminalSquare size={14} /><span>{m.tool}</span><Check size={13} /></div>}</div></div>)}{running && <div className="typing"><span /><span /><span /> 主 Agent 正在思考</div>}</div><div className="composer"><textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); pushMessage(); } }} placeholder="描述你想完成的工作..." /><div className="composer-foot"><div className="composer-hints"><button><Plus size={15} /> 添加上下文</button><button><Command size={14} /> 调用 Skill</button></div><button className="send-button" onClick={pushMessage} disabled={running || !input.trim()}><Send size={16} /> 发送</button></div></div></section><aside className="run-context"><div className="context-block"><div className="context-title"><span>本次运行</span><span className="trace-id">TR-8F2A91</span></div><div className="context-stat"><span>状态</span><b className="green-text"><span className="status-dot" /> 运行中</b></div><div className="context-stat"><span>循环轮次</span><b>04 <small>/ 20</small></b></div><div className="context-stat"><span>已用 Token</span><b>8,420</b></div></div><div className="context-block"><div className="context-title"><span>执行轨迹</span><Activity size={15} /></div><div className="trace-list"><Trace label="意图理解" time="09:42:12" active /><Trace label="加载客户洞察 Skill" time="09:42:14" active /><Trace label="读取 3 个文件" time="09:42:18" active /><Trace label="生成分析结论" time="等待中" /></div></div><div className="context-block memory-callout"><BrainCircuit size={17} /><div><b>记忆已注入</b><p>2 条长期记忆 · 用户偏好简洁输出</p></div></div></aside></div>; }
function Trace({ label, time, active }) { return <div className={`trace-item ${active ? 'active' : ''}`}><span className="trace-icon">{active ? <Check size={12} /> : <Clock3 size={12} />}</span><div><b>{label}</b><small>{time}</small></div></div>; }

function useResource(path) {
  const [state, setState] = useState({ loading: true, error: '', data: [] });
  const reload = async () => {
    setState(prev => ({ ...prev, loading: true, error: '' }));
    try { const result = await apiRequest(path); setState({ loading: false, error: '', data: result.items || [] }); }
    catch (error) { setState({ loading: false, error: error.message, data: [] }); }
  };
  useEffect(() => { reload(); }, [path]);
  return { ...state, reload };
}

function ResourceState({ loading, error, data = [], empty = '暂无数据', children }) {
  if (loading) return <div className="resource-state"><Sparkles size={18} className="spin" />正在加载实时数据…</div>;
  if (error) return <div className="resource-state error-state"><X size={18} />{error}</div>;
  if (!data.length) return <div className="resource-state">{empty}</div>;
  return children;
}

function DynamicAgents({ onNotice }) {
  const resource = useResource('/api/agents');
  const create = async () => { const name = window.prompt('智能体名称'); if (!name) return; try { await apiRequest('/api/agents', { method: 'POST', body: JSON.stringify({ name, description: '自定义企业智能体', type: 'subagent' }) }); await resource.reload(); onNotice(`已部署智能体：${name}`); } catch (e) { onNotice(e.message); } };
  return <Page title="智能体" eyebrow="AGENT REGISTRY" action="部署智能体" onAction={create}><ResourceState {...resource} empty="还没有注册智能体"><div className="agent-grid">{resource.data.map(agent => <div className="agent-card" key={agent.id}><div className="agent-card-top"><div className={`agent-symbol ${agent.type || 'subagent'}`}><Bot size={18} /></div><span className={agent.status === 'running' ? 'status-chip live' : 'status-chip'}><span className="status-dot" />{agent.status === 'running' ? '运行中' : '空闲'}</span></div><h3>{agent.name}</h3><p>{agent.description || '未填写描述'}</p><div className="agent-card-foot"><span>{agent.type === 'subagent' ? 'Sub-agent' : 'Orchestrator'}</span><button onClick={() => onNotice(`${agent.name} 配置已打开`)}><Settings2 size={14} /></button></div></div>)}</div></ResourceState></Page>;
}

function DynamicTasks({ onNotice }) {
  const resource = useResource('/api/tasks');
  const create = async () => { const name = window.prompt('任务名称'); if (!name) return; try { await apiRequest('/api/tasks', { method: 'POST', body: JSON.stringify({ name, schedule: '手动触发', agentId: 'orchestrator' }) }); await resource.reload(); onNotice(`已创建任务：${name}`); } catch (e) { onNotice(e.message); } };
  return <Page title="固化任务" eyebrow="TASK CATALOG" action="创建任务" onAction={create}><ResourceState {...resource} empty="还没有固化任务"><div className="table-panel panel"><table><thead><tr><th>任务名称</th><th>触发方式</th><th>绑定智能体</th><th>最近结果</th><th>状态</th></tr></thead><tbody>{resource.data.map(task => <tr key={task.id}><td><div className="task-name"><div className="task-icon"><Layers3 size={15} /></div><b>{task.name}</b></div></td><td><span className="schedule-text"><CalendarClock size={14} />{task.schedule || '手动触发'}</span></td><td><span className="agent-link"><Bot size={14} />{task.agentId || 'orchestrator'}</span></td><td>{task.result || '尚未运行'}</td><td><span className="status-chip live"><span className="status-dot" />{task.status === 'enabled' ? '已启用' : task.status}</span></td></tr>)}</tbody></table></div></ResourceState></Page>;
}

function DynamicMemory({ onNotice }) {
  const resource = useResource('/api/memory');
  const create = async () => { const content = window.prompt('请输入要保存的长期记忆'); if (!content) return; try { await apiRequest('/api/memory', { method: 'POST', body: JSON.stringify({ content, type: 'user' }) }); await resource.reload(); onNotice('记忆已保存'); } catch (e) { onNotice(e.message); } };
  return <Page title="记忆" eyebrow="LONG-TERM MEMORY" action="写入记忆" onAction={create}><ResourceState {...resource} empty="还没有长期记忆"><div className="memory-layout"><div className="memory-summary panel"><div className="memory-orb"><BrainCircuit size={23} /></div><h3>记忆快照</h3><p>每轮会话注入的紧凑事实集合，帮助 Agent 保持连续协作。</p><div className="memory-count"><strong>{resource.data.length}</strong><span>条有效记忆</span></div></div><div className="memory-list panel"><div className="panel-head"><div><p className="eyebrow">STORED FACTS</p><h2>已保存内容</h2></div></div>{resource.data.map(item => <div className="memory-row" key={item.id}><div className="memory-type"><Database size={15} /></div><div><b>{item.content}</b><small>{item.type || 'assistant'} · {item.createdAt ? new Date(item.createdAt).toLocaleString('zh-CN') : '系统'}</small></div><button className="icon-button" onClick={() => onNotice('记忆编辑接口将在下一阶段接入')}><MoreHorizontal size={17} /></button></div>)}</div></div></ResourceState></Page>;
}

function DynamicSchedules({ onNotice }) {
  const resource = useResource('/api/schedules');
  const create = async () => { const name = window.prompt('调度名称'); if (!name) return; try { await apiRequest('/api/schedules', { method: 'POST', body: JSON.stringify({ name, taskId: 'task-feedback', rule: 'manual' }) }); await resource.reload(); onNotice(`已创建调度：${name}`); } catch (e) { onNotice(e.message); } };
  return <Page title="调度" eyebrow="AUTOMATION" action="新建调度" onAction={create}><ResourceState {...resource} empty="还没有调度"><div className="schedule-grid"><div className="schedule-main panel"><div className="panel-head"><div><p className="eyebrow">UPCOMING RUNS</p><h2>即将执行</h2></div><span className="health-badge"><span className="status-dot" />调度服务正常</span></div>{resource.data.map(item => <div className="schedule-row" key={item.id}><div className="schedule-badge cyan"><CalendarClock size={18} /></div><div><b>{item.name || item.taskId}</b><small>{item.nextRunAt || item.rule || '手动触发'}</small></div><span>{item.status === 'enabled' ? '已启用' : item.status}</span><button className="icon-button" onClick={() => onNotice(`${item.name || item.taskId} 配置已打开`)}><MoreHorizontal size={17} /></button></div>)}</div><div className="schedule-side panel"><p className="eyebrow">SCHEDULER</p><h3>平台级调度器</h3><p>调度独立于会话存活，触发时拉起完整 Agent 会话并推送结果。</p><div className="scheduler-stat"><span>活跃调度</span><b>{resource.data.length}</b></div></div></div></ResourceState></Page>;
}

function DynamicAudit() {
  const resource = useResource('/api/audit');
  return <Page title="可观测性" eyebrow="TRACE & AUDIT"><ResourceState {...resource} empty="暂无审计事件"><div className="table-panel panel"><div className="panel-head"><div><p className="eyebrow">AUDIT LOG</p><h2>审计日志</h2></div></div><table><thead><tr><th>时间</th><th>类型</th><th>Trace ID</th><th>详情</th></tr></thead><tbody>{resource.data.map(item => <tr key={`${item.traceId}-${item.runId}`}><td>{item.createdAt ? new Date(item.createdAt).toLocaleString('zh-CN') : '刚刚'}</td><td>{item.type}</td><td className="trace-id">{item.traceId}</td><td>{item.runId ? `运行 ${item.runId}` : JSON.stringify(item)}</td></tr>)}</tbody></table></div></ResourceState></Page>;
}

function Agents({ onNotice }) { const agents = [['主 Agent','意图理解、任务拆解与结果汇总','orchestrator','运行中'],['客户洞察','读取反馈、聚类主题、生成行动建议','subagent','空闲'],['研究员','竞品信息检索与周报编排','subagent','空闲'],['内容编排器','将主题转为内容日历与发布任务','subagent','空闲'],['数据审计员','校验工具结果与引用来源','subagent','空闲'],['记忆管家','维护长期记忆与用户画像','system','运行中']]; const create = async () => { const name = window.prompt('智能体名称'); if (!name) return; try { await apiRequest('/api/agents', { method: 'POST', body: JSON.stringify({ name, description: '自定义企业智能体', type: 'subagent' }) }); onNotice(`已部署智能体：${name}`); } catch (e) { onNotice(e.message); } }; return <Page title="智能体" eyebrow="AGENT REGISTRY" action="部署智能体" onAction={create}><div className="agent-grid">{agents.map(([name, desc, type, status]) => <div className="agent-card" key={name}><div className="agent-card-top"><div className={`agent-symbol ${type}`}><Bot size={18} /></div><span className={status === '运行中' ? 'status-chip live' : 'status-chip'}><span className="status-dot" />{status}</span></div><h3>{name}</h3><p>{desc}</p><div className="agent-card-foot"><span>{type === 'subagent' ? 'Sub-agent' : type === 'system' ? 'System' : 'Orchestrator'}</span><button onClick={() => onNotice(`${name} 配置已打开`)}><Settings2 size={14} /></button></div></div>)}</div></Page>; }
function Tasks({ onNotice }) { const tasks = [['客户反馈洞察','每周一 09:00','客户洞察','成功 12 次'],['竞品价格周报','每周五 16:30','研究员','成功 8 次'],['内容发布排期','手动触发','内容编排器','成功 23 次'],['月度经营复盘','每月 1 日 10:00','主 Agent','未运行']]; const create = async () => { const name = window.prompt('任务名称'); if (!name) return; try { await apiRequest('/api/tasks', { method: 'POST', body: JSON.stringify({ name, schedule: '手动触发', agentId: 'orchestrator' }) }); onNotice(`已创建任务：${name}`); } catch (e) { onNotice(e.message); } }; return <Page title="固化任务" eyebrow="TASK CATALOG" action="创建任务" onAction={create}><div className="table-panel panel"><div className="table-toolbar"><div className="filter-tabs"><button className="selected">全部 <b>12</b></button><button>运行中 <b>3</b></button><button>草稿 <b>2</b></button></div><div className="table-search"><Search size={15} /> 搜索任务</div></div><table><thead><tr><th>任务名称</th><th>触发方式</th><th>绑定智能体</th><th>最近结果</th><th>状态</th><th /></tr></thead><tbody>{tasks.map(([name, schedule, agent, result]) => <tr key={name}><td><div className="task-name"><div className="task-icon"><Layers3 size={15} /></div><b>{name}</b></div></td><td><span className="schedule-text"><CalendarClock size={14} />{schedule}</span></td><td><span className="agent-link"><Bot size={14} />{agent}</span></td><td>{result}</td><td><span className="status-chip live"><span className="status-dot" />已启用</span></td><td><button className="icon-button" onClick={() => onNotice(`${name} 配置已打开`)}><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></div></Page>; }
function Skills({ onNotice }) { const skills = [['客户洞察','把非结构化反馈转成主题、证据与行动项','v1.4.2','已启用','cyan'],['网页研究','搜索与抓取公开网页，强制保留来源','v2.1.0','已启用','orange'],['文件摘要','对长文档进行分级压缩和关键结论提取','v1.1.3','已启用','lime'],['MCP · Linear','连接项目管理系统，创建与更新 Issue','v0.8.4','需授权','violet']]; return <Page title="Skills & 工具" eyebrow="CAPABILITY LAYER" action="接入 Skill" onAction={() => onNotice('已打开 Skill 接入流程')}><div className="skill-grid">{skills.map(([name, desc, ver, state, tone]) => <div className="skill-card panel" key={name}><div className="skill-top"><div className={`skill-mark ${tone}`}><Wrench size={17} /></div><button className="icon-button"><MoreHorizontal size={17} /></button></div><h3>{name}</h3><p>{desc}</p><div className="skill-meta"><span>{ver}</span><span className={state === '需授权' ? 'permission' : 'enabled'}>{state}</span></div><button className="skill-action" onClick={() => onNotice(`${name} 已加载到当前工作区`)}>{state === '需授权' ? '授权接入' : '查看说明'} <ArrowUpRight size={14} /></button></div>)}</div></Page>; }
function Memory({ onNotice }) { const items = [['用户偏好简洁输出，结论先行。','用户画像','2 小时前'],['项目文件默认写入 /workspace/deliverables。','环境事实','昨天'],['林嘉负责增长产品，协作方包括市场与销售。','协作方式','3 天前'],['不要保存凭证、临时快照和进度日志。','安全规则','系统']]; const create = async () => { const content = window.prompt('请输入要保存的长期记忆'); if (!content) return; try { await apiRequest('/api/memory', { method: 'POST', body: JSON.stringify({ content, type: 'user' }) }); onNotice('记忆已保存'); } catch (e) { onNotice(e.message); } }; return <Page title="记忆" eyebrow="LONG-TERM MEMORY" action="写入记忆" onAction={create}><div className="memory-layout"><div className="memory-summary panel"><div className="memory-orb"><BrainCircuit size={23} /></div><h3>记忆快照</h3><p>每轮会话注入的紧凑事实集合，帮助 Agent 保持连续协作。</p><div className="memory-count"><strong>24</strong><span>条有效记忆</span></div><div className="memory-count"><strong>03</strong><span>条本周新增</span></div></div><div className="memory-list panel"><div className="panel-head"><div><p className="eyebrow">STORED FACTS</p><h2>已保存内容</h2></div><div className="table-search"><Search size={15} /> 筛选</div></div>{items.map(([text, type, time]) => <div className="memory-row" key={text}><div className="memory-type"><Database size={15} /></div><div><b>{text}</b><small>{type} · {time}</small></div><button className="icon-button" onClick={() => onNotice('记忆编辑接口即将接入')}><MoreHorizontal size={17} /></button></div>)}</div></div></Page>; }
function Schedules({ onNotice }) { const create = async () => { const name = window.prompt('调度名称'); if (!name) return; try { await apiRequest('/api/schedules', { method: 'POST', body: JSON.stringify({ name, taskId: 'task-feedback', rule: 'manual' }) }); onNotice(`已创建调度：${name}`); } catch (e) { onNotice(e.message); } }; return <Page title="调度" eyebrow="AUTOMATION" action="新建调度" onAction={create}><div className="schedule-grid"><div className="schedule-main panel"><div className="panel-head"><div><p className="eyebrow">UPCOMING RUNS</p><h2>即将执行</h2></div><span className="health-badge"><span className="status-dot" />调度服务正常</span></div>{[['客户反馈洞察','今天 09:00','剩余 18 分钟','cyan'],['竞品价格周报','周五 16:30','2 天后','orange'],['月度经营复盘','01 Sep · 10:00','12 天后','violet']].map(([name, time, remaining, tone]) => <div className="schedule-row" key={name}><div className={`schedule-badge ${tone}`}><CalendarClock size={18} /></div><div><b>{name}</b><small>{time}</small></div><span>{remaining}</span><button className="icon-button" onClick={() => onNotice(`${name} 已暂停`)}><MoreHorizontal size={17} /></button></div>)}</div><div className="schedule-side panel"><p className="eyebrow">SCHEDULER</p><h3>平台级调度器</h3><p>调度独立于会话存活，触发时拉起完整 Agent 会话并推送结果。</p><div className="scheduler-stat"><span>活跃调度</span><b>08</b></div><div className="scheduler-stat"><span>本月执行</span><b>126</b></div></div></div></Page>; }
function Audit() { const logs = [['09:42:18','工具调用','ReadFile','customer_feedback_2026W33.csv','成功','28ms'],['09:42:14','Skill 加载','customer-insights','SKILL.md','成功','42ms'],['09:41:55','会话创建','TR-8F2A91','林嘉的工作区','成功','12ms'],['昨天 18:32','权限确认','WriteFile','/deliverables/weekly.md','已确认','—'],['昨天 17:09','工具调用','WebSearch','pricing · competitors','成功','1.2s']]; return <Page title="可观测性" eyebrow="TRACE & AUDIT"><div className="audit-top"><div className="audit-kpi panel"><span>今日会话</span><strong>28</strong><small>+16.7%</small></div><div className="audit-kpi panel"><span>平均响应</span><strong>1.8s</strong><small>↓ 240ms</small></div><div className="audit-kpi panel"><span>工具成功率</span><strong>98.6%</strong><small>+0.8%</small></div><div className="audit-kpi panel"><span>需关注事件</span><strong className="amber-text">03</strong><small>近 24 小时</small></div></div><div className="table-panel panel"><div className="panel-head"><div><p className="eyebrow">AUDIT LOG</p><h2>审计日志</h2></div><div className="table-search"><Search size={15} /> 搜索追踪 ID</div></div><table><thead><tr><th>时间</th><th>类型</th><th>对象</th><th>上下文</th><th>结果</th><th>耗时</th></tr></thead><tbody>{logs.map(row => <tr key={row.join('-')}>{row.map((cell, i) => <td key={cell} className={i === 4 ? 'success-cell' : ''}>{cell}</td>)}</tr>)}</tbody></table></div></Page>; }
function Page({ title, eyebrow, action, onAction, children }) { return <><div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div>{action && <button className="run-button" onClick={onAction}><Plus size={15} /> {action}</button>}</div>{children}</>; }

createRoot(document.getElementById('root')).render(<App />);
