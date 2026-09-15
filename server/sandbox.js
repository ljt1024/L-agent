import Docker from 'dockerode';
import { config } from './config.js';

const docker = new Docker();

export function sandboxStatus() { return { enabled: config.dockerSandboxEnabled, image: config.dockerImage, mode: config.dockerSandboxEnabled ? 'docker' : 'disabled' }; }

export async function executeInSandbox(command, { timeoutMs = 15_000 } = {}) {
  if (!config.dockerSandboxEnabled) throw new Error('Docker sandbox is disabled. Set DOCKER_SANDBOX_ENABLED=true to execute commands.');
  if (!command || command.length > 2_000 || /(^|\s)(rm|mkfs|shutdown|reboot)\b/i.test(command)) throw new Error('Command rejected by sandbox policy.');
  const container = await docker.createContainer({ Image: config.dockerImage, Cmd: ['sh', '-lc', command], WorkingDir: '/tmp', NetworkDisabled: true, HostConfig: { AutoRemove: true, Memory: 256 * 1024 * 1024, NanoCpus: 500_000_000, PidsLimit: 64 } });
  await container.start();
  const result = await Promise.race([container.wait(), new Promise((_, reject) => setTimeout(() => reject(new Error('Sandbox timeout')), timeoutMs))]);
  const logs = await container.logs({ stdout: true, stderr: true });
  return { exitCode: result.StatusCode, output: logs.toString('utf8').slice(0, 20_000) };
}
