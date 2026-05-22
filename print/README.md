# Print pieces

Standalone print artifacts. Not part of the live website — open these HTML files directly in Chrome and print to PDF, then send the PDF to a printer.

## Door hanger

**File:** `door-hanger.html`
**Size:** 4" × 9" finished, 1/8" bleed (full art 4.25" × 9.25")
**Sides:** 2 (front + back), each on its own page

### How to print

1. Open `door-hanger.html` in Chrome (double-click, or `open print/door-hanger.html` from terminal)
2. Press `Cmd+P`
3. Set:
   - **Destination:** Save as PDF
   - **Pages:** All
   - **Paper size:** Custom → `4.25 in × 9.25 in`
   - **Margins:** None
   - **Scale:** 100% (Default)
   - **Background graphics:** On
4. Save as `door-hanger.pdf`, send to printer with: *"4×9 finished, 1/8 bleed, die-cut knob hole as marked on artwork."*

### Regenerating the QR code

The QR is hardcoded as inline SVG inside `door-hanger.html`, pointing at:

```
https://doorwaydetail.com
```

The promo code (`DOOR25`) is shown as visible text on the hanger so the customer types it in manually after landing on the site. This keeps the QR short + scannable and gives the customer a chance to browse before committing.

If you change the URL, regenerate the SVG via:

```bash
node print/regen-qr.mjs > /tmp/qr.svg
```

…then paste the contents of `/tmp/qr.svg` into the HTML where the existing `<svg ... shape-rendering="crispEdges">…</svg>` block lives inside `.qr-wrap`.

### Generating the PDF directly (skip the Cmd+P workflow)

Run this one-liner from terminal — saves the PDF to your Desktop in seconds:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --no-pdf-header-footer --no-margins \
  --print-to-pdf="$HOME/Desktop/Doorway-Detail-Door-Hanger.pdf" \
  --print-to-pdf-no-header \
  "file://$(pwd)/print/door-hanger.html"
```

### Assets referenced

- `../public/logo.png` — Doorway Detail logo (with tagline)
- `../public/workers/team-v4.png` — team trio illustration used on the front side

### Why standalone HTML?

- Not on the live website — customers can't accidentally browse to it
- No build step required, opens in any browser
- Zero dependencies at runtime (QR is pre-baked)
- Easy to hand off to a designer or printer who doesn't run Node
