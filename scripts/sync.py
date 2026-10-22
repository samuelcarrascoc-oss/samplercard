"""Baja el catálogo público de samplercard en TCGMatch y lo guarda en data/catalogo.json.

Lo corre la GitHub Action cada ~15 min (y se puede correr a mano).
Si TCGMatch falla o devuelve muchos menos productos que la vez anterior,
NO se sobrescribe: el sitio queda con el último catálogo bueno.
Solo usa la biblioteca estándar de Python.
"""
import json
import sys
import time
import urllib.request
from pathlib import Path

SELLER = "6a7a6fbd8839ab183ce672c2"
API = "https://api.tcgmatch.cl/products/seller/" + SELLER
RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "data" / "catalogo.json"
POR_PAGINA = 25  # la API no entrega más de 25 por página
CAIDA_MAXIMA = 0.5  # si llegan menos de la mitad de productos que antes, se asume falla

IDIOMAS = {"english": "Inglés", "spanish": "Español", "portugues": "Portugués", "japanese": "Japonés"}
ESTADOS = {"near-mint": "NM", "light-played": "LP", "moderately-played": "MP",
           "heavily-played": "HP", "damaged": "Dañada", "new": "Nuevo", "used": "Usado"}


def pedir(url, intentos=4):
    for i in range(intentos):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "samplercard-sitio/1.0"})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except Exception as e:  # red, 429, 5xx
            if i == intentos - 1:
                raise
            print(f"  reintento {i + 1} ({e})")
            time.sleep(3 * (i + 1))


def bajar(categoria):
    items, ediciones, pagina = [], {}, 1
    while True:
        url = f"{API}?pagina={pagina}&limit={POR_PAGINA}&graded=include&inStock=true&category={categoria}"
        d = pedir(url)["data"]
        for e in d.get("filters", {}).get("editions", []):
            ediciones[e["key"]] = e["value"]
        items += d["items"]
        total = d.get("totalItems", 0)
        if not d["items"] or len(items) >= total:
            return items, ediciones, total
        pagina += 1
        time.sleep(0.4)


def version(p):
    if p.get("isHoloReverse"):
        return "Reverse"
    if p.get("isHolo"):
        return "Holo"
    return "Normal"


def carta(p, ediciones):
    cat = p.get("catalog") or {}
    info = cat.get("cardInfo") or {}
    fotos = [i["url"] for i in p.get("images") or [] if isinstance(i, dict) and i.get("url")]
    fotos += cat.get("images") or []
    return {
        "id": p["_id"],
        "nombre": p.get("name") or cat.get("name", ""),
        "precio": p.get("price", 0),
        "stock": p.get("quantity", 0),
        "idioma": IDIOMAS.get(p.get("language"), p.get("language") or ""),
        "estado": ESTADOS.get(p.get("status"), p.get("status") or ""),
        "version": version(p),
        "set": ediciones.get(cat.get("set"), cat.get("set") or ""),
        "numero": info.get("code", ""),
        "rareza": info.get("rarity", ""),
        "foto": fotos[0] if fotos else "",
    }


def accesorio(p):
    fotos = [i["url"] for i in p.get("images") or [] if isinstance(i, dict) and i.get("url")]
    nombre = p.get("name", "")
    return {
        "id": p["_id"],
        "nombre": nombre,
        "precio": p.get("price", 0),
        "stock": p.get("quantity", 0),
        "estado": ESTADOS.get(p.get("status"), p.get("status") or ""),
        "tipo": p.get("type", ""),
        "es_deck": any(t in nombre.lower() for t in ("deck", "pack")) or bool(p.get("isDeck")),
        "descripcion": p.get("description", ""),
        "fotos": fotos,
    }


def main():
    try:
        cartas, ediciones, total_c = bajar("card")
        accs, _, total_a = bajar("accessory")
    except Exception as e:
        print(f"ERROR al leer TCGMatch: {e}. Se mantiene el catálogo anterior.")
        return 0

    nuevo = {
        "cartas": sorted((carta(p, ediciones) for p in cartas), key=lambda c: c["nombre"]),
        "accesorios": [accesorio(p) for p in accs],
    }
    n_nuevo = len(nuevo["cartas"]) + len(nuevo["accesorios"])
    print(f"TCGMatch: {len(cartas)}/{total_c} cartas, {len(accs)}/{total_a} accesorios")

    anterior = json.loads(SALIDA.read_text(encoding="utf-8")) if SALIDA.exists() else None
    if anterior:
        n_ant = len(anterior["cartas"]) + len(anterior["accesorios"])
        if n_nuevo < n_ant * CAIDA_MAXIMA:
            print(f"Llegaron {n_nuevo} productos vs {n_ant} antes: parece una falla, no se guarda.")
            return 0
        if {k: anterior[k] for k in ("cartas", "accesorios")} == nuevo:
            print("Sin cambios.")
            return 0

    nuevo["actualizado"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    SALIDA.parent.mkdir(exist_ok=True)
    SALIDA.write_text(json.dumps(nuevo, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Guardado {SALIDA.name}: {n_nuevo} productos")
    return 0


if __name__ == "__main__":
    sys.exit(main())
