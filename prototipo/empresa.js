(function () {
  var $ = window.proto.$, $$ = window.proto.$$;
  /* Sem e-mail confirmado, volta ao cadastro (a confirmação vem antes do passo a passo). */
  try { if (!sessionStorage.getItem("ilabs-proto-email-confirmado")) { window.location.replace("cadastro.html?confirme=1"); return; } } catch (e) {}
  var CHAVE = "ilabs-proto-empresa";
  var etapa = 1, TOTAL = 4;
  var DIAS_TESTE = 365; /* valor TEMPORÁRIO de desenvolvimento; o valor de lançamento está em docs/antes-de-lancar.md */
  var CAMPOS = ["v-cargo", "v-tel", "e-razao", "e-fantasia", "e-cnpj", "e-tel", "e-email", "f-cep", "f-log", "f-num", "f-comp", "f-cidade", "f-uf", "f-afe", "f-rt", "f-crf"];
  var ROT = {
    "v-cargo": "Cargo", "v-tel": "Telefone", "e-razao": "Razão social", "e-fantasia": "Nome fantasia", "e-cnpj": "CNPJ", "e-tel": "Telefone da empresa", "e-email": "E-mail da empresa",
    "f-cep": "CEP", "f-log": "Logradouro", "f-num": "Número", "f-comp": "Complemento", "f-cidade": "Cidade", "f-uf": "UF", "f-afe": "AFE (ANVISA)", "f-rt": "Responsável técnico", "f-crf": "CRF"
  };

  /* ---------- CNPJ: formato e dígitos verificadores ---------- */
  function dv(b) {
    var p = b.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2], s = 0;
    for (var i = 0; i < b.length; i++) s += +b[i] * p[i];
    var r = s % 11; return r < 2 ? 0 : 11 - r;
  }
  function cnpjValido(v) {
    v = v.replace(/\D/g, "");
    if (v.length !== 14 || /^(\d)\1+$/.test(v)) return false;
    var a = dv(v.slice(0, 12)); var b = dv(v.slice(0, 12) + a);
    return v.slice(12) === "" + a + b;
  }
  var CNPJ_JA_CADASTRADO = "11222333000181"; /* só para mostrar a regra de unicidade */

  /* ---------- Máscaras ---------- */
  function mascara(id, fn) { $("#" + id).addEventListener("input", function () { this.value = fn(this.value.replace(/\D/g, "")); }); }
  mascara("e-cnpj", function (d) { d = d.slice(0, 14); return d.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2"); });
  mascara("f-cep", function (d) { d = d.slice(0, 8); return d.replace(/^(\d{5})(\d)/, "$1-$2"); });
  function tel(d) { d = d.slice(0, 11); if (d.length > 10) return d.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3"); if (d.length > 6) return d.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3"); if (d.length > 2) return d.replace(/^(\d{2})(\d+)/, "($1) $2"); return d; }
  mascara("v-tel", tel); mascara("e-tel", tel);

  /* ---------- Rascunho (neste navegador, só no protótipo) ---------- */
  function ler() { try { return JSON.parse(localStorage.getItem(CHAVE) || "null"); } catch (e) { return null; } }
  function gravar() {
    var d = { etapa: etapa, campos: {}, ativ: ativSel() };
    CAMPOS.forEach(function (id) { d.campos[id] = $("#" + id).value; });
    try { localStorage.setItem(CHAVE, JSON.stringify(d)); } catch (e) { /* sem armazenamento: segue sem rascunho */ }
  }
  function limpar() { try { localStorage.removeItem(CHAVE); } catch (e) { } }
  function ativSel() { return $$("#ativ input:checked").map(function (i) { return i.value; }); }

  /* ---------- Etapas ---------- */
  function erro(id, msg) { var e = $("#e-" + id); if (e) e.textContent = msg || ""; var i = $("#" + id); if (i) i.setAttribute("aria-invalid", msg ? "true" : "false"); return !msg; }
  function obrig(id, msg) { return erro(id, $("#" + id).value.trim() ? "" : msg); }
  function validar(n) {
    var ok = true, primeiro = null;
    function marca(r, id) { if (!r && !primeiro) primeiro = id; ok = ok && r; }
    if (n === 1) { marca(obrig("v-cargo", "Informe o seu cargo."), "v-cargo"); marca(erro("v-tel", $("#v-tel").value.replace(/\D/g, "").length >= 10 ? "" : "Informe o telefone com DDD."), "v-tel"); }
    if (n === 2) {
      marca(obrig("e-razao", "Informe a razão social."), "e-razao");
      var c = $("#e-cnpj").value, d = c.replace(/\D/g, "");
      var msg = !d ? "Informe o CNPJ." : !cnpjValido(c) ? "CNPJ inválido. Confira os números." : d === CNPJ_JA_CADASTRADO ? "Este CNPJ já tem uma empresa cadastrada. Se você é da empresa, peça acesso ao responsável." : "";
      marca(erro("e-cnpj", msg), "e-cnpj");
      var em = $("#e-email").value.trim();
      marca(erro("e-email", em.indexOf("@") > 0 && em.indexOf(".") > em.indexOf("@") ? "" : "Informe um e-mail válido."), "e-email");
    }
    if (n === 3) {
      marca(erro("f-cep", $("#f-cep").value.replace(/\D/g, "").length === 8 ? "" : "Informe o CEP com 8 números."), "f-cep");
      marca(obrig("f-log", "Informe o logradouro."), "f-log"); marca(obrig("f-num", "Informe o número."), "f-num"); marca(obrig("f-cidade", "Informe a cidade."), "f-cidade"); marca(obrig("f-uf", "Escolha a UF."), "f-uf");
      var a = ativSel().length > 0; $("#e-ativ").textContent = a ? "" : "Marque pelo menos uma atividade."; marca(a, "ativ");
      marca(erro("f-rt", $("#f-rt").value.trim().split(/\s+/).length >= 2 ? "" : "Informe o nome completo do responsável técnico."), "f-rt");
      marca(erro("f-crf", /^[A-Za-z]{2}\s?\d{3,7}$/.test($("#f-crf").value.trim()) ? "" : "Informe o CRF com a UF e o número, por exemplo SP 12345."), "f-crf");
    }
    if (primeiro) { var el = $("#" + primeiro); if (el && el.focus) el.focus(); }
    return ok;
  }
  function resumo() {
    function v(id) { return ($("#" + id).value || "").trim() || "—"; }
    function bloco(titulo, n, linhas) {
      return "<h3>" + titulo + ' <button type="button" class="link" data-ir="' + n + '">Editar</button></h3><dl>' +
        linhas.map(function (l) { return "<dt>" + l[0] + "</dt><dd>" + l[1] + "</dd>"; }).join("") + "</dl>";
    }
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    $("#resumo").innerHTML =
      bloco("Você", 1, [["Nome", "Carla Dias"], ["E-mail", "carla.dias@lab-teste.com.br"], ["Cargo", esc(v("v-cargo"))], ["Telefone", esc(v("v-tel"))]]) +
      bloco("A empresa", 2, [["Razão social", esc(v("e-razao"))], ["Nome fantasia", esc(v("e-fantasia"))], ["CNPJ", esc(v("e-cnpj"))], ["Telefone", esc(v("e-tel"))], ["E-mail", esc(v("e-email"))]]) +
      bloco("A fábrica", 3, [["Endereço", esc(v("f-log") + ", " + v("f-num") + " · " + v("f-cidade") + "/" + v("f-uf") + " · CEP " + v("f-cep"))], ["Atividades", esc(ativSel().join(", ") || "—")], ["AFE (ANVISA)", esc(v("f-afe"))], ["Resp. técnico", esc(v("f-rt") + " (CRF " + v("f-crf") + ")")]]);
    $$("[data-ir]").forEach(function (b) { b.addEventListener("click", function () { ir(+b.getAttribute("data-ir")); }); });
  }
  function ir(n) {
    etapa = n;
    $$("[data-etapa]").forEach(function (s) { s.hidden = +s.getAttribute("data-etapa") !== n; });
    $$("#etapas li").forEach(function (li, i) { li.className = i + 1 < n ? "feita" : i + 1 === n ? "atual" : ""; if (i + 1 === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current"); });
    $("#eyebrow").textContent = "Etapa " + n + " de " + TOTAL;
    $("#voltar").style.visibility = n === 1 ? "hidden" : "visible";
    var ult = n === TOTAL; $("#proximo").textContent = ult ? "Criar empresa" : "Próxima etapa →";
    if (ult) { resumo(); $("#proximo").disabled = !$("#aceite").checked; } else { $("#proximo").disabled = false; }
    gravar();
    var h = $("[data-etapa='" + n + "'] h2"); if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
  }
  $("#aceite").addEventListener("change", function () { $("#proximo").disabled = !this.checked; });
  $("#voltar").addEventListener("click", function () { $("#rasc").innerHTML = ""; if (etapa > 1) ir(etapa - 1); });
  $("#proximo").addEventListener("click", function () {
    $("#rasc").innerHTML = "";
    if (etapa < TOTAL) { if (validar(etapa)) ir(etapa + 1); return; }
    /* Criar empresa: no banco será uma única chamada atômica (empresa, responsável, perfis, armazém e teste). */
    var fim = new Date(); fim.setDate(fim.getDate() + DIAS_TESTE);
    $("#p-dias").textContent = String(DIAS_TESTE);
    $("#p-razao").textContent = $("#e-razao").value.trim();
    $("#p-fim").textContent = fim.toLocaleDateString("pt-BR");
    limpar(); $("#wiz").hidden = true; $("#pronto").hidden = false;
  });
  $$("[data-etapa] input, [data-etapa] select").forEach(function (i) { i.addEventListener("change", gravar); i.addEventListener("blur", gravar); });
  $("#recomecar").addEventListener("click", function () { limpar(); location.reload(); });

  /* retomar rascunho */
  var r = ler();
  if (r && r.campos) {
    CAMPOS.forEach(function (id) { if (r.campos[id] != null) $("#" + id).value = r.campos[id]; });
    $$("#ativ input").forEach(function (i) { i.checked = (r.ativ || []).indexOf(i.value) >= 0; });
    var tem = CAMPOS.some(function (id) { return r.campos[id]; });
    if (tem) {
      $("#rasc").innerHTML = '<div class="msg warn">Encontramos um rascunho. Retomando da etapa ' + (r.etapa || 1) + ".</div>";
      $("#recomecar").hidden = false; ir(Math.min(Math.max(r.etapa || 1, 1), TOTAL)); return;
    }
  }
  ir(1);
})();
