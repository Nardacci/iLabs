(function () {
  var $ = window.proto.$, $$ = window.proto.$$;
  var q = new URLSearchParams(location.search);
  var primeiro = q.get("primeiro") === "1";

  /* ---------- Alterar senha ---------- */
  var validar = window.proto.senha.iniciar({
    nova: "#nova", conf: "#conf", lista: "#politica", forca: "#forca", forcaTxt: "#forca-txt",
    botao: "#enviar-senha", email: "#s-email", gatilhos: [], extra: function () { return $("#atual").value.length > 0; }
  });
  $("#atual").addEventListener("input", validar);
  function msg(id, tipo, texto) { $(id).innerHTML = texto ? '<div class="msg ' + tipo + '">' + texto + "</div>" : ""; }
  $("#form-senha").addEventListener("submit", function (e) {
    e.preventDefault();
    if ($("#enviar-senha").disabled) return;
    if ($("#atual").value === "errada") { msg("#s-msg", "bad", "A senha atual não confere."); $("#atual").focus(); return; }
    msg("#s-msg", "ok", "Senha alterada. As suas outras sessões foram encerradas.");
    ["#atual", "#nova", "#conf"].forEach(function (s) { $(s).value = ""; });
    validar();
    $$("[data-sess]").forEach(function (li) { li.remove(); });
  });

  /* ---------- Duas etapas ---------- */
  var feito = false;
  function mostrar(id) { $$("#f-passos > li").forEach(function (li) { li.hidden = li.id !== id; }); var l = $("#" + id); if (l) l.scrollIntoView({ block: "nearest" }); }
  function abrir() { $("#f-inicio").hidden = true; $("#f-passos").hidden = false; mostrar("f1"); }
  $("#comecar-2fa").addEventListener("click", abrir);
  $$("[data-prox]").forEach(function (b) { b.addEventListener("click", function () { mostrar(b.getAttribute("data-prox")); if (b.getAttribute("data-prox") === "f3") $("#f-codigo").focus(); }); });
  $("#form-2fa").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!/^\d{6}$/.test($("#f-codigo").value.trim())) { msg("#f-msg", "bad", "O código tem 6 dígitos. Confira o aplicativo e tente de novo."); $("#f-codigo").focus(); return; }
    msg("#f-msg", "", ""); mostrar("f4");
  });
  $("#guardei").addEventListener("change", function () { $("#concluir-2fa").disabled = !this.checked; });
  $("#concluir-2fa").addEventListener("click", function () {
    feito = true;
    $("#f-passos").hidden = true; $("#f-inicio").hidden = true;
    var p = $("#pill-2fa"); p.className = "pill ok"; p.textContent = "Ativa";
    window.proto.aviso("Verificação em duas etapas ativada.");
    $("#banner-obrig").hidden = true;
    if (primeiro) $("#f-continuar").hidden = false;
  });
  if (primeiro) { $("#banner-obrig").hidden = false; abrir(); }

  /* ---------- Sessões ---------- */
  $$("[data-encerrar]").forEach(function (b) {
    b.addEventListener("click", function () { b.closest("li").remove(); window.proto.aviso("Sessão encerrada."); });
  });
  $("#encerrar-outras").addEventListener("click", function () { $$("[data-sess]").forEach(function (li) { li.remove(); }); window.proto.aviso("As outras sessões foram encerradas."); });

  /* ---------- Aviso de inatividade (10 minutos; aviso 1 minuto antes) ---------- */
  var t = null, s = 60;
  function fechar() { clearInterval(t); $("#modal-inativ").hidden = true; }
  $("#simular-inativ").addEventListener("click", function () {
    s = 60; $("#m-seg").textContent = String(s); $("#modal-inativ").hidden = false; $("#m-continuar").focus();
    clearInterval(t);
    t = setInterval(function () { s -= 1; $("#m-seg").textContent = String(s); if (s <= 0) { fechar(); location.href = "entrar.html"; } }, 1000);
  });
  $("#m-continuar").addEventListener("click", function () { fechar(); window.proto.aviso("Sessão mantida."); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("#modal-inativ").hidden) { fechar(); } });
})();
