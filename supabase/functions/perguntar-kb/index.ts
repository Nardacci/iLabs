// Ponto de entrada da função "perguntar-kb". SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY são
// injetadas pelo ambiente das Edge Functions. A chave do provedor de IA vem do segredo ANTHROPIC_API_KEY, cadastrado
// no painel do Supabase (nunca neste arquivo, nunca no git). KB_IA_MODELO (opcional) troca o modelo sem mexer no código.
import Anthropic from 'npm:@anthropic-ai/sdk@1.8.0';
import { createClient } from 'npm:@supabase/supabase-js@2.119.0';
import { MODELO_PADRAO, type PedidoAoModelo, type RespostaDoModelo, type TrechoParaIa } from '../_compartilhado/ia.ts';
import { criarManipuladorPerguntar } from './manipulador.ts';

const url = Deno.env.get('SUPABASE_URL') ?? '';
const chavePublica = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const chaveDeServico = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const chaveDaIa = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const modelo = Deno.env.get('KB_IA_MODELO') || MODELO_PADRAO;

const opcoes = { auth: { persistSession: false, autoRefreshToken: false } } as const;
const servico = createClient(url, chaveDeServico, { ...opcoes, db: { schema: 'ilab' } });

/** Cliente com o acesso da própria pessoa: o banco aplica empresa, função e confidencialidade. */
const daPessoa = (token: string) =>
  createClient(url, chavePublica, {
    ...opcoes,
    db: { schema: 'ilab' },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

// Uma nova tentativa e no máximo 60 s: a função de servidor tem tempo limitado e a pessoa está esperando.
const provedor = chaveDaIa ? new Anthropic({ apiKey: chaveDaIa, maxRetries: 1, timeout: 60_000 }) : null;

Deno.serve(
  criarManipuladorPerguntar({
    iaConfigurada: () => provedor !== null,
    modelo,
    async contexto(token) {
      const { data, error } = await daPessoa(token).rpc('meu_estado');
      if (error || !Array.isArray(data) || data.length === 0) return null;
      const e = data[0] as { usuario_id: string; empresa_id: string | null; ativo: boolean };
      return e.ativo && e.empresa_id ? { usuarioId: e.usuario_id, empresaId: e.empresa_id } : null;
    },
    async podePerguntar(token) {
      const { data, error } = await daPessoa(token).rpc('minhas_permissoes');
      if (error || !Array.isArray(data)) return false;
      return (data as { funcao_chave: string; consultar: boolean }[]).some(
        (p) => p.funcao_chave === 'kb.documentos' && p.consultar,
      );
    },
    async trechos(token, pergunta, limite): Promise<TrechoParaIa[]> {
      const { data, error } = await daPessoa(token).rpc('kb_buscar_para_ia', { p_consulta: pergunta, p_limite: limite });
      if (error) throw new Error('kb_buscar_para_ia falhou');
      return (data ?? []) as TrechoParaIa[];
    },
    async perguntarAoModelo(pedido: PedidoAoModelo): Promise<RespostaDoModelo> {
      if (!provedor) throw new Error('IA sem chave');
      const resposta = await provedor.messages.create(pedido as unknown as Anthropic.MessageCreateParamsNonStreaming);
      return resposta as unknown as RespostaDoModelo;
    },
    async registrar(r) {
      const { error } = await servico.rpc('kb_registrar_interacao', {
        p_empresa_id: r.empresaId,
        p_usuario_id: r.usuarioId,
        p_pergunta: r.pergunta,
        p_resposta: r.resposta,
        p_estado: r.estado,
        p_modelo: r.modelo,
        p_tokens_entrada: r.tokensEntrada,
        p_tokens_saida: r.tokensSaida,
        p_fontes: r.fontes,
      });
      if (error) throw new Error('kb_registrar_interacao falhou');
    },
  }),
);
