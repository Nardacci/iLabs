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

  /* ---------- menu único (uma vez só, para todas as telas) ---------- */
  function menu(atual) {
    var h = '<a href="#inicio"' + (atual === "inicio" ? ' aria-current="page"' : "") + ">Visão geral</a>";
    G.forEach(function (g) {
      h += "<h2>" + esc(g.nome) + "</h2>";
      g.itens.forEach(function (i) { h += '<a href="#' + i.id + '"' + (atual === i.id ? ' aria-current="page"' : "") + ">" + esc(i.nome) + (i.externo ? '<span class="ext">já pronta ↗</span>' : "") + "</a>"; });
    });
    $("#menu").innerHTML = h;
  }

  /* ---------- páginas ---------- */
  function topo(titulo, sub) {
    return '<div class="p-topo" style="justify-content:space-between"><div><h1>' + esc(titulo) + '</h1><p class="sub">' + sub + '</p></div>' +
      '<div class="field"><label for="papel">Ver como</label><select id="papel" class="input"><option value="admin"' + (estado.papel === "admin" ? " selected" : "") + '>Administrador</option><option value="analista"' + (estado.papel === "analista" ? " selected" : "") + ">Analista (sem função de restaurar)</option></select></div></div>";
  }
  function inicio() {
    var h = topo("Principal: cadastros globais", "Empresa <strong>Lab Teste</strong> · você é <strong>Carla Mendes</strong>. Dados <strong>fictícios</strong>; tudo vale só nesta página. Recarregue para voltar ao começo.");
    h += '<div class="p-caixa"><h3>Como ler este protótipo (Marco 1A)</h3><ul><li>Os <strong>4 grupos</strong> já analisados, com as decisões de 06/11 aplicadas. Os outros 4 grupos do Principal ficam para o Marco 2.</li><li>Todo cadastro tem <strong>três situações</strong> (ativo, inativo, excluído). <strong>Nada é apagado.</strong> Excluir só vale para o que <strong>nunca foi usado</strong>.</li><li>Toda mudança pede <strong>motivo</strong> e entra no <strong>histórico</strong>. As recusas aparecem como <em>"O servidor recusou"</em>: no sistema real, quem recusa é o banco, nunca só a tela.</li><li>Em cada tela, a caixa <strong>"O que foi decidido"</strong> mostra o que mudou em relação ao legado. É o que você deve criticar.</li></ul></div>';
    h += '<div class="p-cards">';
    G.forEach(function (g) { h += '<div class="card"><h3>' + esc(g.nome) + "</h3><ul>" + g.itens.map(function (i) { return '<li><a href="#' + i.id + '">' + esc(i.nome) + "</a></li>"; }).join("") + "</ul></div>"; });
    h += "</div>";
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
  function ligaPapel() { var s = $("#papel"); if (s) s.onchange = function () { estado.papel = this.value; }; }
  function rota() {
    var id = (location.hash || "#inicio").slice(1), it = item(id);
    estado.busca = ""; estado.filtro = "vivos"; estado.aba = "grupos";
    Array.prototype.forEach.call(document.querySelectorAll(".modal-fundo"), function (m) { m.hidden = true; });
    if (!it) inicio(); else if (it.externo) externa(it); else lista(it);
    $("#conteudo").focus(); window.scrollTo(0, 0);
  }
  var bm = document.getElementById("menu-botao");
  bm.addEventListener("click", function () { var w = bm.parentNode, ab = w.classList.toggle("aberto"); bm.setAttribute("aria-expanded", ab); });
  window.addEventListener("hashchange", function () { bm.parentNode.classList.remove("aberto"); bm.setAttribute("aria-expanded", "false"); });
  window.addEventListener("hashchange", rota); rota();
})();
