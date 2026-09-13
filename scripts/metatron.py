#!/usr/bin/env python3
"""Reconstruit le cube de Métatron du logo Stellaé en vectoriel.

Le logo d'origine ne fait que 1178 px de large, le symbole y occupe 255 x 259 px.
Aucun agrandissement ne peut en tirer une bonne qualité. La figure étant purement
géométrique, on la redessine exactement plutôt que de l'interpoler.

Géométrie relevée sur l'original :
  rayon d'un cercle            r = 26.5 px
  distance centre -> anneau 2  = 102.5 px, soit 3.87 r, donc 4 r
  hexagone pointe en haut, 13 cercles : 1 centre, 6 à 2r, 6 à 4r
  toutes les paires de centres reliées, soit 78 segments
  trait noir de 2 à 3 px sur une figure de 265 px

Usage : python3 scripts/metatron.py [dossier_de_sortie]
"""
import itertools, math, pathlib, subprocess, sys, shutil

SORTIE = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path("logo-stellae")
SORTIE.mkdir(parents=True, exist_ok=True)

R = 1.0                      # rayon d'un cercle, unité de base
TRAIT = 0.085                # épaisseur, calée sur le rapport mesuré (2,5 px sur 265)
MARGE = 0.25

def centres():
    """Les 13 centres : l'origine, 6 à 2r, 6 à 4r, hexagone pointe en haut."""
    pts = [(0.0, 0.0)]
    for distance in (2 * R, 4 * R):
        for k in range(6):
            angle = math.radians(90 + 60 * k)
            pts.append((distance * math.cos(angle), -distance * math.sin(angle)))
    return pts

def svg(couleur="currentColor", trait=TRAIT):
    pts = centres()
    demi = 5 * R + MARGE
    out = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-demi:.4f} {-demi:.4f} {2*demi:.4f} {2*demi:.4f}" '
        f'role="img" aria-label="Cube de Métatron, symbole Stellaé Experiences">',
        '<title>Cube de Métatron · Stellaé Experiences</title>',
        f'<g fill="none" stroke="{couleur}" stroke-width="{trait}" '
        'stroke-linecap="round" stroke-linejoin="round">',
    ]
    # les 78 segments d'abord, les cercles par dessus
    for (x1, y1), (x2, y2) in itertools.combinations(pts, 2):
        out.append(f'<line x1="{x1:.4f}" y1="{y1:.4f}" x2="{x2:.4f}" y2="{y2:.4f}"/>')
    for (x, y) in pts:
        out.append(f'<circle cx="{x:.4f}" cy="{y:.4f}" r="{R:.4f}"/>')
    out += ['</g>', '</svg>', '']
    return "\n".join(out)

def rendu_png(chemin_svg, chemin_png, taille):
    """Rend le SVG en PNG transparent. cairosvg si présent, sinon Chrome."""
    try:
        import cairosvg
        cairosvg.svg2png(url=str(chemin_svg), write_to=str(chemin_png),
                         output_width=taille, output_height=taille)
        return "cairosvg"
    except ImportError:
        pass
    chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    if not pathlib.Path(chrome).exists():
        return None
    html = SORTIE / "_rendu.html"
    html.write_text(
        '<style>html,body{margin:0;background:transparent}'
        f'svg{{width:{taille}px;height:{taille}px;display:block}}</style>'
        + chemin_svg.read_text(), encoding="utf-8")
    subprocess.run([chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                    "--default-background-color=00000000",
                    f"--window-size={taille},{taille}",
                    f"--screenshot={chemin_png}", f"file://{html}"],
                   capture_output=True, timeout=120)
    html.unlink(missing_ok=True)
    return "chrome" if chemin_png.exists() else None

# Deux épaisseurs : la fine reproduit le trait de l'original, parfaite en grand et
# à l'impression ; la standard reste lisible à 40 px dans une navigation.
EPAISSEURS = {"fin": 0.055, "standard": 0.085}

VARIANTES = {
    "gris":    "#6E6E6E",   # la nuance que rend le logo d'origine
    "encre":   "#2C1E14",
    "petrole": "#0A6A70",
    "lagon":   "#0F4C5C",
    "blanc":   "#FFFFFF",   # pour les fonds sombres
}

if __name__ == "__main__":
    for ep_nom, ep in EPAISSEURS.items():
        suffixe = "" if ep_nom == "standard" else f"-{ep_nom}"
        f = SORTIE / f"stellae-metatron{suffixe}.svg"
        f.write_text(svg(trait=ep), encoding="utf-8")
        print(f"  {f.name:36} vectoriel, prend la couleur du texte, trait {ep_nom}")

    for nom, couleur in VARIANTES.items():
        f = SORTIE / f"stellae-metatron-{nom}.svg"
        f.write_text(svg(couleur), encoding="utf-8")
        print(f"  {f.name:36} {couleur}")
        f2 = SORTIE / f"stellae-metatron-{nom}-fin.svg"
        f2.write_text(svg(couleur, EPAISSEURS["fin"]), encoding="utf-8")

    moteur = None
    for taille in (512, 1024, 2048, 4096):
        src = SORTIE / "stellae-metatron-gris.svg"
        png = SORTIE / f"stellae-metatron-{taille}.png"
        moteur = rendu_png(src, png, taille) or moteur
        if png.exists():
            print(f"  {png.name:36} {png.stat().st_size // 1024} Ko, fond transparent")
    png_blanc = SORTIE / "stellae-metatron-blanc-2048.png"
    rendu_png(SORTIE / "stellae-metatron-blanc.svg", png_blanc, 2048)
    if png_blanc.exists():
        print(f"  {png_blanc.name:36} {png_blanc.stat().st_size // 1024} Ko, pour fonds sombres")
    print(f"\nrendu PNG par : {moteur}")
