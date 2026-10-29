"""Erzeugt die verständlichen Datenschutzunterlagen aus ihren Markdown-Quellen.

Layout nach den MobileReserve-Unterlagen vom Oktober 2026. Zur ersten
Übernahme kann --vorlage auf eine unveränderte Referenzdatei zeigen.
Folgeläufe verwenden die vorhandene Ausgabe und erhalten deren Stilpaket.
Danach jede Ausgabe mit dem gebündelten render_docx.py visuell prüfen.
"""
from copy import deepcopy
from pathlib import Path
import argparse
import re

from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.opc.constants import RELATIONSHIP_TYPE as RT

ORDNER = Path(__file__).resolve().parents[1]
BLAU = "233D4D"
GELB = "FFF2CC"
TITEL = {
    "TOM": "Technische und\norganisatorische Maßnahmen",
    "VVT": "Verzeichnis von\nVerarbeitungstätigkeiten",
    "DSFA": "Datenschutzfolgenabschätzung",
}


def element(name, **werte):
    knoten = OxmlElement("w:" + name)
    for schluessel, wert in werte.items():
        knoten.set(qn("w:" + schluessel), str(wert))
    return knoten


def feldtext(absatz, text, fett=None):
    for teil in re.split(r"(\[[^\]]+\])", text):
        if not teil:
            continue
        lauf = absatz.add_run(teil)
        lauf.bold = fett
        if teil.startswith("[") and not re.fullmatch(r"\[Q[\dQ, –-]+\]", teil):
            lauf.text = "[ERGÄNZEN: " + teil[1:-1] + "]"
            lauf.bold = True
            lauf._r.get_or_add_rPr().append(element("shd", fill=GELB))


def text_einfuegen(absatz, text):
    for teil in re.split(r"(\*\*.+?\*\*|\[[^\]]+\]\([^)]+\)|`[^`]+`)", text):
        if not teil:
            continue
        if teil.startswith("**"):
            feldtext(absatz, teil[2:-2], True)
        elif re.fullmatch(r"\[[^\]]+\]\([^)]+\)", teil):
            treffer = re.fullmatch(r"\[([^\]]+)\]\(([^)]+)\)", teil)
            link = element("hyperlink")
            link.set(qn("r:id"), absatz.part.relate_to(treffer[2], RT.HYPERLINK, is_external=True))
            lauf = element("r")
            eig = element("rPr")
            eig.append(element("color", val=BLAU))
            eig.append(element("u", val="single"))
            lauf.append(eig)
            inhalt = element("t"); inhalt.text = treffer[1]; lauf.append(inhalt)
            link.append(lauf); absatz._p.append(link)
        elif teil.startswith("`"):
            feldtext(absatz, teil[1:-1])
        else:
            feldtext(absatz, teil)


