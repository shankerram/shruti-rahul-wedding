# Shruti & Rahul — banana-leaf wedding invitation

A small static site: the invitation arrives wrapped in a banana leaf and tied with
a red-and-yellow thread, the way the printed card does. Tapping the knot unties the
thread, the two lobes of the leaf swing open, and the invitation is revealed.

There are four invitations, one per guest list, all sharing the same leaf, thread
and page-turner:

| Path | Pages |
| --- | --- |
| `/reception/` | Reception invite (hosts and names), then date, venue and Reception timing |
| `/muhurtham-reception/` | Mehendi ceremony, then the wedding invite, then date, venue, Muhurtham and Reception |
| `/muhurtham-reception-only/` | Wedding invite, then date, venue, Muhurtham and Reception (no Mehendi page) |
| `/muhurtham/` | Wedding invite, then date, venue and Muhurtham |

The site root redirects to `/reception/`. Tap the card, use the buttons, arrow keys
or a swipe to move between pages; with three pages a row of dots shows where you are.

Every page is the finished artwork placed as-is, so the decorations, the Ganesha
idol and the lettering are exactly the designer's. The leaf is cut from photographs
of the real card.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Redirect to `/reception/` |
| `<route>/index.html` | One per invitation: leaf lobes, the card, the SVG thread and bow, and the list of pages |
| `styles.css` | Layout, the 3D fold, the untie choreography, responsive sizing |
| `main.js` | Click/keyboard/swipe handling and the open → turn pages → re-wrap state machine |
| `assets/<route>/N.jpg` | That invitation's pages, in order (a route may point at another route's images) |
| `assets/<route>/N-still.jpg`, `N-mask.png` | For a page marked `data-sway`: the page with its garlands painted out, and the garlands alone, which `main.js` layers on top and rocks gently |
| `assets/lobe.webp`, `assets/lobe_r.webp` | Left and right leaf lobes with transparency |
| `assets/base.jpg` | Leaf texture that sits under the card |

No build step and no dependencies. Serve the folder from any static host (the pages
use `../` paths, so open them over HTTP rather than as files). Add `?open` to a route
to load it already opened.

To add a page to an invitation, drop the image into its `assets/<route>/` folder and
add an `<img>` line to the `.pages` list in that route's `index.html`. To add an
invitation, copy a route folder, point its `.pages` at a new assets folder, and set
`--ratio` on `.stage` to the artwork's height ÷ width.

The page carries a `noindex` meta tag so the invitation stays out of search results.
