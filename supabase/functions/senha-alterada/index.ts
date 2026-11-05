// Ponto de entrada da função "senha-alterada". Chaves injetadas pelo ambiente das Edge Functions.
import { createClient } from 'npm:@supabase/supabase-js@2.119.0';
import { criarManipuladorSenhaAlterada } from './manipulador.ts';

const url = Deno.env.get('SUPABASE_URL') ?? '';
const chaveDeServico = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const servico = createClient(url, chaveDeServico, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: 'ilab' },
});

Deno.serve(
  criarManipuladorSenhaAlterada({
    async quemE(tokenDeAcesso): Promise<string | null> {
      const { data, error } = await servico.auth.getUser(tokenDeAcesso);
      return error || !data.user ? null : data.user.id;
    },
    async registrarTrocaDeSenha(usuarioId, ip, navegador): Promise<void> {
      const { error } = await servico.rpc('registrar_troca_de_senha', {
        p_usuario_id: usuarioId,
        p_ip: ip,
        p_navegador: navegador,
      });
      if (error) throw new Error('registrar_troca_de_senha falhou');
    },
  }),
);