def vorbereiten(ziel, vorlage, kurz):
    dokument = Document(vorlage or (ziel if ziel.exists() else None))
    tabellenvorlage = deepcopy(dokument.tables[0]._tbl) if dokument.tables else None
    # Der vollständige Inhalt ist ein neuer Sachtext; fremde Kommentare und
    # frühere Hyperlinks gehören nicht in die unabhängigen Behördenunterlagen.
    for kind in list(dokument._element.body):
        if kind.tag != qn("w:sectPr"):
            dokument._element.body.remove(kind)
    for kennung, rel in list(dokument.part.rels.items()):
        if rel.reltype == RT.HYPERLINK or "comments" in rel.reltype:
            dokument.part.drop_rel(kennung)
    for abschnitt in dokument.sections:
        abschnitt.page_width = Cm(21); abschnitt.page_height = Cm(29.7)
        abschnitt.top_margin = Cm(2); abschnitt.bottom_margin = Cm(1.9)
        abschnitt.left_margin = Cm(2.2); abschnitt.right_margin = Cm(2.2)
        abschnitt.header_distance = Cm(.8); abschnitt.footer_distance = Cm(.9)
        for bereich in [abschnitt.header, abschnitt.footer]:
            for kind in list(bereich._element):
                bereich._element.remove(kind)
        abschnitt.header.add_paragraph()
        fuss = abschnitt.footer.add_paragraph(style="Footer")
        fuss.paragraph_format.tab_stops.add_tab_stop(Cm(16.6), WD_TAB_ALIGNMENT.RIGHT)
        fuss.paragraph_format.space_after = Pt(0)
        fuss.add_run(f"{kurz} · weiter.bilden · 05.10.2026\tSeite ")
        for name, nachher in [("PAGE", " von "), ("NUMPAGES", "")]:
            fuss._p.append(element("fldSimple", instr=name))
            fuss.add_run(nachher)
        for lauf in fuss.runs:
            lauf.font.name = "Arial"; lauf.font.size = Pt(8)
            lauf.font.color.rgb = RGBColor.from_string("666666")
    for name, groesse, fett, vorher, nachher in [
        ("Normal",10.5,False,0,6),("Title",23,True,0,8),
        ("Subtitle",11,False,0,12),("Heading 1",14,True,15,7),
        ("Heading 2",11.5,True,11,5),("Heading 3",10.5,True,8,4),
        ("List Bullet",10.5,False,0,4),("List Number",10.5,False,0,4),
        ("Footer",8,False,0,0),
    ]:
        stil = dokument.styles[name]
        stil.font.name = "Arial"; stil.font.size = Pt(groesse)
        stil.font.bold = fett; stil.font.italic = False; stil.font.underline = False
        stil.font.color.rgb = RGBColor(0,0,0)
        pf = stil.paragraph_format
        pf.alignment = WD_ALIGN_PARAGRAPH.LEFT
        pf.space_before = Pt(vorher); pf.space_after = Pt(nachher)
        pf.line_spacing = 1.12; pf.widow_control = True
        pf.keep_with_next = name.startswith("Heading") or name in ["Title", "Subtitle"]
        for rand in stil.element.xpath(".//w:pBdr"):
            rand.getparent().remove(rand)
        spracheigenschaften = stil.element.get_or_add_rPr()
        for bisher in spracheigenschaften.xpath("./w:lang"):
            spracheigenschaften.remove(bisher)
        spracheigenschaften.append(element("lang", val="de-DE"))
    eig = dokument.core_properties
    eig.title = TITEL[kurz].replace("\n", " ")
    eig.subject = "weiter.bilden – Fortbildungsportal Schwaben"
    eig.author = ""; eig.last_modified_by = ""; eig.comments = ""
    eig.keywords = "Datenschutz, Schwaben, weiter.bilden"
    for bisher in dokument.settings.element.xpath("./w:updateFields"):
        dokument.settings.element.remove(bisher)
    dokument.settings.element.append(element("updateFields", val="true"))
    return dokument, tabellenvorlage


def tabelle(dokument, inhalt, muster):
    from docx.table import Table
    kopf = inhalt[0]
    if len(kopf) == 2:
        breiten = [4.1, 12.5]
    elif kopf[0].startswith("Risiko"):
        breiten = [6.0, 8.1, 2.5]
    else:
        breiten = [2.5, 7.5, 6.6]
    if muster is not None:
        xml = deepcopy(muster)
        for kind in list(xml):
            if kind.tag in [qn("w:tr"), qn("w:tblGrid")]:
                xml.remove(kind)
        gitter = element("tblGrid")
        for breite in breiten:
            gitter.append(element("gridCol", w=round(breite / 2.54 * 1440)))
        xml.insert(1, gitter)
        dokument._element.body.insert(-1, xml)
        tab = Table(xml, dokument._body)
    else:
        tab = dokument.add_table(rows=0, cols=len(breiten))
    tab.alignment = WD_TABLE_ALIGNMENT.CENTER; tab.autofit = False
    for spalte, breite in zip(tab.columns, breiten):
        spalte.width = Cm(breite)
    eig = tab._tbl.tblPr
    for alt in eig.xpath("./w:tblBorders"):
        eig.remove(alt)
    raender = element("tblBorders")
    for seite in ["top","left","bottom","right","insideH","insideV"]:
        raender.append(element(seite,val="single",sz=4,color="D9D9D9"))
    eig.append(raender)
    for nummer, werte in enumerate(inhalt):
        zeile = tab.add_row()
        zeile._tr.get_or_add_trPr().append(element("cantSplit"))
        if nummer == 0:
            zeile._tr.get_or_add_trPr().append(element("tblHeader"))
        for spalte, (zelle, wert, breite) in enumerate(zip(zeile.cells, werte, breiten)):
            zelle.width = Cm(breite)
            zelle.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            zeig = zelle._tc.get_or_add_tcPr()
            zeig.append(element("shd", fill=BLAU if nummer == 0 else ("F2F5F7" if nummer % 2 == 0 else "FFFFFF")))
            innen = element("tcMar")
            for seite, abstand in [("top",100),("left",110),("bottom",100),("right",110)]:
                innen.append(element(seite,w=abstand,type="dxa"))
            zeig.append(innen)
            p = zelle.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.line_spacing = 1.08
            p.paragraph_format.keep_with_next = nummer == 0
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if kopf[-1] == "Verbleibend" and spalte == 2 else WD_ALIGN_PARAGRAPH.LEFT
            text_einfuegen(p, wert)
            for lauf in p.runs:
                lauf.font.size = Pt(10)
                if nummer == 0:
                    lauf.bold = True; lauf.font.color.rgb = RGBColor(255,255,255)
    p = dokument.add_paragraph()
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1
    p.add_run().font.size = Pt(2)


