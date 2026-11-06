(function () {
  var $ = window.proto.$;
  window.proto.senha.iniciar({
    nova: "#nova", conf: "#conf", lista: "#politica", forca: "#forca", forcaTxt: "#forca-txt",
    botao: "#enviar", email: "#email", gatilhos: ["#termos"],
    extra: function () { return $("#termos").checked && $("#nome").value.trim().length > 2 && $("#email").value.indexOf("@") > 0; }
  });
  ["#nome", "#email"].forEach(function (s) { $(s).addEventListener("input", function () { $("#nova").dispatchEvent(new Event("input")); }); });
  $("#form-cadastro").addEventListener("submit", function (e) {
    e.preventDefault();
    if ($("#enviar").disabled) return;
    /* Mesma resposta exista ou não uma conta com este e-mail (não revela quem já é cliente). */
    $("#cd-email-show").textContent = $("#email").value.trim();
    $("#cd-form").hidden = true; $("#cd-confirma").hidden = false;
  });
  /* A etapa seguinte só abre depois de "clicar no link do e-mail" (simulado). Sem a confirmação, não segue. */
  var CONF = "ilabs-proto-email-confirmado";
  if (/confirme=1/.test(window.location.search)) window.proto.aviso("Primeiro crie a conta e confirme o e-mail. Depois você cadastra a empresa.");
  $("#abrir-link-email").addEventListener("click", function () {
    try { sessionStorage.setItem(CONF, $("#email").value.trim()); } catch (e) {}
    $("#seguir-empresa").disabled = false;
    $("#aguardando").textContent = "E-mail confirmado. Pode continuar.";
    window.proto.aviso("E-mail confirmado.");
  });
  $("#seguir-empresa").addEventListener("click", function () { if (!$("#seguir-empresa").disabled) window.location.href = "empresa.html"; });
  $("#reenviar").addEventListener("click", function () { window.proto.aviso("E-mail reenviado, se o endereço puder ser usado."); });
})();
