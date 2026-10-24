// samplercard: vitrina que lee data/catalogo.json (lo actualiza la GitHub Action desde TCGMatch)
const WHATSAPP = "56971022853";
const TCGMATCH = "https://tcgmatch.cl/producto/";
const POR_TANDA = 48;

const SECCIONES = {
  inicio: { titulo: "samplercard · Pokémon TCG Chile" },
  singles: { titulo: "Singles", bajada: "Cartas sueltas en stock. Toca una carta para ver el detalle." },
  decks: { titulo: "Deck - Packs", bajada: "Mazos completos y packs de cartas, listos para jugar." },
  accesorios: { titulo: "Accesorios", bajada: "Cajas, pins, peluches y más para cuidar tu colección." },
  sellados: { titulo: "Sellados", bajada: "Producto sellado: sobres, ETB y colecciones." },
};

const $ = (id) => document.getElementById(id);
const estado = { datos: null, seccion: "singles", lista: [], mostrados: 0 };

const pesos = (n) => "$" + Number(n || 0).toLocaleString("es-CL");
const normal = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function linkWhatsapp(p) {
  const partes = [p.nombre];
  if (p.set) partes.push(p.set);
  if (p.idioma) partes.push(p.idioma);
  if (p.version && p.version !== "Normal") partes.push(p.version);
  let texto = `Hola! Quiero consultar por: ${partes.join(" · ")} a ${pesos(p.precio)}${p.unidad ? " " + p.unidad : ""}.`;
  if (p.id) texto += ` ${TCGMATCH}${p.id}`;
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
}

async function cargar() {
  try {
    const opcional = (url) => fetch(url, { cache: "no-cache" }).then((r) => r.json()).catch(() => []);
    const [cat, sell, extras] = await Promise.all([
      fetch("data/catalogo.json", { cache: "no-cache" }).then((r) => r.json()),
      opcional("data/sellados.json"),
      opcional("data/extras.json"),
    ]);
    // extras.json: productos que no están en TCGMatch (solo WhatsApp); "publicado": false los oculta
    const propios = extras.filter((e) => e.publicado !== false);
    estado.datos = {
      ...cat,
      accesorios: [...cat.accesorios, ...propios.filter((e) => e.seccion !== "sellados")],
      sellados: [...sell, ...propios.filter((e) => e.seccion === "sellados")],
    };
  } catch (e) {
    $("vacio").hidden = false;
    $("vacio").textContent = "No se pudo cargar el catálogo. Intenta recargar la página.";
    return;
  }
  llenarFiltros();
  llenarCifras();
  llenarArte();
  if (estado.datos.actualizado) {
    const f = new Date(estado.datos.actualizado);
    $("actualizado").textContent = "Precios y stock sincronizados con TCGMatch · " +
      f.toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" });
  }
  irA(location.hash);
}

function llenarFiltros() {
  const cartas = estado.datos.cartas;
  const opciones = (campo) => [...new Set(cartas.map((c) => c[campo]).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
  for (const [id, campo] of [["f-idioma", "idioma"], ["f-version", "version"], ["f-set", "set"]]) {
    for (const v of opciones(campo)) $(id).add(new Option(v, v));
  }
}

function llenarCifras() {
  const cifras = [
    [productos("singles").length, "singles en stock"],
    [productos("decks").length, "deck - packs"],
    [productos("accesorios").length, "accesorios"],
  ].filter(([n]) => n > 0);
  $("cifras").innerHTML = cifras.map(([n, t]) => `<div><strong>${n.toLocaleString("es-CL")}</strong><span>${t}</span></div>`).join("");
}

// Portada: las imágenes salen del stock real, así nunca muestra algo que no hay
function llenarArte() {
  const img = (src, alt) => `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy">`;
  // las 3 cartas más caras cuya imagen sí carga (algunas fotos del catálogo fallan); la más cara al centro
  const candidatas = productos("singles").filter((c) => c.foto).sort((a, b) => b.precio - a.precio).slice(0, 10);
  const carga = (c) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(c); i.onerror = () => ok(null); i.src = c.foto; });
  Promise.all(candidatas.map(carga)).then((r) => {
    const top = r.filter(Boolean).slice(0, 3);
    $("arte-hero").innerHTML = [top[1], top[0], top[2]].filter(Boolean).map((c) => img(c.foto, c.nombre)).join("");
  });
  for (const s of ["decks", "accesorios", "sellados"]) {
    const fotos = productos(s).filter((p) => (p.fotos || [])[0]).slice(0, 4);
    const arte = $(`arte-${s}`);
    arte.classList.toggle("cuatro", fotos.length > 3);
    arte.innerHTML = fotos.map((p) => img(p.fotos[0], p.nombre)).join("");
    $(`v-${s}`).hidden = productos(s).length === 0;
  }
}

function productos(seccion) {
  const d = estado.datos;
  if (seccion === "singles") return d.cartas;
  if (seccion === "decks") return d.accesorios.filter((a) => a.es_deck);
  if (seccion === "accesorios") return d.accesorios.filter((a) => !a.es_deck);
  return d.sellados;
}

function filtrar() {
  let lista = productos(estado.seccion);
  if (estado.seccion === "singles") {
    const q = normal($("buscar").value).trim();
    const idioma = $("f-idioma").value, version = $("f-version").value, set = $("f-set").value;
    lista = lista.filter((c) =>
      (!idioma || c.idioma === idioma) && (!version || c.version === version) && (!set || c.set === set) &&
      (!q || q.split(/\s+/).every((t) => normal(`${c.nombre} ${c.set} ${c.numero} ${c.rareza}`).includes(t))));
    const orden = $("f-orden").value;
    lista = [...lista].sort(orden === "precio-asc" ? (a, b) => a.precio - b.precio
      : orden === "precio-desc" ? (a, b) => b.precio - a.precio
      : (a, b) => a.nombre.localeCompare(b.nombre, "es"));
    $("conteo").textContent = `${lista.length} carta${lista.length === 1 ? "" : "s"}`;
  }
  estado.lista = lista;
  estado.mostrados = 0;
  $("grilla").innerHTML = "";
  mostrarMas();
}

