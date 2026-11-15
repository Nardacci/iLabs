// Busca de endereço pelo CEP. Quem chama é o formulário do Profissional (e qualquer outro que peça endereço).
//  1. descobre quem é a pessoa pelo token enviado (sem sessão válida, nada é consultado);
//  2. procura na base do banco (ilab.buscar_cep, com a sessão da própria pessoa);
//  3. se não achar, pergunta à BrasilAPI (gratuita, base dos Correios) e GUARDA o resultado na base, para a próxima vez
//     ser instantânea e o sistema continuar respondendo se a API sair do ar.
// Sai do sistema SÓ o número do CEP (oito dígitos). Nenhum dado de pessoa, nenhuma chave.

import { CABECALHOS_CORS, responderJson } from '../_compartilhado/http.ts';

export interface EnderecoPorCep {
  logradouro: string | null;
  complemento: string | null;
  uf: string;
  /** Código do IBGE; nulo quando o nome do município que a API devolveu não bate com a lista do banco. */
  municipio_id: number | null;
  municipio: string;
  bairro: string | null;
  origem: 'base' | 'api';
}

export interface RespostaDaApi {
  logradouro: string | null;
  bairro: string | null;
  uf: string;
  municipio: string;
}

export interface DependenciasCep {
  /** Devolve o id do usuário dono do token, ou null se o token não vale. */
  quemE(tokenDeAcesso: string): Promise<string | null>;
  /** `ilab.buscar_cep` chamada com a sessão da pessoa (o banco decide se ela pode). */
  buscarNaBase(tokenDeAcesso: string, cep: string): Promise<EnderecoPorCep | null>;
  /** null = a API não conhece o CEP; 'indisponivel' = a API não respondeu (rede, limite, erro). */
  buscarNaApi(cep: string): Promise<RespostaDaApi | null | 'indisponivel'>;
  /** Casa o nome do município da API com a lista do IBGE do banco. */
  acharMunicipio(uf: string, nome: string): Promise<{ id: number; nome: string } | null>;
  guardarNaBase(cep: string, endereco: EnderecoPorCep): Promise<void>;
}

function lerToken(req: Request): string | null {
  const cabecalho = req.headers.get('authorization') ?? '';
  const [tipo, token] = cabecalho.split(' ');
  return tipo?.toLowerCase() === 'bearer' && token ? token : null;
}

/** Tira acento, caixa, apóstrofo e espaços repetidos: "Sant'Ana do Livramento" casa com "SANTANA DO LIVRAMENTO". */
export function normalizarNome(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`´]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function criarManipuladorCep(dep: DependenciasCep): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CABECALHOS_CORS });
    if (req.method !== 'POST') return responderJson({ ok: false, mensagem: 'Pedido não aceito.' }, 405);

    const token = lerToken(req);
    if (!token) return responderJson({ ok: false, mensagem: 'Sessão inválida. Entre de novo.' }, 401);

    let cep = '';
    try {
      const corpo = await req.json() as { cep?: unknown };
      cep = typeof corpo.cep === 'string' ? corpo.cep.replace(/\D/g, '') : '';
    } catch {
      cep = '';
    }
    if (!/^\d{8}$/.test(cep)) return responderJson({ ok: false, mensagem: 'Informe os 8 números do CEP.' }, 400);

    try {
      if (!(await dep.quemE(token))) {
        return responderJson({ ok: false, mensagem: 'Sessão inválida. Entre de novo.' }, 401);
      }

      const naBase = await dep.buscarNaBase(token, cep);
      if (naBase) return responderJson({ ok: true, achado: { ...naBase, origem: 'base' } });

      const naApi = await dep.buscarNaApi(cep);
      if (naApi === 'indisponivel') return responderJson({ ok: true, achado: null, indisponivel: true });
      if (!naApi || !/^[A-Za-z]{2}$/.test(naApi.uf) || !naApi.municipio) {
        return responderJson({ ok: true, achado: null });
      }

      const uf = naApi.uf.toUpperCase();
      const municipio = await dep.acharMunicipio(uf, naApi.municipio);
      const endereco: EnderecoPorCep = {
        logradouro: naApi.logradouro?.trim() || null,
        complemento: null,
        uf,
        municipio_id: municipio?.id ?? null,
        municipio: municipio?.nome ?? naApi.municipio,
        bairro: naApi.bairro?.trim().toUpperCase() || null,
        origem: 'api',
      };
      // Só entra na base o que está completo (rua e município reconhecido); CEP "geral" de cidade pequena não tem rua.
      if (endereco.municipio_id !== null && endereco.logradouro) {
        try {
          await dep.guardarNaBase(cep, endereco);
        } catch {
          console.error('buscar-cep: não foi possível guardar o CEP na base');
        }
      }
      return responderJson({ ok: true, achado: endereco });
    } catch {
      console.error('buscar-cep: não foi possível consultar o CEP');
      return responderJson({ ok: false, mensagem: 'Não foi possível concluir. Tente de novo.' }, 500);
    }
  };
}
