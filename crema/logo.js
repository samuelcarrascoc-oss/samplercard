// samplercard · propuesta Crema vinilo: fija la paleta y dibuja el logo elegido (B6 "Noche con brillo", 24-nov)
document.documentElement.dataset.tema = "crema";
// Logo B6: carta oscura inclinada con borde mostaza; vinilo con aro claro, surcos y brillo; brazo y 3 pads de sampler
const LOGO = `<g transform="rotate(-7.5 220 290)">
  <rect x="40" y="40" width="360" height="500" rx="56" fill="#F2B824"/>
  <rect x="60" y="60" width="320" height="460" rx="38" fill="#2C2540"/>
  <circle cx="220" cy="248" r="120" fill="#121018" stroke="#FFF6E6" stroke-width="5"/>
  <g fill="none" stroke="#FFF6E6" stroke-opacity=".3" stroke-width="2.5"><circle cx="220" cy="248" r="104"/><circle cx="220" cy="248" r="90"/><circle cx="220" cy="248" r="76"/></g>
  <path d="M220 248 L220 128 A120 120 0 0 1 305 163 Z" fill="#FFF6E6" fill-opacity=".18"/>
  <path d="M220 248 L220 368 A120 120 0 0 1 135 333 Z" fill="#FFF6E6" fill-opacity=".18"/>
  <circle cx="220" cy="248" r="46" fill="#E5446D"/>
  <circle cx="220" cy="248" r="9" fill="#F2B824"/>
  <line x1="300" y1="188" x2="352" y2="100" stroke="#F2B824" stroke-width="15" stroke-linecap="round"/>
  <circle cx="352" cy="100" r="19" fill="#F2B824"/>
  <rect x="104" y="406" width="64" height="54" rx="12" fill="#E5446D"/>
  <rect x="188" y="406" width="64" height="54" rx="12" fill="#F2B824"/>
  <rect x="272" y="406" width="64" height="54" rx="12" fill="#2A9D8F"/>
</g>`;
document.querySelectorAll("svg[data-logo]").forEach((s) => { s.setAttribute("viewBox", "0 0 440 580"); s.innerHTML = LOGO; });
