import { definirCadastro } from '../compartilhado/cadastro/descricao';

/**
 * Profissionais: a pessoa que executa e assina. É separado da conta de usuário (a conta é opcional).
 * Cadastro completo, com as regras do legado (decisão de 13/11/2026; nome da mãe e do pai voltaram): o formulário é
 * próprio (`profissional/formulario-profissional.ts`). Os `campos` abaixo servem à lista, à busca e às mensagens.
 */
export const profissionais = definirCadastro({
  tabela: 'profissionais',
  titulo: 'Profissionais',
  singular: 'profissional',
  genero: 'm',
  funcao: 'acesso.profissionais',
  identificador: 'nome',
  busca: ['codigo', 'nome', 'cpf'],
  ordenarPor: 'nome',
  formularioProprio: () =>
    import('./profissional/formulario-profissional').then((m) => m.FormularioProfissional),
  campos: [
    { nome: 'codigo', rotulo: 'Código', obrigatorio: true, max: 20 },
    { nome: 'nome', rotulo: 'Nome completo', obrigatorio: true, max: 255 },
    {
      nome: 'cpf',
      rotulo: 'CPF',
      obrigatorio: true,
      formato: 'cpf',
      dica: 'Pode digitar com pontos e traço. O sistema confere os dígitos.',
    },
    {
      nome: 'funcao_profissional_id',
      rotulo: 'Cargo principal (função profissional)',
      tipo: 'lista',
      obrigatorio: true,
      referencia: { tabela: 'funcoes_profissionais', rotulo: 'descricao' },
    },
    {
      nome: 'setor_id',
      rotulo: 'Setor',
      tipo: 'lista',
      referencia: {
        tabela: 'estrutura_organizacional',
        rotulo: 'nome',
        onde: { coluna: 'tipo', valor: 'setor' },
      },
      dica: 'Opcional. É carregado quando a pessoa entra no sistema: se mudar, ela precisa entrar de novo.',
    },
    {
      nome: 'grupo_id',
      rotulo: 'Grupo de usuários',
      tipo: 'lista',
      referencia: { tabela: 'grupos_usuarios', rotulo: 'nome' },
      dica: 'É carregado quando a pessoa entra no sistema: se mudar, ela precisa entrar de novo.',
    },
  ],
});
