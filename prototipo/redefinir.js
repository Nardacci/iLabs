(function () {
  var $ = window.proto.$;
  var q = new URLSearchParams(location.search);
  if (q.get("estado") === "expirado") { $("#r-ok").hidden = true; $("#r-fim").hidden = false; return; }

  window.proto.senha.iniciar({
    nova: "#nova", conf: "#conf", lista: "#politica", forca: "#forca", forcaTxt: "#forca-txt",
    botao: "#enviar", email: "#r-email"
  });
  $("#form-redefinir").addEventListener("submit", function (e) {
    e.preventDefault();
    if ($("#enviar").disabled) return;
    $("#r-ok").hidden = true; $("#r-pronto").hidden = false;
  });
})();
