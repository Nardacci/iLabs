import { inject, Injectable } from '@angular/core';
import { SessaoService } from '../sessao/sessao.service';
import { BancoService, ErroDoBanco, type LinhaDe } from './banco';

/** Bucket privado da base de conhecimento (criado pela migração 15). */
export const BUCKET_DOS_DOCUMENTOS = 'kb-documentos';
/** O banco confere o mesmo limite (50 MB) e os mesmos tipos; aqui é só aviso rápido, antes de enviar. */
export const LIMITE_DO_ARQUIVO = 52_428_800;

const TIPOS_ACEITOS = {
  txt: 'text/plain',
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
} as const;
type ExtensaoAceita = keyof typeof TIPOS_ACEITOS;

/** Extensão aceita (txt, docx ou pdf) ou nulo. */
export function extensaoDe(nome: string): ExtensaoAceita | null {
  const ext = nome.split('.').pop()?.toLowerCase() ?? '';
  return ext in TIPOS_ACEITOS ? (ext as ExtensaoAceita) : null;
}

/** Aviso rápido sobre o arquivo escolhido (o banco e o Storage conferem de novo). Nulo = tudo certo. */
export function conferirArquivo(arquivo: { name: string; size: number }): string | null {
  if (!extensaoDe(arquivo.name)) return 'Use um arquivo TXT, DOCX ou PDF.';
  if (arquivo.size <= 0) return 'O arquivo está vazio.';
  if (arquivo.size > LIMITE_DO_ARQUIVO) return 'O arquivo passa de 50 MB.';
  return null;
}

/** Tamanho em linguagem simples (por exemplo, "1,2 MB"). */
export function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

