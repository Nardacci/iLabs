(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Tema ---------- */
  var root = document.documentElement;
  function darkNow() {
    var t = root.getAttribute("data-theme");
    if (t) return t === "dark";
    return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
  }
  $$("[data-theme-toggle]").forEach(function (b) {
    b.addEventListener("click", function () {
      root.setAttribute("data-theme", darkNow() ? "light" : "dark");
    });
  });

  /* ---------- Aviso ---------- */
  var avisoT;
  function aviso(texto) {
    var el = $("#aviso");
    el.textContent = texto; el.hidden = false;
    clearTimeout(avisoT);
    avisoT = setTimeout(function () { el.hidden = true; }, 2600);
  }

    window.proto = { aviso: aviso, $: $, $$: $$ };
})();
