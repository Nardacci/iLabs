(function () {
  var $ = window.proto.$, $$ = window.proto.$$, aviso = window.proto.aviso;
/* ---------- Início: dados de exemplo por perfil ---------- */
  var PERFIS = {
    cq: {
      nome: "Ana Souza", ini: "AS", papel: "Analista do CQ", saud: "Bom dia, Ana",
      sub: "O que depende do seu perfil, do mais urgente ao menos.",
      tarefas: [
        { n: "high", t: "Digitar o resultado da análise do lote T-2611-0142", m: "Lactose monoidratada · amostragem feita em 02/11", d: "atrasada 1 dia", a: "Abrir análise" },
        { n: "high", t: "Calibração da balança BAL-03 vence em 3 dias", m: "Laboratório físico-químico · responsável: manutenção", d: "3 dias", a: "Ver equipamento" },
        { n: "mid", t: "Programar coleta de água purificada", m: "Ponto PTA-PW-01 sem coleta há 6 dias", d: "esta semana", a: "Programar" },
        { n: "mid", t: "Ler e assinar o POP-017, revisão 4", m: "Treinamento obrigatório", d: "até 10/11", a: "Abrir POP" },
        { n: "", t: "Verificar a amostragem do lote T-2611-0150", m: "Segunda pessoa, conforme o plano de amostragem", d: "sem prazo", a: "Verificar" }
      ],
      kpis: [
        { t: "Materiais com validade em menos de 30 dias", v: "3", c: "warn" },
        { t: "Desvios de qualidade abertos", v: "2", c: "bad" },
        { t: "Calibrações a vencer em 30 dias", v: "4", c: "warn" },
        { t: "Treinamentos em dia", v: "94%", c: "ok", p: 94 }
      ]
    },
    almox: {
      nome: "Carlos Lima", ini: "CL", papel: "Almoxarife", saud: "Bom dia, Carlos",
      sub: "O que depende do seu perfil, do mais urgente ao menos.",
      tarefas: [
        { n: "high", t: "Endereçar 2 notas fiscais recebidas ontem", m: "Fornecedor T-Química · volumes aguardando posição", d: "hoje", a: "Endereçar" },
        { n: "mid", t: "Atender a solicitação da produção SP-0098", m: "OPE T-0031 · 5 itens", d: "hoje", a: "Atender" },
        { n: "mid", t: "Lotes aprovados fora da área de quarentena", m: "3 volumes ainda sinalizados como quarentena", d: "esta semana", a: "Atualizar" },
        { n: "", t: "Inventário cíclico do almoxarifado A", m: "Rua 3 e rua 4", d: "até 12/11", a: "Contar" }
      ],
      kpis: [
        { t: "Volumes em quarentena há mais de 5 dias", v: "2", c: "bad" },
        { t: "Materiais com validade em menos de 30 dias", v: "3", c: "warn" },
        { t: "Divergências no último inventário", v: "1", c: "warn" },
        { t: "Recebimentos conferidos no prazo", v: "98%", c: "ok", p: 98 }
      ]
    },
    gestor: {
      nome: "Marina Reis", ini: "MR", papel: "Gestor da Qualidade", saud: "Bom dia, Marina",
      sub: "O que espera decisão da Qualidade.",
      tarefas: [
        { n: "high", t: "Certificar o lote T-2611-0131 (pessoa delegada)", m: "Todos os registros assinados · produto acabado", d: "hoje", a: "Revisar e certificar" },
        { n: "high", t: "Aprovar o laudo do lote T-2611-0142", m: "Aguardando há 2 dias · lactose monoidratada", d: "atrasada 2 dias", a: "Abrir laudo" },
        { n: "mid", t: "Desvio DV-0031: definir a causa raiz", m: "Aberto há 9 dias · limpeza de equipamento", d: "esta semana", a: "Abrir desvio" },
        { n: "mid", t: "Pedido de mudança PM-0012 aguarda parecer", m: "Alteração de etapa no lote padrão", d: "até 09/11", a: "Dar parecer" }
      ],
      kpis: [
        { t: "Desvios abertos há mais de 7 dias", v: "1", c: "bad" },
        { t: "Laudos pendentes de aprovação", v: "2", c: "warn" },
        { t: "Revisões periódicas de documentos em atraso", v: "5", c: "warn" },
        { t: "Lotes liberados no prazo (30 dias)", v: "91%", c: "ok", p: 91 }
      ]
    }
  };
  var ETAPAS = [
    { id: "rec", l: "Recebido", n: 4 },
    { id: "qua", l: "Quarentena", n: 7, w: "2 há mais de 5 dias", b: true },
    { id: "ana", l: "Análise do CQ", n: 5 },
    { id: "apr", l: "Aprovado", n: 12 },
    { id: "pro", l: "Em produção", n: 3 },
    { id: "lib", l: "Para liberar", n: 1 }
  ];
  var LOTES = {
    rec: [
      ["T-2611-0155", "Estearato de magnésio", "T-Química", "08/2028", "1 dia", ["ok", "Conferido"]],
      ["T-2611-0156", "Blister Al/PVC", "Embalagens Teste", "11/2028", "1 dia", ["warn", "Falta nota"]],
      ["T-2611-0157", "Caixa de cartolina", "Embalagens Teste", "—", "0 dia", ["ok", "Conferido"]],
      ["T-2611-0158", "Lactose monoidratada", "T-Química", "07/2028", "0 dia", ["ok", "Conferido"]]
    ],
    qua: [
      ["T-2611-0142", "Lactose monoidratada", "T-Química", "06/2028", "6 dias", ["bad", "Análise atrasada"]],
      ["T-2611-0143", "Celulose microcristalina", "T-Química", "09/2028", "6 dias", ["bad", "Aguardando amostragem"]],
      ["T-2611-0150", "Insumo ativo A", "Farmo Teste", "03/2028", "3 dias", ["warn", "Em amostragem"]],
      ["T-2611-0151", "Amido de milho", "T-Química", "10/2028", "3 dias", ["ok", "No prazo"]],
      ["T-2611-0152", "Dióxido de silício", "T-Química", "12/2028", "2 dias", ["ok", "No prazo"]],
      ["T-2611-0153", "Povidona", "Farmo Teste", "05/2028", "2 dias", ["ok", "No prazo"]],
      ["T-2611-0154", "Talco", "T-Química", "04/2028", "1 dia", ["ok", "No prazo"]]
    ],
    ana: [
      ["T-2611-0140", "Insumo ativo B", "Farmo Teste", "02/2028", "4 dias", ["warn", "Resultado pendente"]],
      ["T-2611-0141", "Croscarmelose", "T-Química", "08/2028", "3 dias", ["ok", "Em análise"]],
      ["T-2611-0144", "Lactose spray-dried", "T-Química", "07/2028", "3 dias", ["ok", "Em análise"]],
      ["T-2611-0145", "Estearato de magnésio", "T-Química", "08/2028", "2 dias", ["ok", "Em análise"]],
      ["T-2611-0146", "Água purificada PTA-PW-01", "Interno", "—", "1 dia", ["ok", "Em análise"]]
    ],
    apr: [
      ["T-2610-0120", "Celulose microcristalina", "T-Química", "08/2028", "—", ["ok", "Aprovado"]],
      ["T-2610-0121", "Amido de milho", "T-Química", "09/2028", "—", ["ok", "Aprovado"]],
      ["T-2610-0122", "Povidona", "Farmo Teste", "06/2028", "—", ["ok", "Aprovado"]]
    ],
    pro: [
      ["T-2611-OPE31", "Comprimido 5 mg, ordem T-0031", "Interno", "—", "2 dias", ["ok", "Em andamento"]],
      ["T-2611-OPE32", "Comprimido 10 mg, ordem T-0032", "Interno", "—", "1 dia", ["ok", "Em andamento"]],
      ["T-2611-OPE33", "Comprimido 5 mg, ordem T-0033", "Interno", "—", "0 dia", ["warn", "Falta autorização"]]
    ],
    lib: [
      ["T-2611-0131", "Comprimido 5 mg", "Interno", "11/2028", "1 dia", ["warn", "Aguarda certificação"]]
    ]
  };
  var TRILHA = [
    ["09:42", "<b>Carlos Lima</b> endereçou o lote <span class=\"mono\">T-2611-0158</span> no almoxarifado A, rua 3"],
    ["09:15", "<b>Ana Souza</b> assinou o registro de amostragem do lote <span class=\"mono\">T-2611-0150</span>"],
    ["08:50", "<b>Sistema</b> avisou: validade de <span class=\"mono\">T-2610-0098</span> em 21 dias"],
    ["ontem", "<b>Marina Reis</b> alterou o perfil <i>Analista do CQ</i>: acrescentou a função Verificação de amostragens (antes: sem a função)"],
    ["ontem", "<b>Carlos Lima</b> recebeu a nota fiscal 48213 de T-Química (4 volumes)"]
  ];

  var etapaSel = "qua";
  function montar(chave) {
    var p = PERFIS[chave];
    $("#avatar").textContent = p.ini; $("#nome-eu").textContent = p.nome; $("#papel-eu").textContent = p.papel;
    $("#saudacao").textContent = p.saud;
    $("#subsaudacao").textContent = "terça-feira, 3 de novembro de 2026 · " + p.papel;
    $("#sub-tarefas").textContent = p.sub;
    $("#lista-tarefas").innerHTML = p.tarefas.map(function (t) {
      return '<li class="task ' + t.n + '"><i class="bar"></i><div><strong>' + t.t + '</strong><span class="meta">' + t.m + '</span></div>' +
        '<div class="actions"><span class="due">' + t.d + '</span><button type="button" class="btn small" data-fora>' + t.a + "</button></div></li>";
    }).join("");
    $("#lista-kpi").innerHTML = p.kpis.map(function (k) {
      return '<div class="kpi"><span>' + k.t + '</span><span class="v ' + k.c + '">' + k.v + "</span>" +
        (k.p ? '<div class="meter" role="img" aria-label="' + k.p + ' por cento"><i style="width:' + k.p + '%"></i></div>' : "") + "</div>";
    }).join("");
    $("#trilha").innerHTML = TRILHA.map(function (a) { return "<li><time>" + a[0] + "</time><span>" + a[1] + "</span></li>"; }).join("");
    corrente();
    ligarFora();
  }
  function corrente() {
    $("#corrente").innerHTML = ETAPAS.map(function (e) {
      return '<button type="button" class="stage' + (e.b ? " block" : "") + '" data-etapa="' + e.id + '" aria-pressed="' + (e.id === etapaSel) + '">' +
        '<span class="n">' + e.n + '</span><span class="l">' + e.l + '</span><span class="w">' + (e.w || "") + "</span></button>";
    }).join("");
    $("#lotes").innerHTML = LOTES[etapaSel].map(function (r) {
      return "<tr><td class=\"mono\">" + r[0] + "</td><td>" + r[1] + "</td><td>" + r[2] + "</td><td>" + r[3] + "</td><td>" + r[4] +
        '</td><td><span class="pill ' + r[5][0] + '">' + r[5][1] + "</span></td></tr>";
    }).join("");
    $$("[data-etapa]").forEach(function (b) {
      b.addEventListener("click", function () { etapaSel = b.getAttribute("data-etapa"); corrente(); });
    });
  }
  function ligarFora() {
    $$("[data-fora]").forEach(function (el) {
      el.onclick = function (e) { e.preventDefault(); aviso("Esta tela não faz parte do protótipo."); };
    });
  }
  $("#ver-como").addEventListener("change", function () { montar(this.value); });
  $("#abrir-eu").addEventListener("click", function () {
    var m = $("#menu-eu"), abrir = m.hidden;
    m.hidden = !abrir; this.setAttribute("aria-expanded", String(abrir));
  });
  $("#sair").addEventListener("click", function () { location.href = "entrar.html"; });
  $("#abrir-menu").addEventListener("click", function () {
    var s = $("#menu-lateral"), abrir = !s.classList.contains("open");
    s.classList.toggle("open", abrir); this.setAttribute("aria-expanded", String(abrir));
  });
  document.addEventListener("click", function (e) {
    var s = $("#menu-lateral");
    if (s.classList.contains("open") && !s.contains(e.target) && e.target !== $("#abrir-menu")) { s.classList.remove("open"); $("#abrir-menu").setAttribute("aria-expanded", "false"); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); $("#busca").focus(); }
    if (e.key === "Escape") { $("#menu-eu").hidden = true; $("#menu-lateral").classList.remove("open"); }
  });
  $("#busca").addEventListener("keydown", function (e) {
    if (e.key === "Enter" && this.value.trim()) { aviso("A busca global não faz parte do protótipo."); }
  });

  montar("cq");
})();
