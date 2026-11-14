import type { NomeDaTabela } from '../dados/banco';
import type { OpcaoDeLista } from '../ui/campo';

export interface CampoDeCadastro {
  /** Nome da coluna no banco. */
  nome: string;
  rotulo: string;
  tipo?: 'texto' | 'textolongo' | 'email' | 'lista' | 'data';
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
  /** Aparece só na lista (e como filtro): não entra no formulário nem na alteração. */
  somenteLista?: boolean;
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
   * O cadastro NOVO exige um arquivo (TXT, MD, DOCX ou PDF): o navegador envia ao bucket privado e o banco registra o
   * documento pela função `kb_criar_documento`. Alterar os dados continua pela alteração genérica, com motivo.
   */
  envioDeArquivo?: boolean;
  /**
   * Filtros extras na barra da lista: nomes de campos do tipo lista com `referencia` (por exemplo, a fonte do documento).
   * Cada um vira uma escolha "Todos" ou um dos registros do outro cadastro.
   */
  filtros?: readonly string[];
}

/** Só confere o formato da descrição em tempo de compilação. */
export function definirCadastro(descricao: DescricaoDeCadastro): DescricaoDeCadastro {
  return descricao;
}
