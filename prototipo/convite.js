(function () {
  var $ = window.proto.$;
  var q = new URLSearchParams(location.search);
  var estado = q.get("estado"), perfil = q.get("perfil") || "aprovador";
  var aprova = perfil !== "consulta";

  if (estado === "expirado" || estado === "usado") {
    $("#c-ok").hidden = true; $("#c-fim").hidden = false;
    $("#c-fim-t").textContent = estado === "expirado" ? "Este convite expirou" : "Este convite já foi usado";
    $("#c-fim-p").textContent = estado === "expirado"
      ? "O link vale por 48 horas. Peça um novo convite ao administrador da sua empresa."
      : "Cada convite só pode ser usado uma vez. Se você já criou a senha, entre com o seu e-mail e a senha.";
    return;
  }
  if (!aprova) { $("#c-perfil").textContent = "Consulta do almoxarifado"; }

  window.proto.senha.iniciar({
    nova: "#nova", conf: "#conf", lista: "#politica", forca: "#forca", forcaTxt: "#forca-txt",
    botao: "#enviar", email: "#c-email", gatilhos: ["#termos"],
    extra: function () { return $("#termos").checked; }
  });

  $("#form-convite").addEventListener("submit", function (e) {
    e.preventDefault();
    if ($("#enviar").disabled) return;
    /* quem aprova segue para configurar as duas etapas; os demais entram direto */
    location.href = aprova ? "seguranca.html?primeiro=1#duas-etapas" : "inicio.html";
  });
})();
