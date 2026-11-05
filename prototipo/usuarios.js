(function () {
  var $ = window.proto.$, $$ = window.proto.$$, A = window.adm, esc = A.esc;
  var MOTIVO_MIN = 5;
  var alvo = null, acaoAtual = null;

  function motivoOk(texto) { return texto && texto.trim().length >= MOTIVO_MIN; }
  function msg(id, texto) { $(id).innerHTML = texto ? '<div class="msg bad">' + esc(texto) + "</div>" : ""; }

  /* ---------- Lista ---------- */
  function chips(p) {
    return '<div class="chips">' + p.perfis.map(function (id) {
      var f = A.perfil(id);
      return '<span class="chip' + (f.ativo ? "" : " inativo") + '">' + esc(f.nome) + (f.ativo ? "" : " (perfil inativo)") + "</span>";
    }).join("") + "</div>";
  }
  function situacao(p) {
    if (!p.ativo) return '<span class="pill bad">Inativa</span>';
    if (p.bloq) return '<span class="pill warn">Bloqueada</span>';
    return '<span class="pill ok">Ativa</span>';
  }
  function linha(p) {
    var eu = p.id === A.EU, b = "";
    b += '<button type="button" class="btn small" data-acao="editar" data-id="' + p.id + '"' + (eu ? ' disabled title="Você não pode alterar o seu próprio perfil"' : "") + ">Perfis</button>";
    if (p.bloq) b += '<button type="button" class="btn small" data-acao="desbloquear" data-id="' + p.id + '">Desbloquear</button>';
    if (p.ativo) {
      b += '<button type="button" class="btn small" data-acao="senha" data-id="' + p.id + '">Exigir nova senha</button>';
      b += '<button type="button" class="btn small" data-acao="inativar" data-id="' + p.id + '"' + (eu ? ' disabled title="Você não pode inativar a si mesma"' : "") + ">Inativar</button>";
    } else {
      b += '<button type="button" class="btn small" data-acao="reativar" data-id="' + p.id + '">Reativar</button>';
    }
    return "<tr><td><strong>" + esc(p.nome) + (eu ? " (você)" : "") + "</strong><small>" + esc(p.email) + "</small></td><td>" + chips(p) + "</td><td>" + situacao(p) +
      "</td><td>" + esc(p.acesso) + '</td><td><div class="acoes-linha">' + b + "</div></td></tr>";
  }
  function listar() {
    var t = A.norm($("#busca").value), s = $("#situacao").value;
    var lista = A.pessoas.filter(function (p) {
      var texto = A.norm(p.nome + " " + p.email + " " + p.perfis.map(function (id) { return A.perfil(id).nome; }).join(" "));
      if (t && texto.indexOf(t) < 0) return false;
      if (s === "ativo") return p.ativo;
      if (s === "inativo") return !p.ativo;
      if (s === "bloqueado") return p.ativo && p.bloq;
      return true;
    });
    $("#corpo").innerHTML = lista.map(linha).join("");
    $("#vazio").hidden = lista.length > 0;
    $("#contagem").textContent = lista.length + " de " + A.pessoas.length + " pessoas (a lista não tem limite)";
    avisos();
  }
  function avisos() {
    var bl = A.pessoas.filter(function (p) { return p.bloq && p.ativo; });
    $("#avisos").innerHTML = bl.map(function (p) {
      return '<div class="msg warn"><strong>' + esc(p.nome) + "</strong> foi bloqueada por 5 tentativas erradas em 15 minutos. Confirme que foi a própria pessoa antes de desbloquear. " +
        '<button type="button" class="btn small" data-acao="desbloquear" data-id="' + p.id + '">Desbloquear</button></div>';
    }).join("");
  }
  function convites() {
    var rot = { valido: ["ok", "Válido"], vencido: ["bad", "Vencido"], usado: ["warn", "Usado"], cancelado: ["bad", "Cancelado"] };
    $("#corpo-conv").innerHTML = A.convites.map(function (c) {
      var r = rot[c.estado], b = "";
      if (c.estado === "valido" || c.estado === "vencido") b += '<button type="button" class="btn small" data-conv="reenviar" data-id="' + c.id + '">Reenviar</button> ';
      if (c.estado === "valido") b += '<button type="button" class="btn small" data-conv="cancelar" data-id="' + c.id + '">Cancelar</button>';
      var nota = c.estado === "valido" ? "vale até " + c.expira : c.estado === "vencido" ? "venceu em " + c.expira : c.estado === "usado" ? "aceito; não vale de novo" : "não vale mais";
      return "<tr><td><strong>" + esc(c.nome) + "</strong><small>" + esc(c.email) + "</small></td><td>" + esc(A.perfil(c.perfil).nome) +
        '</td><td><span class="pill ' + r[0] + '">' + r[1] + "</span><small>" + nota + "</small></td><td>" + (b || "—") + "</td></tr>";
    }).join("");
  }

  /* ---------- Ações da linha ---------- */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-acao]"), c = e.target.closest("[data-conv]"), f = e.target.closest("[data-fechar]");
    if (f) { A.fechar(f.getAttribute("data-fechar")); return; }
    if (b) { acao(b.getAttribute("data-acao"), A.pessoa(b.getAttribute("data-id"))); }
    if (c) { conv(c.getAttribute("data-conv"), c.getAttribute("data-id")); }
  });
  function acao(tipo, p) {
    alvo = p; acaoAtual = tipo;
    if (tipo === "editar") { editar(p); return; }
    if (tipo === "inativar" || tipo === "reativar") {
      $("#m-situacao-t").textContent = tipo === "inativar" ? "Inativar " + p.nome : "Reativar " + p.nome;
      $("#s-texto").textContent = tipo === "inativar" ? "As sessões da pessoa são encerradas na hora e o acesso acaba. O cadastro e o histórico não são apagados." : "A pessoa volta a poder entrar com a senha que já tem.";
      $("#s-motivo").value = ""; msg("#m-situacao-msg", ""); A.abrir("m-situacao", "#s-motivo"); return;
    }
    var rot = { desbloquear: ["Desbloquear " + p.nome, "A contagem de tentativas recomeça. A pessoa deve ser conhecida e confirmada por você."],
                senha: ["Exigir nova senha de " + p.nome, "A pessoa sai de todas as sessões e recebe um link por e-mail para criar uma senha nova. Você não vê nem define a senha."] };
    $("#m-acao-t").textContent = rot[tipo][0]; $("#a-texto").textContent = rot[tipo][1];
    $("#a-motivo").value = ""; msg("#m-acao-msg", ""); A.abrir("m-acao", "#a-motivo");
  }
  $("#f-situacao").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!motivoOk($("#s-motivo").value)) { msg("#m-situacao-msg", "Informe o motivo (pelo menos 5 caracteres)."); $("#s-motivo").focus(); return; }
    if (alvo.id === A.EU) { msg("#m-situacao-msg", "Você não pode alterar a sua própria situação."); return; }
    alvo.ativo = acaoAtual === "reativar";
    A.fechar("m-situacao"); listar();
    window.proto.aviso(acaoAtual === "inativar" ? alvo.nome + " foi inativada; as sessões foram encerradas." : alvo.nome + " foi reativada.");
  });
  $("#f-acao").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!motivoOk($("#a-motivo").value)) { msg("#m-acao-msg", "Informe o motivo (pelo menos 5 caracteres)."); $("#a-motivo").focus(); return; }
    if (acaoAtual === "desbloquear") { alvo.bloq = false; window.proto.aviso(alvo.nome + " foi desbloqueada."); }
    if (acaoAtual === "senha") { window.proto.aviso("Sessões de " + alvo.nome + " encerradas; o link de nova senha foi enviado por e-mail."); }
    A.fechar("m-acao"); listar();
  });

  /* ---------- Editar perfis (vários, com motivo, sempre mostra o gravado) ---------- */
  function editar(p) {
    $("#e-nome").textContent = p.nome; $("#e-motivo").value = ""; msg("#m-editar-msg", ""); $("#e-hist").hidden = true; $("#e-hist-lista").innerHTML = "";
    var html = "";
    A.perfis.forEach(function (f) {
      var vinculado = p.perfis.indexOf(f.id) >= 0;
      if (!f.ativo && !vinculado) return;
      html += '<label class="check"><input type="checkbox" value="' + f.id + '"' + (vinculado ? " checked" : "") + "><span>" + esc(f.nome) + (f.ativo ? "" : " (perfil inativo, vínculo gravado)") + "</span></label>";
    });
    $("#e-perfis").innerHTML = html;
    A.abrir("m-editar", "#e-perfis input");
  }
  $("#f-editar").addEventListener("submit", function (e) {
    e.preventDefault();
    var novos = $$("#e-perfis input:checked").map(function (i) { return i.value; });
    if (!novos.length) { msg("#m-editar-msg", "Escolha pelo menos um perfil. Para retirar o acesso, inative a pessoa."); return; }
    if (!motivoOk($("#e-motivo").value)) { msg("#m-editar-msg", "Informe o motivo (pelo menos 5 caracteres)."); $("#e-motivo").focus(); return; }
    if (alvo.id === A.EU) { msg("#m-editar-msg", "Você não pode alterar o seu próprio perfil."); return; }
    var nome = function (ids) { return ids.map(function (id) { return A.perfil(id).nome; }).join(", "); };
    var antes = nome(alvo.perfis), depois = nome(novos);
    alvo.perfis = novos; msg("#m-editar-msg", "");
    $("#e-hist").hidden = false;
    $("#e-hist-lista").insertAdjacentHTML("afterbegin", "<li><time>" + esc(A.agora()) + " · Carla Mendes</time><span class=\"ant\">" + esc(antes) + '</span><span class="dep">' + esc(depois) + "</span>Motivo: " + esc($("#e-motivo").value.trim()) + "</li>");
    $("#e-motivo").value = "";
    listar();
    window.proto.aviso("Perfis alterados. Antes, depois e motivo ficaram na auditoria.");
  });

  /* ---------- Convidar ---------- */
  $("#abrir-convite").addEventListener("click", function () {
    $("#c-nome").value = ""; $("#c-email").value = ""; msg("#m-convite-msg", "");
    $("#c-perfil").innerHTML = '<option value="">Escolha um perfil</option>' + A.perfis.filter(function (f) { return f.ativo; }).map(function (f) { return '<option value="' + f.id + '">' + esc(f.nome) + "</option>"; }).join("");
    $("#c-perfil-info").textContent = "Todos os perfis ativos aparecem aqui (" + A.perfis.filter(function (f) { return f.ativo; }).length + "), sem limite. Depois você pode dar mais de um perfil.";
    A.abrir("m-convite", "#c-nome");
  });
  $("#f-convite").addEventListener("submit", function (e) {
    e.preventDefault();
    var nome = $("#c-nome").value.trim(), email = $("#c-email").value.trim().toLowerCase(), pf = $("#c-perfil").value;
    if (!nome) { msg("#m-convite-msg", "Informe o nome."); $("#c-nome").focus(); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg("#m-convite-msg", "Informe um e-mail válido."); $("#c-email").focus(); return; }
    if (!pf) { msg("#m-convite-msg", "Escolha o perfil proposto."); $("#c-perfil").focus(); return; }
    if (A.pessoas.some(function (p) { return p.email === email; })) { msg("#m-convite-msg", "Já existe um usuário com este e-mail."); return; }
    A.convites.forEach(function (c) { if (c.email === email && c.estado === "valido") c.estado = "cancelado"; });
    A.convites.unshift({ id: "c" + (A.convites.length + 10), nome: nome, email: email, perfil: pf, criado: "05/11 " + A.agora().slice(11, 16), expira: "07/11 " + A.agora().slice(11, 16), estado: "valido" });
    A.fechar("m-convite"); convites();
    window.proto.aviso("Convite enviado a " + email + ". Vale 48 horas e uma só vez.");
  });
  function conv(tipo, id) {
    var c = A.convites.filter(function (x) { return x.id === id; })[0];
    if (tipo === "reenviar") { c.estado = "valido"; c.expira = "07/11 " + A.agora().slice(11, 16); window.proto.aviso("Novo convite enviado a " + c.email + ". O anterior deixou de valer."); }
    if (tipo === "cancelar") { c.estado = "cancelado"; window.proto.aviso("Convite cancelado."); }
    convites();
  }

  $("#busca").addEventListener("input", listar);
  $("#situacao").addEventListener("change", listar);
  listar(); convites();
})();
