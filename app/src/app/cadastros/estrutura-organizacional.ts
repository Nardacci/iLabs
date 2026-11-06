import { definirCadastro } from '../compartilhado/cadastro/descricao';

/**
 * Estrutura organizacional: UMA árvore para planta, prédio, departamento e setor (decisão de 06/11/2026).
 * As regras (nível só dentro de nível maior, sem ciclo, sem pai excluído) são do banco; a tela só mostra.
 */
export const estruturaOrganizacional = definirCadastro({
  tabela: 'estrutura_organizacional',
  titulo: 'Estrutura organizacional',
  singular: 'nível',
  genero: 'm',
  funcao: 'organizacao.estrutura',
  identificador: 'nome',
  busca: ['codigo', 'nome'],
  ordenarPor: 'nome',
  arvore: { pai: 'pai_id' },
  campos: [
    { nome: 'nome', rotulo: 'Nome', obrigatorio: true, max: 120 },
    { nome: 'codigo', rotulo: 'Código', obrigatorio: true, max: 20 },
    {
      nome: 'tipo',
      rotulo: 'Tipo de nível',
      tipo: 'lista',
      obrigatorio: true,
      opcoes: [
        { valor: 'planta', rotulo: 'Planta' },
        { valor: 'predio', rotulo: 'Prédio' },
        { valor: 'departamento', rotulo: 'Departamento' },
        { valor: 'setor', rotulo: 'Setor' },
      ],
      dica: 'Um nível só fica dentro de um nível maior: planta, prédio, departamento e setor, nessa ordem.',
    },
    {
      nome: 'pai_id',
      rotulo: 'Está dentro de',
      tipo: 'lista',
      referencia: { tabela: 'estrutura_organizacional', rotulo: 'nome' },
      naLista: false,
      dica: 'Deixe em branco para o nível mais alto (uma planta).',
    },
    {
      nome: 'responsavel_id',
      rotulo: 'Responsável',
      tipo: 'lista',
      referencia: { tabela: 'profissionais', rotulo: 'nome' },
    },
  ],
});
