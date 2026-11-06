// Ponto de entrada da função "login" no Supabase. SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY
// são injetadas pelo próprio ambiente das Edge Functions: nenhuma chave fica neste arquivo.
import { createClient } from 'npm:@supabase/supabase-js@2.119.0';
import { criarManipuladorLogin, type PassoDaConta, type Sessao } from './manipulador.ts';
import { esperar } from '../_compartilhado/http.ts';

const url = Deno.env.get('SUPABASE_URL') ?? '';
const chavePublica = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const chaveDeServico = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const opcoes = { auth: { persistSession: false, autoRefreshToken: false } } as const;
const servico = createClient(url, chaveDeServico, { ...opcoes, db: { schema: 'ilab' } });

Deno.serve(
  criarManipuladorLogin({
    async entrar(email, senha): Promise<Sessao | null> {
      const cliente = createClient(url, chavePublica, opcoes);
      const { data, error } = await cliente.auth.signInWithPassword({ email, password: senha });
      if (error || !data.session) return null;
      const s = data.session;
      return {
        access_token: s.access_token,
        refresh_token: s.refresh_token,
        expires_in: s.expires_in,
        expires_at: s.expires_at,
        token_type: s.token_type,
      };
    },
    async passoDaConta(tokenDeAcesso): Promise<PassoDaConta | null> {
      const cliente = createClient(url, chavePublica, {
        ...opcoes,
        db: { schema: 'ilab' },
        global: { headers: { Authorization: `Bearer ${tokenDeAcesso}` } },
      });
      const { data, error } = await cliente.rpc('proximo_passo');
      if (error || !Array.isArray(data) || data.length === 0) return null;
      return data[0] as PassoDaConta;
    },
    async encerrarSessao(tokenDeAcesso): Promise<void> {
      await servico.auth.admin.signOut(tokenDeAcesso);
    },
    async registrarAcesso(email, evento, resultado, ip, navegador, detalhe): Promise<void> {
      const { error } = await servico.rpc('registrar_acesso', {
        p_email: email,
        p_evento: evento,
        p_resultado: resultado,
        p_ip: ip,
        p_navegador: navegador,
        p_detalhe: detalhe,
      });
      if (error) throw new Error('registrar_acesso falhou');
    },
    async bloquearPorTentativas(email, ip, navegador): Promise<boolean> {
      const { data, error } = await servico.rpc('bloquear_por_tentativas', {
        p_email: email,
        p_ip: ip,
        p_navegador: navegador,
      });
      if (error) throw new Error('bloquear_por_tentativas falhou');
      return data === true;
    },
    esperar,
    agora: () => Date.now(),
  }),
);
