import type { Type } from '@angular/core';
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
  /**
   * Para `tipo: 'lista'` com opções de OUTRO cadastro (a coluna guarda o id): de onde vêm e qual coluna dá o nome.
   * Para escolher só aparecem os ativos (mais o que já estava gravado); a lista mostra o nome, não o id.
   */
  referencia?: {
    tabela: NomeDaTabela;
    rotulo: string;
    /** Só oferece os registros em que a coluna tem este valor (conveniência da tela: o banco confere a gravação). */
    onde?: { coluna: string; valor: string };
  };
  /** Como mostrar o valor na lista (o banco guarda só os dígitos). */
  formato?: 'cpf';
}

/**
 * Entradas que o cadastro entrega ao formulário próprio (quando o cadastro é grande demais para o formulário
 * genérico). O formulário só coleta e apresenta; salvar e conferir é do banco.
 */
export interface EntradasDoFormularioProprio {
  /** A linha em edição (nula na inclusão). */
  registro: Record<string, unknown> | null;
  /** Chamado depois que o banco gravou. */
  aoSalvar: (resultado: { id: string; alteracao: boolean }) => void;
  aoCancelar: () => void;
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
  /** Gênero do nome, para "Novo" ou "Nova" (padrão: feminino, como "Nova unidade de medida"). */
  genero?: 'm' | 'f';
  /** Função do banco (ilab.funcoes) que libera a tela e as ações. */
  funcao: string;
  /** Campo que nomeia o registro nas ações e no histórico (padrão: o primeiro campo). */
  identificador?: string;
  /** Colunas em que a busca procura. */
  busca: readonly string[];
  ordenarPor: string;
  campos: readonly CampoDeCadastro[];
  /**
   * Cadastro em ÁRVORE: a coluna que guarda o id do nível de cima. A lista mostra os níveis recuados, carregados
   * de uma vez (sem páginas); com busca, mostra só os que combinam, sem recuo.
   */
  arvore?: { pai: string };
  /**
   * Cadastro com muitos campos: um componente próprio no lugar do formulário genérico da aba Dados (migalhas, abas,
   * histórico, situação e o aviso de "entrar de novo" continuam sendo do cadastro genérico). Recebe
   * `EntradasDoFormularioProprio` como entradas.
   */
  formularioProprio?: () => Promise<Type<unknown>>;
}

/** Só confere o formato da descrição em tempo de compilação. */
export function definirCadastro(descricao: DescricaoDeCadastro): DescricaoDeCadastro {
  return descricao;
}
