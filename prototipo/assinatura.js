(function () {
  var $ = window.proto.$, $$ = window.proto.$$, A = window.adm, esc = A.esc;
  var PESSOAS = {
    rui:    { nome: "Rui Tavares", perfil: "Chefe do CQ", pode: ["aprovador", "reprovador"], dupla: true, elaborou: false },
    lucia:  { nome: "Lúcia Prado", perfil: "Aprovador", pode: ["aprovador", "reprovador"], dupla: true, elaborou: true },
    carla:  { nome: "Carla Mendes", perfil: "Administrador", pode: [], dupla: false, elaborou: false },
    marina: { nome: "Marina Reis", perfil: "Gestor da GQ", pode: ["aprovador", "reprovador", "anulador"], dupla: true, elaborou: false }
  };
  var ROTULO = { aprovador: "Aprovador", reprovador: "Reprovador", liberador: "Liberador", anulador: "Anulador" };
  var LIMITE = 5, falhas = {}, bloqueados = {}, atual = null, sig = null;

  function eu() { return PESSOAS[$("#persona").value]; }
  function msg(texto, tipo) { $("#a-msg").innerHTML = texto ? '<div class="msg ' + (tipo || "bad") + '">' + esc(texto) + "</div>" : ""; }
  function faixa() {
    var k = $("#persona").value;
    $("#faixa-bloqueio").innerHTML = bloqueados[k] ? '<div class="msg warn" style="margin-top:12px">' + esc(PESSOAS[k].nome) + ' está bloqueada por 15 minutos depois de 5 senhas erradas. O administrador foi avisado.</div>' : "";
  }
  $("#persona").addEventListener("change", faixa);

  $$("[data-sig]").forEach(function (b) {
    b.addEventListener("click", function () {
      atual = eu(); sig = b.getAttribute("data-sig");
      if (bloqueados[$("#persona").value]) { faixa(); window.proto.aviso("Pessoa bloqueada: o servidor recusa qualquer assinatura."); return; }
      $("#a-quem").textContent = atual.nome + " (" + atual.perfil + ")";
      $("#a-sig").textContent = ROTULO[sig];
      $("#m-assina-t").textContent = "Assinar como " + ROTULO[sig].toLowerCase();
      $("#a-senha").value = ""; $("#a-codigo").value = ""; $("#a-motivo").value = ""; msg("");
      $("#a-senha").type = "password"; $("#ver-senha").setAttribute("aria-pressed", "false");
      $("#campo-codigo").hidden = !(atual.dupla || A.APROVA.indexOf(sig) >= 0);
      A.abrir("m-assina", "#a-senha");
    });
  });
  $("#ver-senha").addEventListener("click", function () {
    var i = $("#a-senha"), m = i.type === "password"; i.type = m ? "text" : "password";
    this.setAttribute("aria-label", m ? "Ocultar a senha" : "Mostrar a senha"); this.setAttribute("aria-pressed", String(m));
  });
  $("#a-cancelar").addEventListener("click", function () { A.fechar("m-assina"); });

  /* A ordem das conferências é a mesma do servidor: permissão, motivo, segregação, segundo fator, senha. */
  $("#f-assina").addEventListener("submit", function (e) {
    e.preventDefault();
    var k = $("#persona").value, motivo = $("#a-motivo").value.trim();
    if (atual.pode.indexOf(sig) < 0) { msg("O seu perfil não permite assinar como " + sig + ". Quem recusa é o servidor, mesmo que a tela deixe tentar."); return; }
    if (motivo.length < 5) { msg("Informe o motivo (pelo menos 5 caracteres)."); $("#a-motivo").focus(); return; }
    if (atual.elaborou) { msg("Quem elaborou o registro não pode assiná-lo como " + sig + ". Peça a outra pessoa."); return; }
    if (!$("#campo-codigo").hidden && !/^\d{6}$/.test($("#a-codigo").value.trim())) { msg("Confirme o código de 6 dígitos da verificação em duas etapas antes de assinar."); $("#a-codigo").focus(); return; }
    if (!$("#a-senha").value) { msg("Digite a sua senha de novo."); $("#a-senha").focus(); return; }
    if ($("#a-senha").value === "errada") {
      falhas[k] = (falhas[k] || 0) + 1;
      if (falhas[k] >= LIMITE) { bloqueados[k] = true; A.fechar("m-assina"); faixa(); window.proto.aviso("Acesso bloqueado por tentativas erradas."); return; }
      msg("Senha incorreta. A assinatura não foi registrada. Restam " + (LIMITE - falhas[k]) + " tentativas antes do bloqueio.");
      $("#a-senha").value = ""; $("#a-senha").focus(); return;
    }
    falhas[k] = 0;
    var quando = A.agora();
    var sem = $("#sem-assin"); if (sem) sem.remove();
    $("#assinaturas").insertAdjacentHTML("afterbegin", "<li><time>" + esc(quando) + " (hora do servidor)</time><strong>" + esc(atual.nome) + "</strong> (" + esc(atual.perfil) + ") assinou como <strong>" + esc(ROTULO[sig].toLowerCase()) + "</strong>" +
      (!$("#campo-codigo").hidden ? ", com duas etapas" : "") + ".<br>Motivo: " + esc(motivo) + "</li>");
    var s = $("#situacao-laudo");
    if (sig === "aprovador" || sig === "liberador") { s.className = "pill ok"; s.textContent = sig === "aprovador" ? "Aprovado" : "Liberado"; }
    else { s.className = "pill bad"; s.textContent = sig === "reprovador" ? "Reprovado" : "Anulado"; }
    A.fechar("m-assina");
    window.proto.aviso("Assinatura registrada. Ela não pode ser alterada nem apagada.");
  });
  faixa();
})();
