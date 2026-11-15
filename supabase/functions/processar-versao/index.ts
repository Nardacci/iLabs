// Ponto de entrada da função "processar-versao". SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY são
// injetadas pelo ambiente das Edge Functions: nenhuma chave fica neste arquivo.
import { createClient } from 'npm:@supabase/supabase-js@2.119.0';
import { extrairTrechos } from '../_compartilhado/texto.ts';
import { criarManipuladorProcessamento, type VersaoParaProcessar } from './manipulador.ts';

const url = Deno.env.get('SUPABASE_URL') ?? '';
const chavePublica = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const chaveDeServico = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const BUCKET = 'kb-documentos';

const opcoes = { auth: { persistSession: false, autoRefreshToken: false } } as const;
const servico = createClient(url, chaveDeServico, { ...opcoes, db: { schema: 'ilab' } });

/** Cliente com o acesso da própria pessoa: o banco aplica empresa, função e confidencialidade. */
const daPessoa = (token: string) =>
  createClient(url, chavePublica, {
    ...opcoes,
    db: { schema: 'ilab' },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

const COLUNAS = 'id, empresa_id, arquivo_caminho, tipo_arquivo, tamanho_bytes';

Deno.serve(
  criarManipuladorProcessamento({
    async empresaDoToken(token): Promise<string | null> {
      const { data, error } = await daPessoa(token).rpc('meu_estado');
      if (error || !Array.isArray(data) || data.length === 0) return null;
      return (data[0] as { empresa_id: string | null }).empresa_id;
    },
    async podeProcessar(token): Promise<boolean> {
      const { data, error } = await daPessoa(token).rpc('minhas_permissoes');
      if (error || !Array.isArray(data)) return false;
      return (data as { funcao_chave: string; incluir: boolean; alterar: boolean }[]).some(
        (p) => p.funcao_chave === 'kb.documentos' && (p.incluir || p.alterar),
      );
    },
    async versaoVisivel(token, versaoId): Promise<VersaoParaProcessar | null> {
      const { data, error } = await daPessoa(token).from('kb_documento_versoes').select(COLUNAS).eq('id', versaoId)
        .maybeSingle();
      if (error || !data) return null;
      return data as VersaoParaProcessar;
    },
    async pendentes(empresaId, limite): Promise<VersaoParaProcessar[]> {
      const { data, error } = await servico.rpc('kb_versoes_pendentes', { p_empresa_id: empresaId, p_limite: limite });
      if (error) throw new Error('kb_versoes_pendentes falhou');
      const ids = (data as { versao_id: string }[]).map((l) => l.versao_id);
      if (ids.length === 0) return [];
      const { data: versoes, error: erro2 } = await servico.from('kb_documento_versoes').select(COLUNAS).in('id', ids)
        .eq('empresa_id', empresaId);
      if (erro2) throw new Error('leitura das versões falhou');
      return versoes as VersaoParaProcessar[];
    },
    async marcar(empresaId, versaoId, estado, erro): Promise<void> {
      const { error } = await servico.rpc('kb_marcar_processamento', {
        p_empresa_id: empresaId,
        p_versao_id: versaoId,
        p_estado: estado,
        p_erro: erro ?? null,
      });
      if (error) throw new Error('kb_marcar_processamento falhou');
    },
    async baixar(caminho): Promise<Uint8Array> {
      const { data, error } = await servico.storage.from(BUCKET).download(caminho);
      if (error || !data) throw new Error('download falhou');
      return new Uint8Array(await data.arrayBuffer());
    },
    extrair: (tipo, bytes) => extrairTrechos(tipo, bytes),
    async gravar(empresaId, versaoId, trechos): Promise<number> {
      const { data, error } = await servico.rpc('kb_gravar_trechos', {
        p_empresa_id: empresaId,
        p_versao_id: versaoId,
        p_trechos: trechos,
      });
      if (error) throw new Error('kb_gravar_trechos falhou');
      return data as number;
    },
  }),
);
