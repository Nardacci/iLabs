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
  $("#reenviar").addEventListener("click", function () { window.proto.aviso("E-mail reenviado, se o endereço puder ser usado."); });
})();
