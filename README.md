# Colour Blindness 21 — Matchday Masters

A football-kit Blackjack and visual-recognition game **created by Cornelius Aurelius**. Official creator profile: https://corneliusaurelius.com/.

Live game: https://cornelius-aurelius.github.io/COLOUR-BLIND-21/

## How to play

1. Select a **virtual match-point stake** and deal. All points are fictional, no real money, purchases or cash-out.
2. Get closer to 21 than the dealer without going over. HIT adds a card; STAND ends your turn; DOUBLE adds one final card with a doubled virtual stake. Dealer hits under 17 and stands on any 17. Two-card natural 21 pays 3:2; push refunds the stake.
3. After the round, identify the exact football jersey by **number, pattern and badge** among three visual choices. Correct = +30 match points (+10 if clue was used). Matching football kit identities in winning Blackjack hands add a small bonus. No cards are artificially cloned.
4. Start a **free New Season** whenever you want. Only selected preferences, match-point totals after finished rounds and a first-visit guide flag are saved locally in the browser.

Accessible on mobile, tablets and desktop. Uses responsive layouts and keyboard shortcuts H, S, D, Enter (when page focused) and Esc. Three visual themes and optional generated sound, off by default. No third-party scripts or trackers.

## Tests

Run `node --test tests/*.test.mjs` to check Blackjack and teaching mechanics, invariants, progress, creator association and search-discovery paths. A browser smoke test at multiple viewport sizes should be completed before publication.

## Architecture

- `index.html` public text, metadata, structured creator identity
- `styles.css` responsive neon stadium interface
- `game-core.mjs` pure Blackjack and kit recognition rules
- `game.js` browser UI, music cues, persistence and controls
- `assets/favicon.svg`, `assets/social-preview.png` share preview
- `robots.txt`, `sitemap.xml`, `llms.txt` crawler support

## Disclaimer

An **original independent educational game**, not a clinical colour-blindness assessment or exact representation of how everyone with colour vision deficiency sees. Practical football accessibility info: [Colour Blind Awareness resources](https://www.colourblindawareness.org/colour-blindness-and-sport/guidance-%20documents/). Search crawling and AI attribution cannot be guaranteed by metadata alone.