def erzeugen(kurz, vorlage=None):
    stamm = f"{kurz}_Fortbildungsportal_Schwaben"
    ziel = ORDNER / f"{stamm}.docx"
    d, muster = vorbereiten(ziel, vorlage, kurz)
    zeilen = (ORDNER / f"{stamm}.md").read_text().splitlines()
    i = 0; umbruch = False; quellen = False; einfuehrung = 0
    while i < len(zeilen):
        text = zeilen[i].strip(); i += 1
        if not text: continue
        if text == "<!-- seite -->":
            # Thematische Trennung im Quelltext; Word darf natürlich fließen.
            continue
        if text == "<!-- seite-fest -->":
            umbruch = True; continue
        if text.startswith("# "):
            d.add_paragraph(TITEL[kurz], "Title"); einfuehrung = 1; continue
        if einfuehrung == 1:
            d.add_paragraph(text,"Subtitle"); einfuehrung = 2; continue
        if einfuehrung == 2:
            p = d.add_paragraph(text)
            p.paragraph_format.space_after = Pt(12)
            for r in p.runs:
                r.font.size = Pt(9); r.font.color.rgb = RGBColor.from_string("555555")
            einfuehrung = 3; continue
        if text.startswith("|"):
            block = [text]
            while i < len(zeilen) and zeilen[i].strip().startswith("|"):
                block.append(zeilen[i].strip()); i += 1
            zellen = [[t.strip() for t in zeile.strip("|").split("|")] for zeile in block]
            zellen = [zeile for zeile in zellen if not all(re.fullmatch(r"[-: ]+", t) for t in zeile)]
            tabelle(d, zellen, muster); continue
        if text.startswith("##"):
            ebene = 2 if text.startswith("###") else 1
            p = d.add_paragraph(text.lstrip("# "), f"Heading {ebene}")
            if umbruch:
                p.paragraph_format.page_break_before = True
                p.paragraph_format.space_before = Pt(0)
                umbruch = False
            quellen = text.startswith("### Quellen") or text.startswith("### Rechtsquellen") or text == "### Grundlagen"
            continue
        if text.startswith("- "):
            p = d.add_paragraph(style="Normal" if quellen else "List Bullet")
            text_einfuegen(p, text[2:])
        elif re.match(r"\d+\. ",text):
            p = d.add_paragraph(style="List Number")
            text_einfuegen(p, re.sub(r"^\d+\. ", "", text))
        else:
            p = d.add_paragraph(); text_einfuegen(p,text)
        if text.startswith("**Externe Dienste:**"):
            p.paragraph_format.keep_together = True
        if quellen:
            p.paragraph_format.space_after = Pt(4)
            for r in p.runs: r.font.size = Pt(9.5)
    d.save(ziel)
    print(ziel)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--vorlage", type=Path)
    parser.add_argument("--alle", action="store_true")
    optionen = parser.parse_args()
    for kuerzel in (["TOM", "VVT", "DSFA"] if optionen.alle else ["TOM", "VVT"]):
        erzeugen(kuerzel, optionen.vorlage)
