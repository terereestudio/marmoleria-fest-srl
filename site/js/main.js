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
  document.documentElement.classList.add("js");

  /* ---------- Aparición suave de secciones al bajar ---------- */
  var reveals = $all("[data-reveal]");
  if (reveals.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      var revealObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("is-visible"); revealObs.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
      reveals.forEach(function (el) { revealObs.observe(el); });
    }
  }

  /* ---------- Fotos del hero con fundido cruzado ---------- */
  var heroMedia = $("[data-hero-slides]");
  if (heroMedia) {
    var heroSlides = $all(".hero-slide", heroMedia);
    var heroCaption = $("[data-hero-caption]", heroMedia);
    var heroIndex = 0, heroPaused = false;
    if (heroSlides.length > 1 && !reduceMotion) {
      heroMedia.addEventListener("mouseenter", function () { heroPaused = true; });
      heroMedia.addEventListener("mouseleave", function () { heroPaused = false; });
      window.setInterval(function () {
        if (heroPaused || document.hidden) return;
        var next = (heroIndex + 1) % heroSlides.length;
        var img = heroSlides[next];
        if (!img.complete) { img.loading = "eager"; return; } // espera a que la foto esté cargada
        heroSlides[heroIndex].classList.remove("is-active");
        img.classList.add("is-active");
        heroIndex = next;
        if (heroCaption) heroCaption.textContent = img.getAttribute("data-caption") || "";
      }, 5000);
    }
  }

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

  /* ---------- Carrusel de trabajos: desplazamiento continuo e infinito ----------
     Se duplican las fotos (copias ocultas para lectores de pantalla) y, al llegar al final
     del primer juego, se vuelve atrás sin que se note. Se pausa con el mouse, el dedo o el foco. */
  $all("[data-carousel]").forEach(function (root) {
    var track = $(".carousel-track", root);
    if (!track) return;
    var originals = $all(".slide", track);
    if (!originals.length) return;
    var prev = $("[data-carousel-prev]", root);
    var next = $("[data-carousel-next]", root);

    originals.forEach(function (li) {
      var copy = li.cloneNode(true);
      copy.setAttribute("aria-hidden", "true");
      $all("img", copy).forEach(function (im) { im.alt = ""; im.loading = "lazy"; im.removeAttribute("fetchpriority"); });
      track.appendChild(copy);
    });

    var SPEED = 0.35; // px por cuadro: lento y continuo
    var paused = false, holdUntil = 0, pos = track.scrollLeft;
    function setWidth() { return originals[originals.length - 1].offsetLeft + originals[originals.length - 1].offsetWidth - originals[0].offsetLeft + parseFloat(getComputedStyle(track).columnGap || 0); }
    var loopW = setWidth();
    window.addEventListener("resize", function () { loopW = setWidth(); });

    function wrap() {
      if (track.scrollLeft >= loopW) { track.scrollLeft -= loopW; pos = track.scrollLeft; }
    }
    function step() {
      if (!paused && Date.now() > holdUntil && !document.hidden) {
        pos += SPEED;
        track.scrollLeft = pos;
        if (Math.abs(track.scrollLeft - pos) > 2) pos = track.scrollLeft;
        wrap();
      }
      window.requestAnimationFrame(step);
    }
    if (!reduceMotion) window.requestAnimationFrame(step);

    var pause = function () { paused = true; };
    var resume = function () { paused = false; pos = track.scrollLeft; };
    root.addEventListener("mouseenter", pause);
    root.addEventListener("mouseleave", resume);
    track.addEventListener("touchstart", pause, { passive: true });
    track.addEventListener("touchend", function () { holdUntil = Date.now() + 2500; resume(); }, { passive: true });
    track.addEventListener("focusin", pause);
    track.addEventListener("focusout", resume);
    track.addEventListener("scroll", function () { if (paused) { wrap(); } }, { passive: true });

    function slideStep() {
      var first = originals[0], second = originals[1] || originals[0];
      return second.offsetLeft - first.offsetLeft || first.offsetWidth;
    }
    function go(dir) {
      if (dir < 0 && track.scrollLeft < slideStep()) { track.scrollLeft += loopW; }
      holdUntil = Date.now() + 1200;
      track.scrollBy({ left: dir * slideStep(), behavior: reduceMotion ? "auto" : "smooth" });
      window.setTimeout(function () { wrap(); pos = track.scrollLeft; }, 700);
    }
    if (prev) prev.addEventListener("click", function () { go(-1); });
    if (next) next.addEventListener("click", function () { go(1); });
    track.addEventListener("keydown", function (ev) {
      if (ev.key === "ArrowRight") { ev.preventDefault(); go(1); }
      if (ev.key === "ArrowLeft") { ev.preventDefault(); go(-1); }
    });
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
        frame.width = "800";
        frame.height = "450";
        frame.referrerPolicy = "no-referrer-when-downgrade";
        frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox");
        while (slot.firstChild) slot.removeChild(slot.firstChild);
        slot.appendChild(frame);
        loadBtn.hidden = true;
      });
    }
  }
})();
