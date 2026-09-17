# Shruti & Rahul — banana-leaf wedding invitation

A small static site: the invitation arrives wrapped in a banana leaf and tied with
a red-and-yellow thread, the way the printed card does. Tapping the knot unties the
thread, the two lobes of the leaf swing open, and the invitation is revealed.

- **Card 1 (front):** Ganesha, the invocation, the hosts, and both names down to
  "Chi. Rahul (Son of Smt. Usha & Shri Rangilal Jaiswal)".
- **Card 2 (back):** the date, venue and address, Muhurtham and Reception timings,
  and the compliments line. Tap the card (or use the button, arrow keys, or a swipe)
  to turn it over.

The decorations, the Ganesha idol and all the lettering are taken from the original
invitation artwork, not redrawn. The leaf is cut from photographs of the real card.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Markup: leaf lobes, the two-sided card, the SVG thread and bow |
| `styles.css` | Layout, the 3D fold, the untie choreography, responsive sizing |
| `main.js` | Click/keyboard/swipe handling and the open → flip → re-wrap state machine |
| `assets/card1.jpg` | Front of the card (original artwork, lower text lifted off) |
| `assets/card2.jpg` | Back of the card (same artwork, date/venue text re-centred) |
| `assets/lobe.webp`, `assets/lobe_r.webp` | Left and right leaf lobes with transparency |
| `assets/base.jpg` | Leaf texture that sits under the card |

No build step and no dependencies. Open `index.html` in a browser or serve the folder
from any static host. `index.html?open` loads the site already opened.

The page carries a `noindex` meta tag so the invitation stays out of search results.
