#!/usr/bin/env python3
"""Importe le Google Doc de Stéphanie (export texte) dans src/content/ (Markdown + frontmatter).

À lancer une seule fois au démarrage, ou quand le doc change avant la mise en service du tableau de bord.
Après, la source de vérité devient src/content/ (modifiée par Stéphanie via /admin).

Usage : python3 scripts/import_doc.py ../maquettes/sources/doc-stephanie.txt
"""
import re, sys, pathlib, unicodedata

SITE = pathlib.Path(__file__).resolve().parent.parent
DOC = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else SITE.parent / "maquettes" / "sources" / "doc-stephanie.txt"
lines = DOC.read_text(encoding="utf-8").splitlines()

def sl(a, b):
    return lines[a - 1:b - 1]

def clean(t):
    t = t.strip()
    t = re.sub(r"\\\[(.+?)\\\]", r"\1", t)
    t = t.replace("\\", "")
    return t

def md(slice_, drop_h1=True):
    """Markdown propre : titres sans gras, paragraphes, sans la signature ni les boutons."""
    out = []
    for raw in slice_:
        t = raw.strip()
        if not t:
            continue
        if re.match(r"^(onglet|article)\b", t, re.I) and not t.startswith("#"):
            continue
        if t.startswith("#"):
            level = len(t) - len(t.lstrip("#"))
            title = clean(t.lstrip("#")).strip("* ")
            if level == 1 and drop_h1:
                continue
            out.append("#" * level + " " + title)
            out.append("")
            continue
        t = clean(t)
        plain = t.strip("* ")
        if plain == "Vision · Organisation · Terrain":
            continue
        if re.match(r"^\*?\*?\[", t) or t.startswith("[") or plain.startswith("[") :
            continue
        if re.match(r"^\*\*(Instagram|E-mail|WhatsApp)\*\*", t):
            continue  # libellés des liens de contact, portés par le frontmatter
        out.append(t)
        out.append("")
    return "\n".join(out).strip() + "\n"

def h1(slice_):
    for raw in slice_:
        t = raw.strip()
        if t.startswith("# "):
            return clean(t[2:]).strip("* ")
    return ""

def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s

def write(path, front, body):
    path.parent.mkdir(parents=True, exist_ok=True)
    fm = "---\n" + "".join(f"{k}: {v}\n" for k, v in front.items()) + "---\n\n"
    path.write_text(fm + body, encoding="utf-8")
    print("écrit", path.relative_to(SITE))

def yaml(s):
    return '"' + s.replace('"', '\\"') + '"'

C = SITE / "src" / "content"

# ---- Accueil
acc = sl(6, 52)
acc_body = md(acc)
paras = [p for p in acc_body.split("\n\n") if p and not p.startswith("#")]
lead, sub = paras[0], paras[1]
rest = acc_body.split("\n\n", 2)[2] if len(paras) > 2 else ""
rest = rest.replace(lead + "\n\n", "").replace(sub + "\n\n", "")
write(C / "pages" / "accueil.md", {
    "title": yaml(h1(acc)),
    "eyebrow": yaml("Stellaé Experiences · Création de retraites et de séjours immersifs"),
    "lead": yaml(lead),
    "sub": yaml(sub),
    "cta_label": yaml("Découvrir mon accompagnement"),
    "cta_href": "/organiser-une-retraite",
    "cta2_label": yaml("Me parler de ma retraite"),
    "cta2_href": "/contact",
    "closing": yaml("Que tu sois au début de ton projet ou que tu aies déjà l’habitude d’organiser des retraites, je peux intervenir à partir de là où tu en es."),
    "seo_description": yaml("Stéphanie Lem accompagne coachs, thérapeutes et créateurs dans la création de retraites et de séjours immersifs : vision, organisation, terrain."),
}, rest)

# ---- Organiser
org = sl(52, 130)
org_body = md(org)
org_body = re.sub(r"\n*C’est cette continuité[^\n]*\n*", "\n", org_body)
write(C / "pages" / "organiser-une-retraite.md", {
    "title": yaml("Organiser une retraite"),
    "eyebrow": yaml("Mon accompagnement"),
    "closing": yaml("Comprendre le projet, construire tout ce qui doit l’être et, lorsque c’est nécessaire, être là pour le faire vivre concrètement."),
    "cta_label": yaml("Me parler de ma retraite"),
    "cta_href": "/contact",
    "seo_description": yaml("Construire une retraite qui tient vraiment : lieu, budget, transports, hébergements, planning, participants, avant et pendant le séjour."),
}, org_body)

