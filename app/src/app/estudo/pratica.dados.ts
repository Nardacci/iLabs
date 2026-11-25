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
  /** O que a "situação" acompanha neste fluxo (lote, fornecedor, pedido…). */
  rotuloSituacao: string;
  passos: readonly PassoPratica[];
}

export const PRATICAS: readonly PraticaFicha[] = [
  {
    id: 'recebimento',
    ficha: 'fluxo1',
    titulo: 'Receber a matéria-prima, colocá-la em quarentena e liberá-la',
    rotuloSituacao: 'Situação do lote',
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
  {
    id: 'fornecedor',
    ficha: 'fluxo2',
    titulo: 'Qualificar o fornecedor e comprar',
    rotuloSituacao: 'Situação do fornecedor para este material',
    resumo:
      'Acompanhe uma fornecedora de açúcar (dados inventados) desde o cadastro até a compra e a baixa do pedido. O ponto central: só se compra, e só se recebe, de quem a Qualidade qualificou para aquele material.',
    passos: [
      {
        titulo: 'Cadastrar o fornecedor',
        tela: 'Principal › Cadastros e tabelas de apoio › Pessoa jurídica',
        quem: 'Compras',
        situacao: 'Cadastrado, ainda não avaliado',
        campos: [
          { rotulo: 'Razão social', valor: 'Fornecedora Exemplo Ltda.' },
          { rotulo: 'CNPJ', valor: '00.000.000/0001-00 (fictício)', exigido: true },
          { rotulo: 'Papel', valor: 'Fornecedor', exigido: true },
          { rotulo: 'O que fornece', valor: 'Açúcar refinado' },
        ],
        garantia: 'O CNPJ é único e empresa inativa não é escolhida em nenhuma tela.',
        tentativa: {
          acao: 'Cadastrar o mesmo CNPJ pela segunda vez',
          resposta:
            'Recusado: "Já existe uma empresa com este CNPJ." (No sistema antigo havia quatro cadastros diferentes.)',
        },
      },
      {
        titulo: 'Avaliar o fornecedor para um material',
        tela: 'Garantia da Qualidade › Fornecedores › Avaliação de fornecedores',
        quem: 'Garantia da Qualidade',
        situacao: 'Em avaliação',
        campos: [
          {
            rotulo: 'Fornecedor e material',
            valor: 'Fornecedora Exemplo, açúcar refinado',
            exigido: true,
          },
          { rotulo: 'Questionário', valor: '34 perguntas respondidas (versão 1)' },
          { rotulo: 'Documentos do fornecedor', valor: 'Licença e certificado anexados' },
          { rotulo: 'Resultado de amostra', valor: 'Amostra piloto aprovada' },
        ],
        garantia:
          'A avaliação fica ligada ao par fornecedor + material e guarda as respostas. Ser qualificado para um material não vale para outro.',
        tentativa: {
          acao: 'Usar a avaliação do açúcar para qualificar o mesmo fornecedor em outro material',
          resposta:
            'Recusado: "A avaliação é de outro material. Avalie o fornecedor para este material."',
        },
      },
      {
        titulo: 'Decidir a qualificação',
        tela: 'Garantia da Qualidade › Fornecedores › Qualificação (tela nova)',
        quem: 'Responsável da Garantia da Qualidade',
        situacao: 'Qualificado, com validade',
        campos: [
          { rotulo: 'Decisão', valor: 'Qualificado', exigido: true },
          { rotulo: 'Validade da qualificação', valor: '23/11/2028', exigido: true },
          { rotulo: 'Restrições', valor: 'Só lotes acima de 500 kg exigem nova amostra' },
          {
            rotulo: 'Assinatura eletrônica',
            valor: 'Login, senha e significado "aprovo"',
            exigido: true,
          },
        ],
        garantia:
          'Só quem tem a função aprova, e quem avaliou não aprova. Sem validade não qualifica. Fica o histórico de cada decisão.',
        tentativa: {
          acao: 'A própria avaliadora aprovar a qualificação',
          resposta:
            'Recusado: "Quem avaliou não pode aprovar a qualificação." (Segregação de funções.)',
        },
      },
      {
        titulo: 'Usar no recebimento',
        tela: 'Estoque › Estoque › Recebimento de Material (automático)',
        quem: 'Sistema (conferência automática)',
        situacao: 'Qualificado: o recebimento é aceito',
        campos: [
          { rotulo: 'Fornecedor da nota', valor: 'Fornecedora Exemplo Ltda.' },
          { rotulo: 'Material da nota', valor: 'Açúcar refinado' },
          { rotulo: 'Qualificação em vigor?', valor: 'Sim, até 23/11/2028', exigido: true },
        ],
        garantia:
          'O recebimento consulta a qualificação. Fornecedor sem qualificação, ou com qualificação vencida, é recusado (ou exige decisão registrada da Qualidade).',
        tentativa: {
          acao: 'Receber de fornecedor com qualificação vencida',
          resposta:
            'Bloqueado: "Qualificação vencida para este material." (No sistema antigo o recebimento nunca consultava a avaliação.)',
        },
      },
      {
        titulo: 'Avaliar o desempenho a cada entrega',
        tela: 'Estoque › Estoque › Avaliação do Fornecedor',
        quem: 'Estoque e Qualidade',
        situacao: 'Qualificado, com nota da entrega',
        campos: [
          { rotulo: 'Entrega', valor: 'Lote L-2026-001' },
          { rotulo: 'Pontuação', valor: '82 de 100' },
          { rotulo: 'Motivos de perda de pontos', valor: 'Atraso de 2 dias' },
          { rotulo: 'Limite para requalificar', valor: '70 (parâmetro da empresa)', exigido: true },
        ],
        garantia:
          'A nota fica ligada ao lote. Uma nota abaixo do limite abre a requalificação. Depois de gravada, a nota não se altera sem histórico.',
        tentativa: {
          acao: 'Mudar a nota de uma entrega já gravada, sem deixar rastro',
          resposta:
            'Recusado: "A avaliação gravada não pode ser alterada. Faça uma correção com justificativa."',
        },
      },
      {
        titulo: 'Requalificar ou desqualificar',
        tela: 'Garantia da Qualidade › Fornecedores › Qualificação (tela nova)',
        quem: 'Garantia da Qualidade',
        situacao: 'Em requalificação, depois desqualificado ou renovado',
        campos: [
          { rotulo: 'Motivo', valor: 'Duas entregas abaixo do limite' },
          { rotulo: 'Decisão', valor: 'Desqualificado', exigido: true },
          {
            rotulo: 'Assinatura eletrônica',
            valor: 'Feita agora, com significado "desqualifico"',
            exigido: true,
          },
        ],
        garantia:
          'Qualificação vencida bloqueia como a de fornecedor não qualificado. Há aviso antes do vencimento. Desqualificar exige assinatura.',
        tentativa: {
          acao: 'Desqualificar sem assinar',
          resposta: 'Recusado: "A desqualificação exige assinatura eletrônica e motivo."',
        },
      },
      {
        titulo: 'Gerar o pedido de compra',
        tela: 'Estoque › Gestão analítica › Análise de Estoque (Gerar pedido de compra)',
        quem: 'Compras',
        situacao: 'Pedido aberto',
        campos: [
          { rotulo: 'Necessidade', valor: 'Açúcar refinado: 500 kg (curva ABC, últimos 12 meses)' },
          {
            rotulo: 'Fornecedor oferecido',
            valor: 'Só os qualificados para este material',
            exigido: true,
          },
          { rotulo: 'Centro de custo', valor: 'Produção' },
        ],
        garantia:
          'A lista só oferece fornecedor qualificado para aquele material. Sem fornecedor, o sistema diz o motivo com clareza.',
        tentativa: {
          acao: 'Gerar pedido para um material sem nenhum fornecedor qualificado',
          resposta:
            'Recusado: "Não há fornecedor qualificado para este material." (No sistema antigo o botão não respondia nada.)',
        },
      },
      {
        titulo: 'Baixar o pedido no recebimento',
        tela: 'Estoque › Gestão analítica › Pedido de Compra (a baixa vem do recebimento)',
        quem: 'Sistema (a partir do recebimento)',
        situacao: 'Pedido parcial ou concluído',
        campos: [
          { rotulo: 'Pedido', valor: '500 kg de açúcar' },
          { rotulo: 'Recebido até agora', valor: '25 kg (lote L-2026-001)' },
          { rotulo: 'Saldo do pedido', valor: '475 kg', exigido: true },
        ],
        garantia:
          'A baixa vem do próprio recebimento, com a quantidade recebida. A baixa manual só existe com justificativa e assinatura.',
        tentativa: {
          acao: 'Dar baixa manual no pedido, sem justificativa',
          resposta: 'Recusado: "A baixa manual exige justificativa e assinatura."',
        },
      },
    ],
  },
  {
    id: 'laudo',
    ficha: 'fluxo3',
    titulo: 'As regras do laboratório, a análise e o laudo',
    rotuloSituacao: 'Situação',
    resumo:
      'Acompanhe como a Qualidade prepara as regras de um material (açúcar, dados inventados) e depois colhe a amostra, analisa e emite o laudo. O ponto central: o que vale é a versão aprovada da regra, e quem decide o laudo não é quem digitou o resultado.',
    passos: [
      {
        titulo: 'Cadastrar a regra de amostragem',
        tela: 'Controle da Qualidade › Amostragem › Regra de Amostragem',
        quem: 'Controle da Qualidade',
        situacao: 'Regra de amostragem em elaboração',
        campos: [
          {
            rotulo: 'Material e tipo de análise',
            valor: 'Açúcar refinado, físico-química',
            exigido: true,
          },
          { rotulo: 'Quantidade e tolerância', valor: '100 g, tolerância de 5%', exigido: true },
          { rotulo: 'Plano de amostragem e recipiente', valor: 'Sonda, frasco âmbar' },
          { rotulo: 'Precauções e limpeza', valor: 'Descritas' },
        ],
        garantia:
          'Só uma regra ativa por material e tipo de análise. Quantidade e tolerância inválidas são recusadas, não viram zero em silêncio.',
        tentativa: {
          acao: 'Salvar quantidade "0" ou tolerância negativa',
          resposta:
            'Recusado: "A quantidade deve ser maior que zero e a tolerância não pode ser negativa."',
        },
      },
      {
        titulo: 'Cadastrar a regra de análise',
        tela: 'Controle da Qualidade › Análise e Laudo › Regra de Análise',
        quem: 'Controle da Qualidade',
        situacao: 'Regra de análise em elaboração',
        campos: [
          { rotulo: 'Ensaio', valor: 'Pureza' },
          { rotulo: 'Limites', valor: 'Mínimo 98,0 e máximo 102,0', exigido: true },
          { rotulo: 'Método e especificação', valor: 'Método interno 001, versão 1' },
          { rotulo: 'Unidade', valor: '%' },
        ],
        garantia:
          'O mínimo é sempre menor ou igual ao máximo, inclusive com zero e números negativos. Regra duplicada é recusada.',
        tentativa: {
          acao: 'Salvar mínimo 0 e máximo -5',
          resposta:
            'Recusado: "O mínimo não pode ser maior que o máximo." (No sistema antigo isto passava quando um dos valores era zero.)',
        },
      },
      {
        titulo: 'Aprovar a versão da regra',
        tela: 'Controle da Qualidade › Regras › Aprovação (tela nova)',
        quem: 'Chefe do Controle da Qualidade',
        situacao: 'Regra aprovada, versão 1',
        campos: [
          { rotulo: 'Versão', valor: '1', exigido: true },
          { rotulo: 'Aprovador', valor: 'Chefe do CQ (função própria)', exigido: true },
          {
            rotulo: 'Assinatura eletrônica',
            valor: 'Login, senha e significado "aprovo"',
            exigido: true,
          },
        ],
        garantia:
          'A regra só vale depois de aprovada. Cada mudança gera uma nova versão, e a análise guarda a versão que usou.',
        tentativa: {
          acao: 'Usar na análise uma regra ainda não aprovada',
          resposta:
            'Bloqueado: "Esta regra ainda não tem versão aprovada." (No sistema antigo o que era salvo valia na hora.)',
        },
      },
      {
        titulo: 'Programar a amostragem',
        tela: 'Controle da Qualidade › Solicitação de Análise › Programação de Amostragem',
        quem: 'Controle da Qualidade',
        situacao: 'Aguardando coleta',
        campos: [
          { rotulo: 'Solicitação de análise', valor: 'Aberta no recebimento do lote L-2026-001' },
          { rotulo: 'Responsável', valor: 'Amostrador Exemplo', exigido: true },
          { rotulo: 'Data de início', valor: 'Hoje (não pode ser anterior)', exigido: true },
        ],
        garantia:
          'Só se programa uma vez por solicitação. Reagendar exige motivo e fica no histórico.',
        tentativa: {
          acao: 'Programar a mesma amostragem uma segunda vez',
          resposta:
            'Recusado: "Esta solicitação já está programada. Para mudar, reagende com motivo." (No sistema antigo criava duas amostragens.)',
        },
      },
      {
        titulo: 'Registrar a amostragem',
        tela: 'Controle da Qualidade › Amostragem › Consultar Amostragem',
        quem: 'Amostrador e verificador (pessoas diferentes)',
        situacao: 'Amostra coletada',
        campos: [
          {
            rotulo: 'Amostrador',
            valor: 'Amostrador Exemplo (função de amostrador)',
            exigido: true,
          },
          { rotulo: 'Verificador', valor: 'Verificador Exemplo (outra pessoa)', exigido: true },
          { rotulo: 'Quantidades', valor: 'Análise 100 g; retenção 200 g; referência 200 g' },
          { rotulo: 'Checklist', valor: 'Todas as respostas preenchidas' },
        ],
        garantia:
          'As conferências valem na gravação, não só na tela. Só quem tem a função de amostrador registra. O saldo do lote baixa e o Estoque é chamado a separar.',
        tentativa: {
          acao: 'Registrar com o mesmo usuário como amostrador e verificador',
          resposta: 'Recusado: "Amostrador e verificador devem ser pessoas diferentes."',
        },
      },
      {
        titulo: 'Programar a análise',
        tela: 'Controle da Qualidade › Análise e Laudo › Programação de Análise',
        quem: 'Controle da Qualidade',
        situacao: 'Análise programada',
        campos: [
          {
            rotulo: 'Analista',
            valor: 'Renata Exemplo (físico-química, treinada no método)',
            exigido: true,
          },
          { rotulo: 'Data', valor: 'Hoje' },
        ],
        garantia:
          'Só analista com a função e treinado no método. Solicitação cancelada não se programa.',
        tentativa: {
          acao: 'Programar a análise de uma solicitação cancelada',
          resposta: 'Recusado: "Solicitação cancelada não pode ser programada."',
        },
      },
      {
        titulo: 'Digitar os resultados',
        tela: 'Controle da Qualidade › Análise e Laudo › Consultar Análise Programada',
        quem: 'Analista programada',
        situacao: 'Resultados digitados',
        campos: [
          { rotulo: 'Resultado da pureza', valor: '97,2% (limite 98,0 a 102,0)' },
          {
            rotulo: 'Classificação',
            valor: 'Fora do limite (calculada pelo banco)',
            exigido: true,
          },
          {
            rotulo: 'Equipamento e padrão usados',
            valor: 'Balança 01; padrão P-12 (validade em dia)',
            exigido: true,
          },
          { rotulo: 'Observação', valor: 'Repetida a leitura, mesmo valor', exigido: true },
        ],
        garantia:
          'O resultado fora do limite é classificado pelo banco e abre investigação, com observação obrigatória. Laudo já liberado não se altera.',
        tentativa: {
          acao: 'Corrigir um resultado depois que o laudo foi liberado',
          resposta: 'Recusado: "Laudo liberado não pode ser alterado. Abra uma investigação."',
        },
      },
      {
        titulo: 'Decidir e emitir o laudo',
        tela: 'Controle da Qualidade › Análise e Laudo › Emissão do Laudo Final',
        quem: 'Chefe do Controle da Qualidade',
        situacao: 'Reprovado (neste exemplo, pela pureza)',
        campos: [
          { rotulo: 'Decisão', valor: 'Reprovado', exigido: true },
          { rotulo: 'Motivo da reprovação', valor: 'Pureza abaixo do limite', exigido: true },
          { rotulo: 'Validade do laudo', valor: 'Não maior que a validade do lote' },
          {
            rotulo: 'Assinatura eletrônica',
            valor: 'Login, senha e significado "decido"',
            exigido: true,
          },
        ],
        garantia:
          'Quem decide tem a função e não digitou ensaio. Aprovar só com todos os resultados na especificação, conferido na gravação. Reprovar exige motivo. O laudo muda a situação do lote na hora.',
        tentativa: {
          acao: 'Aprovar o laudo com um resultado fora do limite',
          resposta: 'Recusado: "Há resultado fora da especificação. Não é possível aprovar."',
        },
      },
      {
        titulo: 'Etiqueta',
        tela: 'Controle da Qualidade › Análise e Laudo › Gerar Etiqueta',
        quem: 'Estoque',
        situacao: 'Etiqueta de reprovado emitida',
        campos: [
          { rotulo: 'Tipo de etiqueta', valor: 'Reprovado', exigido: true },
          { rotulo: 'Número do laudo e validade', valor: 'Laudo 2026/001' },
        ],
        garantia:
          'A etiqueta só sai com laudo emitido e decisão gravada, e traz o número do laudo.',
        tentativa: {
          acao: 'Gerar etiqueta de aprovado sem laudo emitido',
          resposta: 'Recusado: "Só se gera etiqueta de um laudo emitido."',
        },
      },
    ],
  },
  {
    id: 'pedido-material',
    ficha: 'fluxo6',
    titulo: 'Pedir, separar e entregar o material',
    rotuloSituacao: 'Situação do pedido',
    resumo:
      'Acompanhe um pedido de açúcar da Produção (dados inventados) até a entrega. O ponto central: só sai o saldo disponível, de preferência o que vence primeiro, e cada mudança fica assinada e registrada.',
    passos: [
      {
        titulo: 'Pedir o material',
        tela: 'Estoque › Estoque › Solicitação de Material',
        quem: 'Produção, Qualidade ou outro setor',
        situacao: 'Pedido aberto',
        campos: [
          { rotulo: 'Tipo', valor: 'Produção (nasce da ordem de produção)', exigido: true },
          {
            rotulo: 'Almoxarifado',
            valor: 'Almoxarifado Central (do grupo de quem pede)',
            exigido: true,
          },
          { rotulo: 'Item e quantidade', valor: 'Açúcar refinado, 10 kg' },
          { rotulo: 'Centro de custo', valor: 'Produção' },
        ],
        garantia:
          'O almoxarifado é do grupo de quem pede. O tipo Produção só nasce da ordem de produção. O pedido só existe com tudo preenchido.',
        tentativa: {
          acao: 'Pedir de um almoxarifado de outro grupo',
          resposta:
            'Recusado: "Este almoxarifado não é do seu grupo." (No sistema antigo a tela oferecia todos e gravava em um que não era seu.)',
        },
      },
      {
        titulo: 'Aprovar o pedido',
        tela: 'Estoque › Estoque › Aprovação de Solicitação',
        quem: 'Quem tem a função, do grupo do almoxarifado',
        situacao: 'Aprovado',
        campos: [
          {
            rotulo: 'Almoxarifado exige aprovação?',
            valor: 'Sim (parâmetro do almoxarifado)',
            exigido: true,
          },
          { rotulo: 'Aprovador', valor: 'Supervisor Exemplo (função de aprovador)', exigido: true },
          { rotulo: 'Decisão', valor: 'Aprovado, com assinatura eletrônica', exigido: true },
        ],
        garantia:
          'Quem aprova não é quem pediu. A decisão fica assinada, e cancelar a aprovação exige justificativa.',
        tentativa: {
          acao: 'Quem pediu aprovar o próprio pedido',
          resposta:
            'Recusado: "Quem fez o pedido não pode aprová-lo." (No sistema antigo a mesma pessoa criava e aprovava.)',
        },
      },
      {
        titulo: 'Separar o lote',
        tela: 'Estoque › Estoque › Separação de Material',
        quem: 'Estoque',
        situacao: 'Separado',
        campos: [
          {
            rotulo: 'Lotes oferecidos',
            valor: 'Só disponíveis e dentro da validade',
            exigido: true,
          },
          { rotulo: 'Ordem da lista', valor: 'O que vence primeiro aparece primeiro' },
          { rotulo: 'Lote escolhido', valor: 'L-2026-001, validade 30/11/2027' },
        ],
        garantia:
          'Fora da lista ficam quarentena, refugo, bloqueio, reanálise e vencido. A lista sugere o que vence primeiro; escolher outro lote é permitido e fica registrado, e a empresa pode exigir justificativa assinada (parâmetro).',
        tentativa: {
          acao: 'Escolher um lote que vence depois do sugerido',
          resposta:
            'Aviso: "Há um lote disponível que vence antes. Sua escolha ficará registrada." Se a empresa ligou o parâmetro, pede também a justificativa assinada. (A escolha é livre; o registro é obrigatório.)',
        },
      },
      {
        titulo: 'Pesar o material',
        tela: 'Estoque › Estoque › Central de Pesagem',
        quem: 'Estoque',
        situacao: 'Pesado',
        campos: [
          { rotulo: 'Balança', valor: 'Balança 01 (calibração válida)', exigido: true },
          { rotulo: 'Lacre', valor: 'Número registrado' },
          { rotulo: 'Peso bruto, tara e líquido', valor: '10,4 kg, 0,4 kg, 10,0 kg' },
          { rotulo: 'Volumes A e B', valor: '6,0 kg + 4,0 kg' },
        ],
        garantia:
          'A balança é um equipamento cadastrado, a soma dos volumes bate com o total, e a divergência além da diferença permitida do subgrupo não finaliza a pesagem.',
        tentativa: {
          acao: 'Finalizar com volumes que somam 9,5 kg em vez de 10,0 kg',
          resposta: 'Recusado: "A soma dos volumes não confere com o total pesado."',
        },
      },
      {
        titulo: 'Atender (entregar)',
        tela: 'Estoque › Estoque › Atendimento de Solicitação',
        quem: 'Estoque',
        situacao: 'Atendido',
        campos: [
          {
            rotulo: 'Lote e quantidade entregue',
            valor: 'L-2026-001, 10 kg (pedido: 10 kg)',
            exigido: true,
          },
          { rotulo: 'Justificativa', valor: 'Exigida se houver diferença ou troca de lote' },
          { rotulo: 'Assinatura', valor: 'Feita agora', exigido: true },
        ],
        garantia:
          'A quantidade não passa da pedida. Uma só transação baixa o lote e o endereço e muda a situação do pedido. O pedido de produção volta à ordem de produção com o que foi entregue.',
        tentativa: {
          acao: 'Entregar 12 kg para um pedido de 10 kg',
          resposta: 'Recusado: "A quantidade entregue não pode passar da solicitada."',
        },
      },
      {
        titulo: 'Saída avulsa (sem pedido)',
        tela: 'Estoque › Estoque › Saída de Material (Outras)',
        quem: 'Estoque',
        situacao: 'Saída registrada com justificativa',
        campos: [
          {
            rotulo: 'Tipo e motivo',
            valor: 'De lista cadastrada: "Amostra para teste"',
            exigido: true,
          },
          { rotulo: 'Lote e quantidade', valor: 'L-2026-001, 1 kg' },
          { rotulo: 'Justificativa assinada', valor: 'Preenchida', exigido: true },
        ],
        garantia:
          'Só sai o que está disponível. Sem pedido, só com justificativa assinada. O valor sai do custo do lote, não fica 0,00.',
        tentativa: {
          acao: 'Dar saída avulsa de um lote em quarentena',
          resposta: 'Recusado: "Lote em quarentena não está disponível para saída."',
        },
      },
      {
        titulo: 'Consultar o histórico',
        tela: 'Estoque › Estoque › Histórico do Lote',
        quem: 'Todos',
        situacao: 'Só leitura',
        campos: [
          { rotulo: 'Quem pediu', valor: 'Produção, em 23/11/2026 às 09:10' },
          { rotulo: 'Quem aprovou', valor: 'Supervisor Exemplo' },
          { rotulo: 'Quem separou e entregou', valor: 'Estoque, com o motivo de cada escolha' },
        ],
        garantia:
          'O histórico mostra quem pediu, aprovou, separou e entregou, quando e por quê. O saldo reservado nunca passa do saldo disponível.',
        tentativa: {
          acao: 'Apagar uma linha do histórico',
          resposta: 'Recusado: "O histórico não pode ser apagado."',
        },
      },
    ],
  },
  {
    id: 'reprovado-reanalise',
    ficha: 'fluxo4',
    titulo: 'O que acontece com o lote depois do laudo',
    rotuloSituacao: 'Situação do lote',
    resumo:
      'Acompanhe dois lotes de açúcar (dados inventados): um aprovado, que vai para o estoque comum, e um reprovado, que vai para o refugo. Depois, a reanálise e a revalidação de lotes que ficaram velhos. O ponto central: o destino é conferido pelo banco, e a validade só muda com um laudo.',
    passos: [
      {
        titulo: 'Destino do lote aprovado',
        tela: 'Estoque › Estoque › Movimentação de Quarentena',
        quem: 'Estoque',
        situacao: 'Disponível',
        campos: [
          { rotulo: 'Laudo', valor: 'Aprovado e emitido', exigido: true },
          { rotulo: 'Destino', valor: 'Estoque comum, rua 3, coluna 1', exigido: true },
          { rotulo: 'Quantidade', valor: '25 kg (o pendente)' },
        ],
        garantia:
          'Só vai para local comum, nunca para quarentena nem refugo, conferido no servidor. A quantidade não passa do pendente.',
        tentativa: {
          acao: 'Forçar o destino para outra quarentena',
          resposta:
            'Recusado: "Lote aprovado só pode ir para local comum." (No sistema antigo só a lista da tela impedia; o servidor aceitava.)',
        },
      },
      {
        titulo: 'Destino do lote reprovado',
        tela: 'Estoque › Estoque › Movimentação de Quarentena',
        quem: 'Estoque',
        situacao: 'Reprovado, em refugo',
        campos: [
          {
            rotulo: 'Laudo',
            valor: 'Reprovado, com motivo "pureza abaixo do limite"',
            exigido: true,
          },
          { rotulo: 'Destino', valor: 'Local de refugo', exigido: true },
          { rotulo: 'Quantidade', valor: '25 kg' },
        ],
        garantia:
          'Só vai para refugo. O saldo passa a reprovado e sai de tudo: separação, remessa e movimentação.',
        tentativa: {
          acao: 'Separar o lote reprovado para a produção',
          resposta: 'Recusado: "Lote reprovado não está disponível."',
        },
      },
      {
        titulo: 'Destino final do reprovado',
        tela: 'Estoque › Reprovados › Destino final (tela nova)',
        quem: 'Estoque e Qualidade',
        situacao: 'Reprovado, destino final registrado',
        campos: [
          { rotulo: 'Destino', valor: 'Destruição', exigido: true },
          { rotulo: 'Documento', valor: 'Termo de destruição anexado', exigido: true },
          { rotulo: 'Assinaturas', valor: 'Estoque e Qualidade', exigido: true },
        ],
        garantia:
          'O lote só deixa o refugo com o destino final registrado e assinado, e isso fica no histórico. (No sistema antigo o reprovado ficava no refugo, sem baixa.)',
        tentativa: {
          acao: 'Dar baixa no refugo sem registrar o destino',
          resposta:
            'Recusado: "Informe o destino final (devolução ao fornecedor ou destruição), com documento e assinatura."',
        },
      },
      {
        titulo: 'Agenda de reanálise',
        tela: 'Estoque › Estoque › Agenda de Reanálise',
        quem: 'Estoque (aviso) e Qualidade',
        situacao: 'Disponível, reanálise em 30 dias',
        campos: [
          { rotulo: 'Classificação de reanálise', valor: 'Do cadastro do material', exigido: true },
          { rotulo: 'Próxima reanálise', valor: '23/12/2026' },
          { rotulo: 'Aviso', valor: 'Enviado antes do vencimento' },
        ],
        garantia:
          'O prazo vem do material. O sistema avisa antes de vencer, e a reanálise vencida e não feita bloqueia o lote sozinha.',
        tentativa: {
          acao: 'Usar um lote cuja reanálise venceu ontem',
          resposta: 'Bloqueado: "Reanálise vencida. O lote saiu do disponível até um novo laudo."',
        },
      },
      {
        titulo: 'Agendar e concluir a reanálise',
        tela: 'Estoque › Agenda de Reanálise; Controle da Qualidade › Emissão do Laudo Final',
        quem: 'Estoque pede; Qualidade conclui',
        situacao: 'Em reanálise, depois disponível com nova data',
        campos: [
          { rotulo: 'Justificativa', valor: 'Reanálise de rotina', exigido: true },
          { rotulo: 'Análise aberta', valor: 'Tipo reanálise, no CQ' },
          { rotulo: 'Resultado', valor: 'Aprovado: nova data de reanálise 23/06/2027' },
        ],
        garantia:
          'Abre uma análise do tipo reanálise sem duplicar, e o lote sai do disponível até o laudo. Aprovada, volta com nova data; reprovada, segue o destino do reprovado.',
        tentativa: {
          acao: 'Abrir uma segunda reanálise enquanto a primeira está aberta',
          resposta: 'Recusado: "Já existe uma reanálise aberta para este lote."',
        },
      },
      {
        titulo: 'Revalidar a validade',
        tela: 'Estoque › Estoque › Revalidação de Lote',
        quem: 'Estoque e Qualidade',
        situacao: 'Vencido, em revalidação, depois disponível',
        campos: [
          { rotulo: 'Lote', valor: 'L-2025-014, vencido ontem' },
          { rotulo: 'Pedido', valor: 'Revalidação, com justificativa', exigido: true },
          { rotulo: 'Nova validade', valor: 'Só muda com o laudo de revalidação', exigido: true },
        ],
        garantia:
          'Abre uma análise de revalidação. A validade só muda com o laudo, e só pede quem tem a função.',
        tentativa: {
          acao: 'Estender a validade do lote direto, sem laudo',
          resposta: 'Recusado: "A validade só pode mudar por laudo de revalidação aprovado."',
        },
      },
      {
        titulo: 'Lote vencido',
        tela: 'Estoque › Estoque › Disponibilidade do Lote (automático)',
        quem: 'Sistema',
        situacao: 'Vencido: fora do disponível',
        campos: [
          { rotulo: 'Validade', valor: '22/11/2026 (menor que hoje)', exigido: true },
          { rotulo: 'Saldo disponível', valor: 'Zero, na hora' },
        ],
        garantia:
          'O lote vencido sai do disponível na hora, conforme o banco, e não entra por nenhuma porta: recebimento, produção ou devolução.',
        tentativa: {
          acao: 'Dar entrada em um lote já vencido',
          resposta:
            'Recusado: "A validade do lote é menor que a data de hoje." (No sistema antigo a entrada aceitava.)',
        },
      },
    ],
  },
  {
    id: 'movimentacao',
    ficha: 'fluxo5',
    titulo: 'Guardar e movimentar o material dentro do estoque',
    rotuloSituacao: 'Situação do saldo',
    resumo:
      'Acompanhe 25 kg de açúcar (dados inventados) sendo endereçados e depois movidos de uma prateleira para outra. O ponto central: a movimentação é "tudo ou nada", o destino é conferido pelo banco e nada se apaga, só se estorna.',
    passos: [
      {
        titulo: 'Cadastrar o endereço',
        tela: 'Estoque › Estoque › Endereço do Estoque',
        quem: 'Estoque',
        situacao: 'Endereço criado, vazio',
        campos: [
          { rotulo: 'Local', valor: 'Estoque comum', exigido: true },
          { rotulo: 'Rua, coluna e andar', valor: '3 · 1 · 2', exigido: true },
          {
            rotulo: 'Capacidade',
            valor: 'Altura 1,2 m; largura 1,0 m; profundidade 1,0 m; peso máximo 500 kg',
          },
        ],
        garantia:
          'O endereço é único dentro do local. Só se exclui endereço vazio, com justificativa e histórico.',
        tentativa: {
          acao: 'Excluir um endereço que ainda tem saldo',
          resposta: 'Recusado: "Só é possível excluir endereço vazio, com justificativa."',
        },
      },
      {
        titulo: 'Endereçar o lote',
        tela: 'Estoque › Estoque › Endereçamento de Material',
        quem: 'Estoque',
        situacao: 'Endereçado',
        campos: [
          { rotulo: 'Item e lote', valor: 'Açúcar refinado, L-2026-001' },
          { rotulo: 'Quantidade', valor: '25 kg (o pendente)', exigido: true },
          { rotulo: 'Endereço', valor: 'Quarentena, rua 1, coluna 2, andar 1', exigido: true },
        ],
        garantia:
          'A quantidade não passa do pendente, o local é compatível com o tipo do material e a gravação é "tudo ou nada".',
        tentativa: {
          acao: 'Endereçar 30 kg quando só há 25 kg pendentes',
          resposta:
            'Recusado: "A quantidade passa do pendente de endereçamento." (No sistema antigo a tela dizia "sucesso" e não gravava.)',
        },
      },
      {
        titulo: 'Movimentar entre endereços',
        tela: 'Estoque › Estoque › Movimentação de Material',
        quem: 'Estoque',
        situacao: 'Movido, uma só transação',
        campos: [
          { rotulo: 'Origem', valor: 'Estoque comum, 3 · 1 · 2 (saldo 25 kg)' },
          { rotulo: 'Quantidade', valor: '10 kg', exigido: true },
          { rotulo: 'Destino', valor: 'Estoque comum, 3 · 2 · 1', exigido: true },
          { rotulo: 'Justificativa', valor: 'Reorganização do estoque' },
        ],
        garantia:
          'Sai da origem e entra no destino, ou nada acontece. A quantidade não passa do saldo da origem.',
        tentativa: {
          acao: 'Mover 40 kg de uma origem com 25 kg',
          resposta: 'Recusado: "A quantidade passa do saldo da origem." Nada foi movido.',
        },
      },
      {
        titulo: 'Conferir o destino',
        tela: 'Estoque › Estoque › Movimentação de Material (automático)',
        quem: 'Sistema',
        situacao: 'Destino conferido',
        campos: [
          { rotulo: 'Destino vazio ou com o mesmo material', valor: 'Sim', exigido: true },
          {
            rotulo: 'Cabe em altura, largura, profundidade e peso',
            valor: 'Sim (peso × quantidade)',
            exigido: true,
          },
          { rotulo: 'Tipo do local compatível', valor: 'Comum com comum', exigido: true },
          { rotulo: 'Almoxarifado do grupo do usuário', valor: 'Sim' },
        ],
        garantia:
          'Tudo conferido no servidor: destino, tamanho, peso, tipo do local e grupo do usuário.',
        tentativa: {
          acao: 'Mover açúcar para um endereço que já guarda outro material',
          resposta: 'Recusado: "O destino está ocupado por outro material."',
        },
      },
      {
        titulo: 'Impedir movimentação simultânea',
        tela: 'Estoque › Estoque › Movimentação de Material (automático)',
        quem: 'Sistema',
        situacao: 'Uma movimentação por vez',
        campos: [
          { rotulo: 'Pessoa A', valor: 'Move 20 kg da origem (saldo 25 kg)' },
          { rotulo: 'Pessoa B, ao mesmo tempo', valor: 'Tenta mover 20 kg da mesma origem' },
          { rotulo: 'Saldo final', valor: 'Nunca negativo', exigido: true },
        ],
        garantia:
          'Duas pessoas não movem o mesmo saldo ao mesmo tempo: a segunda espera ou é recusada, e o saldo nunca fica negativo.',
        tentativa: {
          acao: 'Salvar a mesma origem em duas janelas ao mesmo tempo',
          resposta:
            'Recusado na segunda janela: "O saldo desta origem acabou de mudar. Confira e tente de novo."',
        },
      },
      {
        titulo: 'Quem vê e quem move',
        tela: 'Estoque › Cadastros › Grupo de Usuário – Almoxarifado',
        quem: 'Administrador',
        situacao: 'Acesso por grupo',
        campos: [
          { rotulo: 'Grupo da usuária', valor: 'Almoxarifado Central' },
          { rotulo: 'Almoxarifados que ela vê', valor: 'Só o do grupo dela', exigido: true },
        ],
        garantia:
          'Cada pessoa só enxerga e move os almoxarifados do seu grupo, em toda consulta e gravação. Abrir a tela sem permissão é recusado.',
        tentativa: {
          acao: 'Usuário de outro grupo abrir a Movimentação pelo endereço da tela',
          resposta:
            'Recusado: "Você não tem permissão para esta tela." (No sistema antigo, o usuário de consulta abria pelo endereço.)',
        },
      },
      {
        titulo: 'Consultar saldo e histórico',
        tela: 'Estoque › Estoque › Disponibilidade do Lote; Histórico do Lote',
        quem: 'Todos',
        situacao: 'Só leitura',
        campos: [
          {
            rotulo: 'Saldo por item, lote e local',
            valor: 'Igual à soma das movimentações',
            exigido: true,
          },
          {
            rotulo: 'Histórico',
            valor: 'Quem, quando, de onde para onde, por quê; com análise, laudo e aprovador',
          },
        ],
        garantia:
          'O saldo é a soma das movimentações. O histórico mostra quem fez, quando e por quê, e junta análise, laudo e aprovador.',
        tentativa: {
          acao: 'Alterar o saldo direto na tela de consulta',
          resposta: 'Recusado: "O saldo só muda por movimentação."',
        },
      },
      {
        titulo: 'Corrigir um engano',
        tela: 'Estoque › Estoque › Estorno de Movimentação (tela nova)',
        quem: 'Estoque, com a Qualidade',
        situacao: 'Corrigido por estorno',
        campos: [
          { rotulo: 'Movimentação errada', valor: '10 kg para o endereço trocado' },
          { rotulo: 'Estorno', valor: 'Volta os 10 kg à origem', exigido: true },
          { rotulo: 'Motivo e assinatura', valor: 'Preenchidos', exigido: true },
        ],
        garantia:
          'Não se edita nem se apaga. Corrige-se com um estorno assinado, que também fica no histórico.',
        tentativa: {
          acao: 'Apagar a movimentação errada',
          resposta:
            'Recusado: "Movimentações não se apagam. Faça um estorno com motivo e assinatura."',
        },
      },
    ],
  },
  {
    id: 'amostras-cq',
    ficha: 'fluxo7',
    titulo: 'Guardar as amostras do Controle da Qualidade',
    rotuloSituacao: 'Situação da amostra',
    resumo:
      'Acompanhe as amostras de referência e de retenção de um lote de açúcar (dados inventados) desde a entrada até a saída. O ponto central: a amostra não conta como estoque disponível e só sai depois do prazo de guarda, ou com justificativa assinada pela Qualidade.',
    passos: [
      {
        titulo: 'Preparar o almoxarifado e o item',
        tela: 'Estoque › Cadastros › Almoxarifado; Item',
        quem: 'Estoque',
        situacao: 'Estrutura pronta',
        campos: [
          {
            rotulo: 'Almoxarifado especial',
            valor: 'Amostras do CQ (referência, retenção, estabilidade)',
            exigido: true,
          },
          { rotulo: 'No item: amostras que guarda', valor: 'Referência e retenção', exigido: true },
        ],
        garantia:
          'Saldo de almoxarifado especial nunca conta como disponível, e o item só guarda o que está marcado.',
        tentativa: {
          acao: 'Guardar amostra de estabilidade em item que não marcou estabilidade',
          resposta: 'Recusado: "Este item não guarda amostra de estabilidade."',
        },
      },
      {
        titulo: 'Guardar a amostra (entrada)',
        tela: 'Estoque › Regulatório › Movimentações (Entrada)',
        quem: 'Estoque ou Qualidade',
        situacao: 'Amostra guardada',
        campos: [
          { rotulo: 'Lote', valor: 'L-2026-001, liberado', exigido: true },
          { rotulo: 'Tipo', valor: 'Referência', exigido: true },
          { rotulo: 'Quantidade', valor: '200 g (duas análises completas)' },
          { rotulo: 'Endereço', valor: 'Amostras do CQ, 1 · 1 · 1' },
        ],
        garantia:
          'Só entra amostra de lote liberado. A quantidade não passa da disponível e o endereço serve ao lote. A quantidade mínima é a de duas análises completas (IN 139/2022, orientação da ANVISA).',
        tentativa: {
          acao: 'Guardar amostra de um lote ainda em quarentena',
          resposta: 'Recusado: "Só se guarda amostra de lote liberado."',
        },
      },
      {
        titulo: 'Abrir o acompanhamento de estabilidade',
        tela: 'Estoque › Regulatório › Movimentações; Controle da Qualidade › Acompanhamento de Estabilidade',
        quem: 'Qualidade',
        situacao: 'Estabilidade em acompanhamento',
        campos: [
          {
            rotulo: 'Tipo de estabilidade',
            valor: '25 °C e 60% de umidade, 24 meses',
            exigido: true,
          },
          { rotulo: 'Pontos do estudo', valor: '0, 3, 6, 12 e 24 meses (do protocolo aprovado)' },
          { rotulo: 'Acompanhamento', valor: 'Aberto sozinho' },
        ],
        garantia:
          'A amostra de estabilidade exige o tipo e abre o acompanhamento sozinha, com os pontos do estudo aprovado.',
        tentativa: {
          acao: 'Guardar amostra de estabilidade sem informar o tipo',
          resposta:
            'Recusado: "Informe o tipo de estabilidade." (No sistema antigo a tela nem tinha o campo.)',
        },
      },
      {
        titulo: 'Consultar o que está guardado',
        tela: 'Estoque › Regulatório › Consulta de Disponibilidade',
        quem: 'Estoque e Qualidade',
        situacao: 'Só leitura',
        campos: [
          { rotulo: 'Por item, lote e tipo', valor: 'Referência 200 g; retenção 200 g' },
          { rotulo: 'Prazo de guarda restante', valor: '1 ano e 11 meses', exigido: true },
          { rotulo: 'Conta no disponível?', valor: 'Não' },
        ],
        garantia:
          'Um só relatório de amostras por item, lote, tipo e prazo de guarda restante. A amostra não entra no disponível do atendimento.',
        tentativa: {
          acao: 'Atender um pedido de produção usando a amostra guardada',
          resposta: 'Recusado: "O saldo de amostra não está disponível para atendimento."',
        },
      },
      {
        titulo: 'Dar saída da amostra',
        tela: 'Estoque › Regulatório › Movimentações (Saída)',
        quem: 'Qualidade',
        situacao: 'Amostra consumida, descartada ou devolvida',
        campos: [
          { rotulo: 'Motivo', valor: 'Consumo em análise (de lista cadastrada)', exigido: true },
          { rotulo: 'Quantidade', valor: '50 g' },
          {
            rotulo: 'Justificativa assinada da Qualidade',
            valor: 'Exigida antes do fim do prazo de guarda',
            exigido: true,
          },
        ],
        garantia:
          'Só sai depois do prazo de guarda; antes, só com justificativa assinada pela Qualidade. O prazo mínimo é o da norma e não se reduz.',
        tentativa: {
          acao: 'Dar saída da amostra antes do fim do prazo de guarda, sem justificativa',
          resposta:
            'Recusado: "A amostra ainda está no prazo de guarda. A saída exige justificativa assinada pela Qualidade." (No sistema antigo foi aceita sem aviso.)',
        },
      },
      {
        titulo: 'Registrar o destino',
        tela: 'Estoque › Estoque › Histórico do Lote',
        quem: 'Todos',
        situacao: 'Só leitura',
        campos: [
          { rotulo: 'Quem deu a saída', valor: 'Qualidade, em 23/11/2026 às 10:05' },
          { rotulo: 'Quanto e por quê', valor: '50 g, consumo em análise' },
        ],
        garantia:
          'O histórico mostra quem deu a saída, quando, quanto e por quê, inclusive para a amostra.',
        tentativa: {
          acao: 'Apagar o registro da saída',
          resposta: 'Recusado: "O histórico não pode ser apagado."',
        },
      },
    ],
  },
  {
    id: 'devolucao-entradas',
    ficha: 'fluxo8',
    titulo: 'Devolução e as outras portas de entrada do lote',
    rotuloSituacao: 'Situação do lote',
    resumo:
      'Acompanhe as três formas de um lote entrar no estoque além da compra: o produto acabado que vem da produção, a sobra devolvida e a entrada avulsa (dados inventados). O ponto central: o lote nunca é inventado na tela e todo lote novo entra em quarentena.',
    passos: [
      {
        titulo: 'Dar entrada ao produto acabado',
        tela: 'Estoque › Estoque › Entrada de Material - Produção',
        quem: 'Estoque',
        situacao: 'Em quarentena',
        campos: [
          { rotulo: 'Ordem de produção', valor: 'OP-2026-050, liberada', exigido: true },
          { rotulo: 'Lote', valor: 'Vem da ordem, não é digitado', exigido: true },
          { rotulo: 'Validade', valor: '30/11/2028 (maior que hoje)', exigido: true },
          { rotulo: 'Destino', valor: 'Quarentena, quando o item exige' },
        ],
        garantia:
          'O lote nasce de uma ordem de produção e vem dela. A validade é maior que hoje, e o destino é só de quarentena quando o item exige.',
        tentativa: {
          acao: 'Dar entrada em um lote digitado, sem ordem de produção',
          resposta:
            'Recusado: "O lote de produto acabado deve vir de uma ordem de produção liberada." (No sistema antigo aceitava lote inventado.)',
        },
      },
      {
        titulo: 'Abrir a análise e a etiqueta',
        tela: 'Controle da Qualidade › Solicitação de Análise (automático)',
        quem: 'Sistema',
        situacao: 'Em quarentena, análise aberta',
        campos: [
          { rotulo: 'Tipo da análise', valor: 'Produto acabado', exigido: true },
          { rotulo: 'Situação do lote', valor: 'Em quarentena, fora do disponível' },
          { rotulo: 'Etiqueta', valor: 'Sai do lote' },
        ],
        garantia:
          'A análise nasce com o tipo produto acabado. O lote fica em quarentena, sem aparecer como disponível.',
        tentativa: {
          acao: 'Separar o lote recém-entrado para uma venda',
          resposta: 'Recusado: "O lote está em quarentena e não está disponível."',
        },
      },
      {
        titulo: 'Devolver a sobra da produção',
        tela: 'Estoque › Estoque › Devolução da Produção',
        quem: 'Estoque',
        situacao: 'Sobra devolvida, em quarentena',
        campos: [
          { rotulo: 'Lote devolvido', valor: 'L-2026-001, atendido à produção', exigido: true },
          { rotulo: 'Quantidade', valor: '2 kg (saíram 10 kg)', exigido: true },
          { rotulo: 'Justificativa assinada', valor: 'Sobra da ordem OP-2026-050', exigido: true },
        ],
        garantia:
          'A quantidade não passa do que saiu para a produção. O destino respeita quarentena, umidade e refrigeração. A sobra volta ao saldo e fica no histórico.',
        tentativa: {
          acao: 'Devolver 15 kg de um pedido que entregou 10 kg',
          resposta: 'Recusado: "A quantidade devolvida passa do que saiu para a produção."',
        },
      },
      {
        titulo: 'Devolver material de outra origem',
        tela: 'Estoque › Estoque › Devolução de Material',
        quem: 'Estoque',
        situacao: 'Em quarentena, análise aberta',
        campos: [
          {
            rotulo: 'Lote',
            valor: 'Já existe, com o mesmo item, validade e fabricante',
            exigido: true,
          },
          { rotulo: 'Quantidade', valor: '5 kg' },
          { rotulo: 'Justificativa', valor: 'Devolução de cliente' },
        ],
        garantia:
          'O lote precisa existir, com o mesmo item, validade e fabricante. O total endereçado não passa da quantidade. Entra em quarentena e abre análise.',
        tentativa: {
          acao: 'Devolver um lote que não existe no estoque',
          resposta: 'Recusado: "Lote não encontrado. Devolução só de lote existente."',
        },
      },
      {
        titulo: 'Entrada avulsa',
        tela: 'Estoque › Estoque › Entrada de Material - Outras',
        quem: 'Estoque',
        situacao: 'Em quarentena, análise aberta',
        campos: [
          { rotulo: 'Tipo e motivo', valor: 'Ativos, de lista cadastrada', exigido: true },
          { rotulo: 'Item, lote e fabricante', valor: 'Não se repetem na lista', exigido: true },
          { rotulo: 'Justificativa', valor: 'Doação de amostra do fornecedor' },
        ],
        garantia:
          'Item, lote e fabricante não se repetem. Só tipo e motivo ativos. Entra em quarentena e abre análise.',
        tentativa: {
          acao: 'Escolher um motivo de movimentação inativo',
          resposta:
            'Recusado: "Este motivo está inativo." (No sistema antigo o motivo inativo ainda era oferecido.)',
        },
      },
      {
        titulo: 'Entrada de produção de serviço',
        tela: 'Estoque › Estoque › Entrada de Produção',
        quem: 'Estoque',
        situacao: 'Em quarentena',
        campos: [
          { rotulo: 'Ordem e serviço terceirizado', valor: 'OP-2026-051, serviço Exemplo' },
          {
            rotulo: 'Custos adicionais',
            valor: 'De lista cadastrada (a validar: o que são FR170 e FR180)',
            exigido: true,
          },
          { rotulo: 'Lote', valor: 'Mesma regra da entrada de produto acabado' },
        ],
        garantia:
          'Os custos vêm de lista cadastrada e o lote segue a mesma regra do produto acabado. O código do lote não é cortado em silêncio.',
        tentativa: {
          acao: 'Gravar um código de lote maior que o campo aceita',
          resposta:
            'Recusado: "O código do lote é maior que o permitido." (No sistema antigo era cortado em 10 caracteres, sem aviso.)',
        },
      },
      {
        titulo: 'Consultar',
        tela: 'Estoque › Estoque › Histórico do Lote; Relatórios › Quarentena de Produto Acabado',
        quem: 'Todos',
        situacao: 'Só leitura',
        campos: [
          {
            rotulo: 'Histórico',
            valor: 'Entrada, análise, laudo, aprovador, usuário e hora',
            exigido: true,
          },
          {
            rotulo: 'Relatório de quarentena',
            valor: 'Um só, mesmo quando não há resultado (mostra "nenhum lote")',
          },
        ],
        garantia:
          'O histórico mostra a entrada, a análise, o laudo, o aprovador, o usuário e a hora. O relatório de quarentena é um só e avisa quando está vazio.',
        tentativa: {
          acao: 'Apagar uma entrada do histórico',
          resposta: 'Recusado: "O histórico não pode ser apagado."',
        },
      },
    ],
  },
  {
    id: 'agua-ambiente',
    ficha: 'fluxo11a',
    titulo: 'Monitorar a água e as salas',
    rotuloSituacao: 'Situação da coleta',
    resumo:
      'Acompanhe o monitoramento de um ponto de água e de uma sala limpa (dados inventados), da agenda de coleta à liberação para a produção. O ponto central: o resultado é conferido contra os limites de alerta e de ação, e a Produção só usa o ponto ou a sala com laudo aprovado e dentro do prazo.',
    passos: [
      {
        titulo: 'Cadastrar o ponto ou a sala',
        tela: 'Principal › Cadastros › Pontos de água, Ambientes',
        quem: 'Qualidade',
        situacao: 'Cadastrado',
        campos: [
          { rotulo: 'Tag', valor: 'PA-01 (ponto de água) e SL-03 (sala)', exigido: true },
          { rotulo: 'Tipo da água', valor: 'Purificada' },
          { rotulo: 'Classe de limpeza da sala', valor: 'Classe C', exigido: true },
          {
            rotulo: 'Frequência de coleta',
            valor: 'Semanal (parâmetro da empresa)',
            exigido: true,
          },
        ],
        garantia:
          'O ponto e a sala têm tag única, classe de limpeza e frequência. Só o cadastro ativo é oferecido.',
        tentativa: {
          acao: 'Cadastrar uma sala sem classe de limpeza',
          resposta:
            'Recusado: "Informe a classe de limpeza da sala." (No sistema antigo o CQ nem tinha esse campo.)',
        },
      },
      {
        titulo: 'Agendar a coleta',
        tela: 'Controle da Qualidade › Solicitação de Análise › Programação de Solicitação de Análise',
        quem: 'Qualidade',
        situacao: 'Coletas programadas',
        campos: [
          { rotulo: 'Tipo', valor: 'Ambiente', exigido: true },
          { rotulo: 'Tipo de análise', valor: 'Microbiológica', exigido: true },
          { rotulo: 'Dia e horário', valor: 'Segundas, 08:00 (o programa gera as coletas do mês)' },
        ],
        garantia:
          'O programa gera as coletas do período. Ambiente só aceita análise microbiológica, não repete horário, e hoje e o passado são recusados.',
        tentativa: {
          acao: 'Agendar análise físico-química para uma sala',
          resposta: 'Recusado: "Ambiente só aceita análise microbiológica."',
        },
      },
      {
        titulo: 'Programar e registrar a amostragem',
        tela: 'Controle da Qualidade › Amostragem › Registro de Amostragem',
        quem: 'Amostrador e verificador',
        situacao: 'Amostra coletada',
        campos: [
          { rotulo: 'Amostrador', valor: 'Amostrador Exemplo', exigido: true },
          { rotulo: 'Verificador', valor: 'Outra pessoa', exigido: true },
          {
            rotulo: 'Condições da sala na coleta',
            valor: 'Em atividade, fluxo de ar ligado',
            exigido: true,
          },
        ],
        garantia:
          'Não há pedido ao Estoque. O verificador é diferente do amostrador, e as condições reais da sala (vazia, em atividade, fluxo, ar) são registradas.',
        tentativa: {
          acao: 'Registrar sem informar as condições da sala',
          resposta: 'Recusado: "Informe as condições da sala no momento da coleta."',
        },
      },
      {
        titulo: 'Programar e digitar a análise',
        tela: 'Controle da Qualidade › Análise e Laudo › Consultar Análise Programada',
        quem: 'Analista',
        situacao: 'Resultado digitado',
        campos: [
          { rotulo: 'Ensaio', valor: 'Contagem de microrganismos (da regra do ponto ou sala)' },
          {
            rotulo: 'Resultado',
            valor: '12 UFC (limite de alerta 5; limite de ação 10)',
            exigido: true,
          },
          {
            rotulo: 'Classificação',
            valor: 'Acima do limite de ação (calculada pelo banco)',
            exigido: true,
          },
          { rotulo: 'Desvio', valor: 'Aberto automaticamente' },
        ],
        garantia:
          'Os ensaios vêm da regra de análise do ponto ou da sala. O resultado é conferido contra os limites de alerta e de ação, e fora do limite de ação abre desvio.',
        tentativa: {
          acao: 'Digitar resultado e a tela dizer "sucesso" sem gravar',
          resposta:
            'Impossível: "A gravação só termina depois de confirmada no banco." (No sistema antigo a tela dizia "sucesso" e os dados sumiam.)',
        },
      },
      {
        titulo: 'Aprovar e emitir o laudo',
        tela: 'Controle da Qualidade › Análise e Laudo › Emissão do Laudo Final',
        quem: 'Quem tem a função de aprovar',
        situacao: 'Reprovado',
        campos: [
          { rotulo: 'Decisão', valor: 'Reprovado (acima do limite de ação)', exigido: true },
          {
            rotulo: 'Assinatura',
            valor: 'Função de aprovador, diferente do analista',
            exigido: true,
          },
          { rotulo: 'Prazo de validade do laudo', valor: 'Só no laudo aprovado' },
        ],
        garantia:
          'O laudo é assinado por quem tem a função e é diferente do analista. Reprovar abre desvio. O laudo vale por um prazo.',
        tentativa: {
          acao: 'Aprovar com resultado acima do limite de ação',
          resposta:
            'Recusado: "Há resultado fora do limite de ação. Não é possível aprovar." (No sistema antigo só aparecia a opção Aprovar.)',
        },
      },
      {
        titulo: 'Boletim e etiqueta',
        tela: 'Controle da Qualidade › Análise e Laudo › Gerar Etiqueta',
        quem: 'Qualidade',
        situacao: 'Boletim emitido',
        campos: [
          {
            rotulo: 'Boletim',
            valor: 'Data da exposição, ambiente, condições reais e resultado preenchidos',
            exigido: true,
          },
          { rotulo: 'Etiqueta', valor: 'Com os dados da empresa certificada', exigido: true },
        ],
        garantia:
          'O boletim traz as condições reais da sala e o resultado. A etiqueta traz os dados da instituição certa.',
        tentativa: {
          acao: 'Imprimir o boletim com campos em branco',
          resposta:
            'Recusado: "O boletim só imprime com data, ambiente, condições e resultado preenchidos."',
        },
      },
      {
        titulo: 'Liberar o uso na Produção',
        tela: 'Produção › Autorizações › Autorização de ponto de água',
        quem: 'Produção',
        situacao: 'Autorizado, só com laudo aprovado e dentro do prazo',
        campos: [
          { rotulo: 'Laudo do CQ', valor: 'Aprovado e dentro do prazo', exigido: true },
          { rotulo: 'Autorização', valor: 'Liberada pela função da Produção' },
        ],
        garantia:
          'A Produção só autoriza o ponto ou a sala com laudo aprovado do CQ e dentro do prazo. O banco bloqueia o resto, sem controle paralelo.',
        tentativa: {
          acao: 'Autorizar um ponto de água com laudo reprovado ou vencido',
          resposta: 'Bloqueado: "Não há laudo aprovado e válido do CQ para este ponto."',
        },
      },
      {
        titulo: 'Excluir ou cancelar uma coleta',
        tela: 'Controle da Qualidade › Programação de Solicitação de Análise',
        quem: 'Qualidade',
        situacao: 'Cancelada, com justificativa',
        campos: [
          { rotulo: 'Justificativa', valor: 'Sala em manutenção', exigido: true },
          { rotulo: 'Histórico', valor: 'Quem, quando e por quê' },
        ],
        garantia:
          'A justificativa é obrigatória e fica no histórico. Coleta que já tem laudo não se cancela.',
        tentativa: {
          acao: 'Cancelar uma coleta com laudo já liberado',
          resposta:
            'Recusado: "Depois do laudo não se cancela. Abra uma investigação." (No sistema antigo podia.)',
        },
      },
    ],
  },
  {
    id: 'estabilidade',
    ficha: 'fluxo11b',
    titulo: 'Acompanhar a estabilidade do produto acabado',
    rotuloSituacao: 'Situação do estudo',
    resumo:
      'Acompanhe o estudo de estabilidade de um lote de produto acabado (dados inventados), do protocolo ao relatório final. O ponto central: o estudo só abre com protocolo aprovado, cada tempo gera sua análise na data prevista e um resultado fora da especificação segura o estudo até a investigação.',
    passos: [
      {
        titulo: 'Escrever o protocolo',
        tela: 'Controle da Qualidade › Tabelas de Apoio › Regra de Estabilidade',
        quem: 'Qualidade',
        situacao: 'Protocolo em elaboração',
        campos: [
          {
            rotulo: 'Produto e tipo de análise',
            valor: 'Comprimido Exemplo 500 mg, físico-química',
            exigido: true,
          },
          { rotulo: 'Tempos (dias)', valor: 'T0 = 0; T1 = 90; T2 = 180; T3 = 365', exigido: true },
          { rotulo: 'Condição de armazenamento', valor: '30 °C e 75% de umidade' },
          { rotulo: 'Número de lotes', valor: '3' },
        ],
        garantia:
          'Os dias são positivos e em ordem crescente. Há uma regra aprovada por produto e tipo de análise.',
        tentativa: {
          acao: 'Salvar tempos fora de ordem (T1 = 180 e T2 = 90)',
          resposta: 'Recusado: "Os tempos devem estar em ordem crescente."',
        },
      },
      {
        titulo: 'Mudar o protocolo',
        tela: 'Controle da Qualidade › Tabelas de Apoio › Regra de Estabilidade (editar)',
        quem: 'Qualidade',
        situacao: 'Nova versão do protocolo',
        campos: [
          { rotulo: 'Justificativa', valor: 'Inclusão do ponto de 9 meses', exigido: true },
          {
            rotulo: 'Histórico',
            valor: 'Campo a campo: o que mudou, de quê para quê, quem e quando',
          },
          { rotulo: 'Estudo aberto?', valor: 'Se houver, só muda por nova versão' },
        ],
        garantia:
          'A justificativa é obrigatória e o log é campo a campo. Regra com estudo aberto só muda por nova versão. A regra não se exclui, só se desativa.',
        tentativa: {
          acao: 'Alterar o protocolo sem justificativa',
          resposta:
            'Recusado: "Informe a justificativa da alteração." (No sistema antigo não pedia e o log dizia "não existe log de alteração".)',
        },
      },
      {
        titulo: 'Abrir o estudo',
        tela: 'Estoque › Regulatório › Movimentações (Entrada de Estabilidade)',
        quem: 'Estoque (entrada)',
        situacao: 'Estudo aberto',
        campos: [
          { rotulo: 'Lote liberado', valor: 'L-2026-120', exigido: true },
          { rotulo: 'Protocolo aprovado', valor: 'Versão 2', exigido: true },
          { rotulo: 'Quantidade reservada e data de início', valor: '300 unidades, hoje' },
          { rotulo: 'Data prevista de cada tempo', valor: 'Calculada pelo sistema' },
        ],
        garantia:
          'O estudo só abre com protocolo aprovado. Sem protocolo, o Estoque recebe a recusa. O sistema calcula a data prevista de cada tempo.',
        tentativa: {
          acao: 'Dar entrada de estabilidade de um produto sem protocolo aprovado',
          resposta: 'Recusado: "Não há protocolo de estabilidade aprovado para este produto."',
        },
      },
      {
        titulo: 'Gerar a análise de cada tempo',
        tela: 'Controle da Qualidade › Estabilidade › Acompanhamento de Estabilidade',
        quem: 'Sistema e Qualidade',
        situacao: 'Tempo T1 em análise',
        campos: [
          {
            rotulo: 'Data prevista de T1',
            valor: '23/02/2027 (a análise nasce sozinha)',
            exigido: true,
          },
          { rotulo: 'Aviso', valor: 'Tempo próximo e tempo atrasado' },
          { rotulo: 'Atraso', valor: 'Exige justificativa' },
        ],
        garantia:
          'A análise do tempo nasce na data prevista, sozinha, com lote, validade e quantidade do T0. Há aviso de tempo próximo e atrasado, e o atraso exige justificativa.',
        tentativa: {
          acao: 'Deixar o tempo T1 passar da data sem análise e sem justificar',
          resposta:
            'Aviso: "Tempo T1 atrasado. Informe a justificativa do atraso." (No sistema antigo não havia aviso.)',
        },
      },
      {
        titulo: 'Interromper o estudo',
        tela: 'Controle da Qualidade › Estabilidade › Interromper Estudo',
        quem: 'Quem tem a função de estabilidade',
        situacao: 'Interrompido, com justificativa assinada',
        campos: [
          { rotulo: 'Justificativa', valor: 'Lote retirado do mercado', exigido: true },
          {
            rotulo: 'Assinatura',
            valor: 'Função de estabilidade, conferida na gravação',
            exigido: true,
          },
        ],
        garantia:
          'A justificativa é obrigatória e assinada. Com análise pendente, o banco recusa, não só a tela. A função é conferida na gravação.',
        tentativa: {
          acao: 'Interromper o estudo com uma análise ainda pendente',
          resposta: 'Recusado: "Há solicitação de análise pendente. Conclua ou cancele antes."',
        },
      },
      {
        titulo: 'Concluir o estudo',
        tela: 'Controle da Qualidade › Estabilidade › Final de Estabilidade',
        quem: 'Qualidade (função de aprovar)',
        situacao: 'Concluído',
        campos: [
          { rotulo: 'Todos os tempos com laudo liberado', valor: 'T0 a T3', exigido: true },
          { rotulo: 'Temperatura', valor: '30 °C (valor numérico, não texto livre)' },
          { rotulo: 'Conclusão', valor: 'Aprovado', exigido: true },
          { rotulo: 'Assinatura', valor: 'De quem conclui', exigido: true },
        ],
        garantia:
          'Não conclui como aprovado com resultado reprovado nem fora da especificação sem investigação. A conclusão tem assinatura.',
        tentativa: {
          acao: 'Concluir como aprovado com um laudo reprovado',
          resposta:
            'Recusado: "Há laudo reprovado. A conclusão aprovada exige investigação concluída." (No sistema antigo permitia.)',
        },
      },
      {
        titulo: 'Imprimir o relatório final',
        tela: 'Controle da Qualidade › Estabilidade › Final de Estabilidade (Imprimir)',
        quem: 'Qualidade',
        situacao: 'Relatório emitido',
        campos: [
          {
            rotulo: 'Conteúdo',
            valor:
              'Protocolo, condição, métodos, resultados por tempo, data prevista e realizada, conclusão e quem assinou',
            exigido: true,
          },
        ],
        garantia:
          'O relatório traz o protocolo, a condição, os métodos, os resultados por tempo, as datas, a conclusão e quem assinou.',
        tentativa: {
          acao: 'Imprimir o relatório de um estudo que não existe',
          resposta: 'Aviso: "Estudo não encontrado." (No sistema antigo aparecia um erro técnico.)',
        },
      },
      {
        titulo: 'Resultado fora da especificação',
        tela: 'Controle da Qualidade › Estabilidade › Investigação (tela nova)',
        quem: 'Qualidade',
        situacao: 'Estudo retido, em investigação',
        campos: [
          { rotulo: 'Laudo do tempo T2', valor: 'Reprovado (dissolução abaixo do limite)' },
          { rotulo: 'Estudo', valor: 'Retido', exigido: true },
          { rotulo: 'Desvio', valor: 'Aberto automaticamente', exigido: true },
          { rotulo: 'Comunicação', valor: 'Investigação e comunicação registradas' },
        ],
        garantia: 'O estudo fica retido, abre desvio, e a conclusão só vem depois da investigação.',
        tentativa: {
          acao: 'Concluir o estudo enquanto a investigação está aberta',
          resposta:
            'Recusado: "Há investigação aberta. Conclua-a antes de concluir o estudo." (No sistema antigo o resultado fora da especificação não mudava nada.)',
        },
      },
    ],
  },
];
