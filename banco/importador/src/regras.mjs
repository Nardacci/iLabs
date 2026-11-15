// Catálogo de regras: lê os arquivos `regras-geral.jsonl` e `regras-seguranca-e-acesso.jsonl` do legado e os envia à
// função `kb_importar_regras`. Mesmas garantias dos documentos: ensaio sem gravar, varredura de segredos (o valor nunca
// sai daqui), repetível, retomável, e o que sumiu da fonte só é MARCADO.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ARQUIVOS_DE_REGRAS, PASTAS_DO_PILOTO, PASTAS_IGNORADAS } from './config.mjs';
import { foiLiberado } from './ensaio.mjs';
import { caminhoRelativo } from './selecionar.mjs';
import { varrer } from './segredos.mjs';

const TAMANHO_DO_LOTE = 200;
const CONFIDENCIALIDADES = { interno: 'Interno', confidencial: 'Confidencial' };

/** Procura os arquivos de regras (.jsonl) nas pastas do piloto. Devolve [{ caminho, absoluto }], em ordem. */
export function acharArquivosDeRegras(raiz, pastas = PASTAS_DO_PILOTO) {
  const achados = [];
  const visitar = (pasta) => {
    let entradas;
    try {
      entradas = readdirSync(pasta, { withFileTypes: true });
    } catch (e) {
      if (e.code === 'ENOENT') return;
      throw e;
    }
    for (const entrada of entradas) {
      const absoluto = join(pasta, entrada.name);
      if (entrada.isDirectory()) {
        if (!PASTAS_IGNORADAS.includes(entrada.name)) visitar(absoluto);
      } else if (entrada.isFile()) {
        const caminho = caminhoRelativo(raiz, absoluto);
        if (ARQUIVOS_DE_REGRAS.test(caminho)) achados.push({ caminho, absoluto });
      }
    }
  };
  for (const pasta of pastas) visitar(join(raiz, pasta));
  return achados.sort((a, b) => a.caminho.localeCompare(b.caminho, 'pt'));
}

/**
 * Lê um arquivo de regras. Devolve { regras, erros }. Nunca devolve o texto das regras em mensagem de erro: só o
 * número da linha. O arquivo de segurança e acesso nunca entra como Interno (a confidencialidade só sobe).
 */
export function lerRegras(caminho, texto) {
  const regras = [];
  const erros = [];
  const soConfidencial = /seguranca-e-acesso/i.test(caminho);
  texto.split(/\r?\n/).forEach((linha, i) => {
    if (!linha.trim()) return;
    let r;
    try {
      r = JSON.parse(linha);
    } catch {
      erros.push(`linha ${i + 1}: não é JSON válido`);
      return;
    }
    const falta = ['id', 'menu', 'tela', 'tipo', 'regra'].filter((c) => typeof r?.[c] !== 'string' || !r[c].trim());
    if (falta.length) {
      erros.push(`linha ${i + 1}: falta ${falta.join(', ')}`);
      return;
    }
    const conf = CONFIDENCIALIDADES[String(r.confidencialidade ?? '').trim().toLowerCase()];
    if (!conf) {
      erros.push(`linha ${i + 1}: confidencialidade deve ser Interno ou Confidencial`);
      return;
    }
    regras.push({ ...r, confidencialidade: soConfidencial ? 'Confidencial' : conf });
  });
  const repetidos = regras.map((r) => r.id.toUpperCase()).filter((c, i, todos) => todos.indexOf(c) !== i);
  if (repetidos.length) erros.push(`${new Set(repetidos).size} código(s) repetido(s) no arquivo`);
  return { regras, erros };
}

/**
 * Varredura de segredos do arquivo de regras, CAMPO a CAMPO. Cada regra é uma linha só, e quase toda linha traz a palavra
 * "servidor" (campo `onde_aplicada`); a varredura por linha tomaria qualquer numeração de norma (como 7.1.2.3) por
 * endereço de servidor. Por campo, o endereço só conta quando o próprio campo fala de servidor ou tem número de rede.
 * Devolve [{ tipo, linha }] (no máximo 20 por tipo), sem o valor encontrado.
 */
export function varrerRegras(texto) {
  const achados = [];
  const contagem = new Map();
  texto.split(/\r?\n/).forEach((linha, i) => {
    if (!linha.trim()) return;
    let textos = [linha];
    try {
      const r = JSON.parse(linha);
      textos = Object.values(r).flatMap((v) => (Array.isArray(v) ? v : [v])).filter((v) => typeof v === 'string');
    } catch {
      // linha que não é JSON: varre a linha inteira (e o arquivo será recusado como inválido de qualquer jeito)
    }
    for (const t of textos) {
      for (const a of varrer(t)) {
        const n = (contagem.get(a.tipo) ?? 0) + 1;
        contagem.set(a.tipo, n);
        if (n <= 20) achados.push({ tipo: a.tipo, linha: i + 1 });
      }
    }
  });
  return achados;
}

