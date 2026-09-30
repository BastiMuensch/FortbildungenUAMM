import React, { useMemo } from "react";
import { qrMatrix } from "@/lib/qr";

/** Das MFA-Geheimnis bleibt im Browser; kein externer QR-Dienst wird aufgerufen. */
export function MfaQrCode({ otpauth }: { otpauth: string }) {
  const matrix = useMemo(() => {
    for (const stufe of ["M", "L"] as const) {
      try {
        return qrMatrix(otpauth, stufe);
      } catch {
        // Lange Kontobezeichnungen passen gegebenenfalls noch mit Stufe L.
      }
    }
    return null;
  }, [otpauth]);

  if (!matrix) return (
    <p role="status" className="text-sm text-muted-foreground">
      Der QR-Code konnte nicht erstellt werden. Nutzen Sie bitte den Einrichtungsschlüssel unter „Manuell einrichten“.
    </p>
  );

  // Vier weiße Module Ruhezone und feste Farben erhalten die Scanbarkeit auch im Dunkelmodus.
  const rand = 4;
  const kante = matrix.groesse + rand * 2;
  const pfad = matrix.module.flatMap((zeile, y) => zeile.flatMap((dunkel, x) =>
    dunkel ? [`M${x + rand},${y + rand}h1v1h-1z`] : [],
  )).join("");

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="QR-Code zur Einrichtung der Zwei-Faktor-Authentifizierung"
      viewBox={`0 0 ${kante} ${kante}`}
      width={kante * 4}
      height={kante * 4}
      className="h-auto max-w-full"
      shapeRendering="crispEdges"
    >
      <rect width={kante} height={kante} fill="#ffffff" />
      <path d={pfad} fill="#000000" />
    </svg>
  );
}
