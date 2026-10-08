import "server-only";

import sharp from "sharp";
import { MAX_UNTERSCHRIFT_BYTES } from "@/lib/unterschrift";

export class UnterschriftsBildFehler extends Error {}

/** Dekodiert ausschließlich Rasterbilder und speichert PNG ohne Metadaten. */
export async function normalisiereUnterschrift(datei: File): Promise<Uint8Array<ArrayBuffer>> {
  if (!datei.size || datei.size > MAX_UNTERSCHRIFT_BYTES) {
    throw new UnterschriftsBildFehler("Bitte eine PNG- oder JPEG-Datei mit höchstens 750 KB auswählen.");
  }
  const daten = Buffer.from(await datei.arrayBuffer());
  const istPng = daten.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const istJpeg = daten[0] === 255 && daten[1] === 216 && daten[2] === 255;
  if (!istPng && !istJpeg) {
    throw new UnterschriftsBildFehler("Bitte eine echte PNG- oder JPEG-Datei auswählen.");
  }
  try {
    const bild = sharp(daten, { limitInputPixels: 12_000_000, failOn: "warning" });
    const metadaten = await bild.metadata();
    if ((metadaten.pages ?? 1) > 1) throw new Error("Mehrere Bildseiten sind nicht erlaubt.");
    const png = await bild.rotate().resize({ width: 1200, height: 400, fit: "inside", withoutEnlargement: true })
      .png().toBuffer();
    return new Uint8Array(png);
  } catch {
    throw new UnterschriftsBildFehler("Das Bild ist beschädigt oder zu groß. Bitte ein PNG oder JPEG mit höchstens 12 Megapixeln verwenden.");
  }
}
