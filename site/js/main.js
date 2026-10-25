/* ==========================================================================
   Marmolería Festa — interacción de la landing
   Sin librerías. Sin innerHTML ni eval: todo el texto se escribe con textContent.
   ========================================================================== */
(function () {
  "use strict";

  /* Números de WhatsApp (formato internacional, sin + ni espacios) */
  var CONTACTOS = {
    jose: { nombre: "José", numero: "5493794710121" },
    carlos: { nombre: "Carlos", numero: "5493794567000" }
  };
  var TIEMPO_MINIMO_MS = 3000; // trampa de tiempo antibots

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Año del footer ---------- */
  var year = $("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Menú en celular ---------- */
  var toggle = $(".nav-toggle");
  var nav = $("#menu-principal");
  if (toggle && nav) {
    var closeNav = function () { nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); };
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $all("a", nav).forEach(function (a) { a.addEventListener("click", closeNav); });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && nav.classList.contains("is-open")) { closeNav(); toggle.focus(); }
    });
  }

  /* ---------- Pestañas del catálogo ---------- */
  var tabs = $all('[role="tab"]');
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute("aria-controls"));
      if (panel) panel.hidden = !on;
    });
    if (focus) tab.focus();
  }
  if (tabs.length) {
    selectTab(tabs[0], false);
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { selectTab(tab, false); });
      tab.addEventListener("keydown", function (ev) {
        var next = null;
        if (ev.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        if (ev.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (ev.key === "Home") next = tabs[0];
        if (ev.key === "End") next = tabs[tabs.length - 1];
        if (next) { ev.preventDefault(); selectTab(next, true); }
      });
    });
  }

  /* ---------- Formulario → WhatsApp ---------- */
  var form = $("#form-presupuesto");
  var status = $("[data-form-status]");
  var loadedAt = Date.now();

  function setStatus(msg, type, link) {
    if (!status) return;
    status.textContent = msg;
    status.className = "form-status" + (type ? " is-" + type : "");
    if (link) {
      status.appendChild(document.createTextNode(" "));
      var a = document.createElement("a");
      a.href = link;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = "Abrir WhatsApp";
      status.appendChild(a);
    }
  }

  /* Limpia el texto: sin caracteres de control, espacios normalizados y largo máximo */
  function clean(value, max) {
    return String(value || "")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      .replace(/[ \t]+/g, " ")
      .trim()
      .slice(0, max);
  }

  if (form) {
    var fields = $("[data-form-fields]", form);
    if (fields) fields.disabled = false; // el formulario solo funciona con JS (evita envíos por GET)

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var data = new FormData(form);

      // Capa antibots 1: honeypot
      if (clean(data.get("website"), 200) !== "") { setStatus("No pudimos procesar la consulta.", "error"); return; }
      // Capa antibots 2: trampa de tiempo
      if (Date.now() - loadedAt < TIEMPO_MINIMO_MS) { setStatus("Revisá los datos y volvé a tocar Enviar.", "error"); return; }

      var nombre = clean(data.get("nombre"), 60);
      var trabajo = clean(data.get("trabajo"), 60);
      var material = clean(data.get("material"), 60);
      var medidas = clean(data.get("medidas"), 120);
      var mensaje = clean(data.get("mensaje"), 600);
      var contactoKey = clean(data.get("contacto"), 10);
      var contacto = Object.prototype.hasOwnProperty.call(CONTACTOS, contactoKey) ? CONTACTOS[contactoKey] : null;
      var consiente = data.get("consentimiento") === "on";

      var faltan = [];
      if (!nombre) faltan.push({ id: "f-nombre", txt: "tu nombre" });
      if (!trabajo) faltan.push({ id: "f-trabajo", txt: "qué necesitás" });
      if (!contacto) faltan.push({ id: "f-contacto-jose", txt: "con quién querés hablar" });
      if (!consiente) faltan.push({ id: "f-consentimiento", txt: "la aceptación de la Política de Privacidad" });
      if (faltan.length) {
        setStatus("Falta completar: " + faltan.map(function (f) { return f.txt; }).join(", ") + ".", "error");
        var first = document.getElementById(faltan[0].id);
        if (first) first.focus();
        return;
      }

      var lineas = [
        "Hola " + contacto.nombre + ", soy " + nombre + ". Quiero pedir un presupuesto.",
        "",
        "• Trabajo: " + trabajo
      ];
      if (material) lineas.push("• Material: " + material);
      if (medidas) lineas.push("• Medidas aproximadas: " + medidas);
      if (mensaje) lineas.push("• Detalle: " + mensaje);
      lineas.push("", "(Consulta enviada desde la web)");

      var url = "https://wa.me/" + contacto.numero + "?text=" + encodeURIComponent(lineas.join("\n"));
      window.open(url, "_blank", "noopener,noreferrer");
      setStatus("Listo: revisá WhatsApp y tocá enviar. Si no se abrió,", "ok", url);
    });
  }

  /* ---------- Muestras del catálogo → completan el formulario ---------- */
  $all("[data-material]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var input = $("#f-material");
      if (!input) return;
      input.value = clean(btn.getAttribute("data-material"), 60);
      var target = $("#presupuesto");
      if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      var nombre = $("#f-nombre");
      if (nombre) window.setTimeout(function () { nombre.focus({ preventScroll: true }); }, reduceMotion ? 0 : 450);
    });
  });

  /* ---------- Carrusel de trabajos ---------- */
  $all("[data-carousel]").forEach(function (root) {
    var track = $(".carousel-track", root);
    var slides = $all(".slide", track);
    var prev = $("[data-carousel-prev]", root);
    var next = $("[data-carousel-next]", root);
    var current = $("[data-carousel-current]", root);
    var total = $("[data-carousel-total]", root);
    if (!track || !slides.length) return;
    if (total) total.textContent = String(slides.length);

    function index() {
      var left = track.scrollLeft;
      var best = 0, dist = Infinity;
      slides.forEach(function (s, i) {
        var d = Math.abs(s.offsetLeft - track.offsetLeft - left);
        if (d < dist) { dist = d; best = i; }
      });
      return best;
    }
    function update() {
      var maxScroll = track.scrollWidth - track.clientWidth - 2;
      var i = track.scrollLeft >= maxScroll ? slides.length - 1 : index();
      if (current) current.textContent = String(i + 1);
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= maxScroll;
    }
    function go(dir) {
      var i = Math.max(0, Math.min(slides.length - 1, index() + dir));
      track.scrollTo({ left: slides[i].offsetLeft - track.offsetLeft, behavior: reduceMotion ? "auto" : "smooth" });
    }
    if (prev) prev.addEventListener("click", function () { go(-1); });
    if (next) next.addEventListener("click", function () { go(1); });
    track.addEventListener("keydown", function (ev) {
      if (ev.key === "ArrowRight") { ev.preventDefault(); go(1); }
      if (ev.key === "ArrowLeft") { ev.preventDefault(); go(-1); }
    });
    var t;
    track.addEventListener("scroll", function () { window.clearTimeout(t); t = window.setTimeout(update, 60); }, { passive: true });
    window.addEventListener("resize", update);
    update();
  });

  /* ---------- Botón flotante de WhatsApp ---------- */
  var wa = $("[data-wa]");
  if (wa) {
    var waToggle = $("[data-wa-toggle]", wa);
    var waPanel = $("[data-wa-panel]", wa);
    var bubble = $("[data-wa-bubble]", wa);
    var bubbleClose = $("[data-wa-bubble-close]", wa);

    var setPanel = function (open) {
      waPanel.hidden = !open;
      waToggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (open && bubble) bubble.hidden = true;
      if (open) { var first = $("a", waPanel); if (first) first.focus(); }
    };
    waToggle.addEventListener("click", function () { setPanel(waPanel.hidden); });
    if (bubbleClose) bubbleClose.addEventListener("click", function () { bubble.hidden = true; });
    if (bubble) bubble.addEventListener("click", function (ev) { if (ev.target !== bubbleClose) setPanel(true); });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && !waPanel.hidden) { setPanel(false); waToggle.focus(); }
    });
    document.addEventListener("click", function (ev) {
      if (!waPanel.hidden && !wa.contains(ev.target)) setPanel(false);
    });

    // El globo se retira solo después de bajar un poco, para no tapar contenido
    if (bubble) {
      var onScroll = function () {
        if (window.scrollY > 600) { bubble.hidden = true; window.removeEventListener("scroll", onScroll); }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    // Se oculta cuando el footer (formulario y firma) está a la vista
    var footer = $(".site-footer");
    if (footer && "IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        var visible = entries[0].isIntersecting;
        wa.classList.toggle("is-hidden", visible);
        if (visible) setPanel(false);
      }, { threshold: 0.05 }).observe(footer);
    }
  }

  /* ---------- Mapa con fachada (se conecta con Google solo si se pide) ---------- */
  var map = $("[data-map]");
  if (map) {
    var loadBtn = $("[data-map-load]", map);
    var slot = $("[data-map-slot]", map);
    if (loadBtn && slot) {
      loadBtn.hidden = false;
      loadBtn.addEventListener("click", function () {
        var frame = document.createElement("iframe");
        frame.src = "https://www.google.com/maps?q=" + encodeURIComponent("Av. Libertad 5170, Corrientes, Argentina") + "&output=embed";
        frame.title = "Mapa de Google: Av. Libertad 5170, Corrientes";
        frame.loading = "lazy";
        frame.referrerPolicy = "no-referrer-when-downgrade";
        frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox");
        while (slot.firstChild) slot.removeChild(slot.firstChild);
        slot.appendChild(frame);
        loadBtn.hidden = true;
      });
    }
  }
})();
