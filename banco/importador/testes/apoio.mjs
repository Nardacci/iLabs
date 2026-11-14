import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { strToU8, zipSync } from 'fflate';

/** Cria uma pasta temporária com os arquivos descritos em { 'caminho/relativo': conteúdo (texto ou Buffer) }. */
export function criarArvore(arquivos) {
  const raiz = mkdtempSync(join(tmpdir(), 'ilabs-importador-'));
  for (const [caminho, conteudo] of Object.entries(arquivos)) {
    const absoluto = join(raiz, ...caminho.split('/'));
    mkdirSync(dirname(absoluto), { recursive: true });
    writeFileSync(absoluto, conteudo);
  }
  return raiz;
}

/** Um DOCX mínimo (pacote ZIP com word/document.xml) com os parágrafos dados. */
export function docx(paragrafos) {
  const corpo = paragrafos.map((p) => `<w:p><w:r><w:t>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</w:t></w:r></w:p>`).join('');
  const xml = `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${corpo}</w:body></w:document>`;
  return Buffer.from(zipSync({ 'word/document.xml': strToU8(xml), '[Content_Types].xml': strToU8('<Types/>') }));
}

/** Um PDF mínimo e válido com uma linha de texto (texto vazio = PDF sem texto, como um escaneado). */
export function pdf(texto) {
  const conteudo = texto ? `BT /F1 12 Tf 72 720 Td (${texto}) Tj ET` : '';
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${conteudo.length} >>\nstream\n${conteudo}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let saida = '%PDF-1.4\n';
  const posicoes = [];
  objetos.forEach((o, i) => {
    posicoes.push(saida.length);
    saida += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = saida.length;
  saida += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n${posicoes.map((p) => `${String(p).padStart(10, '0')} 00000 n \n`).join('')}`;
  saida += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(saida, 'latin1');
}

/**
 * Banco de mentira, com o comportamento das funções do Supabase que o importador usa (kb_*) e do Storage.
 * Guarda tudo em memória e registra as chamadas.
 */
export function clienteFalso({ falharNoRpc = false } = {}) {
  const estado = { docs: new Map(), objetos: new Map(), chamadas: [], marcados: null, fonteCriada: null, falharNoRpc, regras: new Map(), lotesDeRegras: [], regrasPresentes: null };
  const rpc = async (nome, args) => {
    estado.chamadas.push(nome);
    if (nome === 'kb_criar_fonte') {
      estado.fonteCriada = args;
      return { data: 'fonte-1', error: null };
    }
    if (nome === 'kb_importacao_estado') {
      const linhas = [];
      for (const [caminho, d] of estado.docs) for (const v of d.versoes) linhas.push({ documento_id: d.documentoId, fonte_id: 'fonte-1', fonte_caminho: caminho, situacao: d.situacao, numero: v.numero, checksum: v.checksum });
      return { data: linhas, error: null };
    }
    if (nome === 'kb_importar_documento') {
      if (estado.falharNoRpc) return { data: null, error: { message: 'falha simulada do banco' } };
      const atual = estado.docs.get(args.p_fonte_caminho);
      if (!atual) {
        if (args.p_arquivo_caminho !== `${args.p_empresa_id}/${args.p_documento_id}/${args.p_versao_id}.${args.p_tipo_arquivo}`) return { data: null, error: { message: 'O caminho do arquivo não confere' } };
        estado.docs.set(args.p_fonte_caminho, { documentoId: args.p_documento_id, situacao: 'ativo', titulo: args.p_titulo, tipo: args.p_tipo, versoes: [{ numero: 1, checksum: args.p_checksum, ref: args.p_fonte_ref }] });
        return { data: 'novo', error: null };
      }
      if (atual.situacao !== 'ativo') return { data: 'inativo', error: null };
      const ultima = atual.versoes[atual.versoes.length - 1];
      if (ultima.checksum === args.p_checksum) return { data: 'igual', error: null };
      if (args.p_arquivo_caminho !== `${args.p_empresa_id}/${atual.documentoId}/${args.p_versao_id}.${args.p_tipo_arquivo}`) return { data: null, error: { message: 'O caminho do arquivo não confere' } };
      atual.versoes.push({ numero: ultima.numero + 1, checksum: args.p_checksum, ref: args.p_fonte_ref });
      return { data: 'versao_nova', error: null };
    }
    if (nome === 'kb_importar_regras') {
      if (estado.falharNoRpc) return { data: null, error: { message: 'falha simulada do banco' } };
      if (args.p_regras.length > 500) return { data: null, error: { message: 'Regras demais num lote (máximo 500).' } };
      estado.lotesDeRegras.push(args.p_regras.length);
      const total = { novas: 0, alteradas: 0, iguais: 0, inativas: 0 };
      for (const r of args.p_regras) {
        const atual = estado.regras.get(r.id.toUpperCase());
        if (!atual) total.novas++;
        else if (JSON.stringify(atual) === JSON.stringify(r)) total.iguais++;
        else total.alteradas++;
        estado.regras.set(r.id.toUpperCase(), r);
      }
      return { data: total, error: null };
    }
    if (nome === 'kb_marcar_regras_sumidas') {
      estado.regrasPresentes = args.p_codigos_presentes;
      return { data: 0, error: null };
    }
    if (nome === 'kb_marcar_sumidos') {
      estado.marcados = args.p_caminhos_presentes;
      return { data: 0, error: null };
    }
    return { data: null, error: { message: `função desconhecida: ${nome}` } };
  };
  const storage = {
    from: () => ({
      upload: async (caminho, corpo, opcoes) => {
        estado.objetos.set(caminho, { tamanho: corpo.length, opcoes });
        return { error: null };
      },
      remove: async (lista) => {
        for (const c of lista) estado.objetos.delete(c);
        return { error: null };
      },
    }),
  };
  return { cliente: { rpc, storage }, estado };
}
