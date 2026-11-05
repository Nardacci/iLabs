(function () {
  var $ = window.proto.$, $$ = window.proto.$$, A = window.adm, esc = A.esc;
  var ROT = { entrada: "Entrada", falha: "Falha de entrada", falha_2fa: "Falha no código de duas etapas", bloqueio: "Bloqueio", desbloqueio: "Desbloqueio", saida: "Saída",
    sessao_encerrada: "Sessão encerrada", troca_senha: "Troca de senha", redefinicao_senha: "Redefinição de senha", convite_aceito: "Convite aceito", assinatura: "Assinatura eletrônica", falha_assinatura: "Falha na assinatura" };
  var ACAO = { I: "Inclusão", A: "Alteração", E: "Exclusão" };
  var PILL = { sucesso: "ok", falha: "bad", bloqueado: "warn" };

  function nome(id) { var p = A.pessoa(id); return p ? p.nome : "—"; }
  var opcoes = '<option value="">Todas as pessoas</option>' + A.pessoas.map(function (p) { return '<option value="' + p.id + '">' + esc(p.nome) + "</option>"; }).join("");
  $("#a-pessoa").innerHTML = opcoes; $("#u-pessoa").innerHTML = opcoes;

  /* ---------- Abas (setas, Home e End) ---------- */
  var abas = $$('[role="tab"]');
  function abrir(aba) {
    abas.forEach(function (b) {
      var on = b === aba; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1;
      document.getElementById(b.getAttribute("aria-controls")).hidden = !on;
    });
  }
  abas.forEach(function (b, i) {
    b.addEventListener("click", function () { abrir(b); });
    b.addEventListener("keydown", function (e) {
      var d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (d) { var n = abas[(i + d + abas.length) % abas.length]; abrir(n); n.focus(); e.preventDefault(); }
      if (e.key === "Home") { abrir(abas[0]); abas[0].focus(); e.preventDefault(); }
      if (e.key === "End") { abrir(abas[abas.length - 1]); abas[abas.length - 1].focus(); e.preventDefault(); }
    });
  });

  /* ---------- Acessos ---------- */
  function acessos() {
    var p = $("#a-pessoa").value, de = $("#a-de").value, ate = $("#a-ate").value, r = $("#a-res").value;
    var l = A.acessos.filter(function (x) {
      if (p && x.u !== p) return false;
      if (de && x.data < de) return false;
      if (ate && x.data > ate) return false;
      if (r && x.res !== r) return false;
      return true;
    });
    $("#a-corpo").innerHTML = l.map(function (x) {
      return "<tr><td>" + esc(x.quando) + "</td><td>" + (x.email ? "<strong>" + esc(x.email) + "</strong><small>e-mail digitado, sem conta</small>" : "<strong>" + esc(nome(x.u)) + "</strong><small>" + esc(A.pessoa(x.u).email) + "</small>") +
        "</td><td>" + esc(ROT[x.evento]) + '</td><td><span class="pill ' + PILL[x.res] + '">' + esc(x.res.charAt(0).toUpperCase() + x.res.slice(1)) + "</span></td><td>" + esc(x.ip) + "<small>" + esc(x.nav) + "</small></td><td>" + esc(x.det || "—") + "</td></tr>";
    }).join("");
    $("#a-vazio").hidden = l.length > 0;
    $("#a-contagem").textContent = l.length + " de " + A.acessos.length + " registros";
  }
  /* ---------- Auditoria ---------- */
  function auditoria() {
    var p = $("#u-pessoa").value, de = $("#u-de").value, ate = $("#u-ate").value, ac = $("#u-acao").value, t = A.norm($("#u-texto").value);
    function iso(q) { var m = q[0].match(/^(\d\d)\/(\d\d)\/(\d{4})/); return m[3] + "-" + m[2] + "-" + m[1]; }
    var l = A.auditoria.filter(function (x) {
      if (p && x[1] !== p) return false;
      if (de && iso(x) < de) return false;
      if (ate && iso(x) > ate) return false;
      if (ac && x[4] !== ac) return false;
      if (t && A.norm(x.join(" ")).indexOf(t) < 0) return false;
      return true;
    });
    $("#u-corpo").innerHTML = l.map(function (x) {
      return "<tr><td>" + esc(x[0]) + "</td><td>" + esc(nome(x[1])) + "</td><td><strong>" + esc(x[2]) + "</strong><small>" + esc(x[3]) + " · " + ACAO[x[4]] + '</small></td><td><span class="ant valor-inteiro">' + esc(x[5] || "—") +
        '</span><span class="dep valor-inteiro">' + esc(x[6] || "—") + "</span></td><td>" + esc(x[7] || "—") + "</td></tr>";
    }).join("");
    $("#u-vazio").hidden = l.length > 0;
    $("#u-contagem").textContent = l.length + " de " + A.auditoria.length + " registros";
  }
  ["#a-pessoa", "#a-de", "#a-ate", "#a-res"].forEach(function (s) { $(s).addEventListener("input", acessos); });
  ["#u-pessoa", "#u-de", "#u-ate", "#u-acao", "#u-texto"].forEach(function (s) { $(s).addEventListener("input", auditoria); });
  $("#a-limpar").addEventListener("click", function () { ["#a-pessoa", "#a-de", "#a-ate", "#a-res"].forEach(function (s) { $(s).value = ""; }); acessos(); });
  $("#u-limpar").addEventListener("click", function () { ["#u-pessoa", "#u-de", "#u-ate", "#u-acao", "#u-texto"].forEach(function (s) { $(s).value = ""; }); auditoria(); });
  $$("[data-imprimir]").forEach(function (b) { b.addEventListener("click", function () { window.proto.aviso("No sistema de verdade, a impressão sai com data, hora e quem imprimiu."); }); });
  acessos(); auditoria();
})();