/**
 * ENSAIO do catálogo: o que cada arquivo faria, sem enviar nada. Por arquivo: total, por confidencialidade, achados da
 * varredura (só tipo e linha) e a ação: 'pronto', 'bloqueado' (segredo achado e não liberado) ou 'invalido'.
 */
export function ensaiarRegras({ raiz, pastas, liberados }) {
  return acharArquivosDeRegras(raiz, pastas).map(({ caminho, absoluto }) => {
    const buffer = readFileSync(absoluto);
    const texto = buffer.toString('utf8');
    const checksum = createHash('sha256').update(buffer).digest('hex');
    const achados = varrerRegras(texto);
    const { regras, erros } = lerRegras(caminho, texto);
    const porConfidencialidade = {};
    for (const r of regras) porConfidencialidade[r.confidencialidade] = (porConfidencialidade[r.confidencialidade] ?? 0) + 1;
    let acao = 'pronto';
    if (erros.length) acao = 'invalido';
    else if (achados.length > 0 && !foiLiberado({ caminho, checksum, achados }, liberados)) acao = 'bloqueado';
    return { caminho, absoluto, checksum, total: regras.length, porConfidencialidade, achados, erros, acao, regras };
  });
}

/** Resumo sem as regras (para o relatório). */
export function resumoDoCatalogo(arquivos) {
  return arquivos.map(({ caminho, checksum, total, porConfidencialidade, achados, erros, acao }) => ({ caminho, checksum, total, porConfidencialidade, achados, erros, acao }));
}

async function chamar(cliente, nome, args) {
  const { data, error } = await cliente.rpc(nome, args);
  if (error) throw new Error(`${nome}: ${error.message}`);
  return data;
}

/**
 * IMPORTAÇÃO do catálogo. Repetível (regra igual não muda nada), retomável (cada lote é uma transação) e sem apagar:
 * o que sumiu da fonte só é marcado, e só quando todos os arquivos entraram, sem falhas, sem bloqueio e sem limite.
 * Devolve { arquivos, totais, falhas, marcadasComoSumidas }.
 */
export async function importarRegras({ cliente, empresaId, fonteId, referencia, raiz, pastas, liberados, limite, aoProgresso }) {
  const arquivos = ensaiarRegras({ raiz, pastas, liberados });
  const totais = { novas: 0, alteradas: 0, iguais: 0, inativas: 0 };
  const falhas = [];
  const presentes = [];
  let incompleto = false;
  let enviadas = 0;

  for (const arq of arquivos) {
    if (arq.acao !== 'pronto') {
      incompleto = true;
      falhas.push({ caminho: arq.caminho, erro: arq.acao === 'bloqueado' ? 'bloqueado pela varredura de segredos (revisar)' : `arquivo inválido: ${arq.erros.join('; ')}` });
      continue;
    }
    presentes.push(...arq.regras.map((r) => r.id));
    let regras = arq.regras;
    if (limite && enviadas + regras.length > limite) {
      regras = regras.slice(0, Math.max(limite - enviadas, 0));
      incompleto = true;
    }
    try {
      for (let i = 0; i < regras.length; i += TAMANHO_DO_LOTE) {
        const r = await chamar(cliente, 'kb_importar_regras', {
          p_empresa_id: empresaId,
          p_fonte_id: fonteId,
          p_fonte_ref: referencia,
          p_regras: regras.slice(i, i + TAMANHO_DO_LOTE),
        });
        for (const k of Object.keys(totais)) totais[k] += r?.[k] ?? 0;
        enviadas += Math.min(TAMANHO_DO_LOTE, regras.length - i);
        aoProgresso?.(enviadas, arquivos.reduce((a, x) => a + x.total, 0));
      }
    } catch (e) {
      incompleto = true;
      falhas.push({ caminho: arq.caminho, erro: e.message });
    }
  }

  let marcadas = null;
  if (!incompleto && falhas.length === 0 && arquivos.length > 0) {
    marcadas = await chamar(cliente, 'kb_marcar_regras_sumidas', { p_empresa_id: empresaId, p_fonte_id: fonteId, p_codigos_presentes: presentes });
  }
  return { arquivos: resumoDoCatalogo(arquivos), totais, falhas, marcadasComoSumidas: marcadas, parcial: incompleto };
}
