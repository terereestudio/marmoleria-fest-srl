"""Genera index.html (catálogo incluido), el mapa ilustrado y el favicon."""
import html, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).parent / "site"

# (pestaña, [(grupo, nota, [(slug, nombre, tipo)])])
CATALOGO = [
    ("granitos", "Granitos", [
        ("Nacionales", None, [
            ("gris-mara", "Gris Mara"), ("gris-perla", "Gris Perla"), ("franco-veteado", "Franco Veteado"),
            ("marron-coco", "Marrón Coco"), ("rosa-del-salto", "Rosa del Salto"), ("orcollano", "Orcollano"),
            ("sierra-chica", "Sierra Chica"), ("rojo-dragon", "Rojo Dragón")]),
        ("Importados", None, [
            ("blanco-dallas", "Blanco Dallas"), ("kashmir-white", "Kashmir White"), ("via-lactea", "Vía Láctea"),
            ("preto-indiano", "Preto Indiano"), ("piracema", "Piracema"), ("negro-brasil", "Negro Brasil"),
            ("negro-absoluto", "Negro Absoluto"), ("splendor-white", "Splendor White"), ("alpinus", "Alpinus")]),
    ], "Granito"),
    ("marmoles", "Mármoles", [
        ("Importados", None, [
            ("arabescato", "Arabescato"), ("blanco-brasil", "Blanco Brasil"), ("blanco-turco", "Blanco Turco"),
            ("galala", "Galala"), ("crema-marfil", "Crema Marfil"), ("carrara", "Carrara"),
            ("rojo-alicante", "Rojo Alicante"), ("rosso-verona", "Rosso Verona"), ("marron-bosque", "Marrón Bosque"),
            ("marron-emperador", "Marrón Emperador"), ("beige-bahia", "Beige Bahía"), ("travertino-turco", "Travertino Turco"),
            ("verde-oriental", "Verde Oriental")]),
    ], "Mármol"),
    ("cuarzos", "Cuarzos y cuarcitas", [
        ("Línea Silestone", "cuarzo", [
            ("white-storm", "White Storm"), ("calacatta-gold", "Calacatta Gold"), ("blanco-norte", "Blanco Norte"),
            ("blanco-zeus", "Blanco Zeus"), ("blanco-matrix", "Blanco Matrix")]),
        ("Línea Cuarcita", "piedra natural", [
            ("calacatta-bohemia", "Calacatta Bohemia"), ("patagonia", "Patagonia"), ("blue-rome", "Blue Rome"),
            ("macaubas", "Macaubas")]),
        ("Línea Dekton", "ultracompacto", [("calacatta-natura", "Calacatta Natura"), ("aura", "Aura")]),
        ("Línea Marmotech", None, [("beige-arena", "Beige Arena"), ("blanco-neve", "Blanco Neve")]),
        ("Línea Solidum", None, [("solidum-arabescato", "Arabescato")]),
    ], None),
]

def e(s):
    return html.escape(s, quote=True)

def catalogo_html():
    total = 0
    tabs, panels = [], []
    for i, (key, label, grupos, tipo) in enumerate(CATALOGO):
        n = sum(len(g[2]) for g in grupos)
        total += n
        sel = "true" if i == 0 else "false"
        tabs.append(
            f'      <button class="tab" type="button" role="tab" id="tab-{key}" aria-controls="panel-{key}" '
            f'aria-selected="{sel}" tabindex="{0 if i == 0 else -1}">{e(label)}<span class="tab-count">{n}</span></button>')
        body = []
        for gname, nota, items in grupos:
            meta_base = tipo or gname.replace("Línea ", "")
            small = f' <small>{e(nota)}</small>' if nota else ""
            titulo = f"{label} {gname.lower()}" if tipo else gname
            body.append(f'      <div class="cat-group">\n        <h3>{e(titulo)}{small}</h3>\n        <ul class="swatches">')
            for slug, nombre in items:
                if tipo:  # granitos / mármoles
                    material = f"{tipo} {nombre}"
                    meta = f"{tipo} · {({'Nacionales': 'Nacional', 'Importados': 'Importado'}).get(gname, gname)}"
                else:
                    linea = gname.replace("Línea ", "")
                    material = f"{linea} {nombre}"
                    meta = linea
                body.append(
                    f'          <li><button class="swatch" type="button" data-material="{e(material)}" '
                    f'aria-label="Consultar por {e(material)}">'
                    f'<img src="img/materiales/{slug}.webp" width="240" height="240" alt="{e(material)}, muestra pulida" loading="lazy">'
                    f'<span class="swatch-name">{e(nombre)}</span><span class="swatch-meta">{e(meta)}</span>'
                    f'<span class="swatch-cta" aria-hidden="true">Consultar</span></button></li>')
            body.append("        </ul>\n      </div>")
        panels.append(
            f'    <div class="tab-panel" role="tabpanel" id="panel-{key}" aria-labelledby="tab-{key}" tabindex="0">\n'
            + "\n".join(body) + "\n    </div>")
    out = ('    <div class="tabs" role="tablist" aria-label="Tipos de material">\n' + "\n".join(tabs) + "\n    </div>\n"
           '    <p class="cat-hint">Tocá una muestra para sumarla a tu consulta.</p>\n' + "\n".join(panels))
    return out, total

def mapa_svg():
    # Ilustración (no es un mapa real): calles esquemáticas y el punto de Festa.
    return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
