import type { NomeDaTabela } from '../dados/banco';
import type { OpcaoDeLista } from '../ui/campo';

export interface CampoDeCadastro {
  /** Nome da coluna no banco. */
  nome: string;
  rotulo: string;
  tipo?: 'texto' | 'textolongo' | 'email' | 'lista';
  obrigatorio?: boolean;
  min?: number;
  max?: number;
  /** Para `tipo: 'lista'`: as opções de apoio. */
  opcoes?: readonly OpcaoDeLista[];
  dica?: string;
  /** Aparece como coluna da lista (padrão: sim). */
  naLista?: boolean;
}

/**
 * A descrição curta de um cadastro. Dela saem: lista com busca e paginação, formulário com validação,
 * justificativa nas ações críticas (inativar e reativar), histórico da auditoria e impressão.
 */
export interface DescricaoDeCadastro {
  tabela: NomeDaTabela;
  titulo: string;
  /** Para frases como "Nova {singular}". */
  singular: string;
  /** Função do banco (ilab.funcoes) que libera a tela e as ações. */
  funcao: string;
  /** Colunas em que a busca procura. */
  busca: readonly string[];
  ordenarPor: string;
  campos: readonly CampoDeCadastro[];
}

/** Só confere o formato da descrição em tempo de compilação. */
export function definirCadastro(descricao: DescricaoDeCadastro): DescricaoDeCadastro {
  return descricao;
}
