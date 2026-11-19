#!/usr/bin/env node
// Gera as imagens dos fluxos (docs/roadmap/diagramas/*.png) a partir dos arquivos .mmd (Mermaid).
// As imagens ficam no git (são documento) e a página do estudo as usa.
//
// Como rodar (nada disto entra no projeto do app):
//   mkdir -p /tmp/render && cd /tmp/render && npm init -y && npm i mermaid@10.9.1
//   MERMAID_JS=/tmp/render/node_modules/mermaid/dist/mermaid.min.js node renderizar-diagramas.mjs
// Precisa do Playwright com o Chromium já instalado (no ambiente de agentes: `require('playwright')`).
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const aqui = fileURLToPath(new URL('.', import.meta.url));
const pasta = join(aqui, '..', 'diagramas');
const mermaidJs = process.env.MERMAID_JS ?? sys('Defina MERMAID_JS com o caminho de mermaid.min.js.');
function sys(m) { console.error(m); process.exit(1); }
const require = createRequire(process.env.PLAYWRIGHT_DIR ? join(process.env.PLAYWRIGHT_DIR, 'x.js') : import.meta.url);
const { chromium } = require('playwright');

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const pagina = await navegador.newPage({ deviceScaleFactor: 2, viewport: { width: 2400, height: 1200 } });
await pagina.setContent('<html><body style="margin:0;background:#fff;font-family:Figtree,Segoe UI,Arial,sans-serif"><div id="alvo" style="padding:24px;display:inline-block"></div></body></html>');
await pagina.addScriptTag({ content: readFileSync(mermaidJs, 'utf8') });

for (const arq of readdirSync(pasta).filter((f) => f.endsWith('.mmd'))) {
  const definicao = readFileSync(join(pasta, arq), 'utf8');
  await pagina.evaluate(async (def) => {
    // @ts-ignore
    mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'base',
      themeVariables: { fontFamily: 'Figtree, Segoe UI, Arial, sans-serif', fontSize: '15px', lineColor: '#565b63',
        primaryColor: '#ffffff', primaryBorderColor: '#565b63', primaryTextColor: '#17191c', clusterBkg: '#f4f3f1', clusterBorder: '#d6d3ce' },
      flowchart: { htmlLabels: true, curve: 'basis', nodeSpacing: 40, rankSpacing: 46, padding: 12 } });
    // @ts-ignore
    const { svg } = await mermaid.render('g' + Math.random().toString(36).slice(2), def);
    const alvo = document.getElementById('alvo');
    alvo.innerHTML = svg;
    // tamanho natural do desenho (o Mermaid o encolhe para caber no contêiner)
    const el = alvo.querySelector('svg');
    const vb = el.viewBox.baseVal;
    el.style.maxWidth = 'none';
    el.setAttribute('width', String(Math.ceil(vb.width)));
    el.setAttribute('height', String(Math.ceil(vb.height)));
  }, definicao);
  const alvo = await pagina.$('#alvo');
  const destino = join(pasta, arq.replace(/\.mmd$/, '.png'));
  writeFileSync(destino, await alvo.screenshot({ type: 'png' }));
  console.log('gerado', arq.replace(/\.mmd$/, '.png'));
}
await navegador.close();
