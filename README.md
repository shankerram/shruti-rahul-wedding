# Shruti & Rahul — banana-leaf wedding invitation

Live at **https://shrutiwedsrahul.in** (GitHub Pages, custom domain via the `CNAME` file;
DNS at GoDaddy: four `A` records to GitHub's Pages IPs and `www` as a CNAME).

A small static site: the invitation arrives wrapped in a banana leaf and tied with
a red-and-yellow thread, the way the printed card does. Tapping the knot unties the
thread, the two lobes of the leaf swing open, and the invitation is revealed.

There are four invitations, one per guest list, all sharing the same leaf, thread
and page-turner:

| Path | Pages |
| --- | --- |
| `/reception-NNNNNNNN/` | Reception invite (hosts and names), then date, venue and Reception timing |
| `/mehandi-muhurtham-reception-NNNNNNNN/` | Mehendi ceremony, then the wedding invite, then date, venue, Muhurtham and Reception |
| `/muhurtham-reception-NNNNNNNN/` | Wedding invite, then date, venue, Muhurtham and Reception (no Mehendi page) |
| `/muhurtam-NNNNNNNN/` | Wedding invite, then date, venue and Muhurtham |

Each route carries a random 8-digit number so the links cannot be guessed; the
site root and any other address show a plain 404 page (`404.html`). Tap the card, use the buttons, arrow keys
or a swipe to move between pages; with three pages a row of dots shows where you are.

Every page is the finished artwork placed as-is, so the decorations, the Ganesha
idol and the lettering are exactly the designer's. The leaf is cut from photographs
of the real card.

Music starts on the tap that unties the knot (browsers do not allow sound before a
tap), loops quietly, and fades out when the card is wrapped again. The round button at
the top right mutes it; the choice is remembered on that device.

## Files

| File | What it is |
| --- | --- |
| `404.html` | Shown at the root and at any wrong address |
| `<route>/index.html` | One per invitation: leaf lobes, the card, the SVG thread and bow, and the list of pages |
| `styles.css` | Layout, the 3D fold, the untie choreography, responsive sizing |
| `main.js` | Click/keyboard/swipe handling and the open → turn pages → re-wrap state machine |
| `assets/<route>/N.jpg` | That invitation's pages, in order (a route may point at another route's images) |
| `assets/<route>/N-still.jpg`, `N-mask.png` | For a page marked `data-sway`: the page with its garlands painted out, and the garlands alone, which `main.js` layers on top and rocks gently |
| `assets/lobe.webp`, `assets/lobe_r.webp` | Left and right leaf lobes with transparency |
| `assets/music.m4a`, `assets/music.mp3` | Background music (Seetha Kalyana, guitar/piano/violin), AAC with an MP3 fallback |
| `assets/reception/music.m4a`, `assets/reception/music.mp3` | Reception-only background music (Sathiya 2.0 refix, 21 s loop); the other routes keep `assets/music.*` |
| `assets/base.jpg` | Leaf texture that sits under the card |

No build step and no dependencies. Serve the folder from any static host (the pages
use `../` paths, so open them over HTTP rather than as files). Add `?open` to a route
to load it already opened.

A page's `<img>` can carry `data-sway` (garlands dangle) and `data-petals="pink"` (rose
petals fall while that page is showing, instead of marigold).

To add a page to an invitation, drop the image into its `assets/<route>/` folder and
add an `<img>` line to the `.pages` list in that route's `index.html`. To add an
invitation, copy a route folder, point its `.pages` at a new assets folder, and set
`--ratio` on `.stage` to the artwork's height ÷ width.

The pages carry a `noindex` meta tag so the invitation stays out of search results, and
carry a `<title>` and matching `og:title`/`og:url` ("Shruti & Rahul wedding invitation")
but no description or `og:image`, so a pasted link shows that title in WhatsApp and other
chat apps without a picture card. WhatsApp caches a preview per URL, so to see a changed
preview test with a variant such as `?1` appended, or from a chat that never saw the link.
