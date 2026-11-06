import { definirCadastro } from '../compartilhado/cadastro/descricao';

/** Centros de custo: segue o legado, corrigido (o código aceita letras; toda mudança pede motivo). */
export const centrosCusto = definirCadastro({
  tabela: 'centros_custo',
  titulo: 'Centros de custo',
  singular: 'centro de custo',
  genero: 'm',
  funcao: 'organizacao.centros_custo',
  identificador: 'descricao',
  busca: ['codigo', 'descricao'],
  ordenarPor: 'codigo',
  campos: [
    {
      nome: 'codigo',
      rotulo: 'Código',
      obrigatorio: true,
      max: 20,
      dica: 'Letras, números, ponto, traço e sublinhado (por exemplo TCC01). Sem espaços.',
    },
    { nome: 'descricao', rotulo: 'Descrição', obrigatorio: true, max: 120 },
  ],
});
