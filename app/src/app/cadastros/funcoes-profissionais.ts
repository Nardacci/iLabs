import { definirCadastro } from '../compartilhado/cadastro/descricao';

/** Funções profissionais: quem tem competência para assinar (segunda camada, além do perfil). */
export const funcoesProfissionais = definirCadastro({
  tabela: 'funcoes_profissionais',
  titulo: 'Funções profissionais',
  singular: 'função profissional',
  funcao: 'acesso.funcoes_profissionais',
  identificador: 'descricao',
  busca: ['codigo', 'descricao'],
  ordenarPor: 'descricao',
  campos: [
    { nome: 'codigo', rotulo: 'Código', obrigatorio: true, max: 20 },
    { nome: 'descricao', rotulo: 'Descrição', obrigatorio: true, max: 80 },
    {
      nome: 'pode_assinar',
      rotulo: 'Pode assinar (resumo)',
      max: 200,
      dica: 'Por enquanto é um resumo; depois vira a lista de etapas e campos que a função assina.',
    },
  ],
});
