// Regenerate the door-hanger QR SVG.
// Usage: node print/regen-qr.mjs > /tmp/qr.svg
// Then paste the SVG into print/door-hanger.html (replace the existing <svg> inside .qr-card).

import QRCode from "qrcode";

const url = "https://doorwaydetail.com";

const svg = await QRCode.toString(url, {
  type: "svg",
  errorCorrectionLevel: "H",
  margin: 0,
  color: { dark: "#111111", light: "#FFFFFF" },
});

process.stdout.write(svg);
