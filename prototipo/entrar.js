(function () {
  var $ = window.proto.$, $$ = window.proto.$$;
/* ---------- Entrada ---------- */
  var tentativas = 0, MAX = 3;
  function passo(qual) {
    ["cred", "esqueci", "mfa"].forEach(function (p) { $("#passo-" + p).hidden = p !== qual; });
    var foco = { cred: "#senha", esqueci: "#email-rec", mfa: "#codigo" }[qual];
    if (foco) { setTimeout(function () { var e = $(foco); if (e) e.focus(); }, 30); }
  }
  function msg(id, tipo, texto) {
    $(id).innerHTML = texto ? '<div class="msg ' + tipo + '">' + texto + "</div>" : "";
  }
  $("#ver-senha").addEventListener("click", function () {
    var i = $("#senha"), mostrar = i.type === "password";
    i.type = mostrar ? "text" : "password";
    this.setAttribute("aria-label", mostrar ? "Ocultar a senha" : "Mostrar a senha");
    this.setAttribute("aria-pressed", String(mostrar));
  });
  $("#senha").addEventListener("keyup", function (e) {
    $("#caps").hidden = !(e.getModifierState && e.getModifierState("CapsLock"));
  });
  $("#abrir-esqueci").addEventListener("click", function () { msg("#esqueci-msg", "", ""); passo("esqueci"); });
  $$("[data-voltar]").forEach(function (b) { b.addEventListener("click", function () { passo("cred"); }); });
  $("#form-cred").addEventListener("submit", function (e) {
    e.preventDefault();
    var email = $("#email").value.trim(), senha = $("#senha").value;
    if (tentativas >= MAX) {
      msg("#entrar-msg", "bad", "Conta bloqueada por 15 minutos depois de 3 tentativas. Peça ao administrador do seu perfil para liberar.");
      return;
    }
    if (!email || email.indexOf("@") < 1) { msg("#entrar-msg", "bad", "Informe um e-mail válido, por exemplo nome@empresa.com.br."); $("#email").focus(); return; }
    if (!senha) { msg("#entrar-msg", "bad", "Informe a senha."); $("#senha").focus(); return; }
    if (senha === "errada") {
      tentativas += 1;
      if (tentativas >= MAX) {
        msg("#entrar-msg", "bad", "Conta bloqueada por 15 minutos depois de 3 tentativas. Peça ao administrador do seu perfil para liberar.");
      } else {
        var r = MAX - tentativas;
        msg("#entrar-msg", "warn", "E-mail ou senha incorretos. " + (r === 1 ? "Resta 1 tentativa" : "Restam " + r + " tentativas") + " antes do bloqueio.");
      }
      $("#senha").value = ""; $("#senha").focus();
      return;
    }
    tentativas = 0; msg("#entrar-msg", "", "");
    $("#mfa-email").textContent = email;
    $("#codigo").value = ""; msg("#mfa-msg", "", "");
    passo("mfa");
  });
  $("#form-esqueci").addEventListener("submit", function (e) {
    e.preventDefault();
    var v = $("#email-rec").value.trim();
    if (!v || v.indexOf("@") < 1) { msg("#esqueci-msg", "bad", "Informe um e-mail válido."); return; }
    msg("#esqueci-msg", "ok", "Se este e-mail estiver cadastrado, o link chega em alguns minutos. Por segurança, não dizemos se ele existe.");
  });
  $("#form-mfa").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!/^\d{6}$/.test($("#codigo").value.trim())) { msg("#mfa-msg", "bad", "O código tem 6 dígitos. Confira e tente de novo."); $("#codigo").focus(); return; }
    location.href = "inicio.html";
  });

    passo("cred");
})();
