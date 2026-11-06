/* iLabPharma, protótipo do Principal (Marco 1A): catálogo dos cadastros, com dados FICTÍCIOS.
   Um cadastro = uma descrição. A tela (principal.js) é a mesma para todos. */
(function () {
  var SIM_NAO = [["sim", "Sim"], ["nao", "Não"]];
  function h(quem, acao, motivo, antes, depois, quando) { return { quando: quando || "03/11/2026 09:12", quem: quem || "Carla Mendes", acao: acao, motivo: motivo || "", antes: antes || "", depois: depois || "" }; }

  var grupos = [
    { id: "acesso", nome: "Governança de Acesso", itens: [
      { id: "contas", nome: "Contas de usuário", externo: "usuarios.html", resumo: "Login, validade da conta, perfis e bloqueio. Já está pronta no protótipo de acesso." },
      { id: "perfis", nome: "Perfis de acesso", externo: "perfis.html", resumo: "O que cada perfil pode fazer (função por ação). Já está pronta no protótipo de acesso." },
      { id: "profissionais", nome: "Profissionais", singular: "profissional", resumo: "A pessoa que executa e assina. É separada da conta de usuário: a conta é opcional e se liga ao profissional.",
        decisoes: ["Profissional é separado da Conta de usuário (decisão de 06/11).", "Sem nome da mãe nem do pai (decisão de 06/11).", "Ocupação (CBO) e cargo principal, como no legado."],
        colunas: [["codigo", "Código"], ["nome", "Nome"], ["cpf", "CPF"], ["funcao", "Função profissional"], ["conta", "Conta"]],
        campos: [
          { k: "codigo", t: "Código", obrig: 1, unico: 1 }, { k: "nome", t: "Nome completo", obrig: 1 },
          { k: "cpf", t: "CPF", obrig: 1, cpf: 1, ajuda: "Só dígitos. O sistema confere os dígitos verificadores." },
          { k: "cbo", t: "Ocupação (CBO)", tipo: "select", opcoes: [["2234-05", "2234-05 Farmacêutico industrial"], ["3111-10", "3111-10 Técnico em química"], ["4141-05", "4141-05 Almoxarife"]] },
          { k: "funcao", t: "Função profissional (cargo principal)", obrig: 1, tipo: "select", ref: "funcoes" },
          { k: "conta", t: "Tem conta de usuário?", tipo: "select", opcoes: SIM_NAO },
          { k: "validade", t: "Conta válida até", tipo: "data", ajuda: "Validade da conta (de, até): serve a terceirizados e auditores." } ],
        linhas: [
          { id: 1, codigo: "P001", nome: "Carla Mendes", cpf: "12345678062", cbo: "2234-05", funcao: "Responsável técnico", conta: "sim", usos: 14, hist: [h("Sistema", "Criado", "Cadastro inicial")] },
          { id: 2, codigo: "P002", nome: "Rui Tavares", cpf: "23456789092", cbo: "3111-10", funcao: "Analista de CQ", conta: "sim", usos: 9, hist: [h("Carla Mendes", "Criado", "Novo analista")] },
          { id: 3, codigo: "P003", nome: "Marta Lins", cpf: "34567890175", cbo: "4141-05", funcao: "Almoxarife", conta: "nao", usos: 0, hist: [h("Carla Mendes", "Criado", "Colaboradora sem acesso ao sistema")] },
          { id: 4, codigo: "P004", nome: "Otávio Reis", cpf: "45678901249", cbo: "3111-10", funcao: "Analista de CQ", conta: "sim", usos: 3, situacao: "inativo", hist: [h("Carla Mendes", "Inativado", "Desligado da empresa em 30/10/2026")] } ] },
      { id: "funcoes", nome: "Funções profissionais", singular: "função profissional", resumo: "Diz quem tem competência para assinar cada etapa ou campo. É uma segunda camada, além do perfil.",
        decisoes: ["No legado, a Lote Padrão ficou sem aprovador porque nenhuma função estava ligada à configuração (DV-EST-076).", "A exigência de função por campo ou etapa fica para o desenho de Produção e CQ.", "Descrição única por empresa (o legado aceitava duas iguais, DV-PRI-028)."],
        colunas: [["codigo", "Código"], ["nome", "Descrição"], ["pode", "Pode assinar"]],
        campos: [{ k: "codigo", t: "Código", obrig: 1, unico: 1 }, { k: "nome", t: "Descrição", obrig: 1, unico: 1 }, { k: "pode", t: "Pode assinar (resumo)", ajuda: "No iLabs final isto vira a lista de etapas e campos." }],
        linhas: [
          { id: 1, codigo: "F01", nome: "Responsável técnico", pode: "Liberação de lote, aprovação de laudo", usos: 1, hist: [h("Sistema", "Criado", "Cadastro inicial")] },
          { id: 2, codigo: "F02", nome: "Analista de CQ", pode: "Análise, resultado", usos: 2, hist: [h("Sistema", "Criado", "Cadastro inicial")] },
          { id: 3, codigo: "F03", nome: "Almoxarife", pode: "Recebimento, movimentação", usos: 1, hist: [h("Sistema", "Criado", "Cadastro inicial")] },
          { id: 4, codigo: "F04", nome: "Auditor interno", pode: "", usos: 0, hist: [h("Carla Mendes", "Criado", "Ainda sem uso")] } ] },
      { id: "grupos", nome: "Grupos de usuários", singular: "grupo", resumo: "Define ONDE a pessoa atua (quais almoxarifados enxerga). O perfil define O QUE ela pode fazer. O grupo nunca libera função, só restringe o alcance.",
        decisoes: ["Grupo = escopo (onde). Perfil = o que se pode fazer (decisão de 06/11).", "No legado, trocar a pessoa de grupo não deixava histórico (DV-PRI-033); aqui deixa.", "Alcance além dos almoxarifados (ambientes, salas) fica para análise mais adiante."],
        colunas: [["codigo", "Código"], ["nome", "Nome"], ["almox", "Almoxarifados que enxerga"]],
        campos: [{ k: "codigo", t: "Código", obrig: 1, unico: 1 }, { k: "nome", t: "Nome", obrig: 1 }, { k: "almox", t: "Almoxarifados que enxerga", obrig: 1, ajuda: "Separe por vírgula. Conferido no banco em toda leitura e gravação." }],
        linhas: [
          { id: 1, codigo: "G01", nome: "Operadores de estoque MP", almox: "Matéria-prima e embalagem", usos: 4, hist: [h("Sistema", "Criado", "Cadastro inicial")] },
          { id: 2, codigo: "G02", nome: "Conferentes de recebimento", almox: "Matéria-prima e embalagem", usos: 2, hist: [h("Sistema", "Criado", "Cadastro inicial")] },
          { id: 3, codigo: "G03", nome: "Garantia da Qualidade", almox: "Matéria-prima e embalagem, Produto acabado", usos: 3, hist: [h("Sistema", "Criado", "Cadastro inicial")] } ] }
    ] },
    { id: "org", nome: "Governança Organizacional", itens: [
      { id: "empresa", nome: "Dados da empresa", singular: "empresa", resumo: "A fábrica que usa o sistema (não é o mesmo que Pessoa jurídica, que é fornecedor, cliente etc.). Uma tela de configuração.",
        decisoes: ["No legado, \"Empresa\" era só um tipo de Pessoa jurídica.", "Filiais da fábrica: em aberto, a pesquisar. O sistema fica preparado para mais de uma planta."],
        colunas: [["razao", "Razão social"], ["cnpj", "CNPJ"], ["resp", "Responsável técnico"]],
        campos: [{ k: "razao", t: "Razão social", obrig: 1 }, { k: "cnpj", t: "CNPJ", obrig: 1, cnpj: 1 }, { k: "afe", t: "Autorização de funcionamento (AFE)" }, { k: "resp", t: "Responsável técnico", obrig: 1 }],
        linhas: [{ id: 1, razao: "Lab Teste Farmacêutica Ltda", cnpj: "11222333000181", afe: "1.00.000-0", resp: "Carla Mendes", usos: 99, hist: [h("Sistema", "Criado", "Cadastro da empresa")] }] },
      { id: "estrutura", nome: "Estrutura organizacional", arvore: 1, singular: "nível", resumo: "Uma só árvore: planta, prédio, departamento, setor. Departamentos e Setores deixam de ser cadastros separados.",
        decisoes: ["Departamentos e Setores numa só árvore (decisão de 06/11).", "Preparada para mais de uma planta ou prédio, mesmo sem a informação hoje.", "No legado, alterar, inativar e excluir não pediam justificativa (DV-PRI-046); aqui pedem."],
        colunas: [["nome", "Nome"], ["tipo", "Tipo"], ["resp", "Responsável"]],
        campos: [{ k: "codigo", t: "Código", obrig: 1, unico: 1 }, { k: "nome", t: "Nome", obrig: 1 },
          { k: "tipo", t: "Tipo de nível", obrig: 1, tipo: "select", opcoes: [["Planta", "Planta"], ["Prédio", "Prédio"], ["Departamento", "Departamento"], ["Setor", "Setor"]] },
          { k: "pai", t: "Está dentro de", tipo: "select", ref: "estrutura", vazio: "(nível mais alto)" }, { k: "resp", t: "Responsável" }],
        linhas: [
          { id: 1, codigo: "PL1", nome: "Planta principal", tipo: "Planta", pai: "", resp: "Carla Mendes", usos: 5, hist: [h("Sistema", "Criado", "Cadastro inicial")] },
          { id: 2, codigo: "PR1", nome: "Prédio de produção", tipo: "Prédio", pai: "Planta principal", resp: "", usos: 3, hist: [h("Sistema", "Criado", "Cadastro inicial")] },
          { id: 3, codigo: "DQ", nome: "Qualidade", tipo: "Departamento", pai: "Prédio de produção", resp: "Carla Mendes", usos: 4, hist: [h("Sistema", "Criado", "Cadastro inicial")] },
          { id: 4, codigo: "CQ", nome: "Controle da Qualidade", tipo: "Setor", pai: "Qualidade", resp: "Rui Tavares", usos: 6, hist: [h("Sistema", "Criado", "Cadastro inicial")] },
          { id: 5, codigo: "ALM", nome: "Almoxarifado", tipo: "Setor", pai: "Prédio de produção", resp: "Marta Lins", usos: 2, hist: [h("Sistema", "Criado", "Cadastro inicial")] },
          { id: 6, codigo: "EXP", nome: "Expedição", tipo: "Setor", pai: "Prédio de produção", resp: "", usos: 0, hist: [h("Carla Mendes", "Criado", "Setor novo, sem uso")] } ] },
      { id: "custos", nome: "Centros de custo", singular: "centro de custo", resumo: "Cadastro simples, usado em compras e contas. Segue o legado, corrigido.",
        decisoes: ["O legado apagava as letras do código sem avisar (TCC01 virava 01, DV-PRI-043); aqui o código aceita letras.", "O legado excluía sem justificativa (DV-PRI-044); aqui pede motivo.", "Confirmar com a Contabilidade na validação."],
        colunas: [["codigo", "Código"], ["nome", "Descrição"]],
        campos: [{ k: "codigo", t: "Código", obrig: 1, unico: 1, ajuda: "Aceita letras e números (ex.: TCC01)." }, { k: "nome", t: "Descrição", obrig: 1 }],
        linhas: [
          { id: 1, codigo: "TCC01", nome: "Produção de sólidos", usos: 12, hist: [h("Sistema", "Criado", "Cadastro inicial")] },
          { id: 2, codigo: "TCC02", nome: "Controle da Qualidade", usos: 8, hist: [h("Sistema", "Criado", "Cadastro inicial")] },
          { id: 3, codigo: "TCC09", nome: "Projeto piloto", usos: 0, hist: [h("Carla Mendes", "Criado", "Ainda sem lançamentos")] } ] }
    ] },
    { id: "fisica", nome: "Estrutura Física", itens: [
      { id: "almox", nome: "Almoxarifados e endereços", singular: "almoxarifado", detalhe: 1, resumo: "Tela única com abas. No banco, os cadastros continuam separados (almoxarifado, local, endereço).",
        decisoes: ["Tela única com abas, cadastros separados no banco (decisão de 06/11).", "Marcações do local (quarentena, refrigerado, umidade, refugo) separam o material, e quem confere é o banco, nunca só a tela.", "No legado o endereçamento mostrava sucesso e não gravava (DV-EST-016); aqui grava tudo ou nada."],
        colunas: [["codigo", "Código"], ["nome", "Descrição"], ["tipo", "Tipo"]],
        campos: [{ k: "codigo", t: "Código", obrig: 1, unico: 1 }, { k: "nome", t: "Descrição", obrig: 1 }, { k: "tipo", t: "Tipo de almoxarifado", obrig: 1, tipo: "select", opcoes: [["Padrão", "Padrão"], ["Produção", "Produção"], ["Comercial", "Comercial"]] }],
        linhas: [
          { id: 1, codigo: "00003", nome: "Matéria-prima e embalagem", tipo: "Produção", usos: 20, hist: [h("Sistema", "Criado", "Cadastro inicial")],
            sub: { grupos: ["Operadores de estoque MP", "Conferentes de recebimento", "Garantia da Qualidade"],
              locais: [["L01", "Câmara fria", "Refrigerado", "Todos os grupos de itens"], ["L02", "Quarentena de recebimento", "Quarentena", "Matéria-prima"], ["L03", "Refugo", "Refugo", "Todos"]],
              enderecos: [["Rua 001", "Coluna 01", "Andar 01", "40 × 120 × 100 cm", "500 kg", "Ativo"], ["Rua 001", "Coluna 01", "Andar 02", "40 × 120 × 100 cm", "500 kg", "Ativo"], ["Rua 002", "Coluna 03", "Andar 01", "60 × 120 × 100 cm", "800 kg", "Inativo"]] } },
          { id: 2, codigo: "00004", nome: "Produto acabado", tipo: "Comercial", usos: 6, hist: [h("Sistema", "Criado", "Cadastro inicial")],
            sub: { grupos: ["Garantia da Qualidade"], locais: [["L10", "Expedição", "—", "Produto acabado"]], enderecos: [["Rua 010", "Coluna 01", "Andar 01", "50 × 120 × 100 cm", "600 kg", "Ativo"]] } } ] },
      { id: "ambientes", nome: "Ambientes", singular: "ambiente", resumo: "Um só cadastro para áreas, salas limpas e ambientes controlados. O que muda é a classificação.",
        decisoes: ["Só o cadastro de Ambiente, com classificação (decisão de 06/11).", "Ambiente em uso não pode ser excluído (o legado permitia, DV-PRI-009).", "Descrição repetida é recusada, com mensagem clara (DV-PRI-007, DV-PRI-011)."],
        colunas: [["nome", "Descrição"], ["local", "Onde fica"], ["classe", "Classificação"], ["ctrl", "Controlado"]],
        campos: [{ k: "nome", t: "Descrição", obrig: 1, unico: 1 }, { k: "local", t: "Onde fica (estrutura organizacional)", obrig: 1, tipo: "select", ref: "estrutura" },
          { k: "classe", t: "Classificação do ar", obrig: 1, tipo: "select", opcoes: [["Grau A", "Grau A"], ["Grau B", "Grau B"], ["Grau C", "Grau C"], ["Grau D", "Grau D"], ["Área comum", "Área comum"]] },
          { k: "ctrl", t: "Ambiente controlado?", tipo: "select", opcoes: SIM_NAO }, { k: "limites", t: "Limites de monitoramento", ajuda: "Ex.: temperatura 15 a 25 °C; umidade até 60%." }],
        linhas: [
          { id: 1, nome: "Sala de pesagem 1", local: "Prédio de produção", classe: "Grau D", ctrl: "sim", limites: "15 a 25 °C; até 60%", usos: 7, hist: [h("Sistema", "Criado", "Cadastro inicial")] },
          { id: 2, nome: "Sala de envase", local: "Prédio de produção", classe: "Grau C", ctrl: "sim", limites: "18 a 24 °C; até 55%", usos: 5, hist: [h("Sistema", "Criado", "Cadastro inicial")] },
          { id: 3, nome: "Corredor de apoio", local: "Prédio de produção", classe: "Área comum", ctrl: "nao", limites: "", usos: 0, hist: [h("Carla Mendes", "Criado", "Sem uso")] } ] }
    ] },
    { id: "corp", nome: "Cadastros Corporativos", itens: [
      { id: "pj", nome: "Pessoas jurídicas", singular: "pessoa jurídica", resumo: "Clientes, fornecedores, fabricantes e transportadoras, com papéis, contatos e endereços. As filiais viram endereços com tipo.",
        decisoes: ["Um só cadastro, com papéis marcados (decisão de 06/11).", "CNPJ conferido e único por empresa.", "Alterar e inativar pedem motivo (o legado não pedia, DV-PRI-013).", "Contatos são dados pessoais: guardar só o necessário (LGPD)."],
        colunas: [["razao", "Razão social"], ["cnpj", "CNPJ"], ["papeis", "Papéis"], ["qual", "Qualificação"]],
        campos: [{ k: "razao", t: "Razão social", obrig: 1 }, { k: "cnpj", t: "CNPJ", obrig: 1, cnpj: 1, unico: 1 }, { k: "papeis", t: "Papéis", obrig: 1, tipo: "select", opcoes: [["Fornecedor", "Fornecedor"], ["Fabricante", "Fabricante"], ["Cliente", "Cliente"], ["Transportadora", "Transportadora"], ["Fornecedor e fabricante", "Fornecedor e fabricante"]] }, { k: "contato", t: "Contato principal" }, { k: "qual", t: "Qualificação", ajuda: "Só leitura: vem do cadastro da Garantia da Qualidade." }],
        linhas: [
          { id: 1, razao: "Química Aurora S.A.", cnpj: "44555666000181", papeis: "Fornecedor e fabricante", contato: "Vendas Aurora", qual: "Qualificado", usos: 11, hist: [h("Sistema", "Criado", "Cadastro inicial")] },
          { id: 2, razao: "Embalagens Vale Ltda", cnpj: "77888999000181", papeis: "Fornecedor", contato: "Comercial Vale", qual: "Em avaliação", usos: 3, hist: [h("Carla Mendes", "Criado", "Novo fornecedor")] },
          { id: 3, razao: "Farmácia Central", cnpj: "10101010000177", papeis: "Cliente", contato: "Compras", qual: "—", usos: 4, hist: [h("Sistema", "Criado", "Cadastro inicial")] },
          { id: 4, razao: "Transporte Rápido Ltda", cnpj: "20202020000152", papeis: "Transportadora", contato: "", qual: "—", usos: 0, hist: [h("Carla Mendes", "Criado", "Sem uso")] } ] },
      { id: "qualif", nome: "Qualificação de fornecedores", singular: "qualificação", resumo: "Mora na Garantia da Qualidade. Lista os materiais e serviços APROVADOS por fornecedor, com validade. O banco recusa o recebimento de quem não está qualificado.",
        decisoes: ["Mora na Garantia da Qualidade; recebimento e terceirização BLOQUEIAM fornecedor não qualificado (decisão de 06/11, RDC 658/2022 art. 8º, VI).", "\"Tipos de fornecimento\" virou a lista de materiais e serviços aprovados.", "No legado a coluna \"Qualificado\" mostrava SIM para qualquer um (DV-EST-022)."],
        colunas: [["forn", "Fornecedor"], ["mat", "Material ou serviço aprovado"], ["sit", "Situação"], ["valid", "Válida até"]],
        campos: [{ k: "forn", t: "Fornecedor", obrig: 1, tipo: "select", ref: "pj" }, { k: "mat", t: "Material ou serviço aprovado", obrig: 1 }, { k: "fab", t: "Fabricante" },
          { k: "sit", t: "Situação", obrig: 1, tipo: "select", opcoes: [["Em avaliação", "Em avaliação"], ["Qualificado", "Qualificado"], ["Qualificado com restrição", "Qualificado com restrição"], ["Suspenso", "Suspenso"], ["Desqualificado", "Desqualificado"]] },
          { k: "valid", t: "Válida até", tipo: "data", obrig: 1 }],
        linhas: [
          { id: 1, forn: "Química Aurora S.A.", mat: "Lactose monoidratada", fab: "Química Aurora S.A.", sit: "Qualificado", valid: "2027-08-30", usos: 6, hist: [h("Carla Mendes", "Criado", "Auditoria de qualificação concluída")] },
          { id: 2, forn: "Embalagens Vale Ltda", mat: "Frasco âmbar 100 mL", fab: "Embalagens Vale Ltda", sit: "Em avaliação", valid: "2026-12-31", usos: 0, hist: [h("Carla Mendes", "Criado", "Aguardando auditoria")] },
          { id: 3, forn: "Química Aurora S.A.", mat: "Estearato de magnésio", fab: "Química Aurora S.A.", sit: "Suspenso", valid: "2026-10-15", usos: 2, hist: [h("Carla Mendes", "Alterado", "Desvio de qualidade no recebimento", "Situação: Qualificado", "Situação: Suspenso")] } ],
        regra: "Recebimento de material de fornecedor com situação diferente de Qualificado ou Qualificado com restrição é recusado pelo banco." },
      { id: "contasfin", nome: "Contas bancárias e financeiras", singular: "conta", resumo: "Um só cadastro para conta bancária, financeira, contábil e gerencial, com tipo.",
        decisoes: ["Quatro telas viram um cadastro com tipo (decisão de 06/11).", "A faixa válida da taxa depende da Contabilidade (o legado aceitava 150 e -5, DV-PRI-048).", "No legado, mudar a taxa não ia para o histórico (DV-PRI-047); aqui vai.", "Dados bancários do fornecedor ficam na Pessoa jurídica."],
        colunas: [["codigo", "Código"], ["nome", "Descrição"], ["tipo", "Tipo"], ["taxa", "Taxa (%)"]],
        campos: [{ k: "codigo", t: "Código", obrig: 1, unico: 1 }, { k: "nome", t: "Descrição", obrig: 1 }, { k: "tipo", t: "Tipo", obrig: 1, tipo: "select", opcoes: [["Bancária", "Bancária"], ["Financeira", "Financeira"], ["Contábil", "Contábil"], ["Gerencial", "Gerencial"]] },
          { k: "taxa", t: "Taxa (%)", tipo: "numero", min: 0, max: 100, ajuda: "Entre 0 e 100 (faixa final a definir com a Contabilidade)." }],
        linhas: [
          { id: 1, codigo: "CB-001", nome: "Conta corrente principal", tipo: "Bancária", taxa: "", usos: 30, hist: [h("Sistema", "Criado", "Cadastro inicial")] },
          { id: 2, codigo: "CC-310", nome: "Depreciação de equipamentos", tipo: "Contábil", taxa: "10", usos: 5, hist: [h("Sistema", "Criado", "Cadastro inicial")] },
          { id: 3, codigo: "CG-050", nome: "Despesas de qualidade", tipo: "Gerencial", taxa: "", usos: 0, hist: [h("Carla Mendes", "Criado", "Sem uso")] } ] }
    ] }
  ];
  window.PRI = { grupos: grupos };
})();