<rect width="800" height="450" fill="#1E3672"/>
<g stroke="#2C4A8E" stroke-width="14" fill="none">
<path d="M0 120H800M0 330H800M150 0V450M330 0V450M560 0V450M700 0V450"/>
</g>
<g stroke="#3B5BA6" stroke-width="2" fill="none" opacity=".6">
<path d="M0 60H800M0 200H800M0 400H800M60 0V450M250 0V450M450 0V450"/>
</g>
<path d="M-20 270 L820 230" stroke="#C9D3EA" stroke-width="30" fill="none"/>
<text x="40" y="252" fill="#172C5E" font-family="Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="3" transform="rotate(-2.7 40 252)">AV. LIBERTAD</text>
<g transform="translate(470 245)">
<circle r="46" fill="#FFFFFF" opacity=".15"/>
<path d="M0 -8c-17 0-30 13-30 30 0 22 30 50 30 50s30-28 30-50c0-17-13-30-30-30z" transform="translate(0 -60)" fill="#FFFFFF"/>
<circle cy="-38" r="11" fill="#284B9C"/>
</g>
<rect x="520" y="150" width="236" height="62" fill="#FFFFFF"/>
<text x="536" y="176" fill="#172C5E" font-family="Arial, sans-serif" font-size="16" font-weight="700">Marmolería Festa</text>
<text x="536" y="198" fill="#4B5567" font-family="Arial, sans-serif" font-size="14">Av. Libertad 5170</text>
<text x="780" y="436" fill="#C9D3EA" font-family="Arial, sans-serif" font-size="12" text-anchor="end">Ilustración orientativa</text>
</svg>
"""

# Carrusel "Nuestros trabajos": (archivo, título, ambiente). Orden = orden en pantalla.
# Para agregar una foto: exportarla a img/trabajos/<archivo>-440.webp y -880.webp y sumarla acá.
TRABAJOS = [
    ("isla-cascada", "Isla de cocina con caídas laterales", "Cocina"),
    ("escalera", "Escalera revestida en piedra", "Escaleras"),
    ("vanitory-doble", "Vanitory doble con bachas talladas", "Baño"),
    ("hogar", "Frente de hogar revestido", "Living"),
    ("mueble-piedra", "Mueble de guardado en piedra", "Pieza especial"),
    ("obra-cliente", "Isla de cocina protegida para la entrega", "Colaboración"),
    ("mesa-comedor", "Mesa de comedor con tapa de piedra", "Comedor"),
    ("mesada-respaldo", "Mesada y respaldo en la misma piedra", "Cocina"),
    ("isla-mesada-juego", "Isla y mesada a juego", "Cocina"),
    ("isla-negra-bachas", "Isla negra con bachas integradas", "Cocina"),
    ("isla-piedra-oscura", "Isla con bacha y mesada en piedra oscura", "Cocina"),
    ("barra-curva", "Mesada y barra con extremo curvo", "Cocina"),
    ("mesada-l", "Mesada en L con anafe y bacha", "Cocina"),
]

def trabajos_html():
    out = ['      <ul class="carousel-track" tabindex="0" aria-label="Fotos de trabajos. Usá las flechas para recorrerlas.">']
    for i, (slug, titulo, ambiente) in enumerate(TRABAJOS):
        big = Image.open(ROOT / "img" / "trabajos" / f"{slug}-880.webp")
        small = Image.open(ROOT / "img" / "trabajos" / f"{slug}-440.webp")
        w, h = small.size
        ratio = big.size[0] / big.size[1]
        loading = 'fetchpriority="low" loading="lazy"' if i > 1 else 'loading="eager"'
        out.append(
            f'        <li class="slide"><figure class="slide-fig"><div class="slide-media">'
            f'<img src="img/trabajos/{slug}-440.webp" srcset="img/trabajos/{slug}-440.webp {small.size[0]}w, img/trabajos/{slug}-880.webp {big.size[0]}w" '
            f'sizes="(min-width: 1100px) {round(440 * ratio)}px, (min-width: 700px) {round(380 * ratio)}px, {round(300 * ratio)}px" '
            f'width="{w}" height="{h}" alt="{e(titulo)}, trabajo de Marmolería Festa" {loading} decoding="async"></div>'
            f'<figcaption><strong>{e(titulo)}</strong>{e(ambiente)}</figcaption></figure></li>')
    out.append("      </ul>")
    return "\n".join(out)

def main():
    src = (ROOT.parent / "src" / "index.src.html").read_text(encoding="utf-8")
    cat, total = catalogo_html()
    assert total == 44, total
    page = src.replace("<!--CATALOGO-->", cat).replace("<!--TRABAJOS-->", trabajos_html())

    (ROOT / "index.html").write_text(page, encoding="utf-8")
    (ROOT / "img" / "mapa-festa.svg").write_text(mapa_svg(), encoding="utf-8")
    # Favicon provisorio: cuadrado azul de marca con marco doble (no recorta ni redibuja el logo).
    # [COMPLETAR: reemplazar por el isotipo oficial si Festa lo tiene]
    from PIL import ImageDraw
    for size, name in ((64, "favicon.png"), (180, "apple-touch-icon.png")):
        im = Image.new("RGB", (size, size), (40, 75, 156))
        d = ImageDraw.Draw(im)
        m = size // 6
        d.rectangle([m, m, size - m - 1, size - m - 1], outline="white", width=max(2, size // 20))
        m2 = m + size // 9
        d.rectangle([m2, m2, size - m2 - 1, size - m2 - 1], outline="white", width=max(1, size // 40))
        im.save(ROOT / name)
    print("ok", total)

if __name__ == "__main__":
    main()
