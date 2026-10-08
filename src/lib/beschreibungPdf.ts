import "server-only";

import { load, type CheerioAPI } from "cheerio";
import type { jsPDF } from "jspdf";
import { sanitizeBeschreibung } from "@/lib/sanitize";

interface TextTeil { text: string; fett: boolean }
interface BeschreibungsAbsatz {
  teile: TextTeil[];
  ebene: number;
  listenzeichen?: string;
}
type HtmlKnoten = ReturnType<CheerioAPI>[number];

/** HTML-Struktur erhalten; Klartext für die Suche ist keine Druckvorlage. */
export function leseBeschreibungsAbsaetze(html: string): BeschreibungsAbsatz[] {
  const $ = load(sanitizeBeschreibung(html), {}, false);
  const absaetze: BeschreibungsAbsatz[] = [];

  function inhalt(knoten: HtmlKnoten[], ebene = 0, listenzeichen?: string) {
    let teile: TextTeil[] = [];
    let zeichen = listenzeichen;
    function abschliessen() {
      while (teile.length && !teile[0].text.trim()) teile.shift();
      while (teile.length && !teile.at(-1)!.text.trim()) teile.pop();
      if (!teile.length) return;
      teile[0].text = teile[0].text.trimStart();
      teile[teile.length - 1].text = teile[teile.length - 1].text.trimEnd();
      absaetze.push({ teile, ebene, listenzeichen: zeichen });
      zeichen = undefined;
      teile = [];
    }
    function besuchen(knoten: HtmlKnoten, fett = false) {
      if (knoten.type === "text") {
        const text = knoten.data.replace(/\s+/g, " ");
        if (text) teile.push({ text, fett });
        return;
      }
      if (knoten.type !== "tag") return;
      if (knoten.name === "ul" || knoten.name === "ol") {
        abschliessen();
        $(knoten).children("li").each((index, eintrag) => {
          inhalt($(eintrag).contents().toArray(), ebene + 1, knoten.name === "ol" ? `${index + 1}.` : "•");
        });
        return;
      }
      if (knoten.name === "br" || knoten.name === "hr") { abschliessen(); return; }
      const block = /^(p|h[2-4]|blockquote|pre)$/.test(knoten.name);
      if (block) abschliessen();
      $(knoten).contents().each((_, kind) => besuchen(kind, fett || /^(strong|b|h[2-4])$/.test(knoten.name)));
      if (block) abschliessen();
    }
    knoten.forEach((knoten) => besuchen(knoten));
    abschliessen();
  }
  inhalt($.root().contents().toArray());
  return absaetze;
}

interface BeschreibungsZeile {
  teile: TextTeil[];
  einzug: number;
  listenzeichen?: string;
  abstandVor: number;
}

/** Vermisst Listen mit hängendem Einzug, sodass Folgezeilen unter dem Text stehen. */
export function planeBeschreibung(doc: jsPDF, absaetze: BeschreibungsAbsatz[], breite: number, groesse: number, maximaleHoehe: number) {
  const zeilenhoehe = groesse * 25.4 / 72 * 1.3;
  const alleZeilen: BeschreibungsZeile[] = [];
  doc.setFontSize(groesse);
  function textbreite(text: string, fett: boolean) {
    doc.setFont("helvetica", fett ? "bold" : "normal");
    return doc.getTextWidth(text);
  }
  for (const absatz of absaetze) {
    const einzug = Math.min(absatz.ebene * 5, 40);
    const zeilenbreite = breite - einzug;
    let teile: TextTeil[] = [];
    let belegt = 0;
    let leerzeichen = false;
    let ersteZeile = true;
    function abschliessen() {
      if (!teile.length) return;
      alleZeilen.push({ teile, einzug, listenzeichen: ersteZeile ? absatz.listenzeichen : undefined,
        abstandVor: ersteZeile && alleZeilen.length ? (absatz.ebene ? 0.7 : 2) : 0 });
      ersteZeile = false;
      teile = []; belegt = 0; leerzeichen = false;
    }
    function anhaengen(text: string, fett: boolean) {
      const vorher = teile.at(-1);
      if (vorher?.fett === fett) vorher.text += text;
      else teile.push({ text, fett });
      belegt += textbreite(text, fett);
    }
    for (const teil of absatz.teile) {
      for (const wort of teil.text.match(/\s+|\S+/g) ?? []) {
        if (!wort.trim()) { leerzeichen = true; continue; }
        let abstand = leerzeichen && teile.length ? " " : "";
        if (teile.length && belegt + textbreite(abstand + wort, teil.fett) > zeilenbreite) {
          abschliessen(); abstand = "";
        }
        doc.setFont("helvetica", teil.fett ? "bold" : "normal");
        const stuecke = doc.splitTextToSize(wort, zeilenbreite) as string[];
        stuecke.forEach((stueck, index) => {
          if (index) abschliessen();
          anhaengen((index ? "" : abstand) + stueck, teil.fett);
        });
        leerzeichen = false;
      }
    }
    abschliessen();
  }

  const zeilen: BeschreibungsZeile[] = [];
  let hoehe = 0;
  for (const zeile of alleZeilen) {
    if (hoehe + zeile.abstandVor + zeilenhoehe > maximaleHoehe) break;
    zeilen.push({ ...zeile, teile: zeile.teile.map((teil) => ({ ...teil })) });
    hoehe += zeile.abstandVor + zeilenhoehe;
  }
  const gekuerzt = zeilen.length < alleZeilen.length;
  const letzte = zeilen.at(-1);
  if (gekuerzt && letzte) {
    const restbreite = breite - letzte.einzug - textbreite(" …", false);
    while (letzte.teile.length && letzte.teile.reduce((summe, teil) => summe + textbreite(teil.text, teil.fett), 0) > restbreite) {
      const teil = letzte.teile.at(-1)!;
      teil.text = teil.text.slice(0, -1).trimEnd();
      if (!teil.text) letzte.teile.pop();
    }
    letzte.teile.push({ text: " …", fett: false });
  }
  return { zeilen, hoehe, zeilenhoehe, gekuerzt };
}
