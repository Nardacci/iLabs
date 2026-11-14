import { inject, Injectable } from '@angular/core';
import { BancoService, ErroDoBanco, type LinhaDe, type NomeDaTabela } from './banco';

export interface PedidoDeLista {
  tabela: NomeDaTabela;
  /** Colunas em que a busca procura (parte do texto, sem diferenciar maiúsculas). */
  colunasDeBusca: readonly string[];
  busca: string;
  pagina: number;
  tamanho: number;
  ordenarPor: string;
  /** Só estas situações (ativo, inativo, excluido). Sem isto, vêm todas. */
  situacoes?: readonly string[];
  /** Só os registros em que cada coluna é igual ao valor (por exemplo, { fonte_id: '…' }). */
  filtros?: Readonly<Record<string, string>>;
}

export interface Pagina<L> {
  linhas: L[];
  total: number;
}

interface ErroDeTabela {
  code?: string;
  message: string;
}

/** Traduz os erros comuns do Postgres para uma frase simples. O banco continua sendo quem recusa. */
function traduzir(erro: ErroDeTabela): ErroDoBanco {
  if (erro.code === '23505') return new ErroDoBanco('Já existe um registro com este valor.');
  if (erro.code === '42501' || /row-level security/i.test(erro.message)) {
    return new ErroDoBanco('Você não tem permissão para esta ação.');
  }
  if (erro.code === '23514') return new ErroDoBanco('Algum valor não é aceito. Confira os campos.');
  return new ErroDoBanco(erro.message);
}

/** Leitura e gravação de tabelas. As linhas visíveis e as gravações permitidas são decididas pelo banco (RLS por empresa e função). */
@Injectable({ providedIn: 'root' })
export class ConsultaService {
  private readonly banco = inject(BancoService);

  async listar<T extends NomeDaTabela>(
    p: PedidoDeLista & { tabela: T },
  ): Promise<Pagina<LinhaDe<T>>> {
    const de = (p.pagina - 1) * p.tamanho;
    let consulta = this.banco.cliente
      .from(p.tabela)
      .select('*', { count: 'exact' })
      .order(p.ordenarPor)
      .range(de, de + p.tamanho - 1);
    if (p.situacoes && p.situacoes.length > 0) {
      consulta = consulta.in('situacao' as never, [...p.situacoes] as never);
    }
    for (const [coluna, valor] of Object.entries(p.filtros ?? {})) {
      if (valor) consulta = consulta.eq(coluna as never, valor);
    }
    const termo = p.busca.trim().replace(/[%,()*]/g, ' ');
    if (termo && p.colunasDeBusca.length > 0) {
      consulta = consulta.or(p.colunasDeBusca.map((c) => `${c}.ilike.%${termo}%`).join(','));
    }
    const { data, error, count } = await consulta;
    if (error) throw traduzir(error);
    return { linhas: data as unknown as LinhaDe<T>[], total: count ?? 0 };
  }

  async incluir(tabela: NomeDaTabela, valores: Record<string, unknown>): Promise<void> {
    const { error } = await this.banco.cliente.from(tabela).insert(valores as never);
    if (error) throw traduzir(error);
  }

  /** Um registro pelo id (quem abre o endereço de um cadastro direto, sem passar pela lista). O banco decide se pode ver. */
  async obter<T extends NomeDaTabela>(tabela: T, id: string): Promise<LinhaDe<T> | null> {
    const { data, error } = await this.banco.cliente
      .from(tabela)
      .select('*')
      .eq('id' as never, id as never)
      .maybeSingle();
    if (error) throw traduzir(error);
    return data as unknown as LinhaDe<T> | null;
  }

  /** Histórico de um registro (trilha de auditoria, só leitura). */
  async historico(tabela: string, registroId: string): Promise<LinhaDe<'auditoria'>[]> {
    const { data, error } = await this.banco.cliente
      .from('auditoria')
      .select('*')
      .eq('tabela', tabela)
      .eq('registro_id', registroId)
      .order('em', { ascending: false })
      .limit(50);
    if (error) throw traduzir(error);
    return data;
  }
}
