import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { posix } from 'node:path';
import { indexarEstado, montarRelatorio } from './ensaio.mjs';
import { CONFIDENCIALIDADE_PADRAO, ORIGEM_DA_FONTE } from './config.mjs';

export const BUCKET = 'kb-documentos';

const TIPOS_DE_CONTEUDO = {
  '.md': 'text/markdown',
  '.txt': 'text/plain',
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

async function chamar(cliente, nome, args) {
  const { data, error } = await cliente.rpc(nome, args);
  if (error) throw new Error(`${nome}: ${error.message}`);
  return data;
}

/**
 * IMPORTAÇÃO: envia ao Supabase o que o ensaio classificou como novo ou versão nova.
 * - repetível: o que já está igual na base não é enviado de novo; rodar duas vezes não duplica nada;
 * - retomável: se parar no meio, basta rodar de novo;
 * - nunca apaga: o que sumiu da fonte só é MARCADO (e só quando a importação é completa, sem --limite).
 * `cliente` é o cliente do Supabase com a chave de serviço (injetado: os testes usam um falso).
 * Devolve { resumo, falhas, relatorio }.
 */
export async function importar({ cliente, empresaId, fonteNome, referencia, raiz, pastas, liberados, limite, aoProgresso }) {
  const fonteId = await chamar(cliente, 'kb_criar_fonte', { p_empresa_id: empresaId, p_nome: fonteNome, p_origem: ORIGEM_DA_FONTE });
  const linhas = await chamar(cliente, 'kb_importacao_estado', { p_empresa_id: empresaId });
  const relatorio = await montarRelatorio({ raiz, pastas, estado: indexarEstado(linhas, fonteId), liberados });

  const resumo = { novo: 0, versao_nova: 0, igual: 0, inativo: 0, ignorados_na_hora: 0 };
  const falhas = [];
  const aEnviar = relatorio.itens.filter((i) => i.acao === 'novo' || i.acao === 'versao_nova');
  const lote = limite ? aEnviar.slice(0, limite) : aEnviar;
  let feitos = 0;

  for (const item of lote) {
    const documentoId = item.acao === 'novo' ? randomUUID() : item.documentoId;
    const versaoId = randomUUID();
    const caminhoNoStorage = `${empresaId}/${documentoId}/${versaoId}.${item.ext.slice(1)}`;
    let enviado = false;
    try {
      const { error } = await cliente.storage
        .from(BUCKET)
        .upload(caminhoNoStorage, readFileSync(item.absoluto), { contentType: TIPOS_DE_CONTEUDO[item.ext], upsert: false });
      if (error) throw new Error(`envio do arquivo: ${error.message}`);
      enviado = true;
      const resultado = await chamar(cliente, 'kb_importar_documento', {
        p_empresa_id: empresaId,
        p_fonte_id: fonteId,
        p_fonte_caminho: item.caminho,
        p_fonte_ref: referencia,
        p_documento_id: documentoId,
        p_versao_id: versaoId,
        p_titulo: item.titulo,
        p_tipo: item.tipo,
        p_confidencialidade: item.confidencialidade ?? CONFIDENCIALIDADE_PADRAO,
        p_arquivo_caminho: caminhoNoStorage,
        p_nome_original: posix.basename(item.caminho),
        p_tipo_arquivo: item.ext.slice(1),
        p_tamanho: item.tamanho,
        p_checksum: item.checksum,
      });
      if (resultado === 'novo' || resultado === 'versao_nova') resumo[resultado]++;
      else {
        // o banco achou que não havia nada a gravar (por exemplo, alguém mexeu na base no meio do caminho): o arquivo enviado sobra
        resumo[resultado] = (resumo[resultado] ?? 0) + 1;
        await cliente.storage.from(BUCKET).remove([caminhoNoStorage]);
      }
    } catch (e) {
      falhas.push({ caminho: item.caminho, erro: e.message });
      if (enviado) await cliente.storage.from(BUCKET).remove([caminhoNoStorage]).catch(() => undefined);
    }
    aoProgresso?.(++feitos, lote.length);
  }

  resumo.igual = relatorio.resumo.porAcao.igual;
  resumo.inativo = relatorio.resumo.porAcao.inativo;
  const parcial = Boolean(limite) && aEnviar.length > lote.length;

  // O que sumiu da fonte só é marcado quando a importação foi completa e sem falhas.
  let marcados = null;
  if (!limite && falhas.length === 0) {
    const presentes = relatorio.itens.map((i) => i.caminho);
    marcados = await chamar(cliente, 'kb_marcar_sumidos', { p_empresa_id: empresaId, p_fonte_id: fonteId, p_caminhos_presentes: presentes });
  }
  return { fonteId, resumo, falhas, marcadosComoSumidos: marcados, parcial, relatorio };
}
