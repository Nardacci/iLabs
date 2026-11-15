// Ponto de entrada da função "buscar-cep". Chaves injetadas pelo ambiente das Edge Functions; nada é lido de arquivo.
import { createClient } from 'npm:@supabase/supabase-js@2.119.0';
import { criarManipuladorCep, type EnderecoPorCep, normalizarNome, type RespostaDaApi } from './manipulador.ts';

const url = Deno.env.get('SUPABASE_URL') ?? '';
const chaveDeServico = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const chavePublica = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const servico = createClient(url, chaveDeServico, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: 'ilab' },
});

/** BrasilAPI: gratuita, sem chave, usa a base dos Correios. Só o CEP vai na chamada. */
const API_DE_CEP = 'https://brasilapi.com.br/api/cep/v1/';

Deno.serve(
  criarManipuladorCep({
    async quemE(tokenDeAcesso): Promise<string | null> {
      const { data, error } = await servico.auth.getUser(tokenDeAcesso);
      return error || !data.user ? null : data.user.id;
    },
    async buscarNaBase(tokenDeAcesso, cep): Promise<EnderecoPorCep | null> {
      const dela = createClient(url, chavePublica, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${tokenDeAcesso}` } },
        db: { schema: 'ilab' },
      });
      const { data, error } = await dela.rpc('buscar_cep', { p_cep: cep });
      if (error) throw new Error('buscar_cep falhou');
      const linha = data?.[0];
      return linha ? { ...linha, origem: 'base' } : null;
    },
    async buscarNaApi(cep): Promise<RespostaDaApi | null | 'indisponivel'> {
      try {
        const resposta = await fetch(`${API_DE_CEP}${cep}`, { signal: AbortSignal.timeout(6000) });
        if (resposta.status === 404) return null;
        if (!resposta.ok) return 'indisponivel';
        const j = await resposta.json() as Record<string, unknown>;
        const texto = (v: unknown): string | null => typeof v === 'string' && v.trim() ? v.trim() : null;
        const uf = texto(j['state']);
        const municipio = texto(j['city']);
        if (!uf || !municipio) return null;
        return { logradouro: texto(j['street']), bairro: texto(j['neighborhood']), uf, municipio };
      } catch {
        return 'indisponivel';
      }
    },
    async acharMunicipio(uf, nome): Promise<{ id: number; nome: string } | null> {
      const { data, error } = await servico.from('municipios').select('id, nome').eq('uf', uf);
      if (error) throw new Error('municipios falhou');
      const alvo = normalizarNome(nome);
      return data.find((m: { id: number; nome: string }) => normalizarNome(m.nome) === alvo) ?? null;
    },
    async guardarNaBase(cep, e): Promise<void> {
      const existe = await servico.from('logradouros').select('id').eq('cep', cep).limit(1);
      if (existe.error || (existe.data?.length ?? 0) > 0) return;
      const { error } = await servico.from('logradouros').insert({
        cep,
        tipo: null,
        nome: e.logradouro,
        complemento: null,
        uf: e.uf,
        municipio_id: e.municipio_id,
        bairro: e.bairro,
      });
      if (error) throw new Error('logradouros falhou');
    },
  }),
);