/** SHA-256 do conteúdo, em hexadecimal minúsculo (o banco guarda este valor para avisar de arquivo repetido). */
export async function checksumDe(arquivo: Blob): Promise<string> {
  const resumo = await crypto.subtle.digest('SHA-256', await arquivo.arrayBuffer());
  return [...new Uint8Array(resumo)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Os dados de um documento novo, como o formulário os entrega (vazio = não informado). */
export interface DadosDoDocumento {
  titulo: string;
  legenda: string | null;
  tipo: string;
  origem: string;
  confidencialidade: string;
  data_fonte: string | null;
  identificacao_oficial: string | null;
  consultado_em: string | null;
  situacao_lida: string | null;
}

/** Uma versão de um documento, como o banco guarda. */
export type VersaoDeDocumento = LinhaDe<'kb_documento_versoes'>;

export interface ArquivoJaEnviado {
  documento_id: string;
  titulo: string;
  numero: number;
}

/** As funções do banco aceitam nulo nos campos opcionais; o tipo gerado só sabe dizer `string`. */
const SEM_VALOR = null as unknown as string;

/**
 * Envio de documento: o navegador calcula o checksum, manda o arquivo ao bucket privado, na pasta da empresa, e só
 * então pede ao banco para registrar (`kb_criar_documento`). O banco decide tudo (permissão, caminho, regras); aqui
 * não há regra de negócio. Se o registro falhar depois do envio, o arquivo fica sem registro e é limpo depois.
 */
@Injectable({ providedIn: 'root' })
export class EnvioDeDocumentoService {
  private readonly banco = inject(BancoService);
  private readonly sessao = inject(SessaoService);

  /** Documentos (que a pessoa pode ver) que já têm este mesmo arquivo. Só aviso: não impede o envio. */
  async jaEnviado(arquivo: Blob): Promise<ArquivoJaEnviado[]> {
    const lista = await this.banco.rpc('kb_arquivo_ja_existe', {
      p_checksum: await checksumDe(arquivo),
    });
    return lista.flatMap((x) =>
      x.documento_id && x.titulo && x.numero !== null
        ? [{ documento_id: x.documento_id, titulo: x.titulo, numero: x.numero }]
        : [],
    );
  }

  /**
   * Confere o arquivo, calcula o checksum e o envia ao bucket privado, na pasta da empresa, no caminho
   * `empresa/documento/versão.extensão`. Devolve o que o banco precisa para registrar o envio.
   */
  private async enviarArquivo(
    documentoId: string,
    arquivo: File,
  ): Promise<{ versaoId: string; caminho: string; ext: ExtensaoAceita; checksum: string }> {
    const ext = extensaoDe(arquivo.name);
    const aviso = conferirArquivo(arquivo);
    if (aviso || !ext) throw new ErroDoBanco(aviso ?? 'Use um arquivo TXT, DOCX ou PDF.');
    const empresa = this.sessao.estado()?.empresa_id;
    if (!empresa)
      throw new ErroDoBanco('Não foi possível identificar a sua empresa. Entre de novo.');

    const checksum = await checksumDe(arquivo);
    const versaoId = crypto.randomUUID();
    const caminho = `${empresa}/${documentoId}/${versaoId}.${ext}`;

    const { error } = await this.banco.cliente.storage
      .from(BUCKET_DOS_DOCUMENTOS)
      .upload(caminho, arquivo, { contentType: TIPOS_ACEITOS[ext], upsert: false });
    if (error) {
      throw new ErroDoBanco(
        /row-level security|not authorized|unauthorized|403/i.test(error.message)
          ? 'Você não tem permissão para enviar este arquivo.'
          : 'Não foi possível enviar o arquivo. Tente de novo.',
      );
    }
    return { versaoId, caminho, ext, checksum };
  }

  /** Envia o arquivo e registra o documento com a versão 1. Devolve o id do documento. */
  async criar(dados: DadosDoDocumento, arquivo: File): Promise<string> {
    const documentoId = crypto.randomUUID();
    const envio = await this.enviarArquivo(documentoId, arquivo);
    return this.banco.rpc('kb_criar_documento', {
      p_documento_id: documentoId,
      p_versao_id: envio.versaoId,
      p_titulo: dados.titulo,
      p_legenda: dados.legenda ?? SEM_VALOR,
      p_tipo: dados.tipo,
      p_origem: dados.origem,
      p_confidencialidade: dados.confidencialidade,
      p_data_fonte: dados.data_fonte ?? SEM_VALOR,
      p_identificacao: dados.identificacao_oficial ?? SEM_VALOR,
      p_consultado_em: dados.consultado_em ?? SEM_VALOR,
      p_situacao_lida: dados.situacao_lida ?? SEM_VALOR,
      p_caminho: envio.caminho,
      p_nome_original: arquivo.name,
      p_tipo_arquivo: envio.ext,
      p_tamanho: arquivo.size,
      p_checksum: envio.checksum,
    });
  }

  /** As versões do documento (a mais nova primeiro). O banco decide o que a pessoa pode ver. */
  async versoes(documentoId: string): Promise<VersaoDeDocumento[]> {
    const { data, error } = await this.banco.cliente
      .from('kb_documento_versoes')
      .select('*')
      .eq('documento_id', documentoId)
      .order('numero', { ascending: false });
    if (error) throw new ErroDoBanco(error.message);
    return data;
  }

  /** Envia um arquivo como nova versão (a anterior continua guardada). Devolve o número da versão. */
  async novaVersao(documentoId: string, arquivo: File, motivo: string): Promise<number> {
    const envio = await this.enviarArquivo(documentoId, arquivo);
    return this.banco.rpc('kb_nova_versao', {
      p_documento_id: documentoId,
      p_versao_id: envio.versaoId,
      p_caminho: envio.caminho,
      p_nome_original: arquivo.name,
      p_tipo_arquivo: envio.ext,
      p_tamanho: arquivo.size,
      p_checksum: envio.checksum,
      p_motivo: motivo,
    });
  }

  /** Endereço temporário (1 minuto) para baixar uma versão; só quem enxerga a versão consegue gerá-lo. */
  async enderecoDeDownload(
    versao: Pick<VersaoDeDocumento, 'arquivo_caminho' | 'nome_original'>,
  ): Promise<string> {
    const { data, error } = await this.banco.cliente.storage
      .from(BUCKET_DOS_DOCUMENTOS)
      .createSignedUrl(versao.arquivo_caminho, 60, { download: versao.nome_original });
    if (error) throw new ErroDoBanco('Não foi possível preparar o download. Tente de novo.');
    return data.signedUrl;
  }
}
