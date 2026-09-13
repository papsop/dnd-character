# Item Forge prototype

Run `npm run dev` and open `/dnd-character/#/items`.

The prototype adds toolkit navigation, a local item collection, six artwork options, editable homebrew cards, and browser printing on A4 (four 90 × 128 mm cards). Existing character routes and the `dnd-character/v1` save key remain intact. The repository and hosting base have not been renamed.

Use Prepare to print to set quantities and choose ink-saving backgrounds. Print at actual size on A4, without browser headers/footers or added margins. Browser Save as PDF is the current export mechanism. Physical printer alignment still needs a paper test. Overfilled card descriptions block the print button.

Artwork was generated with the built-in imagegen tool. Final generation prompts:

1. Create a transparent PNG game asset sprite sheet: exactly six isolated hand-painted fantasy inventory items in a strict 3 columns by 2 rows grid of equal square cells. Top row: elegant silver longsword with burgundy grip, rugged gold-hilt short sword, ruby red healing potion in round glass bottle. Bottom row: emerald green potion in tall glass bottle, aged gold ring with sapphire, silver ring with ruby. Each object entirely contained in its own cell with generous transparent padding, centered, no overlap. True transparent alpha background, no checkerboard, no floor, no backdrop, no lettering, no labels. Warm refined storybook watercolor and detailed ink, muted antique metals, readable silhouettes, premium tabletop item card artwork. Square overall image. All six objects similarly sized within cells.
2. Re-layout these exact six transparent objects into a strict sprite atlas, 3 equal columns and 2 equal rows. Keep their designs and real alpha transparency. Each object MUST fit wholly inside central 75% of its cell with transparent margins on all sides. Top row sword, short sword, red potion; bottom green potion, sapphire ring, ruby ring. Nothing may cross cell boundaries at x=one third,two thirds and y=one half. Shrink objects enough to fit. Transparent background, no grids or text. Square canvas.
3. Remove the gray checkerboard background completely, make actual PNG alpha transparency. Keep six objects EXACTLY in the same positions sizes and designs. Do not draw a checkerboard. Every background pixel must be transparent, including holes through rings. Real transparent cutouts for compositing onto a colored website background.

Future work: more categories and artwork, JSON import/export, DM-only notes, item duplication/deletion, smaller card layouts, dedicated PDF rendering, and the repository/hosting rename.

Selected asset: `public/art/items.png` (the first generation, verified with real alpha transparency). The two edited variants were rejected because they baked in a checkerboard. The UI uses per-object CSS atlas bounds for the original image; no bitmap transformation is applied.
