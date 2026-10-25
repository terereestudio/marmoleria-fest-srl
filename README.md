# Marmolería Festa S.R.L. — Landing page

Landing de Marmolería Festa (Av. Libertad 5170, Corrientes Capital), desarrollada por [Tereré Estudio](https://terereestudio.com.ar).

Sitio estático en HTML, CSS y JavaScript sin librerías, pensado para publicarse en **Netlify**.

## Estructura

```
site/                  ← carpeta que se publica (Netlify: publish = "site")
  index.html           ← página principal (generada por build.py, no editar a mano)
  privacidad.html      ← Política de Privacidad (Ley 25.326)
  404.html
  css/styles.css       ← estilos y design tokens
  js/main.js           ← menú, catálogo, carrusel, formulario → WhatsApp, botón flotante, mapa
  fonts/               ← Poppins e Inter alojadas en el sitio (sin Google Fonts)
  img/materiales/      ← 44 muestras de piedra del catálogo
  img/trabajos/        ← fotos de "Nuestros trabajos" (440 y 880 px de alto)
  _headers             ← cabeceras de seguridad y CSP
  _redirects
  .well-known/security.txt
src/index.src.html     ← plantilla de la página principal
build.py               ← genera index.html (catálogo y carrusel), mapa y favicon
netlify.toml
```

## Cómo editar

1. Los textos de la página se cambian en `src/index.src.html`.
2. El catálogo de piedras (`CATALOGO`) y las fotos del carrusel (`TRABAJOS`) se definen en `build.py`.
3. Regenerar la página (requiere Python 3 y Pillow):

   ```bash
   python3 build.py
   ```

### Sumar una foto a "Nuestros trabajos"

1. Exportarla a WebP en dos alturas: `site/img/trabajos/<nombre>-440.webp` y `<nombre>-880.webp`, **sin datos EXIF/GPS**.
2. Agregar `("<nombre>", "Título", "Ambiente")` a la lista `TRABAJOS` de `build.py`.
3. Correr `python3 build.py`.

Todas las fotos del carrusel se muestran con la misma altura; el ancho depende de cada foto.

## Publicación

Conectar el repositorio en Netlify (o arrastrar la carpeta `site/`). No hay paso de build: se publica `site/` tal cual. Netlify da HTTPS automático. Si el dominio usa Cloudflare, dejarlo **solo como DNS** (nube gris), sin proxy.

Después de publicar, verificar en securityheaders.com, SSL Labs y Mozilla Observatory (objetivo: nota A o superior).

## Seguridad (resumen)

- CSP estricta (`script-src 'self'`, sin scripts ni handlers inline) y cabeceras HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy y COOP en `site/_headers`.
- JavaScript sin `innerHTML` ni `eval`; los textos del formulario se limpian y se codifican con `encodeURIComponent`.
- Formulario sin servidor: arma el mensaje y abre WhatsApp (decisión acordada con el estudio en lugar de Netlify Forms). No guarda datos. Capas antibots: honeypot y trampa de tiempo.
- Sin cookies, sin analítica, fuentes locales, mapa de Google con fachada (solo carga si la persona lo pide).
- Fotos sin metadatos EXIF/GPS. La imagen de la colaboración con influencer se publica con autorización de Festa.

## Pendientes [COMPLETAR]

- Dominio definitivo (canonical, Open Graph, datos estructurados, sitemap, robots, security.txt, `_redirects`).
- CUIT y email de contacto para la Política de Privacidad, y revisión legal.
- Si Festa hace medición en obra, entrega y colocación (proceso y preguntas frecuentes).
- Año de inicio o breve historia de la empresa.
- Horario de sábados y domingos.
- Vigencia del catálogo de piedras.
- Isotipo oficial para el favicon (hoy es provisorio).
- Email de seguridad de Tereré Estudio en `security.txt`.
- Nombres de material de cada foto de "Nuestros trabajos" (opcional).
