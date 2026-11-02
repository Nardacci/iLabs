/* Regras de senha do protótipo (decisão de 02/11/2026: boas práticas, sem expiração periódica).
   12 caracteres ou mais, sem exigir maiúscula ou símbolo, fora da lista de senhas comuns. Dados e lista de exemplo. */
(function () {
  var $ = window.proto.$;
  var COMUNS = ["senha1234567", "123456789012", "qwertyuiop12", "password1234", "ilabpharma123", "labteste12345"];

  function avaliar(v, email, conf) {
    var local = (email || "").split("@")[0].toLowerCase();
    var minusc = v.toLowerCase();
    return {
      tam: v.length >= 12,
      comum: v.length > 0 && COMUNS.indexOf(minusc) < 0 && !(local.length >= 4 && minusc.indexOf(local) >= 0),
      igual: v.length > 0 && v === conf
    };
  }

  function forca(v, r) {
    if (!v) return 0;
    if (!r.comum || !r.tam) return 1;
    return v.length >= 16 ? 3 : 2;
  }

  /* cfg: { nova, conf, lista, forca, forcaTxt, botao, email, extra } (seletores; extra é uma função que devolve true/false) */
  function iniciar(cfg) {
    function atualizar() {
      var v = $(cfg.nova).value, c = $(cfg.conf).value;
      var email = cfg.email ? ($(cfg.email).value || $(cfg.email).textContent) : "";
      var r = avaliar(v, email, c);
      Array.prototype.slice.call($(cfg.lista).querySelectorAll("li")).forEach(function (li) {
        li.classList.toggle("ok", !!r[li.getAttribute("data-k")]);
      });
      var n = forca(v, r);
      $(cfg.forca).setAttribute("data-n", String(n));
      $(cfg.forcaTxt).textContent = ["", "Ainda não atende à política", "Boa", "Forte"][n];
      var tudo = r.tam && r.comum && r.igual && (!cfg.extra || cfg.extra());
      $(cfg.botao).disabled = !tudo;
      return tudo;
    }
    [cfg.nova, cfg.conf].forEach(function (s) { $(s).addEventListener("input", atualizar); });
    if (cfg.gatilhos) cfg.gatilhos.forEach(function (s) { $(s).addEventListener("change", atualizar); });
    atualizar();
    return atualizar;
  }

  window.proto.senha = { iniciar: iniciar };
})();