function tarjeta(p, i) {
  const esCarta = estado.seccion === "singles";
  const foto = esCarta ? p.foto : (p.fotos || [])[0];
  const chips = esCarta
    ? [p.idioma, p.version, p.estado].filter(Boolean).map((t) =>
        `<span class="chip ${t === "Holo" ? "holo" : t === "Reverse" ? "reverse" : ""}">${esc(t)}</span>`).join("")
    : (p.estado ? `<span class="chip">${esc(p.estado)}</span>` : "");
  const detalle = esCarta ? [p.set, p.numero].filter(Boolean).join(" · ") : "";
  return `<button class="item${esCarta ? "" : " cuadrada"}" data-i="${i}">
    <div class="foto">${foto ? `<img src="${esc(foto)}" alt="${esc(p.nombre)}" loading="lazy">` : ""}</div>
    <h2>${esc(p.nombre)}</h2>
    ${detalle ? `<p class="detalle">${esc(detalle)}</p>` : ""}
    <div class="chips">${chips}</div>
    <div class="precio"><strong>${pesos(p.precio)}${p.unidad ? ` <small>${esc(p.unidad)}</small>` : ""}</strong><span>${p.stock > 1 ? p.stock + " disp." : "1 disp."}</span></div>
  </button>`;
}

function mostrarMas() {
  const { lista } = estado;
  const desde = estado.mostrados, hasta = Math.min(lista.length, desde + POR_TANDA);
  $("grilla").insertAdjacentHTML("beforeend", lista.slice(desde, hasta).map((p, k) => tarjeta(p, desde + k)).join(""));
  estado.mostrados = hasta;
  $("ver-mas").hidden = hasta >= lista.length;
  const vacio = lista.length === 0;
  $("vacio").hidden = !vacio;
  if (vacio) {
    $("vacio").innerHTML = estado.seccion === "sellados"
      ? `Pronto publicaremos producto sellado. ¿Buscas algo? <a class="enlace" href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hola! Busco producto sellado:")}" target="_blank" rel="noopener">Escríbenos por WhatsApp</a>.`
      : "No hay productos que coincidan.";
  }
}

function abrirFicha(p) {
  const esCarta = estado.seccion === "singles";
  const fotos = esCarta ? [p.foto].filter(Boolean) : p.fotos || [];
  const detalle = esCarta
    ? [p.set, p.numero, p.rareza].filter(Boolean).join(" · ") + `<br>${[p.idioma, p.version, p.estado].filter(Boolean).join(" · ")}`
    : esc(p.estado || "");
  $("ficha-cuerpo").innerHTML = `
    <div class="ficha-fotos">${fotos.map((f) => `<img src="${esc(f)}" alt="${esc(p.nombre)}">`).join("")}</div>
    <div>
      <h2>${esc(p.nombre)}</h2>
      <p class="detalle">${esCarta ? esc(detalle).replace("&lt;br&gt;", "<br>") : detalle}</p>
      <p class="grande">${pesos(p.precio)}${p.unidad ? ` <small>${esc(p.unidad)}</small>` : ""}</p>
      <p class="stock">${p.stock} disponible${p.stock === 1 ? "" : "s"}</p>
      <div class="botones">
        <a class="boton whatsapp" href="${linkWhatsapp(p)}" target="_blank" rel="noopener">Consultar al WhatsApp</a>
        ${p.id ? `<a class="boton tcgmatch" href="${TCGMATCH}${esc(p.id)}" target="_blank" rel="noopener">Comprar en TCG Match</a>` : ""}
      </div>
      <p class="nota">Retiro coordinado en Estación Central o envío (costo aparte).</p>
      ${p.descripcion ? `<p class="descripcion">${esc(p.descripcion)}</p>` : ""}
    </div>`;
  $("ficha").showModal();
}

function irA(hash) {
  const s = (hash || "").replace("#", "");
  estado.seccion = SECCIONES[s] ? s : "inicio";
  const info = SECCIONES[estado.seccion];
  const inicio = estado.seccion === "inicio";
  document.querySelectorAll(".secciones a").forEach((a) => a.classList.toggle("activa", a.dataset.seccion === estado.seccion));
  $("portada").hidden = !inicio;
  for (const id of ["intro", "grilla"]) $(id).hidden = inicio;
  $("filtros").hidden = estado.seccion !== "singles";
  if (inicio) {
    $("ver-mas").hidden = $("vacio").hidden = true;
    document.title = info.titulo;
    return;
  }
  $("titulo").textContent = info.titulo;
  $("bajada").textContent = info.bajada;
  document.title = `${info.titulo} · samplercard`;
  if (estado.datos) filtrar();
}

let espera;
$("buscar").addEventListener("input", () => { clearTimeout(espera); espera = setTimeout(filtrar, 150); });
["f-idioma", "f-version", "f-set", "f-orden"].forEach((id) => $(id).addEventListener("change", filtrar));
$("ver-mas").addEventListener("click", mostrarMas);
$("grilla").addEventListener("click", (e) => {
  const b = e.target.closest(".item");
  if (b) abrirFicha(estado.lista[+b.dataset.i]);
});
$("cerrar").addEventListener("click", () => $("ficha").close());
$("ficha").addEventListener("click", (e) => { if (e.target === $("ficha")) $("ficha").close(); });
window.addEventListener("hashchange", () => { irA(location.hash); window.scrollTo(0, 0); });

cargar();
