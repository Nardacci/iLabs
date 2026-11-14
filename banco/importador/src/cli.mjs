#!/usr/bin/env node
// Importador da base de conhecimento. Dois comandos:
//   ensaio    lê as pastas e escreve o relatório; NÃO grava nada em lugar nenhum.
//   importar  envia ao Supabase o que o ensaio classificou como novo ou versão nova (exige --confirmo).
//
// Credenciais (só variáveis de ambiente, nunca em arquivo, no git ou na tela):
//   ILABS_SUPABASE_URL, ILABS_SUPABASE_CHAVE_SERVICO, ILABS_EMPRESA_ID
//
// Exemplos:
//   node src/cli.mjs ensaio --raiz="C:\p\LabMedsys_homol"
//   node src/cli.mjs importar --raiz="C:\p\LabMedsys_homol" --limite=10 --confirmo
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { PASTAS_DO_PILOTO } from './config.mjs';
import { escreverRelatorio, indexarEstado, montarRelatorio } from './ensaio.mjs';
import { importar } from './importar.mjs';

const NOME_DA_FONTE = 'Repositório do legado';

function opcoes(argv) {
  const o = {};
  for (const a of argv) {
    const m = a.match(/^--([a-z-]+)(?:=(.*))?$/);
    if (m) o[m[1]] = m[2] ?? true;
  }
  return o;
}

function falhar(mensagem) {
  console.error(`Erro: ${mensagem}`);
  process.exit(1);
}

function lerLiberados(caminho, tiposDaLinha) {
  const liberados = { arquivos: {}, tipos: tiposDaLinha ? String(tiposDaLinha).split(',').map((s) => s.trim()).filter(Boolean) : [] };
  if (caminho) {
    if (!existsSync(caminho)) falhar(`o arquivo de liberados não existe: ${caminho}`);
    const lido = JSON.parse(readFileSync(caminho, 'utf8'));
    Object.assign(liberados.arquivos, lido.arquivos ?? lido);
    liberados.tipos.push(...(lido.tipos ?? []));
  }
  return liberados;
}

function clienteDeServico() {
  const url = process.env.ILABS_SUPABASE_URL;
  const chave = process.env.ILABS_SUPABASE_CHAVE_SERVICO;
  const empresaId = process.env.ILABS_EMPRESA_ID;
  if (!url || !chave || !empresaId) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(empresaId)) falhar('ILABS_EMPRESA_ID não é um identificador válido.');
  const cliente = createClient(url, chave, { db: { schema: 'ilab' }, auth: { persistSession: false, autoRefreshToken: false } });
  return { cliente, empresaId };
}

function referenciaDoGit(raiz) {
  const r = spawnSync('git', ['-C', raiz, 'rev-parse', '--short=12', 'HEAD'], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : 'sem referência';
}

function mostrarResumo(r) {
  console.log(`\n${r.arquivos} arquivos analisados (${r.megabytes} MB):`);
  for (const [acao, n] of Object.entries(r.porAcao)) if (n) console.log(`  ${String(n).padStart(5)}  ${acao}`);
  const fora = Object.values(r.ignoradosPorMotivo).reduce((a, b) => a + b, 0);
  console.log(`  ${String(fora).padStart(5)}  ficaram de fora (tipo, fluxos, ANVISA, pastas restritas)`);
  for (const [tipo, n] of Object.entries(r.achadosPorTipo)) console.log(`  achados: ${tipo}: ${n} arquivo(s)`);
}

async function main() {
  const [comando, ...resto] = process.argv.slice(2);
  const o = opcoes(resto);
  if (!['ensaio', 'importar'].includes(comando)) falhar('use "ensaio" ou "importar".');
  if (!o.raiz || o.raiz === true) falhar('informe a pasta do repositório: --raiz="C:\\caminho".');
  const raiz = resolve(String(o.raiz));
  if (!existsSync(raiz)) falhar(`a pasta não existe: ${raiz}`);
  const pastas = o.pastas && o.pastas !== true ? String(o.pastas).split(',').map((s) => s.trim()) : PASTAS_DO_PILOTO;
  const saida = resolve(String(o.saida && o.saida !== true ? o.saida : join(import.meta.dirname, '..', 'saida')));
  const liberados = lerLiberados(o.liberados && o.liberados !== true ? String(o.liberados) : null, o['liberar-tipos']);
  const servico = clienteDeServico();
  const progresso = (feitos, total) => process.stdout.write(`\r  ${feitos}/${total}`);

  if (comando === 'ensaio') {
    let estado = null;
    if (servico && !o['sem-banco']) {
      const { data: fontes } = await servico.cliente.rpc('kb_importacao_estado', { p_empresa_id: servico.empresaId });
      const idDaFonte = (fontes ?? []).find((l) => l.fonte_id)?.fonte_id ?? null;
      estado = indexarEstado(fontes, idDaFonte);
      console.log('Ensaio com o estado atual da base (somente leitura).');
    } else {
      console.log('Ensaio sem consultar a base (sem credenciais ou com --sem-banco): tudo aparece como novo.');
    }
    const relatorio = await montarRelatorio({ raiz, pastas, estado, liberados, aoProgresso: progresso });
    const arquivos = escreverRelatorio(relatorio, saida);
    mostrarResumo(relatorio.resumo);
    console.log(`\nRelatório gravado em:\n  ${arquivos.md}\n  ${arquivos.csv}\n  ${arquivos.json}\nNada foi enviado nem gravado na base.`);
    return;
  }

  if (!o.confirmo) falhar('importar envia dados ao Supabase. Rode o ensaio primeiro e acrescente --confirmo.');
  if (!servico) falhar('defina ILABS_SUPABASE_URL, ILABS_SUPABASE_CHAVE_SERVICO e ILABS_EMPRESA_ID (variáveis de ambiente).');
  const limite = o.limite && o.limite !== true ? Number(o.limite) : undefined;
  if (limite !== undefined && !(limite > 0)) falhar('--limite precisa ser um número maior que zero.');
  const referencia = referenciaDoGit(raiz);
  console.log(`Importando${limite ? ` (no máximo ${limite} arquivos)` : ''}, referência ${referencia}…`);
  const r = await importar({ cliente: servico.cliente, empresaId: servico.empresaId, fonteNome: NOME_DA_FONTE, referencia, raiz, pastas, liberados, limite, aoProgresso: progresso });
  escreverRelatorio(r.relatorio, saida);
  mostrarResumo(r.relatorio.resumo);
  console.log(`\nResultado: ${r.resumo.novo} novos, ${r.resumo.versao_nova} versões novas, ${r.resumo.igual} já estavam iguais.`);
  if (r.marcadosComoSumidos !== null) console.log(`Marcados como "sumiu da fonte": ${r.marcadosComoSumidos}.`);
  else console.log('Marcação de "sumiu da fonte" não feita (importação parcial ou com falhas).');
  if (r.parcial) console.log('Importação parcial: rode de novo, sem --limite, para o resto.');
  if (r.falhas.length) {
    console.log(`\n${r.falhas.length} falha(s):`);
    for (const f of r.falhas.slice(0, 20)) console.log(`  ${f.caminho}: ${f.erro}`);
    process.exitCode = 1;
  }
}

main().catch((e) => falhar(e.message));
