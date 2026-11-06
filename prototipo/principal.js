(function () {
  var $ = window.proto.$, $$ = window.proto.$$, aviso = window.proto.aviso;
  var G = window.PRI.grupos, MOTIVO_MIN = 5;
  var estado = { papel: "admin", filtro: "vivos", busca: "", aba: "grupos" };
  var edit = null, acao = null;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function item(id) { for (var i = 0; i < G.length; i++) for (var j = 0; j < G[i].itens.length; j++) if (G[i].itens[j].id === id) return G[i].itens[j]; return null; }
  function nomeDe(l) { return l.nome || l.razao || ""; }
  function sit(l) { return l.situacao || "ativo"; }
  function agora() { var d = new Date(); function p(n) { return (n < 10 ? "0" : "") + n; } return p(d.getDate()) + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear() + " " + p(d.getHours()) + ":" + p(d.getMinutes()); }
  function cpfOk(v) { v = String(v).replace(/\D/g, ""); if (v.length !== 11 || /^(\d)\1+$/.test(v)) return false; for (var n = 9; n < 11; n++) { var s = 0; for (var i = 0; i < n; i++) s += +v[i] * (n + 1 - i); if ((s * 10 % 11) % 10 !== +v[n]) return false; } return true; }
  function cnpjOk(v) { v = String(v).replace(/\D/g, ""); if (v.length !== 14 || /^(\d)\1+$/.test(v)) return false; for (var n = 12; n < 14; n++) { var w = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2], s = 0; for (var i = 0; i < n; i++) s += +v[i] * w[i]; var r = s % 11; if ((r < 2 ? 0 : 11 - r) !== +v[n]) return false; } return true; }
  function fmt(c, v) { v = String(v == null ? "" : v); if (c.cnpj && v.length === 14) return v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5"); if (c.cpf && v.length === 11) return v.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4"); if (c.tipo === "data" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v.split("-").reverse().join("/"); return v; }
  function campo(it, k) { for (var i = 0; i < it.campos.length; i++) if (it.campos[i].k === k) return it.campos[i]; return {}; }
  function pill(l) { var s = sit(l); return s === "ativo" ? '<span class="pill ok">Ativo</span>' : s === "inativo" ? '<span class="pill warn">Inativo</span>' : '<span class="pill bad">Excluído</span>'; }

  /* ---------- ícones (traço simples, sem biblioteca externa) ---------- */
  var ICO = {
    inicio: '<path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/>',
    acesso: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    org: '<path d="M4 21V5l8-2v18M12 8h8v13M8 9h1M8 13h1M8 17h1M16 12h1M16 16h1M3 21h18"/>',
    fisica: '<path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6M9 11h6"/>',
    corp: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3M3 13h18"/>',
    farma: '<path d="M10.5 20.5a5 5 0 0 1-7-7l9-9a5 5 0 0 1 7 7z"/><path d="M8.5 8.5l7 7"/>',
    tabelas: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>',
    notif: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>',
    config: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2L10 21h4l.6-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/>',
    producao: '<path d="M3 20V9l6 4V9l6 4V6h3v14zM7 20v-3M12 20v-3M17 20v-3"/>',
    estoque: '<path d="M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8"/>',
    cq: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M8 15h8"/>',
    gq: '<circle cx="12" cy="9" r="6"/><path d="M9 9l2 2 3-3M8.5 14L7 21l5-3 5 3-1.5-7"/>',
    docs: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6"/>',
    rastro: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="12" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8.5 7l7 4M8.5 17l7-4"/>',
    comercial: '<path d="M3 4h2l2.4 11h10.2L20 7H6M9 20h.01M17 20h.01"/>',
    patrimonio: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 7h6M9 11h6M9 15h3"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    busca: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    tema: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    seta: '<path d="M6 9l6 6 6-6"/>'
  };
  function svg(nome, cls) { return '<svg class="' + (cls || "p-ico") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICO[nome] + "</svg>"; }
  var ICONE_GRUPO = { acesso: "acesso", org: "org", fisica: "fisica", corp: "corp" };
  var MARCO2 = [["Cadastros Farmacêuticos", "farma"], ["Tabelas Compartilhadas", "tabelas"], ["Central de Notificações", "notif"], ["Configuração da Plataforma", "config"]];
  /* Cada cartão é um módulo. O módulo em que a pessoa está NÃO aparece nos cartões; os outros, sim. */
  var MODULO_ATUAL = "principal";
  var MODULOS = [
    ["Principal", "Acessos, estrutura da empresa e física, cadastros corporativos.", "acesso", "principal"],
    ["Produção", "Planejamento, ordens de produção e execução industrial.", "producao", "producao"],
    ["Estoque", "Recebimento, armazenamento, movimentações e inventário.", "estoque", "estoque"],
    ["Controle da Qualidade", "Ensaios, resultados, especificações e laudos.", "cq", "cq"],
    ["Garantia da Qualidade", "Desvios, mudanças, auditorias e qualificação de fornecedores.", "gq", "gq"],
    ["Controle de Documentos", "Documentos eletrônicos, revisões e registros regulatórios.", "docs", "docs"],
    ["Rastreabilidade", "Rastreabilidade completa de lotes e genealogia.", "rastro", "rastro"],
    ["Comercial", "Pedidos, cotações, faturamento e contratos.", "comercial", "comercial"],
    ["Patrimônio", "Gestão de ativos, manutenções e calibrações.", "patrimonio", "patrimonio"],
    ["Construtor OPE", "Monta e configura as ordens de produção do cliente (a rever quando chegarmos nele).", "config", "ope"] ];
  var abertos = {};

  /* ---------- menu único (uma vez só, para todas as telas) ---------- */
  function menu(atual) {
    var h = '<a href="#inicio"' + (atual === "inicio" ? ' aria-current="page"' : "") + ' title="Início">' + svg("inicio") + '<span class="p-rot">Início</span></a>';
    G.forEach(function (g) {
      var tem = g.itens.some(function (i) { return i.id === atual; });
      var ab = tem || abertos[g.id];
      h += '<div class="p-grupo' + (ab ? " aberto" : "") + (tem ? " atual" : "") + '"><button type="button" class="p-grupo-btn" data-g="' + g.id + '" aria-expanded="' + !!ab + '" title="' + esc(g.nome) + '">' + svg(ICONE_GRUPO[g.id]) + '<span class="p-rot">' + esc(g.nome) + "</span>" + svg("seta", "p-seta") + '</button><div class="p-sub">';
      g.itens.forEach(function (i) { h += '<a href="#' + i.id + '"' + (atual === i.id ? ' aria-current="page"' : "") + ">" + '<span class="p-rot">' + esc(i.nome) + "</span>" + (i.externo ? '<span class="p-etq">pronta</span>' : "") + "</a>"; });
      h += "</div></div>";
    });
    MARCO2.forEach(function (m) { h += '<div class="p-grupo em-breve"><button type="button" class="p-grupo-btn" disabled title="' + m[0] + ' (Marco 2)">' + svg(m[1]) + '<span class="p-rot">' + m[0] + '</span><span class="p-etq">Marco 2</span></button></div>'; });
    $("#menu").innerHTML = h;
    Array.prototype.forEach.call(document.querySelectorAll("#menu .p-grupo-btn[data-g]"), function (b) {
      b.onclick = function () {
        var app = $("#app");
        if (app.classList.contains("recolhido") && window.innerWidth > 880) { app.classList.remove("recolhido"); sincHamb(); abertos[b.getAttribute("data-g")] = true; }
        else abertos[b.getAttribute("data-g")] = !b.parentNode.classList.contains("aberto");
        menu(atualId);
      };
    });
    atualId = atual;
  }
  var atualId = "inicio";

  /* ---------- páginas ---------- */
  function topo(titulo, sub) {
    return '<div class="p-topo"><h1>' + esc(titulo) + '</h1><p class="sub">' + sub + "</p></div>";
  }
  function inicio() {
    var h = '<section class="p-hero"><small>Bom dia, Carla</small><h1>Central de Governança</h1><p>O cérebro do iLabPharma: acessos, estrutura da empresa, cadastros corporativos e as regras de segurança, num só lugar. Empresa <strong>Lab Teste</strong>, dados <strong>fictícios</strong>.</p></section>';
    h += '<div class="p-sec-t"><h2>Módulos operacionais</h2><span class="sub-linha">Só a Governança está desenhada neste marco</span></div><div class="p-modulos">';
    MODULOS.filter(function (m) { return m[3] !== MODULO_ATUAL; }).forEach(function (m) {
      var pronto = m[3] === "principal";
      h += (pronto ? '<a class="p-mod" href="#profissionais">' : '<div class="p-mod em-breve">') + '<div class="p-mod-topo"><span class="p-mod-ico">' + svg(m[2]) + "</span><h3>" + esc(m[0]) + "</h3></div><p>" + esc(m[1]) + "</p>" + (pronto ? '<span class="p-entrar">Entrar no módulo →</span></a>' : '<span class="pill warn">Em breve</span></div>');
    });
    h += "</div>";
    h += '<div class="p-caixa"><h3>Como ler este protótipo (Marco 1A)</h3><ul><li>Os <strong>4 grupos</strong> já analisados, com as decisões de 06/11 aplicadas. Os outros 4 grupos do Principal ficam para o Marco 2 (aparecem apagados no menu).</li><li>Todo cadastro tem <strong>três situações</strong> (ativo, inativo, excluído). <strong>Nada é apagado.</strong> Excluir só vale para o que <strong>nunca foi usado</strong>.</li><li>Toda mudança pede <strong>motivo</strong> e entra no <strong>histórico</strong>. As recusas aparecem como <em>"O servidor recusou"</em>: no sistema real, quem recusa é o banco, nunca só a tela.</li><li>Em cada tela, a caixa <strong>"O que foi decidido"</strong> mostra o que mudou em relação ao legado. É o que você deve criticar.</li><li>Teste também: o <strong>hambúrguer</strong> recolhe o menu, <strong>Ctrl + K</strong> pesquisa, o <strong>sino</strong> mostra avisos e o <strong>avatar</strong> troca o papel ("Ver como").</li></ul></div>';
    $("#conteudo").innerHTML = h; menu("inicio"); ligaPapel();
  }

  function externa(it) {
    $("#conteudo").innerHTML = topo(it.nome, "Já está pronta em outra tela do protótipo.") + '<div class="p-caixa"><h3>' + esc(it.nome) + "</h3><p>" + esc(it.resumo) + '</p><p><a class="btn primary btn-link" href="' + it.externo + '">Abrir ' + esc(it.nome) + "</a></p></div>";
    menu(it.id); ligaPapel();
  }
  function ordemArvore(rows) {
    var out = [], filhos = {};
    rows.forEach(function (r) { (filhos[r.pai || ""] = filhos[r.pai || ""] || []).push(r); });
    (function vai(pai, nivel) { (filhos[pai] || []).forEach(function (r) { out.push({ r: r, nivel: nivel }); vai(r.nome, nivel + 1); }); })("", 0);
    rows.forEach(function (r) { if (!out.some(function (o) { return o.r === r; })) out.push({ r: r, nivel: 0 }); });
    return out;
  }
  function visivel(l) {
    var s = sit(l);
    if (estado.filtro === "vivos" && s === "excluido") return false;
    if (estado.filtro === "ativo" && s !== "ativo") return false;
    if (estado.filtro === "inativo" && s !== "inativo") return false;
    if (estado.filtro === "excluido" && s !== "excluido") return false;
    if (estado.busca) { var t = JSON.stringify(l).toLowerCase(); if (t.indexOf(estado.busca.toLowerCase()) < 0) return false; }
    return true;
  }
  function lista(it) {
    var h = topo(it.nome, esc(it.resumo));
    h += '<div class="p-caixa regra"><h3>O que foi decidido</h3><ul>' + it.decisoes.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("") + "</ul></div>";
    if (it.regra) h += '<div class="p-caixa regra"><h3>Regra do banco</h3><p style="margin:0;font-size:13.5px">' + esc(it.regra) + "</p></div>";
    h += '<div id="recusa" class="p-recusa" aria-live="polite"></div>';
    h += '<section class="sec"><div class="sec-head"><h2>' + esc(it.nome) + '</h2><button type="button" class="btn small primary" id="novo">Novo ' + esc(it.singular) + "</button></div>";
    h += '<div class="barra" role="search"><div class="field larga"><label for="busca">Buscar</label><input id="busca" class="input" type="search" autocomplete="off" value="' + esc(estado.busca) + '" placeholder="Digite parte do texto"></div>' +
      '<div class="field"><label for="filtro">Situação</label><select id="filtro" class="input">' +
      [["vivos", "Ativos e inativos"], ["ativo", "Só ativos"], ["inativo", "Só inativos"], ["excluido", "Só excluídos"], ["todos", "Todos"]].map(function (o) { return '<option value="' + o[0] + '"' + (estado.filtro === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></div></div>";
    h += '<p class="contagem" id="contagem" aria-live="polite"></p><div class="scroll-x"><table class="tab-adm"><thead><tr>' + it.colunas.map(function (c) { return '<th scope="col">' + esc(c[1]) + "</th>"; }).join("") + '<th scope="col">Situação</th><th scope="col">Ações</th></tr></thead><tbody id="corpo"></tbody></table></div><div class="vazio" id="vazio" hidden>Nada encontrado com esse filtro.</div></section><div id="detalhe"></div>';
    $("#conteudo").innerHTML = h; menu(it.id); ligaPapel();
    $("#novo").onclick = function () { abreForm(it, null); };
    $("#busca").oninput = function () { estado.busca = this.value; linhas(it); };
    $("#filtro").onchange = function () { estado.filtro = this.value; linhas(it); };
    linhas(it);
  }
  function linhas(it) {
    var rows = it.linhas.filter(visivel), seq = rows.map(function (r) { return { r: r, nivel: 0 }; });
    if (it.arvore) seq = ordemArvore(rows);
    $("#corpo").innerHTML = seq.map(function (o) {
      var l = o.r, s = sit(l), b = "";
      var tds = it.colunas.map(function (c, i) { var v = fmt(campo(it, c[0]), l[c[0]]); if (c[0] === "ctrl" || c[0] === "conta") v = l[c[0]] === "sim" ? "Sim" : "Não"; var pad = it.arvore && i === 0 ? ' style="padding-left:' + (10 + o.nivel * 22) + 'px"' : ""; return "<td" + (it.arvore && i === 0 ? ' class="arv"' : "") + pad + ">" + (it.arvore && i === 0 && o.nivel ? "└ " : "") + esc(v) + "</td>"; }).join("");
      if (s !== "excluido") b += '<button type="button" class="btn small" data-a="editar" data-id="' + l.id + '">Editar</button>';
      if (it.detalhe && l.sub) b += '<button type="button" class="btn small" data-a="abrir" data-id="' + l.id + '">Abrir</button>';
      if (s === "ativo") b += '<button type="button" class="btn small" data-a="inativar" data-id="' + l.id + '">Inativar</button>';
      if (s === "inativo") b += '<button type="button" class="btn small" data-a="reativar" data-id="' + l.id + '">Reativar</button>';
      if (s !== "excluido") b += '<button type="button" class="btn small" data-a="excluir" data-id="' + l.id + '">Excluir</button>'; else b += '<button type="button" class="btn small" data-a="restaurar" data-id="' + l.id + '">Restaurar</button>';
      if (it.id === "qualif" && s !== "excluido") b += '<button type="button" class="btn small" data-a="receber" data-id="' + l.id + '">Simular recebimento</button>';
      b += '<button type="button" class="btn small" data-a="hist" data-id="' + l.id + '">Histórico</button>';
      return "<tr>" + tds + "<td>" + pill(l) + (l.usos ? '<span class="sub-linha">em uso (' + l.usos + ")</span>" : '<span class="sub-linha">nunca usado</span>') + '</td><td><div class="acoes-linha">' + b + "</div></td></tr>";
    }).join("");
    $("#contagem").textContent = rows.length + " registro" + (rows.length === 1 ? "" : "s") + ".";
    $("#vazio").hidden = rows.length > 0;
    $$("#corpo [data-a]").forEach(function (bt) { bt.onclick = function () { acaoLinha(it, bt.getAttribute("data-a"), +bt.getAttribute("data-id")); }; });
  }
  function recusa(texto) { $("#recusa").innerHTML = texto ? '<div class="msg bad"><strong>O servidor recusou:</strong> ' + esc(texto) + "</div>" : ""; }
  function acaoLinha(it, a, id) {
    var l = it.linhas.filter(function (x) { return x.id === id; })[0]; recusa("");
    if (a === "editar") return abreForm(it, l);
    if (a === "hist") return historico(l);
    if (a === "abrir") return detalhe(it, l);
    if (a === "receber") {
      var ok = l.sit === "Qualificado" || l.sit === "Qualificado com restrição";
      var hoje = new Date(); var venc = l.valid && new Date(l.valid) < hoje;
      if (!ok) return recusa("recebimento de " + l.mat + " de " + l.forn + " recusado: a situação é \"" + l.sit + "\".");
      if (venc) return recusa("recebimento recusado: a qualificação de " + l.forn + " venceu em " + fmt({ tipo: "data" }, l.valid) + ".");
      return aviso("Recebimento aceito: " + l.forn + " está " + l.sit.toLowerCase() + ".");
    }
    var tit = { inativar: "Inativar", reativar: "Reativar", excluir: "Excluir", restaurar: "Restaurar" }[a];
    if (a === "excluir" && l.usos > 0) return recusa("\"" + nomeDe(l) + "\" já foi usado em " + l.usos + " lugar(es). Só pode ser inativado, para não perder o histórico de uso e de assinatura.");
    if (a === "restaurar" && estado.papel !== "admin") return recusa("restaurar um cadastro excluído exige uma função própria, que o seu perfil não tem.");
    acao = { it: it, l: l, a: a };
    $("#m-sit-t").textContent = tit + ": " + nomeDe(l);
    $("#m-sit-sub").textContent = { inativar: "O registro deixa de aparecer nas listas de escolha, mas continua no histórico.", reativar: "O registro volta às listas de escolha.", excluir: "Marca como excluído. Nada é apagado do banco e o histórico fica. Só é possível porque nunca foi usado.", restaurar: "Volta como inativo; reative em seguida se for o caso." }[a];
    $("#m-sit-msg").innerHTML = ""; $("#s-motivo").value = ""; abre("m-sit"); $("#s-motivo").focus();
  }
  $("#f-sit").addEventListener("submit", function (e) {
    e.preventDefault(); var m = $("#s-motivo").value.trim();
    if (m.length < MOTIVO_MIN) { $("#m-sit-msg").innerHTML = '<div class="msg bad">Informe o motivo (pelo menos ' + MOTIVO_MIN + " caracteres).</div>"; return; }
    var l = acao.l, antes = sit(l), novo = { inativar: "inativo", reativar: "ativo", excluir: "excluido", restaurar: "inativo" }[acao.a];
    l.situacao = novo; l.hist.unshift({ quando: agora(), quem: "Carla Mendes", acao: { inativar: "Inativado", reativar: "Reativado", excluir: "Excluído", restaurar: "Restaurado" }[acao.a], motivo: m, antes: "Situação: " + antes, depois: "Situação: " + novo });
    fecha("m-sit"); aviso("Feito. Registrado no histórico."); linhas(acao.it);
  });

  /* ---------- formulário ---------- */
  function opcoes(c) {
    if (c.opcoes) return c.opcoes;
    if (c.ref) { var r = item(c.ref); return r.linhas.filter(function (l) { return sit(l) !== "excluido"; }).map(function (l) { return [nomeDe(l), nomeDe(l)]; }); }
    return [];
  }
  function abreForm(it, l) {
    edit = { it: it, l: l };
    $("#m-form-t").textContent = (l ? "Editar " : "Novo ") + it.singular;
    $("#m-form-sub").textContent = l ? "Toda alteração pede o motivo e fica no histórico, com o antes e o depois." : "Campos com * são obrigatórios. O servidor confere de novo na gravação.";
    $("#m-form-msg").innerHTML = ""; $("#f-motivo-bloco").hidden = !l; $("#f-motivo").value = "";
    $("#f-campos").innerHTML = it.campos.map(function (c) {
      var v = l ? l[c.k] : "", id = "c-" + c.k, rot = '<label for="' + id + '">' + esc(c.t) + (c.obrig ? " *" : "") + "</label>", aj = c.ajuda ? '<span class="ajuda-campo">' + esc(c.ajuda) + "</span>" : "", ro = it.id === "pj" && c.k === "qual" ? " disabled" : "";
      if (c.tipo === "select") return '<div class="field">' + rot + '<select id="' + id + '" class="input"' + ro + '><option value="">' + esc(c.vazio || "Selecione") + "</option>" + opcoes(c).map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(v) === String(o[0]) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select>" + aj + "</div>";
      return '<div class="field">' + rot + '<input id="' + id + '" class="input" type="' + (c.tipo === "data" ? "date" : c.tipo === "numero" ? "number" : "text") + '" autocomplete="off" value="' + esc(v) + '"' + ro + ">" + aj + "</div>";
    }).join("");
    abre("m-form"); var p = $("#f-campos input,#f-campos select"); if (p) p.focus();
  }
  $("#f-form").addEventListener("submit", function (e) {
    e.preventDefault(); var it = edit.it, l = edit.l, vals = {}, erro = "";
    it.campos.forEach(function (c) {
      var el = $("#c-" + c.k), v = el.value.trim(); vals[c.k] = (c.cpf || c.cnpj) ? v.replace(/\D/g, "") : v;
      if (erro) return;
      if (c.obrig && !v) erro = "Preencha: " + c.t + ".";
      else if (c.cpf && v && !cpfOk(v)) erro = "CPF inválido. Confira os dígitos.";
      else if (c.cnpj && v && !cnpjOk(v)) erro = "CNPJ inválido. Confira os dígitos.";
      else if (c.tipo === "numero" && v !== "" && (+v < c.min || +v > c.max)) erro = c.t + " fora da faixa válida (" + c.min + " a " + c.max + ").";
      else if (c.unico && v) { var dup = it.linhas.filter(function (x) { return x !== l && sit(x) !== "excluido" && String(x[c.k]).toLowerCase() === vals[c.k].toLowerCase(); })[0]; if (dup) erro = c.t + " \"" + v + "\" já existe (" + nomeDe(dup) + "). O servidor não aceita repetido."; }
    });
    var motivo = $("#f-motivo").value.trim();
    if (!erro && l && motivo.length < MOTIVO_MIN) erro = "Informe o motivo da mudança (pelo menos " + MOTIVO_MIN + " caracteres).";
    if (erro) { $("#m-form-msg").innerHTML = '<div class="msg bad">' + esc(erro) + "</div>"; return; }
    if (l) {
      var dif = it.campos.filter(function (c) { return String(l[c.k] == null ? "" : l[c.k]) !== vals[c.k]; });
      if (!dif.length) { $("#m-form-msg").innerHTML = '<div class="msg bad">Nada mudou.</div>'; return; }
      l.hist.unshift({ quando: agora(), quem: "Carla Mendes", acao: "Alterado", motivo: motivo, antes: dif.map(function (c) { return c.t + ": " + (fmt(c, l[c.k]) || "(vazio)"); }).join("; "), depois: dif.map(function (c) { return c.t + ": " + (fmt(c, vals[c.k]) || "(vazio)"); }).join("; ") });
      dif.forEach(function (c) { l[c.k] = vals[c.k]; });
    } else {
      var n = { id: Date.now(), usos: 0, hist: [{ quando: agora(), quem: "Carla Mendes", acao: "Criado", motivo: "", antes: "", depois: "" }] };
      it.campos.forEach(function (c) { n[c.k] = vals[c.k]; }); it.linhas.push(n);
    }
    fecha("m-form"); aviso(l ? "Alteração gravada, com o motivo." : "Cadastro criado."); linhas(it);
  });

  /* ---------- histórico e detalhe ---------- */
  function historico(l) {
    $("#m-hist-t").textContent = "Histórico: " + nomeDe(l);
    $("#m-hist-corpo").innerHTML = l.hist.map(function (x) { return '<div class="hist-item"><strong>' + esc(x.acao) + "</strong> · " + esc(x.quem) + "<small>" + esc(x.quando) + "</small>" + (x.motivo ? "<div>Motivo: " + esc(x.motivo) + "</div>" : "") + (x.antes ? '<div class="ant">' + esc(x.antes) + '</div><div class="dep">' + esc(x.depois) + "</div>" : "") + "</div>"; }).join("");
    abre("m-hist");
  }
  function tabela(cab, rows) { return '<div class="scroll-x"><table class="tab-adm"><thead><tr>' + cab.map(function (c) { return '<th scope="col">' + esc(c) + "</th>"; }).join("") + "</tr></thead><tbody>" + rows.map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + esc(c) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>"; }
  function detalhe(it, l) {
    var abas = [["grupos", "Grupos com acesso"], ["locais", "Locais e parâmetros BPF"], ["enderecos", "Endereçamento"]];
    function pinta() {
      var s = l.sub, corpo = "";
      if (estado.aba === "grupos") corpo = '<p class="lead">Quem pode ver e movimentar este almoxarifado. O grupo só restringe o alcance; o que a pessoa pode fazer vem do perfil.</p><div class="chips">' + s.grupos.map(function (g) { return '<span class="chip">' + esc(g) + "</span>"; }).join("") + "</div>";
      if (estado.aba === "locais") corpo = '<p class="lead">Quarentena, refrigerado, umidade e refugo separam o material. Quem impede misturar material em quarentena com material liberado é o banco.</p>' + tabela(["Código", "Local de armazenagem", "Marcação", "Itens permitidos"], s.locais);
      if (estado.aba === "enderecos") corpo = '<p class="lead">Rua, coluna e andar, com medidas e peso máximo. O endereçamento grava tudo ou nada.</p>' + tabela(["Rua", "Coluna", "Andar", "Medidas (A × L × P)", "Peso máximo", "Situação"], s.enderecos);
      $("#detalhe").innerHTML = '<div class="p-detalhe"><h2>' + esc(l.nome) + '</h2><div class="abas" role="tablist">' + abas.map(function (a) { return '<button type="button" role="tab" aria-selected="' + (estado.aba === a[0]) + '" data-aba="' + a[0] + '">' + a[1] + "</button>"; }).join("") + "</div>" + corpo + '<p class="sub-linha">Neste protótipo as abas são só de consulta; a edição segue o mesmo padrão dos outros cadastros.</p></div>';
      $$("#detalhe [data-aba]").forEach(function (b) { b.onclick = function () { estado.aba = b.getAttribute("data-aba"); pinta(); }; });
    }
    pinta(); $("#detalhe").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- janelas e roteamento ---------- */
  function abre(id) { $("#" + id).hidden = false; }
  function fecha(id) { $("#" + id).hidden = true; }
  $$("[data-fechar]").forEach(function (b) { b.addEventListener("click", function () { fecha(b.getAttribute("data-fechar")); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") $$(".modal-fundo").forEach(function (m) { m.hidden = true; }); });
  function ligaPapel() { var s = $("#papel"); if (s) { s.value = estado.papel; s.onchange = function () { estado.papel = this.value; }; } }
  function rota() {
    var id = (location.hash || "#inicio").slice(1), it = item(id);
    estado.busca = ""; estado.filtro = "vivos"; estado.aba = "grupos";
    Array.prototype.forEach.call(document.querySelectorAll(".modal-fundo"), function (m) { m.hidden = true; });
    if (!it) inicio(); else if (it.externo) externa(it); else lista(it);
    $("#conteudo").focus(); window.scrollTo(0, 0);
  }
  /* ---------- casca: hambúrguer, busca (Ctrl+K), sino e avatar ---------- */
  function sincHamb() { var app = $("#app"); $("#hamburguer").setAttribute("aria-expanded", String(!app.classList.contains("recolhido"))); }
  $("#hamburguer").innerHTML = svg("menu", "");
  $("#b-tema").innerHTML = svg("tema", "");
  $("#b-sino").insertAdjacentHTML("afterbegin", svg("notif", ""));
  $(".p-busca-lupa", $("#abre-busca")).innerHTML = svg("busca", "");
  $(".p-busca-lupa", $("#busca-fundo")).innerHTML = svg("busca", "");
  $("#b-avatar .p-chevron").innerHTML = svg("seta", "");
  $("#hamburguer").onclick = function () {
    var app = $("#app");
    if (window.innerWidth <= 880) app.classList.toggle("gaveta"); else app.classList.toggle("recolhido");
    sincHamb();
  };
  $("#fundo-menu").onclick = function () { $("#app").classList.remove("gaveta"); };
  var AVISOS = [["Qualificação suspensa", "Química Aurora S.A. · Estearato de magnésio: recebimento bloqueado."], ["Qualificação a vencer", "Embalagens Vale Ltda · Frasco âmbar vence em 55 dias."], ["Cadastro sem uso", "Setor Expedição e Centro de custo TCC09 nunca foram usados."]];
  $("#lista-sino").innerHTML = AVISOS.map(function (a) { return "<li><strong>" + esc(a[0]) + "</strong><small>" + esc(a[1]) + "</small></li>"; }).join("");
  function pop(btnId, popId) {
    var b = $("#" + btnId), p = $("#" + popId);
    b.onclick = function (e) { e.stopPropagation(); var abrir = p.hidden; fechaPops(); p.hidden = !abrir; b.setAttribute("aria-expanded", String(abrir)); };
  }
  function fechaPops() { ["pop-sino", "pop-avatar"].forEach(function (id) { $("#" + id).hidden = true; }); $("#b-sino").setAttribute("aria-expanded", "false"); $("#b-avatar").setAttribute("aria-expanded", "false"); }
  pop("b-sino", "pop-sino"); pop("b-avatar", "pop-avatar");
  document.addEventListener("click", function (e) { if (!e.target.closest(".p-menu-pop")) fechaPops(); });
  var bsel = 0, bres = [];
  function buscaItens() {
    var r = [["Início", "Visão geral", "#inicio"]];
    G.forEach(function (g) { g.itens.forEach(function (i) { r.push([i.nome, g.nome, "#" + i.id]); if (!i.externo) r.push(["Novo " + i.singular, i.nome, "#" + i.id + "|novo"]); }); });
    return r;
  }
  function pintaBusca() {
    var q = $("#busca-global").value.trim().toLowerCase();
    bres = buscaItens().filter(function (x) { return !q || (x[0] + " " + x[1]).toLowerCase().indexOf(q) >= 0; }).slice(0, 12);
    bsel = Math.min(bsel, Math.max(bres.length - 1, 0));
    $("#busca-lista").innerHTML = bres.length ? bres.map(function (x, i) { return '<li role="option" aria-selected="' + (i === bsel) + '" data-i="' + i + '"><span>' + esc(x[0]) + "</span><small>" + esc(x[1]) + "</small></li>"; }).join("") : '<li class="p-busca-vazio">Nada encontrado.</li>';
    Array.prototype.forEach.call(document.querySelectorAll("#busca-lista [data-i]"), function (li) { li.onclick = function () { vaiBusca(+li.getAttribute("data-i")); }; });
  }
  function abreBusca() { $("#busca-fundo").hidden = false; $("#busca-global").value = ""; bsel = 0; pintaBusca(); $("#busca-global").focus(); }
  function fechaBusca() { $("#busca-fundo").hidden = true; }
  function vaiBusca(i) {
    var x = bres[i]; if (!x) return; fechaBusca();
    var partes = x[2].split("|"), igual = location.hash === partes[0];
    location.hash = partes[0];
    var abrirNovo = function () { var n = $("#novo"); if (n) n.click(); };
    if (partes[1]) { if (igual) abrirNovo(); else setTimeout(abrirNovo, 60); }
  }
  $("#abre-busca").onclick = abreBusca;
  $("#busca-global").oninput = function () { bsel = 0; pintaBusca(); };
  $("#busca-global").onkeydown = function (e) {
    if (e.key === "ArrowDown") { bsel = Math.min(bsel + 1, bres.length - 1); pintaBusca(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { bsel = Math.max(bsel - 1, 0); pintaBusca(); e.preventDefault(); }
    else if (e.key === "Enter") { vaiBusca(bsel); e.preventDefault(); }
  };
  $("#busca-fundo").onclick = function (e) { if (e.target === this) fechaBusca(); };
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); abreBusca(); }
    else if (e.key === "Escape") { fechaBusca(); fechaPops(); }
  });
  window.addEventListener("hashchange", function () { $("#app").classList.remove("gaveta"); });
  window.addEventListener("hashchange", rota); rota();
})();
