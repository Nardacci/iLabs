/**
 * Dados das telas de exemplo do estudo ("Na prática"). Tudo aqui é ILUSTRATIVO: dados fictícios e mensagens escritas à mão
 * para mostrar o que a ficha pede. Nenhuma regra mora aqui: as regras são do banco (ver a ficha de cada fluxo).
 */
export interface Campo {
  rotulo: string;
  valor: string;
  /** Campo que a ficha diz que o banco exige. */
  exigido?: boolean;
}

export interface PassoPratica {
  titulo: string;
  /** Caminho da tela, no formato Módulo › Menu › Tela. */
  tela: string;
  quem: string;
  /** Situação do lote depois deste passo. */
  situacao: string;
  campos: readonly Campo[];
  /** O que o banco garante neste passo (da ficha). */
  garantia: string;
  /** Tentativa de burlar a regra e a resposta que o sistema dá. */
  tentativa: { acao: string; resposta: string };
}

export interface PraticaFicha {
  id: string;
  /** Id do documento do estudo (ficha) a que esta prática se liga. */
  ficha: string;
  titulo: string;
  resumo: string;
  passos: readonly PassoPratica[];
}

export const PRATICAS: readonly PraticaFicha[] = [
  {
    id: 'recebimento',
    ficha: 'fluxo1',
    titulo: 'Receber a matéria-prima, colocá-la em quarentena e liberá-la',
    resumo:
      'Acompanhe um saco de açúcar (dados inventados) do portão da fábrica até o estoque liberado. Em cada passo veja a tela, quem faz, o que o banco garante e tente "errar" para ver o que o sistema responde.',
    passos: [
      {
        titulo: 'Inspeção do veículo',
        tela: 'Estoque › Estoque › Checklist de Inspeção Veicular',
        quem: 'Portaria / Estoque',
        situacao: 'Ainda não recebido',
        campos: [
          { rotulo: 'Placa', valor: 'ABC-1D23 (fictícia)' },
          { rotulo: 'Condutor', valor: 'Carlos Exemplo' },
          { rotulo: 'Perguntas respondidas', valor: '15 de 15', exigido: true },
          { rotulo: 'Parecer', valor: 'Aprovado', exigido: true },
        ],
        garantia:
          'O parecer só pode ser "Aprovado" com todas as perguntas respondidas. Checklist reprovado não pode ser ligado a um recebimento.',
        tentativa: {
          acao: 'Salvar "Aprovado" com 15 perguntas em branco',
          resposta:
            'Recusado: "Responda todas as perguntas do checklist antes de aprovar." (No sistema antigo, isto salvava.)',
        },
      },
      {
        titulo: 'Registrar o recebimento',
        tela: 'Estoque › Estoque › Recebimento de Material',
        quem: 'Estoque',
        situacao: 'Recebido',
        campos: [
          {
            rotulo: 'Fornecedor',
            valor: 'Fornecedora Exemplo Ltda. (qualificada para açúcar)',
            exigido: true,
          },
          { rotulo: 'Nota fiscal', valor: '12345, série 1' },
          { rotulo: 'Material', valor: 'Açúcar refinado (controla lote e quarentena)' },
          { rotulo: 'Lote do fabricante', valor: 'L-2026-001', exigido: true },
          { rotulo: 'Validade', valor: '30/11/2027', exigido: true },
          { rotulo: 'Quantidade', valor: '25 kg em 1 saco' },
        ],
        garantia:
          'Fornecedor sem qualificação para este material bloqueia o recebimento. Lote e validade são obrigatórios para material de quarentena.',
        tentativa: {
          acao: 'Receber de um fornecedor desqualificado',
          resposta:
            'Bloqueado: "Fornecedor não qualificado para este material." Só segue com a situação corrigida pela Qualidade.',
        },
      },
      {
        titulo: 'Conferência física e documental',
        tela: 'Estoque › Estoque › Conferência de Recebimento',
        quem: 'Conferente (função própria)',
        situacao: 'Conferido',
        campos: [
          { rotulo: 'Quantidade conferida', valor: '25 kg (igual à nota)' },
          { rotulo: 'Divergência', valor: 'Nenhuma' },
          { rotulo: 'Conferente', valor: 'Marina Exemplo (função de conferente)', exigido: true },
          {
            rotulo: 'Assinatura eletrônica',
            valor: 'Feita agora, com significado "conferi"',
            exigido: true,
          },
        ],
        garantia:
          'Quem confere precisa da função de conferente e não pode ser quem cadastrou o recebimento. A divergência real é registrada, não só bloqueada.',
        tentativa: {
          acao: 'Conferir usando o mesmo login de quem registrou',
          resposta:
            'Recusado: "Quem registrou o recebimento não pode conferi-lo." Outra pessoa assina.',
        },
      },
      {
        titulo: 'Autorização do recebimento',
        tela: 'Estoque › Estoque › Recebimento de Material (Autorizar recebimento)',
        quem: 'Outra pessoa, com função de autorizador',
        situacao: 'Autorizado',
        campos: [
          { rotulo: 'Autorizador', valor: 'Paulo Exemplo (função de autorizador)', exigido: true },
          {
            rotulo: 'Assinatura eletrônica',
            valor: 'Login, senha e significado "autorizo"',
            exigido: true,
          },
        ],
        garantia:
          'Função específica e diferente de quem conferiu. Fica registrado quem assinou, quando e com que significado.',
        tentativa: {
          acao: 'Autorizar com um login qualquer, sem a função',
          resposta:
            'Recusado: "Este usuário não tem a função de autorizador." (No sistema antigo, qualquer login válido passava.)',
        },
      },
      {
        titulo: 'Endereçar em quarentena',
        tela: 'Estoque › Estoque › Endereçamento de Material',
        quem: 'Estoque',
        situacao: 'Em quarentena',
        campos: [
          { rotulo: 'Almoxarifado', valor: 'Almoxarifado Central' },
          { rotulo: 'Local', valor: 'Quarentena (rua 1, coluna 2, andar 1)', exigido: true },
          { rotulo: 'Lote e quantidade', valor: 'L-2026-001, 25 kg' },
          { rotulo: 'Solicitação de análise', valor: 'Aberta automaticamente' },
        ],
        garantia:
          'Material de quarentena só aceita local de quarentena, conferido no servidor. A solicitação de análise nasce sozinha.',
        tentativa: {
          acao: 'Guardar direto no estoque comum',
          resposta:
            'Recusado: "Material em quarentena só pode ser guardado em local de quarentena."',
        },
      },
      {
        titulo: 'Amostragem e pesagem',
        tela: 'Controle da Qualidade › Amostragem; Estoque › Central de Pesagem',
        quem: 'Qualidade programa; Estoque pesa',
        situacao: 'Em análise',
        campos: [
          { rotulo: 'Regra de amostragem', valor: 'Do cadastro do material', exigido: true },
          {
            rotulo: 'Balança',
            valor: 'Balança 01 (calibração válida até 15/03/2027)',
            exigido: true,
          },
          { rotulo: 'Peso bruto / tara / líquido', valor: '120 g / 20 g / 100 g' },
          { rotulo: 'Lacre', valor: 'Número registrado' },
        ],
        garantia:
          'Só pesa em balança com calibração válida, e o peso fica registrado. A quantidade da amostra vem da regra do material.',
        tentativa: {
          acao: 'Pesar em balança com calibração vencida',
          resposta: 'Recusado: "Balança com calibração vencida. Use outra ou recalibre."',
        },
      },
      {
        titulo: 'Análise e resultado',
        tela: 'Controle da Qualidade › Análise e Laudo › Programação de Análise',
        quem: 'Analista treinado no método',
        situacao: 'Em análise',
        campos: [
          {
            rotulo: 'Analista',
            valor: 'Renata Exemplo (treinamento do método em dia)',
            exigido: true,
          },
          { rotulo: 'Ensaio', valor: 'Identificação e pureza' },
          { rotulo: 'Resultado', valor: '99,8% (dentro de 98,0 a 102,0)' },
          { rotulo: 'Classificação', valor: 'Conforme (calculada pelo banco)' },
        ],
        garantia:
          'O resultado fora do intervalo é classificado pelo banco, não pela tela. O analista precisa estar treinado no método.',
        tentativa: {
          acao: 'Registrar resultado com analista sem treinamento no método',
          resposta:
            'Bloqueado: "Treinamento do método pendente. A tarefa não pode ser executada por esta pessoa."',
        },
      },
      {
        titulo: 'Laudo',
        tela: 'Controle da Qualidade › Análise e Laudo › Emissão Laudo Final',
        quem: 'Revisor da Qualidade (pessoa diferente do analista)',
        situacao: 'Aprovado',
        campos: [
          { rotulo: 'Revisor', valor: 'Sandra Exemplo (função de revisor)', exigido: true },
          { rotulo: 'Decisão', valor: 'Aprovado', exigido: true },
          { rotulo: 'Validade do laudo', valor: '30/11/2027', exigido: true },
        ],
        garantia:
          'O revisor tem função própria e é diferente de quem analisou. A validade do laudo não pode estar no passado. O laudo muda a situação do lote na hora.',
        tentativa: {
          acao: 'O próprio analista aprovar o laudo',
          resposta:
            'Recusado: "Quem analisou não pode revisar o próprio laudo." (Segregação de funções.)',
        },
      },
      {
        titulo: 'Etiqueta e liberação',
        tela: 'Controle da Qualidade › Gerar Etiqueta; Estoque › Movimentação de Quarentena',
        quem: 'Estoque',
        situacao: 'Disponível',
        campos: [
          { rotulo: 'Etiqueta', valor: 'De aprovado (substitui a de quarentena)' },
          { rotulo: 'Destino', valor: 'Estoque comum, rua 3, coluna 1', exigido: true },
        ],
        garantia:
          'Aprovado só vai para local comum; reprovado só vai para refugo. Conferido no servidor, não só na tela.',
        tentativa: {
          acao: 'Mandar um lote reprovado para o estoque comum',
          resposta: 'Recusado: "Lote reprovado só pode ir para local de refugo."',
        },
      },
    ],
  },
];
