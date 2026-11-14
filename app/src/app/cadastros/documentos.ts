import { definirCadastro } from '../compartilhado/cadastro/descricao';

/**
 * Documentos da base de conhecimento (normas, regras, especificações, fluxos e guias).
 * O documento novo exige o arquivo e já nasce com a versão 1; alterar os dados pede motivo; nada se apaga (só se inativa).
 * As regras (data da consulta da ANVISA, confidencialidade, caminho do arquivo) são conferidas pelo banco.
 */
export const documentos = definirCadastro({
  tabela: 'kb_documentos',
  titulo: 'Documentos',
  singular: 'documento',
  genero: 'm',
  funcao: 'kb.documentos',
  identificador: 'titulo',
  busca: ['titulo', 'legenda', 'identificacao_oficial', 'fonte_caminho'],
  filtros: ['fonte_id'],
  ordenarPor: 'titulo',
  envioDeArquivo: true,
  campos: [
    { nome: 'titulo', rotulo: 'Título', obrigatorio: true, max: 200 },
    {
      nome: 'legenda',
      rotulo: 'Legenda',
      tipo: 'textolongo',
      max: 500,
      naLista: false,
      dica: 'Uma ou duas frases sobre o que o documento é. Ajuda a encontrá-lo depois. Opcional.',
    },
    {
      nome: 'tipo',
      rotulo: 'Tipo',
      tipo: 'lista',
      obrigatorio: true,
      opcoes: [
        { valor: 'norma', rotulo: 'Norma' },
        { valor: 'regra_negocio', rotulo: 'Regra de negócio' },
        { valor: 'especificacao', rotulo: 'Especificação' },
        { valor: 'fluxo', rotulo: 'Fluxo' },
        { valor: 'guia', rotulo: 'Guia' },
        { valor: 'defeito', rotulo: 'Defeito' },
        { valor: 'outro', rotulo: 'Outro' },
      ],
    },
    {
      nome: 'origem',
      rotulo: 'Origem',
      tipo: 'lista',
      obrigatorio: true,
      opcoes: [
        { valor: 'anvisa', rotulo: 'ANVISA' },
        { valor: 'legado', rotulo: 'Sistema legado' },
        { valor: 'upload_proprio', rotulo: 'Documento próprio' },
        { valor: 'outro', rotulo: 'Outra' },
      ],
    },
    {
      nome: 'fonte_id',
      rotulo: 'Fonte',
      tipo: 'lista',
      somenteLista: true,
      referencia: { tabela: 'kb_fontes', rotulo: 'nome' },
    },
    {
      nome: 'confidencialidade',
      rotulo: 'Confidencialidade',
      tipo: 'lista',
      obrigatorio: true,
      dica: 'Documento confidencial só aparece para quem tem permissão própria.',
      opcoes: [
        { valor: 'publico', rotulo: 'Público' },
        { valor: 'interno', rotulo: 'Interno' },
        { valor: 'confidencial', rotulo: 'Confidencial' },
      ],
    },
    {
      nome: 'identificacao_oficial',
      rotulo: 'Identificação oficial',
      max: 100,
      dica: 'Por exemplo, RDC 658/2022. Não se repete na empresa. Opcional.',
    },
    {
      nome: 'data_fonte',
      rotulo: 'Data da fonte',
      tipo: 'data',
      naLista: false,
      dica: 'Data de publicação do documento. Opcional.',
    },
    {
      nome: 'consultado_em',
      rotulo: 'Data da consulta',
      tipo: 'data',
      naLista: false,
      dica: 'Obrigatória para documento da ANVISA. A data da consulta não afirma que a norma está vigente.',
    },
    {
      nome: 'situacao_lida',
      rotulo: 'Situação lida na consulta',
      tipo: 'lista',
      naLista: false,
      dica: 'O que a fonte dizia no dia da consulta. Exige a data da consulta.',
      opcoes: [
        { valor: 'vigente', rotulo: 'Vigente' },
        { valor: 'revogada', rotulo: 'Revogada' },
        { valor: 'alterada', rotulo: 'Alterada' },
        { valor: 'nao_verificada', rotulo: 'Não verificada' },
      ],
    },
  ],
});
