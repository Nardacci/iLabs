import type { NomeDeIcone } from './ui/icone';

export interface ModuloDoSistema {
  chave: string;
  nome: string;
  resumo: string;
  icone: NomeDeIcone;
  /** Já tem telas no sistema? Os outros aparecem como "Em breve". */
  pronto: boolean;
  /** Para onde o cartão leva, quando pronto. */
  rota?: string;
  /** Função do banco que libera a tela. Sem permissão, o cartão não aparece (como no menu). Sem função, aparece para todos. */
  funcao?: string;
}

/**
 * Os módulos do iLabPharma, na ordem em que aparecem nos cartões da página inicial.
 * O módulo em que a pessoa está NÃO aparece nos cartões; os outros, sim (decisão do responsável, 06/11/2026).
 */
export const MODULOS: readonly ModuloDoSistema[] = [
  {
    chave: 'principal',
    nome: 'Principal',
    resumo: 'Acessos, estrutura da empresa e física, cadastros corporativos.',
    icone: 'acesso',
    pronto: true,
    rota: '/usuarios',
  },
  {
    chave: 'base-conhecimento',
    nome: 'Base de conhecimento',
    resumo: 'Documentos, normas e regras do sistema, com versões e origem de cada um.',
    icone: 'busca',
    pronto: true,
    rota: '/base-conhecimento/documentos',
    funcao: 'kb.documentos',
  },
  {
    chave: 'producao',
    nome: 'Produção',
    resumo: 'Planejamento, ordens de produção e execução industrial.',
    icone: 'producao',
    pronto: false,
  },
  {
    chave: 'estoque',
    nome: 'Estoque',
    resumo: 'Recebimento, armazenamento, movimentações e inventário.',
    icone: 'estoque',
    pronto: false,
  },
  {
    chave: 'controle-qualidade',
    nome: 'Controle da Qualidade',
    resumo: 'Ensaios, resultados, especificações e laudos.',
    icone: 'controleQualidade',
    pronto: false,
  },
  {
    chave: 'garantia-qualidade',
    nome: 'Garantia da Qualidade',
    resumo: 'Desvios, mudanças, auditorias e qualificação de fornecedores.',
    icone: 'garantiaQualidade',
    pronto: false,
  },
  {
    chave: 'documentos',
    nome: 'Controle de Documentos',
    resumo: 'Documentos eletrônicos, revisões e registros regulatórios.',
    icone: 'documentos',
    pronto: false,
  },
  {
    chave: 'rastreabilidade',
    nome: 'Rastreabilidade',
    resumo: 'Rastreabilidade completa de lotes e genealogia.',
    icone: 'rastreabilidade',
    pronto: false,
  },
  {
    chave: 'comercial',
    nome: 'Comercial',
    resumo: 'Pedidos, cotações, faturamento e contratos.',
    icone: 'comercial',
    pronto: false,
  },
  {
    chave: 'patrimonio',
    nome: 'Patrimônio',
    resumo: 'Gestão de ativos, manutenções e calibrações.',
    icone: 'patrimonio',
    pronto: false,
  },
  {
    chave: 'construtor-ope',
    nome: 'Construtor OPE',
    resumo: 'Monta e configura as ordens de produção do cliente (a rever quando chegarmos nele).',
    icone: 'construtor',
    pronto: false,
  },
];

/** Hoje todas as telas do sistema são do Principal. */
export const MODULO_ATUAL = 'principal';

export function modulosParaOsCartoes(atual: string = MODULO_ATUAL): readonly ModuloDoSistema[] {
  return MODULOS.filter((m) => m.chave !== atual);
}
