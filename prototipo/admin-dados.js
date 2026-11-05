/* Dados fictícios e ajudantes compartilhados pelas telas de administração (usuários, perfis, registros, assinatura).
   Os papéis seguem a proposta em validação com a Qualidade; a matriz espelha a função criar_perfis_de_teste da migração 3. */
(function () {
  var FUNCOES = [
    { k: "acesso.usuarios", g: "Acesso", n: "Usuários" },
    { k: "acesso.perfis", g: "Acesso", n: "Perfis e permissões" },
    { k: "acesso.registro_acessos", g: "Acesso", n: "Registro de acessos" },
    { k: "acesso.politica_seguranca", g: "Acesso", n: "Política de segurança" },
    { k: "auditoria.registros", g: "Auditoria", n: "Trilha de auditoria" },
    { k: "cadastros.unidades_medida", g: "Cadastros", n: "Unidades de medida" },
    { k: "cadastros.pessoas_juridicas", g: "Cadastros", n: "Pessoas jurídicas e fornecedores" },
    { k: "cadastros.almoxarifados", g: "Cadastros", n: "Almoxarifados e endereços" },
    { k: "cadastros.materiais", g: "Cadastros", n: "Materiais" },
    { k: "assinatura.consulta", g: "Assinatura eletrônica", n: "Consultar assinaturas" },
    { k: "assinatura.autor", g: "Assinatura eletrônica", n: "Assinar como autor" },
    { k: "assinatura.revisor", g: "Assinatura eletrônica", n: "Assinar como revisor" },
    { k: "assinatura.aprovador", g: "Assinatura eletrônica", n: "Assinar como aprovador" },
    { k: "assinatura.reprovador", g: "Assinatura eletrônica", n: "Assinar como reprovador" },
    { k: "assinatura.liberador", g: "Assinatura eletrônica", n: "Assinar como liberador" },
    { k: "assinatura.anulador", g: "Assinatura eletrônica", n: "Assinar como anulador" }
  ];
  var ACOES = [["consultar", "Consultar"], ["incluir", "Incluir"], ["alterar", "Alterar"], ["excluir", "Excluir"], ["imprimir", "Imprimir"], ["historico", "Histórico"]];
  var APROVA = ["aprovador", "reprovador", "liberador", "anulador"];

  /* nome, descrição, assinaturas, escreve cadastros, vê auditoria, administra acesso */
  var PAPEIS = [
    ["Administrador do sistema", "Gerencia usuários, perfis e política. Não aprova nada na Qualidade (a validar).", [], false, true, true],
    ["Responsável pelo cadastro", "Mantém os cadastros base.", ["autor"], true, false, false],
    ["Recebimento", "Recebe materiais.", ["autor"], false, false, false],
    ["Almoxarife", "Armazena e movimenta materiais.", ["autor"], false, false, false],
    ["Inventário", "Conta e ajusta estoque.", ["autor"], false, false, false],
    ["Amostrador", "Coleta amostras.", ["autor"], false, false, false],
    ["Analista do CQ", "Executa análises.", ["autor"], false, false, false],
    ["Verificador", "Verifica o trabalho do analista.", ["revisor"], false, false, false],
    ["Chefe do CQ", "Decide a aprovação do controle de qualidade.", ["aprovador", "reprovador"], false, true, false],
    ["Responsável pela estabilidade", "Conduz estudos de estabilidade.", ["autor"], false, false, false],
    ["Qualquer usuário (registra desvio)", "Registra desvios.", ["autor"], false, false, false],
    ["Área envolvida", "Responde a desvios da sua área.", ["autor"], false, false, false],
    ["Analista da GQ", "Revisa registros da Garantia da Qualidade.", ["revisor"], false, true, false],
    ["Gestor da GQ", "Decide na Garantia da Qualidade.", ["aprovador", "reprovador", "anulador"], false, true, false],
    ["Inspetor", "Consulta tudo, sem gravar.", [], false, true, false],
    ["Pessoa Delegada", "Libera lotes por delegação do responsável técnico.", ["liberador", "reprovador"], false, false, false],
    ["Autor", "Elabora documentos.", ["autor"], false, false, false],
    ["Revisor", "Revisa documentos.", ["revisor"], false, false, false],
    ["Aprovador", "Aprova documentos.", ["aprovador", "reprovador"], false, false, false],
    ["Responsável pela vigência", "Torna o documento vigente.", ["liberador"], false, false, false],
    ["Administrador de documentos", "Administra documentos.", ["autor"], false, false, false],
    ["Usuário de consulta", "Só consulta.", [], false, false, false]
  ];

  function vazia() { var o = {}; FUNCOES.forEach(function (f) { o[f.k] = { consultar: false, incluir: false, alterar: false, excluir: false, imprimir: false, historico: false }; }); return o; }
  function matrizDoPapel(p) {
    var m = vazia(), assin = p[2], escreve = p[3], audit = p[4], admin = p[5];
    FUNCOES.forEach(function (f) {
      var c = m[f.k];
      if (f.k.indexOf("cadastros.") === 0 || f.k === "assinatura.consulta") { c.consultar = true; c.imprimir = true; c.incluir = escreve && f.k !== "assinatura.consulta"; c.alterar = c.incluir; c.historico = c.incluir; }
      if (admin && f.k.indexOf("acesso.") === 0) { for (var a in c) c[a] = true; }
      if (audit && (f.k === "auditoria.registros" || f.k === "acesso.registro_acessos")) { c.consultar = true; c.imprimir = true; c.historico = true; }
      if (f.k.indexOf("assinatura.") === 0 && f.k !== "assinatura.consulta" && assin.indexOf(f.k.slice(11)) >= 0) { c.consultar = true; c.incluir = true; }
    });
    return m;
  }
  var perfis = [];
  var adm = vazia();
  FUNCOES.forEach(function (f) { if (f.k.indexOf("assinatura.") !== 0 || f.k === "assinatura.consulta") for (var a in adm[f.k]) adm[f.k][a] = true; });
  perfis.push({ id: "p0", nome: "Administrador", desc: "Acesso total ao ambiente, exceto assinar aprovações (a validar com a Qualidade). Criado com a empresa.", ativo: true, m: adm });
  PAPEIS.forEach(function (p, i) { perfis.push({ id: "p" + (i + 1), nome: p[0], desc: p[1], ativo: true, m: matrizDoPapel(p) }); });
  perfis.push({ id: "p99", nome: "Auditor externo (antigo)", desc: "Perfil que a empresa deixou de usar. Quem ainda o tem continua vendo o vínculo gravado.", ativo: false, m: matrizDoPapel(PAPEIS[14]) });
  function pid(nome) { for (var i = 0; i < perfis.length; i++) if (perfis[i].nome === nome) return perfis[i].id; return null; }

  var EU = "u1";
  var pessoas = [
    { id: "u1", nome: "Carla Mendes", email: "carla.mendes@lab-teste.com.br", ativo: true, bloq: false, perfis: [pid("Administrador")], acesso: "hoje 08:12" },
    { id: "u2", nome: "Rui Tavares", email: "rui.tavares@lab-teste.com.br", ativo: true, bloq: false, perfis: [pid("Chefe do CQ")], acesso: "hoje 08:40", dupla: true },
    { id: "u3", nome: "Ana Souza", email: "ana.souza@lab-teste.com.br", ativo: true, bloq: false, perfis: [pid("Analista do CQ")], acesso: "hoje 07:58" },
    { id: "u4", nome: "Carlos Lima", email: "carlos.lima@lab-teste.com.br", ativo: true, bloq: false, perfis: [pid("Almoxarife"), pid("Recebimento")], acesso: "hoje 09:02" },
    { id: "u5", nome: "Marina Reis", email: "marina.reis@lab-teste.com.br", ativo: true, bloq: true, perfis: [pid("Gestor da GQ")], acesso: "ontem 16:30", dupla: true },
    { id: "u6", nome: "Paulo Nunes", email: "paulo.nunes@lab-teste.com.br", ativo: true, bloq: false, perfis: [pid("Verificador")], acesso: "ontem 17:05" },
    { id: "u7", nome: "Lúcia Prado", email: "lucia.prado@lab-teste.com.br", ativo: true, bloq: false, perfis: [pid("Responsável pelo cadastro"), pid("Aprovador")], acesso: "03/11 10:20", dupla: true },
    { id: "u8", nome: "Bruno Alves", email: "bruno.alves@lab-teste.com.br", ativo: true, bloq: false, perfis: [pid("Amostrador")], acesso: "hoje 08:15" },
    { id: "u9", nome: "Helena Costa", email: "helena.costa@lab-teste.com.br", ativo: true, bloq: false, perfis: [pid("Inspetor"), pid("Auditor externo (antigo)")], acesso: "02/11 14:00" },
    { id: "u10", nome: "Diego Rocha", email: "diego.rocha@lab-teste.com.br", ativo: true, bloq: false, perfis: [pid("Pessoa Delegada")], acesso: "hoje 09:30", dupla: true },
    { id: "u11", nome: "Fernanda Lopes", email: "fernanda.lopes@lab-teste.com.br", ativo: true, bloq: false, perfis: [pid("Usuário de consulta")], acesso: "01/11 11:11" },
    { id: "u12", nome: "Tiago Martins", email: "tiago.martins@lab-teste.com.br", ativo: false, bloq: false, perfis: [pid("Analista da GQ")], acesso: "20/10 15:45" },
    { id: "u13", nome: "Sofia Ramos", email: "sofia.ramos@lab-teste.com.br", ativo: true, bloq: false, perfis: [pid("Autor"), pid("Revisor")], acesso: "hoje 08:50" },
    { id: "u14", nome: "Otávio Braga", email: "otavio.braga@lab-teste.com.br", ativo: true, bloq: false, perfis: [pid("Administrador do sistema")], acesso: "04/11 17:30" },
    { id: "u15", nome: "Renata Duarte", email: "renata.duarte@lab-teste.com.br", ativo: true, bloq: false, perfis: [pid("Inventário")], acesso: "04/11 09:10" },
    { id: "u16", nome: "Eduardo Faria", email: "eduardo.faria@lab-teste.com.br", ativo: true, bloq: false, perfis: [pid("Responsável pela estabilidade")], acesso: "03/11 16:00" }
  ];
  var convites = [
    { id: "c1", nome: "Joana Dias", email: "joana.dias@lab-teste.com.br", perfil: pid("Recebimento"), criado: "05/11 08:30", expira: "07/11 08:30", estado: "valido" },
    { id: "c2", nome: "Marcos Vieira", email: "marcos.vieira@lab-teste.com.br", perfil: pid("Amostrador"), criado: "01/11 10:00", expira: "03/11 10:00", estado: "vencido" },
    { id: "c3", nome: "Sofia Ramos", email: "sofia.ramos@lab-teste.com.br", perfil: pid("Autor"), criado: "30/10 14:00", expira: "01/11 14:00", estado: "usado" }
  ];

  var TEXTO_LONGO = "Procedimento de amostragem de insumos ativos: a amostra deve ser coletada em área de fluxo laminar, com material limpo e identificado, em quantidade suficiente para a análise completa e para a contraprova, registrando lote do fornecedor, validade, condições do recipiente e nome de quem coletou. Qualquer divergência na embalagem deve ser registrada como desvio antes da liberação da quarentena.";
  var auditoria = [
    ["05/11/2026 09:42:10", "u4", "almoxarifados", "AL-A / rua 3", "A", "descrição: Rua 3 (provisória)", "descrição: Rua 3, prateleiras 1 a 4", ""],
    ["05/11/2026 09:15:44", "u3", "amostragens", "T-2611-0150", "I", "", "registro de amostragem criado", ""],
    ["05/11/2026 08:58:03", "u7", "materiais", "M-0042", "A", "descrição: Lactose", "descrição: Lactose monoidratada", "Correção do nome do insumo"],
    ["04/11/2026 17:30:12", "u1", "usuarios.perfis", "Tiago Martins", "A", "perfis: Analista da GQ", "perfis: Analista da GQ (usuário inativado)", "Desligamento da empresa"],
    ["04/11/2026 16:20:00", "u1", "perfil_funcoes", "Analista do CQ: Verificação de amostragens", "A", "incluir: não", "incluir: sim", "Analista passa a registrar a verificação"],
    ["04/11/2026 15:02:31", "u1", "politica_seguranca", "Lab Teste", "A", "tentativas_max: 5", "tentativas_max: 4", "Endurecer a política da empresa"],
    ["04/11/2026 14:10:09", "u7", "materiais", "M-0040", "A", "tipo: excipiente\ndescrição: " + TEXTO_LONGO.slice(0, 120), "tipo: excipiente\ndescrição: " + TEXTO_LONGO, "Procedimento completo conforme POP de amostragem"],
    ["04/11/2026 11:44:51", "u1", "convites", "joana.dias@lab-teste.com.br", "I", "", "convite criado (perfil Recebimento, vale 48 horas)", ""],
    ["03/11/2026 16:00:00", "u4", "pessoas_juridicas", "T-Química Ltda", "I", "", "CNPJ 11.222.333/0001-81, tipos: fornecedor, fabricante", ""],
    ["03/11/2026 10:20:15", "u7", "unidades_medida", "cx", "A", "nome: Caixa", "nome: Caixa (unidade de venda)", "Esclarecer a unidade"],
    ["02/11/2026 14:01:00", "u1", "usuarios", "Helena Costa", "A", "ativo: sim", "ativo: sim (perfil Inspetor acrescentado)", "Inspeção da ANVISA marcada para o mês que vem"],
    ["01/11/2026 09:00:00", "u1", "empresas", "Lab Teste", "I", "", "empresa criada, período de teste de 365 dias (provisório)", ""]
  ];
  var origens = [["200.100.50.10", "Windows · Edge"], ["200.100.50.12", "Windows · Chrome"], ["177.20.4.66", "Android · Chrome"], ["189.30.11.5", "Windows · Firefox"]];
  var acessos = [];
  var seq = [
    ["u3", "entrada", "sucesso", ""], ["u2", "entrada", "sucesso", ""], ["u4", "entrada", "sucesso", ""], ["u8", "entrada", "sucesso", ""],
    ["u5", "falha", "falha", "Senha incorreta"], ["u5", "falha", "falha", "Senha incorreta"], ["u5", "falha", "falha", "Senha incorreta"],
    ["u5", "falha", "falha", "Senha incorreta"], ["u5", "falha", "falha", "Senha incorreta"], ["u5", "bloqueio", "bloqueado", "Bloqueada por 5 falhas em 15 minutos; administrador avisado"],
    ["u2", "assinatura", "sucesso", "aprovador em amostragens"], ["u3", "saida", "sucesso", ""], ["u9", "entrada", "sucesso", ""],
    ["u6", "troca_senha", "sucesso", ""], ["u12", "sessao_encerrada", "sucesso", "Usuário inativado: sessões encerradas na hora"],
    ["u10", "falha_2fa", "falha", "Código de duas etapas inválido"], ["u10", "entrada", "sucesso", ""], ["u1", "redefinicao_senha", "sucesso", "Redefinição pedida pelo administrador"],
    ["u13", "convite_aceito", "sucesso", ""], ["u7", "entrada", "sucesso", ""], ["u2", "falha_assinatura", "falha", "Senha incorreta ao assinar"], ["u2", "assinatura", "sucesso", "aprovador em materiais"],
    ["x", "falha", "falha", "E-mail não cadastrado (a pessoa vê a mesma mensagem de sempre)"], ["u1", "entrada", "sucesso", ""]
  ];
  var dia = 5, hora = 9, min = 50;
  seq.forEach(function (s, i) {
    min -= 97; while (min < 0) { min += 60; hora -= 1; } while (hora < 0) { hora += 24; dia -= 1; }
    var o = origens[i % origens.length];
    acessos.push({ quando: ("0" + dia).slice(-2) + "/11/2026 " + ("0" + hora).slice(-2) + ":" + ("0" + min).slice(-2) + ":" + ("0" + ((i * 7) % 60)).slice(-2), data: "2026-11-" + ("0" + dia).slice(-2), u: s[0], email: s[0] === "x" ? "nao.existe@exemplo.com" : null, evento: s[1], res: s[2], ip: o[0], nav: o[1], det: s[3] });
  });

  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function perfil(id) { for (var i = 0; i < perfis.length; i++) if (perfis[i].id === id) return perfis[i]; return null; }
  function pessoa(id) { for (var i = 0; i < pessoas.length; i++) if (pessoas[i].id === id) return pessoas[i]; return null; }
  function norm(t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

  /* Janelas: foco dentro, Esc fecha, foco volta ao botão que abriu */
  var ultimo = null;
  function abrir(id, foco) {
    var m = document.getElementById(id); ultimo = document.activeElement; m.hidden = false;
    var alvo = foco ? m.querySelector(foco) : m.querySelector("input,select,textarea,button"); if (alvo) alvo.focus();
  }
  function fechar(id) { var m = document.getElementById(id); m.hidden = true; if (ultimo && document.body.contains(ultimo)) ultimo.focus(); }
  document.addEventListener("keydown", function (e) {
    var m = document.querySelector(".modal-fundo:not([hidden])"); if (!m) return;
    if (e.key === "Escape") { fechar(m.id); return; }
    if (e.key === "Tab") {
      var f = Array.prototype.slice.call(m.querySelectorAll("a[href],button:not([disabled]),input:not([disabled]),select,textarea")).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });
  function agora() { var d = new Date(); function p(n) { return ("0" + n).slice(-2); } return "05/11/2026 " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds()); }

  window.adm = { FUNCOES: FUNCOES, ACOES: ACOES, APROVA: APROVA, perfis: perfis, pessoas: pessoas, convites: convites, auditoria: auditoria, acessos: acessos,
    EU: EU, esc: esc, perfil: perfil, pessoa: pessoa, norm: norm, abrir: abrir, fechar: fechar, agora: agora };
})();
