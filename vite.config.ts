import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/* ── ANSI colours for terminal output ── */
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
  blue: '\x1b[34m',
};

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Vite plugin that proxies /api/* → KodeKloud OpenAI API
 * and logs every request / response to the terminal.
 */
function apiLoggerPlugin(env: Record<string, string>): Plugin {
  const apiBase = env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const apiKey = env.VITE_OPENAI_API_KEY;

  return {
    name: 'api-logger',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        /* Only intercept POST /api/… */
        if (req.method !== 'POST' || !req.url?.startsWith('/api/')) return next();

        const targetPath = req.url.replace(/^\/api/, '');
        const targetUrl = `${apiBase}${targetPath}`;

        let body = '';
        req.on('data', (chunk: Buffer) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const payload = JSON.parse(body);
            const userMsg = payload.messages?.find(
              (m: { role: string }) => m.role === 'user',
            );
            const dockerfilePreview = userMsg
              ? userMsg.content.length > 300
                ? userMsg.content.slice(0, 300) + '…'
                : userMsg.content
              : '(none)';

            /* ── REQUEST log ── */
            const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
            console.log(
              `\n${c.cyan}${c.bold}┌─── REQUEST ───${c.reset}  ${c.gray}${ts}${c.reset}`,
            );
            console.log(`${c.cyan}│${c.reset} ${c.blue}Model   ${c.reset} ${payload.model}`);
            console.log(`${c.cyan}│${c.reset} ${c.blue}URL     ${c.reset} ${targetUrl}`);
            console.log(`${c.cyan}│${c.reset} ${c.blue}Dockerfile${c.reset}`);
            dockerfilePreview.split('\n').forEach((line: string) => {
              console.log(`${c.cyan}│${c.reset}   ${c.gray}${line}${c.reset}`);
            });
            console.log(`${c.cyan}└───────────────${c.reset}`);

            /* ── Forward to API ── */
            const t0 = Date.now();
            const apiRes = await fetch(targetUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
              },
              body,
            });
            const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
            const resText = await apiRes.text();

            if (apiRes.ok) {
              const json = JSON.parse(resText);
              const usage = json.usage;
              const finish = json.choices?.[0]?.finish_reason ?? '—';
              const content = json.choices?.[0]?.message?.content ?? '';

              /* Try parsing the analysis JSON inside the content */
              let summary = '';
              try {
                const cleaned = content
                  .replace(/```(?:json)?\s*/g, '')
                  .replace(/```\s*/g, '')
                  .trim();
                const analysis = JSON.parse(cleaned);
                summary = [
                  `Score: ${analysis.optimizationScore ?? '?'}/100`,
                  `Size: ${formatBytes(analysis.originalSize)} → ${formatBytes(analysis.optimizedSize)}`,
                  `Layers: ${analysis.layerCountBefore} → ${analysis.layerCountAfter}`,
                  `Issues: ${analysis.issues?.length ?? 0}`,
                  `Vulns: ${analysis.vulnerabilities?.length ?? 0}`,
                  `Changes: ${analysis.changes?.length ?? 0}`,
                ].join('  │  ');
              } catch {
                summary = content.slice(0, 200) + (content.length > 200 ? '…' : '');
              }

              console.log(
                `\n${c.green}${c.bold}┌─── RESPONSE ──${c.reset}  ${c.gray}${elapsed}s${c.reset}`,
              );
              console.log(`${c.green}│${c.reset} ${c.blue}Status ${c.reset} ${apiRes.status} OK`);
              console.log(`${c.green}│${c.reset} ${c.blue}Model  ${c.reset} ${json.model}`);
              if (usage) {
                console.log(
                  `${c.green}│${c.reset} ${c.blue}Tokens ${c.reset} prompt=${usage.prompt_tokens}  completion=${usage.completion_tokens}  total=${usage.total_tokens}`,
                );
              }
              console.log(`${c.green}│${c.reset} ${c.blue}Finish ${c.reset} ${finish}`);
              console.log(`${c.green}│${c.reset} ${c.magenta}${summary}${c.reset}`);
              console.log(`${c.green}└───────────────${c.reset}\n`);
            } else {
              console.log(
                `\n${c.red}${c.bold}┌─── API ERROR ──${c.reset}  ${c.gray}${elapsed}s${c.reset}`,
              );
              console.log(`${c.red}│${c.reset} Status: ${apiRes.status}`);
              console.log(`${c.red}│${c.reset} ${resText.slice(0, 500)}`);
              console.log(`${c.red}└────────────────${c.reset}\n`);
            }

            res.writeHead(apiRes.status, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            });
            res.end(resText);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.log(`\n${c.red}${c.bold}┌─── PROXY ERROR ──${c.reset}`);
            console.log(`${c.red}│${c.reset} ${msg}`);
            console.log(`${c.red}└──────────────────${c.reset}\n`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: { message: msg } }));
          }
        });
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [react(), apiLoggerPlugin(env)],
  };
});
