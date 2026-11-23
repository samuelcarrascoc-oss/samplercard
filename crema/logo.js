// samplercard · propuesta Crema vinilo: fija la paleta y dibuja el logo A "carta-tornamesa" (colores desde styles.css)
document.documentElement.dataset.tema = "crema";
// Logo A: carta inclinada que es una tornamesa (disco, etiqueta, brazo) con 3 pads de sampler; sombra dura en vez de degradado
const LOGO = `<g transform="rotate(-7.5 220 290)">
  <rect x="58" y="58" width="360" height="500" rx="56" style="fill:var(--logo-b)"/>
  <rect x="40" y="40" width="360" height="500" rx="56" style="fill:var(--logo-a)"/>
  <rect x="60" y="60" width="320" height="460" rx="38" style="fill:var(--logo-cuerpo)"/>
  <rect x="88" y="88" width="264" height="404" rx="24" fill="none" stroke-width="6" stroke-opacity=".85" style="stroke:var(--logo-linea)"/>
  <circle cx="220" cy="248" r="114" style="fill:var(--logo-disco)"/>
  <g fill="none" stroke-width="2.5" stroke-opacity=".14" style="stroke:var(--logo-linea)"><circle cx="220" cy="248" r="102"/><circle cx="220" cy="248" r="90"/><circle cx="220" cy="248" r="78"/></g>
  <path d="M220 248 L220 134 A114 114 0 0 1 300 167 Z" fill-opacity=".08" style="fill:var(--logo-linea)"/>
  <circle cx="220" cy="248" r="46" style="fill:var(--logo-b)"/>
  <circle cx="220" cy="248" r="26" fill="none" stroke-width="3" stroke-opacity=".35" style="stroke:var(--logo-disco)"/>
  <circle cx="220" cy="248" r="9" style="fill:var(--logo-a)"/>
  <line x1="296" y1="190" x2="352" y2="100" stroke-width="15" stroke-linecap="round" style="stroke:var(--logo-a)"/>
  <circle cx="352" cy="100" r="19" style="fill:var(--logo-a)"/>
  <rect x="282" y="176" width="30" height="20" rx="5" transform="rotate(-58 297 186)" style="fill:var(--logo-a)"/>
  <rect x="104" y="404" width="64" height="56" rx="12" style="fill:var(--logo-b)"/>
  <rect x="188" y="404" width="64" height="56" rx="12" style="fill:var(--logo-a)"/>
  <rect x="272" y="404" width="64" height="56" rx="12" style="fill:var(--logo-c)"/>
</g>`;
document.querySelectorAll("svg[data-logo]").forEach((s) => { s.setAttribute("viewBox", "0 0 440 580"); s.innerHTML = LOGO; });
