import { definirCadastro } from '../compartilhado/cadastro/descricao';

/**
 * Profissionais: a pessoa que executa e assina. É separado da conta de usuário (a conta é opcional).
 * Sem nome da mãe nem do pai (decisão de 06/11/2026).
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
  campos: [
    { nome: 'codigo', rotulo: 'Código', obrigatorio: true, max: 20 },
    { nome: 'nome', rotulo: 'Nome completo', obrigatorio: true, max: 120 },
    {
      nome: 'cpf',
      rotulo: 'CPF',
      obrigatorio: true,
      formato: 'cpf',
      dica: 'Pode digitar com pontos e traço. O sistema confere os dígitos.',
    },
    {
      nome: 'funcao_profissional_id',
      rotulo: 'Função profissional (cargo principal)',
      tipo: 'lista',
      obrigatorio: true,
      referencia: { tabela: 'funcoes_profissionais', rotulo: 'descricao' },
    },
    {
      nome: 'cbo',
      rotulo: 'Ocupação (CBO)',
      max: 7,
      dica: 'No formato 0000-00, por exemplo 2234-05.',
      naLista: false,
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