# ---- À propos
ap = sl(130, 186)
ap_body = md(ap)
ap_paras = ap_body.split("\n\n")
intro = "\n\n".join(ap_paras[:4])
rest = "\n\n".join(ap_paras[4:])
write(C / "pages" / "a-propos.md", {
    "title": yaml("Je m’appelle Stéphanie"),
    "eyebrow": yaml("À propos"),
    "intro": yaml(intro.replace("\n\n", "\\n\\n")),
    "portrait": "/images/portrait.jpg",
    "closing": yaml("Si tu as un projet de retraite ou de séjour immersif en tête, tu peux m’en parler."),
    "cta_label": yaml("Me parler de mon projet"),
    "cta_href": "/contact",
    "seo_description": yaml("Éducatrice de jeunes enfants, doula, sales manager : le parcours de Stéphanie Lem, au service de la création de retraites et de séjours immersifs."),
}, rest)

# ---- Projets
pj = sl(186, 240)
pj_body = md(pj)
chunks = re.split(r"\n(?=## )", pj_body)
intro = chunks[0].strip()
imgs = {"Madagascar": ("/images/ocean.jpg", "Île Sainte-Marie"), "Marrakech": ("/images/fleurs.jpg", "Maroc"), "Près de Chartres": ("/images/plage.jpg", "Eure-et-Loir")}
write(C / "pages" / "projets.md", {
    "title": yaml("Trois retraites, trois intentions"),
    "eyebrow": yaml("Projets en cours"),
    "closing": yaml("Chaque retraite commence quelque part. Parfois avec une vision déjà très claire. Parfois avec une envie, une destination, une idée qui revient depuis longtemps."),
    "cta_label": yaml("Me parler de mon projet"),
    "cta_href": "/contact",
    "seo_description": yaml("Les retraites que Stéphanie Lem accompagne actuellement : Madagascar, Marrakech, près de Chartres."),
}, intro.replace("\n\n", " ") + "\n")
for i, ch in enumerate(chunks[1:]):
    lieu = ch.split("\n", 1)[0].lstrip("# ").strip()
    if lieu.startswith("Et ton projet") or "Et ton projet" in ch.split("\n", 1)[0]:
        continue
    body = ch.split("\n", 1)[1]
    avec = re.search(r"^### (.+)$", body, re.M)
    body = re.sub(r"^### .+\n\n?", "", body, flags=re.M)
    body = re.split(r"\n\*\*Et ton projet", body)[0].strip() + "\n"
    img, sous = imgs.get(lieu, ("/images/plage.jpg", ""))
    write(C / "projets" / f"{i+1:02d}-{slug(lieu)}.md", {
        "lieu": yaml(lieu), "sous_titre": yaml(sous), "avec": yaml(avec.group(1) if avec else ""),
        "image": img, "ordre": i + 1,
    }, body)

# ---- Blog
articles = {1: sl(270, 378), 2: sl(378, 506), 3: sl(506, 660), 5: sl(788, 998), 6: sl(998, 1220), 7: sl(1220, 1468)}
themes = {1: "Vision", 2: "Expérience", 3: "Lieu", 5: "Groupe", 6: "Inscriptions", 7: "Budget"}
dates = {1: "2026-09-01", 2: "2026-09-02", 3: "2026-09-03", 5: "2026-09-04", 6: "2026-09-05", 7: "2026-09-06"}
for n, s in articles.items():
    title = h1(s)
    body = md(s)
    first = body.split("\n\n")[0]
    write(C / "blog" / f"{slug(title)[:60]}.md", {
        "title": yaml(title), "theme": yaml(themes[n]), "date": dates[n],
        "description": yaml(first[:155].rsplit(" ", 1)[0] + "…" if len(first) > 155 else first),
        "draft": "false",
    }, body)
for title, theme in [("Comment construire le programme d’une retraite sans vouloir tout remplir ?", "Programme"),
                     ("Comment organiser une retraite sans devenir indispensable à tout ?", "Organisation")]:
    write(C / "blog" / f"{slug(title)[:60]}.md", {
        "title": yaml(title), "theme": yaml(theme), "date": "2026-09-07",
        "description": yaml("Article à venir."), "draft": "true",
    }, "Article en cours d’écriture.\n")

# ---- Contact
ct = sl(1690, 1713)
ct_body = md(ct)
write(C / "pages" / "contact.md", {
    "title": yaml("Me contacter"),
    "eyebrow": yaml("Contact"),
    "instagram": "https://www.instagram.com/",
    "email": "contact@stephanielem.fr",
    "whatsapp": "https://wa.me/",
    "seo_description": yaml("Un projet de retraite ou de séjour immersif ? Écris à Stéphanie Lem par Instagram, e-mail ou WhatsApp."),
}, ct_body)
