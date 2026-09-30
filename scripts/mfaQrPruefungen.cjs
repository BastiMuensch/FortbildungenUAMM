/* eslint-disable @typescript-eslint/no-require-imports -- Ladehook isoliert server-only für den QR-Rundlauf. */
const assert = require("node:assert/strict");
const Module = require("node:module");
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "server-only") return {};
  return originalLoad.call(this, request, parent, isMain);
};
require("tsx/cjs");

const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const sharp = require("sharp");
const jsQR = require("jsqr");
const { otpauthUrl } = require("../src/lib/mfa");
const { MfaQrCode } = require("../src/components/admin/MfaQrCode");

(async () => {
  const geheimnis = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
  const langesKonto = `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(58)}.de`;
  for (const email of ["bdb@example.org", "jörg+fortbildung@example.org", langesKonto]) {
    const uri = otpauthUrl(email, geheimnis);
    const svg = renderToStaticMarkup(React.createElement(MfaQrCode, { otpauth: uri }));
    assert.ok(svg.startsWith("<svg"), "Authenticator-Konten werden als QR-Code angezeigt");
    assert.ok(!svg.includes(geheimnis), "Der Schlüssel steht nicht als Klartext im Bild-Markup");
    // Das tatsächlich gerenderte SVG als Bild scannen, inklusive Ruhezone und Farben.
    const { data, info } = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const gelesen = jsQR(new Uint8ClampedArray(data), info.width, info.height);
    assert.equal(gelesen?.data, uri, "Der sichtbare QR-Code enthält exakt den Authenticator-Link");
    const konto = new URL(gelesen.data);
    assert.equal(konto.protocol, "otpauth:");
    assert.equal(konto.hostname, "totp");
    assert.equal(konto.searchParams.get("secret"), geheimnis);
    assert.equal(konto.searchParams.get("issuer"), "Fortbildungen UAMM");
    assert.equal(konto.searchParams.get("digits"), "6");
    assert.equal(konto.searchParams.get("period"), "30");
    assert.equal(decodeURIComponent(konto.pathname), `/Fortbildungen UAMM:${email}`);
  }
  const zuLang = renderToStaticMarkup(React.createElement(MfaQrCode, { otpauth: "x".repeat(2000) }));
  assert.ok(zuLang.includes("Manuell einrichten"), "Überlange Inhalte blockieren die alternative Einrichtung nicht");
  console.log("MFA-QR: Gerendertes SVG gescannt; Kontodaten, Umlaute, lange Adressen und manuelle Alternative geprüft.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
