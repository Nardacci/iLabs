(function () {
  var $ = window.proto.$, $$ = window.proto.$$, A = window.adm, esc = A.esc;
  var sel = "p9", rascunho = null, historicos = {};
  historicos.p7 = [{ quando: "04/11/2026 16:20:00", quem: "Carla Mendes", motivo: "Analista passa a registrar a verificação", linhas: ["Materiais, Incluir: não → sim"] }];

  function copia(m) { return JSON.parse(JSON.stringify(m)); }
  function atual() { return A.perfil(sel); }
  function msg(id, texto, tipo) { $(id).innerHTML = texto ? '<div class="msg ' + (tipo || "bad") + '">' + esc(texto) + "</div>" : ""; }
  function ehAssin(k) { return k.indexOf("assinatura.") === 0 && k !== "assinatura.consulta"; }
  function aplica(k, a) {
    if (ehAssin(k)) return a === "incluir";
    if (k === "assinatura.consulta") return a === "consultar";
    return true;
  }
  function quem(p) { return A.pessoas.filter(function (x) { return x.perfis.indexOf(p.id) >= 0; }); }

  /* ---------- Lista (sem limite, com busca) ---------- */
  function lista() {
    var t = A.norm($("#busca").value), inat = $("#ver-inativos").checked;
    var itens = A.perfis.filter(function (p) { return (p.ativo || inat) && (!t || A.norm(p.nome + " " + p.desc).indexOf(t) >= 0); });
    $("#lista").innerHTML = itens.map(function (p) {
      var n = quem(p).length;
      return '<li><button type="button" data-id="' + p.id + '"' + (p.id === sel ? ' aria-current="true"' : "") + "><strong>" + esc(p.nome) + (p.ativo ? "" : " (inativo)") + "</strong><span>" +
        n + (n === 1 ? " pessoa" : " pessoas") + "</span></button></li>";
    }).join("") || '<li class="vazio">Nenhum perfil encontrado.</li>';
    var ativos = A.perfis.filter(function (p) { return p.ativo; }).length;
    $("#contagem").textContent = itens.length + " de " + A.perfis.length + " perfis (" + ativos + " ativos). A lista não tem limite.";
  }
  $("#lista").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-id]"); if (!b) return;
    if (pendentes().length) { msg("#d-msg", "Há mudanças não salvas neste perfil. Salve com o motivo ou descarte antes de abrir outro perfil.", "warn"); $("#motivo").focus(); return; }
    sel = b.getAttribute("data-id"); detalhe();
  });
  $("#busca").addEventListener("input", lista);
  $("#ver-inativos").addEventListener("change", lista);

  /* ---------- Detalhe e matriz ---------- */
  function detalhe() {
    var p = atual(); rascunho = copia(p.m);
    $("#h-detalhe").textContent = p.nome;
    $("#d-situacao").innerHTML = p.ativo ? '<span class="pill ok">Ativo</span>' : '<span class="pill bad">Inativo</span>';
    $("#d-desc").textContent = p.desc;
    var q = quem(p);
    $("#d-quem").innerHTML = q.length ? q.map(function (x) { return '<span class="chip' + (x.ativo ? "" : " inativo") + '">' + esc(x.nome) + (x.ativo ? "" : " (inativa)") + "</span>"; }).join("") : '<span class="ajuda-campo">Ninguém tem este perfil ainda.</span>';
    $("#inativar").textContent = p.ativo ? "Inativar perfil" : "Reativar perfil";
    $("#motivo").value = ""; msg("#d-msg", "");
    matriz(); lista(); historico(); resumo();
  }
  function matriz() {
    var h = "<thead><tr><th scope=\"col\">Função</th>" + A.ACOES.map(function (a) { return '<th scope="col">' + a[1] + "</th>"; }).join("") + "</tr></thead><tbody>", g = "";
    A.FUNCOES.forEach(function (f) {
      if (f.g !== g) { g = f.g; h += '<tr class="grupo-linha"><td colspan="7">' + esc(g) + "</td></tr>"; }
      h += '<tr><td scope="row">' + esc(f.n) + "</td>";
      A.ACOES.forEach(function (a) {
        if (!aplica(f.k, a[0])) { h += '<td class="nao-se-aplica" aria-hidden="true">—</td>'; return; }
        var nome = ehAssin(f.k) ? "Assinar (" + f.n + ")" : a[1] + " em " + f.n;
        h += '<td data-k="' + f.k + '" data-a="' + a[0] + '"><input type="checkbox" data-k="' + f.k + '" data-a="' + a[0] + '" aria-label="' + esc(nome) + '"' + (rascunho[f.k][a[0]] ? " checked" : "") + "></td>";
      });
      h += "</tr>";
    });
    $("#matriz").innerHTML = h + "</tbody>";
  }
  $("#matriz").addEventListener("change", function (e) {
    var i = e.target; if (i.type !== "checkbox") return;
    rascunho[i.getAttribute("data-k")][i.getAttribute("data-a")] = i.checked;
    var td = i.closest("td"), mudou = rascunho[i.getAttribute("data-k")][i.getAttribute("data-a")] !== atual().m[i.getAttribute("data-k")][i.getAttribute("data-a")];
    td.classList.toggle("mudou", mudou);
    resumo();
  });
  function nomeFuncao(k) { return A.FUNCOES.filter(function (f) { return f.k === k; })[0].n; }
  function rotuloAcao(a) { return A.ACOES.filter(function (x) { return x[0] === a; })[0][1]; }
  function pendentes() {
    var p = atual(), l = [];
    A.FUNCOES.forEach(function (f) { A.ACOES.forEach(function (a) {
      if (aplica(f.k, a[0]) && rascunho[f.k][a[0]] !== p.m[f.k][a[0]]) l.push(nomeFuncao(f.k) + ", " + rotuloAcao(a[0]) + ": " + (p.m[f.k][a[0]] ? "sim" : "não") + " → " + (rascunho[f.k][a[0]] ? "sim" : "não"));
    }); });
    return l;
  }
  function resumo() {
    var l = pendentes();
    $("#pendencias").textContent = l.length ? l.length + (l.length === 1 ? " mudança" : " mudanças") + " ainda não salva" + (l.length === 1 ? "" : "s") + "." : "Nenhuma mudança pendente.";
    var aprova = A.APROVA.some(function (s) { return rascunho["assinatura." + s].incluir; });
    var adm = rascunho["acesso.usuarios"].alterar || rascunho["acesso.perfis"].alterar;
    var html = '<div class="msg ok" style="margin-bottom:8px">Mesmo que o perfil permita aprovar, <strong>quem elaborou o registro não o aprova</strong>: o banco recusa.</div>';
    if (aprova && adm) html = '<div class="msg warn" style="margin-bottom:8px"><strong>Atenção:</strong> este perfil administra acessos e também aprova. A regra proposta é que o administrador do sistema <strong>não aprove nada na Qualidade</strong> (a validar com a Qualidade).</div>' + html;
    $("#d-regras").innerHTML = html;
  }
  $("#descartar").addEventListener("click", function () { detalhe(); window.proto.aviso("Mudanças descartadas."); });
  $("#f-salvar").addEventListener("submit", function (e) {
    e.preventDefault();
    var l = pendentes();
    if (!l.length) { msg("#d-msg", "Não há mudança para salvar."); return; }
    if ($("#motivo").value.trim().length < 5) { msg("#d-msg", "Informe o motivo da mudança (pelo menos 5 caracteres)."); $("#motivo").focus(); return; }
    var p = atual();
    (historicos[p.id] = historicos[p.id] || []).unshift({ quando: A.agora(), quem: "Carla Mendes", motivo: $("#motivo").value.trim(), linhas: l });
    p.m = copia(rascunho); detalhe();
    window.proto.aviso("Permissões salvas. Antes, depois e motivo ficaram na auditoria.");
  });
  function historico() {
    var h = historicos[sel] || [];
    $("#historico").innerHTML = h.length ? h.map(function (x) {
      return "<li><time>" + esc(x.quando) + " · " + esc(x.quem) + "</time>" + x.linhas.map(function (t) { return "<div>" + esc(t) + "</div>"; }).join("") + "<div>Motivo: " + esc(x.motivo) + "</div></li>";
    }).join("") : '<li class="ajuda-campo" style="border:0">Sem mudanças neste perfil desde a criação.</li>';
  }

  /* ---------- Novo perfil, inativar e reativar ---------- */
  $("#abrir-novo").addEventListener("click", function () { $("#n-nome").value = ""; $("#n-desc").value = ""; msg("#n-msg", ""); A.abrir("m-novo", "#n-nome"); });
  $("#f-novo").addEventListener("submit", function (e) {
    e.preventDefault();
    var nome = $("#n-nome").value.trim();
    if (!nome) { msg("#n-msg", "Informe o nome do perfil."); return; }
    if (A.perfis.some(function (p) { return A.norm(p.nome) === A.norm(nome); })) { msg("#n-msg", "Já existe um perfil com esse nome nesta empresa."); return; }
    var m = {}; A.FUNCOES.forEach(function (f) { m[f.k] = { consultar: false, incluir: false, alterar: false, excluir: false, imprimir: false, historico: false }; });
    var novo = { id: "p" + (100 + A.perfis.length), nome: nome, desc: $("#n-desc").value.trim() || "Sem descrição.", ativo: true, m: m };
    A.perfis.push(novo); sel = novo.id; A.fechar("m-novo"); detalhe(); window.proto.aviso("Perfil criado, sem permissões. Marque o que ele pode fazer.");
  });
  $("#inativar").addEventListener("click", function () {
    var p = atual(), n = quem(p).filter(function (x) { return x.ativo; }).length;
    $("#m-sit-t").textContent = (p.ativo ? "Inativar " : "Reativar ") + p.nome;
    $("#sit-texto").textContent = p.ativo ? "O perfil não é apagado. " + (n ? n + " pessoa(s) perdem as permissões dele até receberem outro perfil, mas o vínculo continua gravado e visível." : "Ninguém usa este perfil agora.") : "O perfil volta a valer para quem já o tinha.";
    $("#sit-motivo").value = ""; msg("#sit-msg", ""); A.abrir("m-sit", "#sit-motivo");
  });
  $("#f-sit").addEventListener("submit", function (e) {
    e.preventDefault();
    if ($("#sit-motivo").value.trim().length < 5) { msg("#sit-msg", "Informe o motivo (pelo menos 5 caracteres)."); return; }
    var p = atual(); p.ativo = !p.ativo; A.fechar("m-sit"); detalhe();
    window.proto.aviso("Perfil " + (p.ativo ? "reativado" : "inativado") + ".");
  });
  document.addEventListener("click", function (e) { var f = e.target.closest("[data-fechar]"); if (f) A.fechar(f.getAttribute("data-fechar")); });

  var inicial = A.perfis.filter(function (p) { return p.nome === "Analista do CQ"; })[0];
  sel = inicial.id; detalhe();
})();
