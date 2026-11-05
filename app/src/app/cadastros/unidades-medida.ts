import { definirCadastro } from '../compartilhado/cadastro/descricao';

/** Cadastro de unidades de medida: a PROVA da tela por metadados. Tudo o que a tela faz sai desta descrição. */
export const unidadesMedida = definirCadastro({
  tabela: 'unidades_medida',
  titulo: 'Unidades de medida',
  singular: 'unidade de medida',
  funcao: 'cadastros.unidades_medida',
  busca: ['sigla', 'nome'],
  ordenarPor: 'nome',
  campos: [
    { nome: 'sigla', rotulo: 'Sigla', obrigatorio: true, max: 10 },
    { nome: 'nome', rotulo: 'Nome', obrigatorio: true, max: 60 },
    {
      nome: 'grandeza',
      rotulo: 'Grandeza',
      tipo: 'lista',
      obrigatorio: true,
      opcoes: ['massa', 'volume', 'unidade', 'comprimento', 'tempo'].map((g) => ({
        valor: g,
        rotulo: g,
      })),
    },
  ],
});
