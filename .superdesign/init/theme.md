# Theme and Design Tokens

## Compact token summary

- Palette: monochrome black, white, and neutral gray only.
- Background: `#0a0a0a`; foreground/paper: `#f5f5f5`.
- Surfaces: `#151515`, `#181818`, `#222222`; borders: `#3d3d3d`.
- Brand accents: neutral grays including `#3f3f3f`, `#555555`, `#d4d4d4`.
- Muted text: `#a3a3a3` and related neutral steps.
- Brand text effect: layered `--brand-frost` text shadow, producing a soft blurred white glow.
- Typography: display/logo typography comes from project font variables and bold condensed/editorial fallbacks; utility text uses compact uppercase tracking.
- Geometry: mostly square corners, hairline borders, strong editorial grids, restrained shadows.
- Responsive breakpoints used throughout CSS: 1200px, 1040px, 900px, 760px, 700px, and 520px.
- Motion: short transitions and entrance animations, disabled under `prefers-reduced-motion`.

## Raw source dumps

### `app/globals.css`

Global tokens, typography, landing-page and shared public styles.

```css
@import 'tailwindcss';
@import 'tw-animate-css';
@import 'shadcn/tailwind.css';
@custom-variant dark (&:is(.dark *));
@font-face {
  font-family: 'Barlow Condensed';
  src: url('/fonts/barlow-condensed.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}
@font-face {
  font-family: 'Manrope';
  src: url('/fonts/manrope.woff2') format('woff2');
  font-weight: 400 800;
  font-display: swap;
}
@font-face {
  font-family: 'Trade Winds';
  src: url('/fonts/trade-winds.ttf') format('truetype');
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: 'Manrope', Arial, sans-serif;
  --font-heading: 'Barlow Condensed', 'Arial Narrow', Impact, sans-serif;
  --color-card: var(--card);
  --color-card-foreground: var(--foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--foreground);
  --color-destructive: var(--primary);
  --color-border: var(--border);
  --color-input: var(--border);
  --color-ring: var(--ring);
  --radius-sm: 2px;
  --radius-md: 2px;
  --radius-lg: 2px;
  --radius-xl: 2px;
}
:root,
.dark {
  --background: #0a0a0a;
  --foreground: #f5f5f5;
  --card: #151515;
  --popover: #181818;
  --primary: #3f3f3f;
  --primary-foreground: #f5f5f5;
  --secondary: #4a4a4a;
  --muted: #222222;
  --muted-foreground: #a3a3a3;
  --accent: #2b2b2b;
  --border: #3d3d3d;
  --ring: #f5f5f5;
  --red: #d4d4d4;
  --paper: #f5f5f5;
  --font-brand: 'Trade Winds', 'Barlow Condensed', Impact, sans-serif;
  --radius: 2px;
  --brand-frost:
    -0.025em 0 0.065em color-mix(in srgb, currentColor 38%, transparent),
    0.025em 0 0.065em color-mix(in srgb, currentColor 38%, transparent),
    -0.075em 0 0.16em color-mix(in srgb, currentColor 18%, transparent),
    0.075em 0 0.16em color-mix(in srgb, currentColor 18%, transparent),
    0 0 0.09em color-mix(in srgb, currentColor 24%, transparent);
}
:where(body, body *) {
  text-shadow: var(--brand-frost);
}
:where(
  .skip-link,
  .skip-link *,
  .statement-strip,
  .statement-strip *,
  .look-open,
  .look-open *,
  .process-section,
  .process-section *,
  .plate-photo figcaption
) {
  text-shadow: none;
}
* {
  box-sizing: border-box;
  border-color: var(--border);
}
html {
  scroll-behavior: smooth;
  scroll-padding-top: 95px;
}
body {
  margin: 0;
  background: var(--background);
  color: var(--foreground);
  font-family: 'Manrope', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
a {
  color: inherit;
  text-decoration: none;
}
button,
a,
input,
textarea {
  -webkit-tap-highlight-color: transparent;
}
button {
  font: inherit;
}
a:focus-visible,
button:focus-visible {
  outline: 2px solid var(--paper);
  outline-offset: 5px;
}
img {
  display: block;
  max-width: 100%;
  height: auto;
}
::selection {
  background: var(--primary);
  color: var(--paper);
}
h1,
h2,
h3,
p,
figure {
  margin: 0;
}
.skip-link {
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 200;
  background: var(--paper);
  color: var(--background);
  padding: 12px;
  transform: translateY(-160%);
}
.skip-link:focus {
  transform: none;
}
.site-header {
  height: 94px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 5%;
  border-bottom: 1px solid var(--border);
  background: #0a0a0a;
  position: sticky;
  top: 0;
  z-index: 30;
}
.brand-logo {
  width: 138px;
  height: auto;
}
.site-header nav {
  display: flex;
  gap: 36px;
  font-size: 13px;
}
.site-header nav a {
  padding: 12px 0;
}
.site-header nav a:hover {
  color: #fff;
}
.header-contact {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 12px;
  border-bottom: 1px solid #656565;
  padding: 9px 0;
}
.hero {
  position: relative;
  display: grid;
  grid-template-columns: 1.03fr 1fr;
  min-height: 740px;
  max-width: 1700px;
  margin: auto;
  padding: 66px 6% 55px 5%;
  gap: 30px;
  overflow: hidden;
}
.eyebrow {
  font-size: 10px;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}
.red-dot {
  width: 6px;
  height: 6px;
  background: var(--red);
  display: inline-block;
}
.hero-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
  z-index: 2;
}
.hero h1 {
  font-family: 'Barlow Condensed', 'Arial Narrow', Impact, sans-serif;
  font-size: clamp(88px, 9.8vw, 157px);
  font-weight: 700;
  letter-spacing: -2px;
  line-height: 0.84;
  margin: 31px 0 37px;
}
.hero h1 span {
  color: var(--red);
}
.hero-bottom {
  display: flex;
  gap: 36px;
  align-items: center;
}
.hero-bottom p {
  color: #b2b2b2;
  font-size: 12px;
  line-height: 1.8;
}
.action {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 26px;
  min-height: 52px;
  padding: 15px 22px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--border);
  transition:
    background 0.2s,
    transform 0.2s;
  white-space: nowrap;
}
.action-red {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--paper);
}
.action:hover {
  transform: translateY(-2px);
}
.action-red:hover {
  background: #555555;
}
.scroll-note {
  margin-top: auto;
  padding-top: 38px;
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 8px;
  letter-spacing: 1.7px;
  color: #929292;
}
.hero-art {
  position: relative;
  padding: 0 12px 10px 10px;
  align-self: center;
}
.hero-frame {
  position: relative;
  transform: rotate(2deg);
  background: var(--paper);
  padding: 8px 8px 29px;
  width: 100%;
  max-width: 510px;
  margin: 0 auto;
}
.hero-frame img {
  width: 100%;
  aspect-ratio: 4/5;
  object-fit: cover;
}
.photo-caption {
  position: absolute;
  bottom: 10px;
  left: 12px;
  color: #222222;
  font-size: 8px;
  letter-spacing: 2px;
}
.side-caption {
  position: absolute;
  right: -32px;
  top: 25%;
  writing-mode: vertical-rl;
  font-size: 8px;
  letter-spacing: 2px;
  color: #a3a3a3;
}
.hero-stamp {
  position: absolute;
  right: -16px;
  bottom: 25px;
  background: var(--primary);
  border: 1px solid #9c9c9c;
  padding: 18px 20px;
  font-family: 'Barlow Condensed', Impact, sans-serif;
  font-size: 24px;
  line-height: 1;
  transform: rotate(-7deg);
  display: flex;
  align-items: center;
  gap: 20px;
}
.statement-strip {
  background: var(--paper);
  color: var(--background);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 5%;
  font-family: 'Barlow Condensed', Impact, sans-serif;
  font-size: 24px;
  letter-spacing: 0.5px;
  border-top: 1px solid var(--paper);
}
.section {
  padding: 100px 5%;
  max-width: 1700px;
  margin: auto;
}
.section h2 {
  font-family: 'Barlow Condensed', Impact, sans-serif;
  font-size: 80px;
  line-height: 0.96;
  letter-spacing: -0.5px;
  margin-top: 24px;
}
.section h2 span {
  color: var(--red);
}
.preview-pecas > p:last-of-type {
  margin-top: 20px;
  font-size: 14px;
  color: var(--muted-foreground);
}
.hero-ctas {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 29px;
}
.hero-ctas .action,
.hero-order-cta {
  min-height: 52px;
}
.hero-order-cta {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  border: 1px solid #707070;
  background: transparent;
  color: var(--paper);
  font-size: 12px;
}
.hero-order-cta:hover {
  border-color: var(--paper);
  background: #ffffff0c;
}
.preview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 50px;
  margin-top: 50px;
}
.preview-grid img {
  max-height: 600px;
  width: 100%;
  object-fit: contain;
}
@media (min-width: 1550px) {
  .hero {
    padding-top: 85px;
    padding-bottom: 80px;
    min-height: 840px;
  }
  .hero-frame {
    max-width: 560px;
  }
}
@media (max-width: 1000px) {
  .hero {
    min-height: 660px;
    padding-top: 55px;
    gap: 10px;
  }
  .hero h1 {
    font-size: 105px;
  }
  .hero-bottom {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
  .hero-stamp {
    right: 0;
    font-size: 19px;
    padding: 15px;
  }
  .side-caption {
    right: -17px;
  }
  .site-header {
    height: 78px;
  }
  .site-header nav {
    gap: 23px;
  }
  .hero-frame {
    padding: 6px 6px 26px;
  }
  .section h2 {
    font-size: 68px;
  }
}
@media (max-width: 700px) {
  html {
    scroll-padding-top: 72px;
  }
  .site-header {
    height: 72px;
    padding: 0 6%;
  }
  .brand-logo {
    width: 114px;
  }
  .site-header nav {
    display: none;
  }
  .header-contact {
    font-size: 10px;
    gap: 8px;
  }
  .hero {
    display: flex;
    flex-direction: column;
    padding: 37px 6% 39px;
    gap: 36px;
    min-height: 0;
  }
  .hero h1 {
    font-size: clamp(76px, 19.8vw, 128px);
    letter-spacing: -1px;
    line-height: 0.84;
    margin: 22px 0 25px;
  }
  .eyebrow {
    font-size: 8px;
    letter-spacing: 1.7px;
  }
  .hero-bottom {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    width: 100%;
  }
  .hero-bottom p {
    font-size: 10px;
  }
  .action {
    font-size: 10px;
    min-height: 47px;
    padding: 12px 15px;
    gap: 18px;
  }
  .scroll-note {
    display: none;
  }
  .hero-art {
    width: 100%;
    padding: 0 12px;
  }
  .hero-frame {
    max-width: 430px;
  }
  .hero-stamp {
    right: -2px;
    bottom: 20px;
    font-size: 25px;
  }
  .side-caption {
    right: -4px;
    font-size: 7px;
  }
  .statement-strip {
    padding: 15px 6%;
    gap: 18px;
    font-size: 16px;
  }
  .statement-strip > span:nth-child(2) {
    display: none;
  }
  .statement-strip svg {
    width: 19px;
  }
  .section {
    padding: 66px 6%;
  }
  .section h2 {
    font-size: 62px;
  }
  .preview-grid {
    gap: 18px;
  }
}
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}

/* Interfaces de catÃ¡logo, editorial e encomendas. */
.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}
.account-link {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 9px 14px;
  border: 1px solid var(--border);
  color: var(--paper);
  font-size: 12px;
}
.account-link:hover {
  border-color: #717171;
  background: var(--muted);
}
.account-link-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
}
.hero-contact {
  font-size: 11px;
  color: #a3a3a3;
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 28px;
}
.hero-contact:hover {
  color: var(--paper);
}
.hero h1 .title-line {
  display: block;
  color: var(--paper);
  overflow: hidden;
  padding-bottom: 0.06em;
  margin-bottom: -0.06em;
}
.hero h1 .title-line > span {
  display: block;
  color: inherit;
  animation: heading-reveal 0.85s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.hero h1 .title-line:nth-child(2) > span {
  animation-delay: 0.08s;
}
.hero h1 .title-line:nth-child(3) > span {
  animation-delay: 0.16s;
}
.hero h1 .title-red {
  color: var(--red);
}
.brand-accent {
  font-family: var(--font-brand);
  font-weight: 400;
  font-size: 0.68em;
  line-height: 1.25;
  letter-spacing: -0.035em;
}
.hero h1 .title-line.title-brand {
  padding-block: 0.09em 0.16em;
  margin-bottom: -0.16em;
}
.hero h1 .title-brand > span {
  font-size: 0.59em;
}
.hero-frame {
  transform: translate(var(--pointer-x, 0px), var(--pointer-y, 0px))
    rotate(2deg);
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  animation: photo-reveal 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.section-heading {
  display: flex;
  justify-content: space-between;
  gap: 50px;
  align-items: flex-end;
  margin-bottom: 52px;
}
.section-heading > p {
  font-size: 14px;
  color: var(--muted-foreground);
  line-height: 1.9;
  max-width: 310px;
  padding-bottom: 8px;
}
.looks-section {
  padding-bottom: 95px;
}
.looks-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 70px 7%;
  align-items: start;
}
.look-card {
  min-width: 0;
}
.look-2 {
  margin-top: 130px;
}
.look-image-link {
  display: block;
  position: relative;
  overflow: hidden;
  background: #111111;
}
.look-image-link .look-image {
  width: 100%;
  aspect-ratio: 4/5;
  object-fit: contain;
  transition: transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
}
.look-image-alternate {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0;
  transition:
    opacity 0.4s,
    transform 0.6s;
}
.look-image-link:hover .look-image-alternate,
.look-image-link:focus-visible .look-image-alternate {
  opacity: 1;
  transform: scale(1.025);
}
.look-badge {
  position: absolute;
  top: 18px;
  left: 18px;
  background: var(--background);
  font-size: 9px;
  letter-spacing: 1.5px;
  padding: 9px 13px;
}
.look-open {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: var(--paper);
  color: var(--background);
  height: 50px;
  display: flex;
  align-items: center;
  padding: 0 15px;
  gap: 12px;
}
.look-open span {
  font-size: 9px;
  letter-spacing: 0.7px;
  max-width: 0;
  overflow: hidden;
  white-space: nowrap;
  transition: max-width 0.3s;
}
.look-image-link:hover .look-open span,
.look-image-link:focus-visible .look-open span {
  max-width: 100px;
}
.look-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 25px;
  font-size: 9px;
  letter-spacing: 1px;
  color: var(--muted-foreground);
}
.look-label > span:last-child {
  margin-left: auto;
  font-size: 8px;
  letter-spacing: 0.5px;
}
.color-swatch {
  width: 8px;
  height: 8px;
  flex: none;
  display: inline-block;
}
.color-swatch.red {
  background: var(--red);
}
.color-swatch.green {
  background: #6e6e6e;
}
.color-swatch.denim {
  background: #b6b6b6;
}
.look-card h3 {
  font-family: 'Barlow Condensed', Impact, sans-serif;
  text-transform: uppercase;
  font-size: 42px;
  line-height: 1.1;
  margin: 13px 0 16px;
}
.text-link {
  display: inline-flex;
  align-items: center;
  gap: 20px;
  font-size: 12px;
  border-bottom: 1px solid #686868;
  padding: 8px 0;
  min-height: 38px;
}
.text-link svg {
  transition: transform 0.2s;
}
.text-link:hover svg {
  transform: translate(2px, -2px);
}
.look-3 {
  grid-column: 1/-1;
  display: grid;
  grid-template-columns: 0.85fr 1fr;
  gap: 11%;
  align-items: center;
  border-top: 1px solid var(--border);
  padding-top: 75px;
  margin-top: 0;
}
.look-3 .look-image-link {
  max-width: 430px;
  transform: rotate(-2deg);
  margin-left: 30px;
}
.look-3 .look-label > span:last-child {
  display: none;
}
.look-3 h3 {
  font-size: 76px;
  max-width: 430px;
  line-height: 0.98;
}
.look-description {
  font-size: 14px;
  line-height: 1.9;
  color: var(--muted-foreground);
  max-width: 330px;
  margin: 24px 0;
}
.look-3 .look-card-copy {
  padding-right: 30px;
}
.editorial-section {
  border-top: 1px solid var(--border);
  padding-bottom: 90px;
}
.editorial-grid {
  columns: 3;
  column-gap: 24px;
}
.gallery-photo {
  display: block;
  position: relative;
  width: 100%;
  padding: 0;
  background: #121212;
  border: 0;
  cursor: zoom-in;
  break-inside: avoid;
  margin: 0 0 24px;
  overflow: hidden;
}
.gallery-photo img {
  width: 100%;
  transition: transform 0.5s;
}
.gallery-photo:hover img {
  transform: scale(1.025);
}
.gallery-number {
  position: absolute;
  left: 13px;
  bottom: 12px;
  letter-spacing: 1px;
  font-size: 8px;
  background: #0b0b0bd9;
  padding: 7px 9px;
  opacity: 0;
  transition: opacity 0.2s;
}
.gallery-photo:hover .gallery-number,
.gallery-photo:focus-visible .gallery-number {
  opacity: 1;
}
.image-expand {
  position: absolute;
  right: 12px;
  top: 12px;
  background: #0b0b0bd9;
  color: var(--paper);
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
}
.gallery-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 22px;
  gap: 25px;
}
.gallery-bottom p {
  font-size: 11px;
  color: var(--muted-foreground);
}
.gallery-more {
  border-radius: 0 !important;
  background: transparent;
}
.editorial-film-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 300px);
  gap: 70px;
  align-items: center;
  max-width: 850px;
  margin: 110px auto 0;
}
.editorial-film-row h3 {
  font-family: 'Barlow Condensed', Impact, sans-serif;
  font-size: clamp(62px, 7.3vw, 105px);
  line-height: 0.88;
  margin: 26px 0;
}
.editorial-film-row > div > p:last-child {
  font-size: 14px;
  line-height: 1.9;
  color: var(--muted-foreground);
}
.video-player {
  position: relative;
  background: #141414;
  min-width: 0;
  aspect-ratio: var(--video-ratio);
  overflow: hidden;
}
.video-player video,
.video-poster,
.video-poster > img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.video-player video {
  display: block;
}
.video-poster {
  border: 0;
  padding: 0;
  color: var(--paper);
  background: #141414;
  position: relative;
  cursor: pointer;
  display: block;
}
.video-poster:after {
  content: '';
  position: absolute;
  inset: 50% 0 0;
  background: linear-gradient(transparent, #000b);
  pointer-events: none;
}
.play-circle {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 66px;
  height: 66px;
  border: 1px solid #eee8;
  background: #0b0b0b66;
  display: grid;
  place-items: center;
  border-radius: 50%;
  z-index: 1;
  transition: background 0.2s;
}
.video-poster:hover .play-circle {
  background: var(--primary);
}
.video-caption {
  position: absolute;
  bottom: 24px;
  left: 20px;
  right: 20px;
  font-size: 13px;
  line-height: 1.5;
  text-align: left;
  z-index: 1;
}
.video-caption small {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 9px;
  letter-spacing: 1px;
  font-size: 8px;
}
.video-error {
  position: absolute;
  inset: auto 0 0;
  background: var(--background);
  padding: 20px;
  font-size: 12px;
}
.video-error a {
  text-decoration: underline;
}
.close-section {
  border-top: 1px solid var(--border);
}
.close-tabs {
  margin-top: 24px;
  gap: 45px !important;
}
.close-tabs-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 50px;
}
.close-tabs-heading h2 {
  margin: 0;
}
.detail-tabs {
  height: auto !important;
  padding: 0 !important;
  gap: 18px !important;
  border-bottom: 1px solid var(--border);
  border-radius: 0 !important;
  max-width: 100%;
}
.detail-tabs [data-slot='tabs-trigger'] {
  font-size: 12px;
  gap: 9px !important;
  min-height: 52px;
  border-radius: 0;
  padding: 10px 3px !important;
}
.detail-tabs [data-slot='tabs-trigger'] > span {
  font-size: 9px;
  color: var(--muted-foreground);
}
.detail-tabs [data-slot='tabs-trigger']:after {
  bottom: -1px !important;
  background: var(--red) !important;
}
.close-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8%;
  align-items: center;
}
.close-photo {
  position: relative;
  background: #101010;
}
.close-photo img {
  width: 100%;
  aspect-ratio: 1/1;
  object-fit: cover;
  object-position: 50% 48%;
  animation: detail-reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.detail-cross {
  position: absolute;
  bottom: 18px;
  right: 20px;
  font-size: 30px;
  font-weight: 300;
  background: var(--background);
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
}
.close-copy {
  max-width: 390px;
}
.close-copy h3 {
  font-family: 'Barlow Condensed', Impact, sans-serif;
  text-transform: uppercase;
  font-size: 68px;
  line-height: 0.95;
  margin: 22px 0;
}
.close-copy > p {
  font-size: 14px;
  line-height: 1.9;
  color: var(--muted-foreground);
}
.stitch-line {
  max-width: 290px;
  margin: 32px 0 24px;
}
.stitch-line svg {
  width: 100%;
  stroke: #747474;
  stroke-width: 1;
  stroke-dasharray: 900;
  stroke-dashoffset: 0;
  animation: stitch 1.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.process-section {
  background: var(--paper);
  color: var(--background);
}
.process-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 50px;
  margin-bottom: 65px;
}
.process-heading > p {
  font-size: 13px;
  line-height: 1.9;
  color: #505050;
}
.process-heading h2 {
  font-size: 90px;
}
.process-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.7fr;
  gap: 50px 12%;
  align-items: center;
}
.process-main {
  max-width: 580px;
}
.process-main img {
  width: 100%;
  transform: rotate(-2deg);
}
.process-main figcaption,
.process-bw figcaption {
  font-size: 8px;
  letter-spacing: 1px;
  margin-top: 23px;
}
.process-film {
  max-width: 310px;
  justify-self: center;
}
.process-film > p {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10px;
  margin-top: 16px;
}
.process-bw {
  max-width: 360px;
  justify-self: center;
}
.process-bw img {
  transform: rotate(2deg);
}
.process-note {
  align-self: center;
}
.editorial-plus {
  font-size: 70px;
  font-weight: 300;
  color: var(--primary);
  line-height: 1;
}
.process-note > p {
  font-family: 'Barlow Condensed', Impact, sans-serif;
  font-size: 77px;
  line-height: 0.92;
  margin: 15px 0 22px;
}
.process-note > p > span {
  color: var(--primary);
}
.process-note .text-link {
  border-color: #636363;
}
.order-section {
  display: grid;
  grid-template-columns: 1.45fr 1fr;
  gap: 8%;
  align-items: center;
  padding-top: 110px;
  padding-bottom: 110px;
}
.order-section h2 {
  font-size: clamp(68px, 6.5vw, 104px);
  line-height: 0.9;
  margin: 28px 0;
}
.order-description {
  font-size: 14px;
  color: var(--muted-foreground);
  line-height: 1.9;
  margin: 28px 0;
}
.contact-note {
  font-size: 10px;
  color: var(--muted-foreground);
  margin-top: 14px;
}
.plate-photo {
  max-width: 285px;
  margin: 0 auto 40px;
  transform: rotate(4deg);
  padding: 8px 8px 29px;
  background: var(--paper);
}
.plate-photo img {
  width: 100%;
  aspect-ratio: 1.2;
  object-fit: cover;
  object-position: center;
}
.plate-photo figcaption {
  position: absolute;
  bottom: 9px;
  left: 10px;
  color: var(--background);
  font-size: 7px;
  letter-spacing: 1px;
}
.order-steps {
  list-style: none;
  padding: 0;
  margin: 0;
}
.order-steps li {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  border-top: 1px solid var(--border);
  padding: 21px 0;
  font-size: 13px;
}
.order-steps li > span {
  font-size: 10px;
  color: var(--muted-foreground);
  padding-top: 3px;
}
.order-steps small {
  display: block;
  font-size: 10px;
  color: var(--muted-foreground);
  margin-top: 8px;
  line-height: 1.6;
}
.site-footer {
  padding: 55px 5% 24px;
  border-top: 1px solid var(--border);
  background: #080808;
}
.footer-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 48px;
  gap: 30px;
}
.footer-top img {
  width: 190px;
}
.footer-top > p {
  font-size: 12px;
  color: var(--muted-foreground);
}
.footer-top > a:last-child {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}
.footer-bottom {
  border-top: 1px solid var(--border);
  padding-top: 23px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  font-size: 8px;
  letter-spacing: 0.6px;
  color: var(--muted-foreground);
}
.footer-credit {
  font-size: 11px;
  letter-spacing: 0;
  line-height: 1.6;
}
.footer-credit strong {
  color: var(--paper);
  font-weight: 600;
  white-space: nowrap;
}
.footer-bottom a {
  display: flex;
  align-items: center;
  gap: 7px;
}
.legal-page {
  max-width: 820px;
  margin: auto;
  padding: 70px 5% 100px;
}
.legal-page h1 {
  font-family: 'Barlow Condensed', Impact, sans-serif;
  font-size: clamp(48px, 7vw, 78px);
  line-height: 0.95;
  margin-top: 18px;
}
.legal-page h2 {
  font-family: 'Barlow Condensed', Impact, sans-serif;
  font-size: 26px;
  color: var(--paper);
  margin: 46px 0 16px;
}
.legal-page p,
.legal-page li {
  font-size: 14px;
  line-height: 1.85;
  color: #bebebe;
}
.legal-page p {
  margin: 16px 0;
}
.legal-page ul {
  margin: 16px 0;
  padding-left: 20px;
  list-style: disc;
}
.legal-page li {
  margin: 10px 0;
}
.legal-page li > strong,
.legal-page p > strong {
  color: var(--paper);
}
.legal-page a {
  color: var(--paper);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.legal-updated {
  font-size: 11px;
  letter-spacing: 0.6px;
  color: var(--muted-foreground);
  text-transform: uppercase;
}
.mobile-contact {
  display: none;
}
.icon-button {
  height: 44px !important;
  min-width: 44px !important;
  border-radius: 0 !important;
  padding: 10px !important;
  background: transparent;
  color: var(--paper);
}
.lightbox[data-slot='dialog-content'] {
  display: flex;
  flex-direction: column;
  gap: 0;
  position: fixed;
  inset: 3vh 3vw;
  width: 94vw;
  max-width: none;
  height: 94dvh;
  transform: none;
  /* Dialog centering uses the independent translate property in Tailwind 4. */
  translate: none;
  border-radius: 0;
  padding: 0;
  background: #0b0b0bfc;
  z-index: 70;
  box-shadow: 0 0 0 100vmax #000b;
}
.lightbox-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
  padding: 7px 15px;
  border-bottom: 1px solid var(--border);
  font-size: 10px;
  letter-spacing: 1.4px;
  min-height: 58px;
}
.lightbox-photo {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px;
  overflow: hidden;
  touch-action: pan-y;
}
.lightbox-photo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.lightbox-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  flex: none;
  padding: 7px 15px;
  min-height: 65px;
  border-top: 1px solid var(--border);
}
.lightbox-bottom p {
  font-size: 11px;
  line-height: 1.5;
  text-align: center;
  color: var(--muted-foreground);
}
.mobile-menu[data-slot='dialog-content'] {
  inset: 0;
  transform: none;
  translate: none;
  width: 100%;
  max-width: none;
  height: 100dvh;
  min-height: 540px;
  background: #080808;
  padding: clamp(74px, 10vh, 104px) 8% max(30px, env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overscroll-behavior: contain;
  border-radius: 0;
  border: 0;
  z-index: 80;
  isolation: isolate;
  box-shadow: none;
}
.menu-close {
  position: absolute !important;
  top: max(18px, env(safe-area-inset-top));
  right: 6%;
  width: 54px !important;
  height: 54px !important;
  border: 1px solid var(--border) !important;
  border-radius: 0 !important;
  background: #0a0a0a !important;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    transform 180ms ease !important;
}
.menu-close:hover {
  border-color: #747474 !important;
  background: var(--muted) !important;
}
.menu-close:active {
  transform: scale(0.94);
}
.menu-close svg {
  width: 25px !important;
  height: 25px !important;
  stroke-width: 1.4;
}
.mobile-menu-masthead {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding-right: 78px;
}
.mobile-menu-masthead img {
  width: clamp(138px, 39vw, 182px);
}
.mobile-menu-masthead span {
  padding-bottom: 3px;
  color: var(--muted-foreground);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
}
.mobile-menu nav {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
  margin: clamp(92px, 16vh, 150px) 0 clamp(38px, 6vh, 70px);
  gap: 0;
}
.mobile-menu nav .mobile-menu-link {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) 48px;
  align-items: center;
  gap: 13px;
  width: 100%;
  min-height: clamp(88px, 12.2vh, 118px);
  padding: 8px 0;
  border: 0;
  border-bottom: 1px solid var(--border);
  border-radius: 0;
  background: transparent;
  color: var(--paper);
  cursor: pointer;
  font-family: 'Barlow Condensed', Impact, sans-serif;
  text-transform: uppercase;
  text-align: left;
  transition:
    color 180ms ease,
    padding 180ms ease,
    border-color 180ms ease;
}
.mobile-menu nav .mobile-menu-link:first-child {
  border-top: 1px solid var(--border);
}
.mobile-menu nav .mobile-menu-link:hover,
.mobile-menu nav .mobile-menu-link:focus-visible {
  padding-left: 8px;
  border-color: #717171;
  color: #fff;
}
.mobile-menu nav .mobile-menu-link:active {
  color: var(--red);
}
.mobile-menu-link > span:nth-child(2) {
  overflow: hidden;
  font-size: clamp(49px, 13.2vw, 78px);
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 0.9;
  text-overflow: ellipsis;
}
.mobile-menu nav .mobile-menu-link small {
  font-family: 'Manrope', sans-serif;
  font-size: 10px;
  font-weight: 400;
  color: var(--muted-foreground);
  letter-spacing: 0;
}
.mobile-menu-arrow {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  justify-self: end;
  border: 1px solid transparent;
  transition:
    border-color 180ms ease,
    transform 180ms ease;
}
.mobile-menu-arrow svg {
  width: 28px !important;
  height: 28px !important;
  stroke-width: 1.7;
}
.mobile-menu-link:hover .mobile-menu-arrow,
.mobile-menu-link:focus-visible .mobile-menu-arrow {
  border-color: var(--border);
  transform: translate(2px, -2px);
}
.mobile-menu-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}
.mobile-menu-footer p {
  font-size: clamp(14px, 3.8vw, 18px);
  color: var(--muted-foreground);
}
.mobile-menu-footer span {
  max-width: 150px;
  color: #747474;
  font-size: 7px;
  line-height: 1.6;
  letter-spacing: 0.9px;
  text-align: right;
  text-transform: uppercase;
}
.look-page {
  padding-top: 32px;
}
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--muted-foreground);
  font-size: 11px;
  min-height: 44px;
  margin-bottom: 24px;
}
.look-detail-layout {
  display: grid;
  grid-template-columns: 1fr 0.9fr;
  gap: 8%;
  align-items: start;
}
.detail-main-image {
  display: block;
  width: 100%;
  position: relative;
  border: 0;
  padding: 0;
  background: #121212;
  cursor: zoom-in;
}
.detail-main-image img {
  width: 100%;
  max-height: 690px;
  aspect-ratio: 4/5;
  object-fit: contain;
}
.detail-thumbnails {
  display: flex;
  gap: 12px;
  margin-top: 15px;
}
.detail-thumbnails button {
  border: 1px solid transparent;
  padding: 3px;
  background: transparent;
  width: 75px;
  cursor: pointer;
  opacity: 0.6;
  transition:
    opacity 0.2s,
    border-color 0.2s;
}
.detail-thumbnails button[aria-pressed='true'] {
  border-color: var(--paper);
  opacity: 1;
}
.detail-thumbnails button:hover {
  opacity: 1;
}
.detail-thumbnails img {
  width: 100%;
  aspect-ratio: 4/5;
  object-fit: cover;
}
.image-hint {
  font-size: 10px;
  color: var(--muted-foreground);
  margin-top: 14px;
}
.look-detail-copy {
  padding-top: 18px;
}
.look-detail-copy h1 {
  font-family: 'Barlow Condensed', Impact, sans-serif;
  font-size: 75px;
  text-transform: uppercase;
  line-height: 0.95;
  max-width: 530px;
  margin: 26px 0;
}
.detail-description {
  font-size: 14px;
  line-height: 1.9;
  color: var(--muted-foreground);
  max-width: 430px;
}
.detail-tags {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  padding: 0;
  margin: 25px 0 32px;
}
.detail-tags li {
  padding: 7px 9px;
  border: 1px solid var(--border);
  font-size: 9px;
  color: #b6b6b6;
}
.order-form {
  border-top: 1px solid var(--border);
  padding-top: 28px;
}
.order-form h2 {
  font-family: 'Manrope', Arial, sans-serif;
  font-size: 18px;
  line-height: 1.4;
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0;
  margin: 0 0 11px;
}
.order-form > p {
  font-size: 12px;
  color: var(--muted-foreground);
  line-height: 1.8;
}
.optional-fields {
  margin: 22px 0;
}
.optional-fields summary {
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
  list-style: none;
}
.optional-fields summary::-webkit-details-marker {
  display: none;
}
.optional-fields[open] summary svg {
  transform: rotate(45deg);
}
.optional-fields > div {
  padding-top: 17px;
}
.optional-fields label {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  margin: 14px 0 7px;
}
.optional-fields label > span {
  color: var(--muted-foreground);
  font-size: 9px;
}
.optional-fields input,
.optional-fields textarea,
.copy-fallback textarea {
  min-height: 46px;
  border-radius: 0;
  padding: 12px;
  font-size: 14px;
}
.optional-fields textarea {
  min-height: 88px;
}
.order-form > .action {
  width: 100%;
  font-size: 13px;
  justify-content: space-between;
}
.copy-reference,
.share-reference {
  min-height: 44px !important;
  font-size: 11px !important;
  border-radius: 0 !important;
  gap: 9px !important;
  padding: 12px 0 !important;
  background: transparent !important;
  white-space: normal !important;
  text-align: left;
}
.share-reference {
  margin-top: 15px;
}
.form-note {
  font-size: 10px !important;
  line-height: 1.7;
  margin-top: 15px;
}
.copy-fallback {
  font-size: 11px;
  display: block;
  margin: 12px 0;
}
.copy-fallback textarea {
  margin-top: 10px;
  min-height: 150px;
}
.look-motion {
  padding: 100px 0 80px;
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 9%;
  align-items: center;
  border-bottom: 1px solid var(--border);
}
.look-motion h2 {
  font-size: 73px;
}
.look-videos {
  display: flex;
  gap: 18px;
  align-items: center;
  overflow-x: auto;
  padding-bottom: 10px;
}
.look-videos .video-player {
  flex: 1;
  min-width: 170px;
  max-width: 300px;
}
.related-looks {
  padding-top: 70px;
}
.related-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7%;
}
.related-grid img {
  width: 100%;
  aspect-ratio: 4/5;
  object-fit: contain;
  max-height: 470px;
  background: #121212;
}
.related-grid > a > span {
  display: block;
  font-size: 9px;
  letter-spacing: 1px;
  color: var(--muted-foreground);
  margin: 20px 0 10px;
}
.related-grid h3 {
  font-family: 'Barlow Condensed', Impact, sans-serif;
  font-size: 35px;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.not-found {
  min-height: 100dvh;
  display: grid;
  grid-template-columns: minmax(0, 1.04fr) minmax(360px, 0.96fr);
  background: #0a0a0a;
}
.not-found-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  padding: 64px 10% 64px 12%;
}
.not-found-brand {
  position: absolute;
  top: 34px;
  left: 6%;
}
.not-found-brand img {
  width: 158px;
  height: auto;
}
.not-found-copy > .eyebrow {
  margin-bottom: 22px;
}
.not-found-number {
  font-family: 'Barlow Condensed', Impact, sans-serif;
  font-size: clamp(130px, 20vw, 285px);
  font-weight: 700;
  line-height: 0.9;
  letter-spacing: 0;
  color: #ffffff08;
  margin: 0 0 -38px -12px;
  user-select: none;
}
.not-found h1 {
  position: relative;
  z-index: 1;
  font-family: 'Barlow Condensed', Impact, sans-serif;
  font-size: clamp(54px, 6.2vw, 97px);
  line-height: 0.88;
}
.not-found h1 span {
  color: var(--red);
}
.not-found-description {
  max-width: 365px;
  margin: 28px 0 34px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--muted-foreground);
}
.not-found-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 24px;
}
.not-found-actions .action { min-height: 52px; }
.not-found-home {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  color: var(--paper);
  font-size: 12px;
}
.not-found-art {
  position: relative;
  min-height: 100dvh;
  overflow: hidden;
  background: #191919;
}
.not-found-art::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #0b0b0b38, transparent 28%), linear-gradient(0deg, #0006, transparent 40%);
  pointer-events: none;
}
.not-found-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.not-found-art figcaption {
  position: absolute;
  z-index: 1;
  right: 24px;
  bottom: 21px;
  color: #ebebeb;
  font-size: 8px;
  letter-spacing: 1.4px;
}
@media (max-width: 760px) {
  .not-found {
    display: flex;
    flex-direction: column-reverse;
  }
  .not-found-art {
    min-height: 38dvh;
    max-height: 410px;
  }
  .not-found-art img { object-position: center 34%; }
  .not-found-copy {
    min-height: 62dvh;
    padding: 62px 7% 52px;
  }
  .not-found-brand {
    top: 21px;
    left: 7%;
  }
  .not-found-brand img { width: 132px; }
  .not-found-number {
    font-size: clamp(120px, 39vw, 190px);
    margin-bottom: -28px;
  }
  .not-found h1 { font-size: clamp(52px, 14.2vw, 76px); }
  .not-found-description { margin: 24px 0 28px; }
  .not-found-actions { gap: 18px; }
}
.reveal-ready {
  opacity: 0;
  transform: translateY(24px);
}
.reveal-ready.is-visible {
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes heading-reveal {
  from {
    transform: translateY(105%);
  }
  to {
    transform: translateY(0);
  }
}
@keyframes photo-reveal {
  from {
    opacity: 0;
    clip-path: inset(100% 0 0);
  }
  to {
    opacity: 1;
    clip-path: inset(0);
  }
}
@keyframes detail-reveal {
  from {
    clip-path: inset(0 100% 0 0);
  }
  to {
    clip-path: inset(0);
  }
}
@keyframes stitch {
  from {
    stroke-dashoffset: 900;
  }
  to {
    stroke-dashoffset: 0;
  }
}
@media (max-width: 1100px) {
  .look-3 h3 {
    font-size: 65px;
  }
  .close-tabs-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 30px;
  }
  .process-heading h2 {
    font-size: 74px;
  }
  .close-copy h3 {
    font-size: 57px;
  }
  .process-grid {
    gap: 40px 7%;
  }
  .process-note > p {
    font-size: 68px;
  }
  .order-section h2 {
    font-size: 76px;
  }
  .look-detail-copy h1 {
    font-size: 61px;
  }
  .look-detail-layout {
    gap: 6%;
  }
  .look-motion {
    gap: 6%;
  }
  .look-motion h2 {
    font-size: 60px;
  }
  .section-heading > p {
    font-size: 12px;
  }
  .hero h1 .title-red {
    font-size: inherit;
  }
  .hero-contact {
    font-size: 10px;
  }
}
@media (max-width: 700px) {
  .header-right {
    gap: 10px;
  }
  .account-link {
    min-width: 44px;
    padding: 0 10px;
  }
  .header-contact {
    font-size: 10px;
    min-height: 44px;
    border: 0;
  }
  .hero-bottom {
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 15px 20px;
  }
  .hero-bottom p {
    font-size: 12px;
  }
  .hero-contact {
    font-size: 10px;
    margin-top: 12px;
    min-height: 30px;
  }
  .hero h1 {
    margin-bottom: 26px;
  }
  .hero-frame {
    animation-duration: 0.65s;
  }
  .section-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 23px;
    margin-bottom: 34px;
  }
  .section-heading > p {
    font-size: 13px;
    line-height: 1.8;
  }
  .looks-grid {
    gap: 45px 18px;
  }
  .look-2 {
    margin-top: 72px;
  }
  .look-card h3 {
    font-size: 26px;
    margin: 10px 0;
  }
  .look-label {
    font-size: 7px;
    gap: 5px;
    margin-top: 16px;
    letter-spacing: 0.3px;
  }
  .look-label > span:last-child {
    display: none;
  }
  .look-badge {
    top: 9px;
    left: 9px;
    font-size: 7px;
    padding: 6px 8px;
    letter-spacing: 0.5px;
  }
  .look-open {
    height: 36px;
    bottom: 10px;
    right: 10px;
    padding: 0 8px;
  }
  .look-open svg {
    width: 19px;
  }
  .look-open span {
    display: none;
  }
  .text-link {
    font-size: 10px;
    gap: 9px;
    min-height: 44px;
  }
  .look-3 {
    padding-top: 40px;
    grid-template-columns: 1fr 1fr;
    gap: 22px;
  }
  .look-3 .look-image-link {
    margin-left: 5px;
  }
  .look-3 .look-card-copy {
    padding-right: 0;
  }
  .look-3 h3 {
    font-size: 34px;
    line-height: 0.96;
  }
  .look-description {
    font-size: 11px;
    line-height: 1.8;
    margin: 13px 0;
  }
  .looks-section {
    padding-bottom: 65px;
  }
  .editorial-grid {
    columns: 2;
    column-gap: 14px;
  }
  .gallery-photo {
    margin-bottom: 14px;
  }
  .image-expand {
    top: 8px;
    right: 8px;
    width: 29px;
    height: 29px;
  }
  .gallery-number {
    display: none;
  }
  .gallery-bottom {
    align-items: flex-start;
    flex-direction: column;
    gap: 16px;
    margin-top: 21px;
  }
  .gallery-bottom p {
    font-size: 10px;
  }
  .gallery-more {
    font-size: 11px !important;
    min-height: 48px;
  }
  .editorial-film-row {
    grid-template-columns: 1fr 1fr;
    gap: 23px;
    margin: 70px auto 0;
  }
  .editorial-film-row h3 {
    font-size: 59px;
    margin: 20px 0;
  }
  .editorial-film-row > div > p:last-child {
    font-size: 11px;
    line-height: 1.7;
  }
  .video-caption {
    left: 12px;
    right: 12px;
    bottom: 14px;
    font-size: 10px;
  }
  .video-caption small {
    font-size: 7px;
    letter-spacing: 0.5px;
  }
  .play-circle {
    width: 48px;
    height: 48px;
  }
  .close-tabs-heading h2 {
    font-size: 60px;
  }
  .close-tabs {
    gap: 26px !important;
  }
  .detail-tabs {
    gap: 15px !important;
    width: 100%;
    justify-content: space-between !important;
  }
  .detail-tabs [data-slot='tabs-trigger'] {
    font-size: 10px;
    gap: 6px !important;
  }
  .close-content {
    grid-template-columns: 1fr;
    gap: 30px;
  }
  .close-photo img {
    aspect-ratio: 1.1;
  }
  .close-copy {
    max-width: none;
  }
  .close-copy h3 {
    font-size: 52px;
    max-width: 300px;
    margin: 17px 0;
  }
  .close-copy > p {
    font-size: 13px;
    max-width: 340px;
  }
  .stitch-line {
    margin: 22px 0 12px;
    max-width: 260px;
  }
  .process-heading {
    flex-direction: column;
    align-items: flex-start;
    gap: 25px;
    margin-bottom: 40px;
  }
  .process-heading h2 {
    font-size: 61px;
  }
  .process-heading > p {
    font-size: 12px;
  }
  .process-grid {
    grid-template-columns: 1fr 1fr;
    gap: 30px 20px;
  }
  .process-main {
    grid-column: 1/-1;
    margin: 0 9px;
    max-width: 450px;
  }
  .process-main img {
    max-height: 510px;
    object-fit: contain;
  }
  .process-main figcaption,
  .process-bw figcaption {
    font-size: 6px;
    margin-top: 16px;
    line-height: 1.6;
    letter-spacing: 0.5px;
  }
  .process-film {
    grid-column: 2;
    grid-row: 2/4;
    align-self: start;
  }
  .process-film > p {
    font-size: 8px;
    gap: 5px;
  }
  .process-bw {
    grid-column: 1;
    grid-row: 2;
    max-width: 190px;
  }
  .process-note {
    grid-column: 1;
    grid-row: 3;
  }
  .process-note > p {
    font-size: 38px;
    margin: 10px 0;
  }
  .editorial-plus {
    font-size: 42px;
  }
  .process-note .text-link {
    font-size: 8px;
  }
  .order-section {
    grid-template-columns: 1fr;
    gap: 65px;
    padding-top: 70px;
    padding-bottom: 70px;
  }
  .order-section h2 {
    font-size: clamp(54px, 13.8vw, 84px);
    margin: 23px 0;
  }
  .order-description {
    font-size: 12px;
    line-height: 1.9;
  }
  .order-intro > .action {
    font-size: 12px;
    min-height: 52px;
    padding: 15px 20px;
    gap: 30px;
  }
  .order-side {
    display: grid;
    grid-template-columns: 1fr 1.15fr;
    gap: 25px;
    align-items: center;
  }
  .plate-photo {
    margin: 0;
    max-width: 190px;
    padding: 5px 5px 24px;
  }
  .plate-photo figcaption {
    font-size: 5px;
    letter-spacing: 0.3px;
    left: 7px;
    bottom: 9px;
  }
  .order-steps li {
    gap: 9px;
    font-size: 10px;
    padding: 14px 0;
  }
  .order-steps li > span {
    font-size: 7px;
  }
  .order-steps small {
    font-size: 8px;
    margin-top: 5px;
  }
  .site-footer {
    padding: 37px 6% 90px;
  }
  .footer-top {
    flex-wrap: wrap;
    gap: 25px;
    padding-bottom: 30px;
  }
  .footer-top img {
    width: 145px;
  }
  .footer-top > p {
    display: none;
  }
  .footer-top > a:last-child {
    font-size: 11px;
  }
  .footer-bottom {
    flex-wrap: wrap;
    gap: 18px;
    font-size: 7px;
    line-height: 1.8;
  }
  .mobile-contact {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #0b0b0bfa;
    z-index: 35;
    border-top: 1px solid var(--border);
    padding: 10px 6% calc(10px + env(safe-area-inset-bottom));
    gap: 10px;
  }
  .mobile-contact > span {
    font-size: 10px;
  }
  .mobile-contact .action {
    min-height: 44px;
    font-size: 10px;
    padding: 10px 13px;
    gap: 14px;
  }
  .lightbox[data-slot='dialog-content'] {
    inset: 0;
    width: 100%;
    height: 100dvh;
  }
  .lightbox-top {
    padding: 8px 10px;
    font-size: 8px;
  }
  .lightbox-photo {
    padding: 6px;
  }
  .lightbox-bottom {
    padding: 8px 6px calc(8px + env(safe-area-inset-bottom));
    gap: 7px;
  }
  .lightbox-bottom p {
    font-size: 9px;
  }
  .look-page {
    padding-top: 18px;
  }
  .back-link {
    margin-bottom: 15px;
  }
  .look-detail-layout {
    grid-template-columns: 1fr;
    gap: 35px;
  }
  .detail-main-image img {
    max-height: 620px;
  }
  .detail-thumbnails {
    gap: 8px;
  }
  .detail-thumbnails button {
    width: 60px;
  }
  .look-detail-copy {
    padding-top: 0;
  }
  .look-detail-copy h1 {
    font-size: 64px;
    margin: 22px 0;
  }
  .detail-description {
    font-size: 14px;
  }
  .detail-tags {
    margin: 22px 0 28px;
    gap: 8px;
  }
  .detail-tags li {
    font-size: 9px;
  }
  .order-form h2 {
    font-size: 18px;
  }
  .order-form > p {
    font-size: 13px;
  }
  .optional-fields summary {
    font-size: 12px;
  }
  .optional-fields input,
  .optional-fields textarea {
    font-size: 16px;
  }
  .look-motion {
    padding: 65px 0;
    grid-template-columns: 1fr;
    gap: 30px;
  }
  .look-motion h2 {
    font-size: 60px;
  }
  .look-videos {
    gap: 15px;
  }
  .look-videos .video-player {
    min-width: 210px;
    max-width: 250px;
  }
  .related-looks {
    padding-top: 60px;
  }
  .related-looks .section-heading {
    gap: 10px;
  }
  .related-looks h2 {
    font-size: 54px;
  }
  .related-grid {
    gap: 18px;
  }
  .related-grid h3 {
    font-size: 25px;
    gap: 8px;
  }
  .related-grid h3 svg {
    width: 17px;
    flex: none;
  }
  .related-grid > a > span {
    font-size: 8px;
  }
  .reveal-ready {
    transform: translateY(16px);
  }
}
@media (max-width: 420px) {
  .mobile-menu[data-slot='dialog-content'] {
    padding-inline: 6%;
  }
  .mobile-menu-masthead span,
  .mobile-menu-footer span {
    display: none;
  }
  .mobile-menu nav .mobile-menu-link {
    grid-template-columns: 31px minmax(0, 1fr) 42px;
    gap: 10px;
  }
  .mobile-menu-link > span:nth-child(2) {
    font-size: clamp(46px, 13.6vw, 58px);
  }
  .mobile-menu-arrow {
    width: 42px;
    height: 42px;
  }
  .mobile-menu-arrow svg {
    width: 25px !important;
    height: 25px !important;
  }
}
@media (max-width: 359px) {
  .account-link-label {
    display: none;
  }
  .account-link {
    padding: 0;
    justify-content: center;
  }
  .header-contact {
    font-size: 9px;
  }
  .hero h1 {
    font-size: 22vw;
  }
  .hero-bottom .action {
    font-size: 11px;
  }
  .hero-bottom p {
    font-size: 11px;
  }
  .hero-stamp {
    font-size: 20px;
  }
  .statement-strip {
    font-size: 14px;
  }
  .section h2 {
    font-size: 53px;
  }
  .look-card h3 {
    font-size: 23px;
  }
  .look-3 h3 {
    font-size: 29px;
  }
  .look-description {
    font-size: 10px;
  }
  .detail-tabs {
    gap: 10px !important;
  }
  .detail-tabs [data-slot='tabs-trigger'] {
    font-size: 9px;
    gap: 4px !important;
  }
  .close-copy h3 {
    font-size: 49px;
  }
  .order-section h2 {
    font-size: 50px;
  }
  .order-side {
    grid-template-columns: 1fr;
    gap: 35px;
  }
  .plate-photo {
    max-width: 195px;
    justify-self: center;
  }
  .order-steps li {
    font-size: 12px;
  }
  .order-steps small {
    font-size: 10px;
  }
  .look-detail-copy h1 {
    font-size: 55px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .reveal-ready {
    opacity: 1;
    transform: none;
  }
  .hero-frame {
    transform: rotate(2deg) !important;
  }
  .hero h1 .title-line > span {
    transform: none;
  }
  .hero-frame,
  .close-photo img {
    clip-path: none;
    opacity: 1;
  }
  .stitch-line svg {
    stroke-dashoffset: 0;
  }
}
```

### `app/store.css`

Store, account, checkout, administration, and drop styles.

```css
/* Storefront: translucent surfaces layered over the Tesoob editorial language. */
.store-shell {
  --store-accent: #d4d4d4;
  width: 100%;
  min-width: 0;
  max-width: 1440px;
  margin: auto;
  padding: 30px 5% 80px;
  min-height: 75vh;
}
.store-shell h1,
.store-shell h2,
.store-shell h3 {
  font-family: 'Barlow Condensed', 'Arial Narrow', sans-serif;
  font-weight: 700;
}
.store-shell h1 {
  font-size: clamp(56px, 7vw, 112px);
  line-height: 0.91;
  letter-spacing: -0.025em;
}
.store-shell h1 em {
  color: var(--store-accent);
  font-style: normal;
}
.store-shell button,
.store-magnetic {
  cursor: pointer;
}
.store-shell button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.store-toolbar,
.store-toolbar a,
.store-back {
  display: flex;
  align-items: center;
  gap: 9px;
}
.store-toolbar {
  justify-content: space-between;
  font-size: 11px;
  color: var(--muted-foreground);
  padding-bottom: 30px;
  border-bottom: 1px solid var(--border);
}
.store-cart-trigger,
.store-add-to-cart,
.store-cart > button,
.store-cart-heading > button,
.store-cart-items > article > button {
  border: 0;
  background: transparent;
  color: var(--paper);
}
.store-cart-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  font-size: 11px;
}
.store-cart-trigger span {
  display: grid;
  place-items: center;
  min-width: 19px;
  height: 19px;
  padding: 0 5px;
  border-radius: 50%;
  background: var(--store-accent);
  color: #f4f4f4;
  font-size: 9px;
}
.store-cart {
  position: fixed;
  z-index: 20;
  top: 88px;
  right: 5%;
  width: min(410px, 88vw);
  max-height: min(70vh, 620px);
  overflow: auto;
  padding: 25px;
  border: 1px solid #ffffff24;
  background: #111111ee;
  box-shadow: 0 22px 65px #0008;
  backdrop-filter: blur(24px);
}
.store-cart-heading {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border);
}
.store-cart-heading .store-kicker { margin-bottom: 7px; }
.store-cart-heading h2 { font-size: 34px; }
.store-cart-heading > button { font-size: 11px; padding: 8px 0; }
.store-cart-items > article {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) 32px;
  gap: 14px;
  align-items: start;
  padding: 18px 0;
  border-bottom: 1px solid var(--border);
}
.store-cart-items img { width: 72px; height: 88px; object-fit: cover; }
.store-cart-items h3 { font-size: 23px; line-height: 1; overflow-wrap: anywhere; }
.store-cart-items p { margin-top: 7px; font-size: 12px; }
.store-cart-items a { display: inline-flex; align-items: center; gap: 8px; margin-top: 12px; font-size: 10px; color: #d0d0d0; }
.store-cart-items > article > button { display: grid; place-items: center; width: 32px; height: 32px; color: #b4b4b4; }
.store-add-to-cart {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 44px;
  margin: 15px 0 0 18px;
  padding: 12px 0;
  border-bottom: 1px solid #616161;
  font-size: 11px;
}
.store-add-to-cart:hover { color: #bababa; }
.store-toolbar a,
.store-back {
  min-height: 44px;
}
.store-back {
  width: fit-content;
  color: var(--muted-foreground);
  font-size: 12px;
  margin-bottom: 35px;
}
.store-kicker {
  font:
    600 10px/1.6 'Manrope',
    sans-serif;
  letter-spacing: 2px;
  color: var(--muted-foreground);
  margin-bottom: 24px;
}
.store-intro {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 8%;
  padding: 58px 0 64px;
  align-items: end;
}
.store-intro h1 {
  font-size: clamp(74px, 10.5vw, 151px);
}
.store-intro-note {
  max-width: 285px;
  justify-self: end;
  padding-bottom: 7px;
}
.store-intro-note > span {
  color: var(--store-accent);
  font-size: 10px;
  letter-spacing: 1.8px;
}
.store-intro-note p {
  font-size: 14px;
  line-height: 1.9;
  margin: 23px 0;
  color: #bebebe;
}
.store-intro-note a {
  display: flex;
  align-items: center;
  gap: 35px;
  font-size: 12px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
}
.store-section-label {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  font-size: 9px;
  letter-spacing: 1.6px;
  border-top: 1px solid var(--border);
  padding: 19px 0 35px;
  color: var(--muted-foreground);
}
.store-catalog {
  scroll-margin-top: 100px;
}
.store-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  column-gap: 7%;
  row-gap: 80px;
  align-items: start;
}
.store-card {
  min-width: 0;
  animation: store-arrive 0.7s both;
  animation-delay: var(--card-delay);
}
.store-card-1 {
  margin-top: 110px;
}
.store-card-2 {
  grid-column: 1/-1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6%;
  padding: 40px;
  border: 1px solid #ffffff13;
  background: #ffffff04;
  backdrop-filter: blur(20px);
  align-items: center;
}
.store-card-2 .store-card-body {
  padding: 0;
  max-width: 400px;
}
.store-card-image {
  display: block;
  position: relative;
  overflow: hidden;
  background: #161616;
}
.store-card-image img {
  width: 100%;
  aspect-ratio: 4/5;
  object-fit: cover;
  transition: transform 0.65s cubic-bezier(0.2, 0.65, 0.25, 1);
}
.store-card-1 .store-card-image img {
  aspect-ratio: 3/4;
}
.store-card-2 .store-card-image img {
  aspect-ratio: 1;
}
.store-card-image:hover img {
  transform: scale(1.035);
}
.store-piece-number {
  position: absolute;
  top: 18px;
  left: 18px;
  font-size: 8px;
  letter-spacing: 1.8px;
  border: 1px solid #ffffff32;
  background: #0e0e0ea6;
  backdrop-filter: blur(18px);
  padding: 10px 12px;
}
.store-card-arrow {
  position: absolute;
  bottom: 18px;
  right: 18px;
  display: grid;
  place-items: center;
  width: 50px;
  height: 50px;
  border: 1px solid #ffffff36;
  background: #1a1a1aa1;
  backdrop-filter: blur(18px);
  transition:
    background 0.2s,
    transform 0.2s;
}
.store-card-image:hover .store-card-arrow {
  background: var(--primary);
  transform: translate(2px, -2px);
}
.store-card-body {
  padding: 25px 0 0;
}
.store-card-title {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 18px;
}
.store-card-title h2 {
  font-size: clamp(28px, 3vw, 42px);
  line-height: 1;
}
.store-card-title > p {
  flex-shrink: 0;
  font-size: 15px;
  margin-top: 5px;
}
.store-description {
  font-size: 13px;
  line-height: 1.85;
  color: #b8b8b8;
  white-space: pre-line;
  overflow-wrap: anywhere;
  margin-top: 18px;
}
.store-text-link {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  font-size: 12px;
  min-height: 44px;
  padding: 12px 0;
  margin-top: 15px;
  border: 0;
  border-bottom: 1px solid #616161;
  background: transparent;
  color: var(--paper);
}
.store-observation {
  border-left: 2px solid #73737380;
  padding: 0 0 0 15px;
  margin-top: 23px;
}
.store-observation > span {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #aaaaaa;
}
.store-observation p {
  font-size: 12px;
  line-height: 1.7;
  color: #b2b2b2;
  white-space: pre-line;
  overflow-wrap: anywhere;
  margin-top: 7px;
}
.store-glass {
  border: 1px solid #ffffff1c;
  background: linear-gradient(135deg, #ffffff0b, #ffffff03);
  box-shadow:
    0 22px 65px #0003,
    inset 0 1px #ffffff09;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
}
.store-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  min-height: 50px;
  padding: 15px 22px;
  border: 1px solid #73737354;
  background: #3f3f3f;
  color: #f4f4f4;
  font:
    600 12px/1.4 'Manrope',
    sans-serif;
  text-align: center;
  text-decoration: none;
  border-radius: 2px;
  transition:
    background 0.2s,
    transform 0.2s,
    border-color 0.2s;
}
.store-button:hover {
  background: #555555;
  transform: translateY(-2px);
}
.store-button-secondary {
  background: #ffffff06;
  color: var(--paper);
  border-color: #ffffff25;
}
.store-button-secondary:hover {
  background: #ffffff10;
  border-color: #ffffff60;
}
.store-magnetic {
  display: inline-flex;
  width: fit-content;
  max-width: 100%;
  min-height: 48px;
  align-items: center;
  gap: 18px;
  padding: 4px 0;
  margin-top: 23px;
  color: var(--paper);
  font-family: 'Barlow Condensed', 'Arial Narrow', Impact, sans-serif;
  font-size: clamp(28px, 2.4vw, 34px);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  transition: color 0.18s;
}
.store-magnetic > svg {
  flex: none;
  color: var(--red);
  transition: transform 0.18s;
}
.store-magnetic:hover,
.store-magnetic:focus-visible {
  color: var(--red);
}
.store-magnetic:hover > svg,
.store-magnetic:focus-visible > svg {
  transform: translate(2px, -2px);
}
.mobile-menu-footer > a {
  display: flex;
  gap: 12px;
  align-items: center;
  min-height: 44px;
  font-size: 13px;
}
.store-notice {
  border: 1px solid var(--border);
  padding: 36px;
  min-height: 125px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 22px;
  color: #bcbcbc;
  font-size: 14px;
  line-height: 1.7;
  text-align: center;
}
.store-footnote {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-top: 70px;
  padding: 28px 0;
  border-top: 1px solid var(--border);
  color: #a2a2a2;
}
.store-footnote p {
  font-size: 11px;
  line-height: 1.7;
  max-width: 420px;
}
.store-footnote > span {
  margin-left: auto;
  font-size: 8px;
  letter-spacing: 2px;
}
.store-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  margin-top: 40px;
  font-size: 12px;
}
.store-pagination button {
  min-height: 44px;
  padding: 10px 15px;
  background: transparent;
  color: var(--paper);
  border: 1px solid var(--border);
}
.store-detail {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  align-items: start;
  gap: 8%;
}
.store-detail-image {
  background: #161616;
  padding: 13px;
  border: 1px solid var(--border);
}
.store-detail-image img {
  width: 100%;
  max-height: 780px;
  object-fit: contain;
}
.store-detail-copy {
  padding: 45px 0;
}
.store-detail h1 {
  font-size: clamp(52px, 6vw, 85px);
  overflow-wrap: anywhere;
}
.store-price {
  font-size: 27px;
  margin-top: 27px;
}
.store-detail-copy > .store-button {
  width: 100%;
  margin-top: 36px;
}
.store-fine-print {
  font:
    400 11px/1.8 'Manrope',
    sans-serif;
  color: #a6a6a6;
  margin-top: 13px;
}
.store-image-error {
  display: grid;
  place-items: center;
  aspect-ratio: 4/5;
  color: var(--muted-foreground);
  font-size: 12px;
  background: #1a1a1a;
}
.store-auth-layout {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 10%;
  margin: 30px auto;
  max-width: 1060px;
  min-width: 0;
}
.store-auth-layout > * {
  min-width: 0;
}
.store-auth-story {
  padding: 40px 0;
}
.store-auth-story > p:not(.store-kicker) {
  margin-top: 32px;
  font-size: 14px;
  line-height: 1.9;
  color: #b6b6b6;
}
.store-auth-story > span {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 10px;
  color: #a0a0a0;
  margin-top: 35px;
}
.store-auth-form {
  width: 100%;
  max-width: 100%;
  padding: 32px;
  align-self: start;
}
.store-auth-form h2 {
  font-size: 35px;
  margin: 27px 0;
}
.store-tabs {
  display: flex;
  gap: 25px;
  border-bottom: 1px solid var(--border);
}
.store-tabs button {
  border: 0;
  border-bottom: 2px solid transparent;
  padding: 12px 0;
  background: transparent;
  font-size: 12px;
  color: var(--muted-foreground);
}
.store-tabs button[aria-pressed='true'] {
  color: var(--paper);
  border-bottom-color: var(--store-accent);
}
.store-shell label {
  display: block;
  font-size: 11px;
  line-height: 1.6;
  color: #cecece;
  margin: 0 0 18px;
}
.store-shell label > span {
  color: var(--muted-foreground);
  font-size: 10px;
}
.store-shell input,
.store-shell textarea,
.store-shell select {
  display: block;
  width: 100%;
  min-width: 0;
  min-height: 48px;
  border: 1px solid #ffffff23;
  background: #0c0c0cba;
  color: var(--paper);
  padding: 12px;
  margin-top: 8px;
  border-radius: 2px;
  font:
    400 14px/1.5 'Manrope',
    sans-serif;
  color-scheme: dark;
}
.store-shell textarea {
  resize: vertical;
}
.store-shell input:focus-visible,
.store-shell select:focus-visible,
.store-shell textarea:focus-visible {
  outline: 2px solid #a4a4a4;
  outline-offset: 2px;
}
.store-shell fieldset {
  min-width: 0;
  padding: 0;
  margin: 0 0 27px;
  border: 0;
}
.store-shell legend {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 20px;
}
.store-auth-form .store-button {
  width: 100%;
}
.store-auth-form form > .store-button {
  margin-top: 22px;
}
.store-divider {
  display: flex;
  align-items: center;
  gap: 13px;
  color: var(--muted-foreground);
  font-size: 10px;
  margin: 25px 0;
}
.store-divider::before,
.store-divider::after {
  content: '';
  height: 1px;
  flex: 1;
  background: var(--border);
}
.store-error {
  padding: 17px 20px;
  border: 1px solid #73737360;
  background: #73737310;
  font-size: 12px;
  line-height: 1.7;
  color: #d4d4d4;
  margin: 22px 0;
}
.store-error-action {
  border: 0;
  padding: 0;
  background: transparent;
  color: #e9e9e9;
  font: inherit;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.store-success {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 17px 20px;
  border: 1px solid #98989850;
  font-size: 12px;
  color: #bebebe;
  margin: 22px 0;
}
.store-account-panel {
  max-width: 1000px;
  margin: auto;
}
.store-account-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 30px 0;
  font-size: 13px;
  overflow-wrap: anywhere;
}
.store-account-panel > h2 {
  margin: 45px 0 20px;
  font-size: 38px;
}
.store-order-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 25px;
  padding: 24px 0;
  border-top: 1px solid var(--border);
}
.store-order-row h3 {
  font-size: 27px;
}
.store-order-row p {
  font-size: 11px;
  color: var(--muted-foreground);
  margin-top: 8px;
}
.store-order-row small {
  font-size: 9px;
  color: var(--muted-foreground);
  overflow-wrap: anywhere;
}
.store-order-row > div:last-child {
  text-align: right;
}
.store-order-row strong {
  font-size: 17px;
}
.store-order-row span {
  display: block;
  font-size: 10px;
  color: #b8b8b8;
  margin-top: 9px;
}
.store-checkout-heading {
  margin-bottom: 42px;
}
.store-checkout-heading > p:last-child {
  margin-top: 22px;
  color: var(--muted-foreground);
  font-size: 13px;
  line-height: 1.7;
}
.store-checkout-layout {
  display: grid;
  grid-template-columns: 1.3fr 0.8fr;
  gap: 5%;
  align-items: start;
}
.store-checkout-form {
  padding: 35px;
}
.store-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.store-checkout-form > .store-button {
  width: 100%;
  margin-top: 24px;
}
.store-payment-note {
  display: flex;
  align-items: start;
  gap: 12px;
  border-top: 1px solid var(--border);
  padding-top: 22px;
}
.store-payment-note svg {
  flex: none;
  color: #a4a4a4;
}
.store-payment-note strong {
  font-size: 12px;
}
.store-payment-note p {
  font-size: 11px;
  color: var(--muted-foreground);
  line-height: 1.8;
  margin-top: 7px;
}
.store-checkout-summary {
  padding: 25px;
  position: sticky;
  top: 118px;
}
.store-summary-image {
  margin-bottom: 25px;
}
.store-summary-image img {
  width: 100%;
  max-height: 280px;
  object-fit: cover;
}
.store-checkout-summary h2 {
  font-size: 36px;
  margin-bottom: 25px;
  line-height: 1;
}
.store-checkout-summary label {
  max-width: 140px;
  margin-top: 25px;
}
.store-checkout-summary dl {
  margin-top: 26px;
}
.store-checkout-summary dl > div {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 20px;
  padding: 14px 0;
  border-top: 1px solid var(--border);
  font-size: 11px;
  line-height: 1.7;
}
.store-checkout-summary dd {
  margin: 0;
  text-align: right;
  max-width: 170px;
}
.store-checkout-summary .store-total {
  font-size: 14px;
  font-weight: 700;
}
.store-checkout-success {
  padding: 60px;
  max-width: 850px;
  margin: 40px auto;
}
.store-checkout-success > svg {
  color: #acacac;
  margin-bottom: 25px;
}
.store-checkout-success h1 {
  font-size: clamp(45px, 6vw, 78px);
}
.store-checkout-success > p:not(.store-kicker) {
  margin-top: 25px;
  line-height: 1.8;
}
.store-checkout-success .store-button {
  margin-top: 30px;
}
.store-thank-you {
  min-height: 62vh;
  max-width: 940px;
  margin: 0 auto;
  padding: clamp(55px, 10vw, 130px) 0;
}
.store-thank-you-mark {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  color: #bababa;
  font-size: 10px;
  letter-spacing: 1.4px;
}
.store-thank-you-mark svg {
  padding: 7px;
  width: 42px;
  height: 42px;
  border: 1px solid #acacac66;
}
.store-thank-you > .store-kicker { margin-top: 45px; }
.store-thank-you h1 { font-size: clamp(58px, 9vw, 126px); }
.store-thank-you-copy {
  max-width: 450px;
  margin-top: 30px;
  color: #bebebe;
  font-size: 15px;
  line-height: 1.9;
}
.store-thank-you-reference {
  max-width: 600px;
  margin-top: 32px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
  color: var(--muted-foreground);
  font-size: 11px;
}
.store-thank-you-reference strong {
  display: block;
  margin-top: 8px;
  color: var(--paper);
  font: 600 12px/1.5 'Manrope', sans-serif;
  overflow-wrap: anywhere;
}
.store-thank-you-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 26px;
  margin-top: 38px;
}
.store-thank-you-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  color: var(--paper);
  font-size: 12px;
}
.store-admin-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 50px;
}
.store-admin-heading h1 {
  font-size: clamp(52px, 6vw, 90px);
}
.store-shell .admin-workspace-nav { margin-bottom: 36px; }
.store-editor {
  scroll-margin-top: 24px;
  padding: 35px;
  max-width: 900px;
  margin: 30px 0;
}
.store-editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 25px;
}
.store-editor-header h2 {
  font-size: 35px;
}
.store-image-picker { margin: 24px 0; }
.store-image-picker-body { display: grid; grid-template-columns: 100px minmax(0, 1fr); gap: 20px; align-items: start; }
.store-image-preview { display: grid; place-items: center; width: 100px; height: 124px; border: 1px solid var(--border); color: var(--muted-foreground); }
.store-image-preview img { width: 100%; height: 100%; object-fit: contain; }
.store-shell .store-image-picker input[type='file'] { padding: 10px; max-width: 100%; font-size: 12px; cursor: pointer; }
.store-image-picker input::file-selector-button { padding: 10px 12px; margin-right: 12px; border: 0; background: var(--paper); color: var(--background); cursor: pointer; text-shadow: none; }
@media (max-width: 520px) {
  .store-image-picker-body { grid-template-columns: minmax(0, 1fr); gap: 14px; }
}
.store-shell .store-checkbox {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
}
.store-shell .store-checkbox input {
  width: 20px;
  height: 20px;
  min-height: 20px;
  margin: 0;
  accent-color: var(--primary);
}
.store-shell .store-legal-consent {
  align-items: flex-start;
  margin: 22px 0 0;
  color: #bcbcbc;
  font-size: 11px;
  line-height: 1.7;
}
.store-shell .store-legal-consent input {
  flex: none;
  margin-top: 1px;
}
.store-legal-consent a {
  color: var(--paper);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.store-admin-row {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 22px 0;
  border-top: 1px solid var(--border);
}
.store-admin-thumb {
  width: 80px;
  flex: none;
}
.store-admin-thumb img {
  width: 80px;
  height: 95px;
  object-fit: cover;
}
.store-admin-row h2 {
  font-size: 30px;
  overflow-wrap: anywhere;
}
.store-admin-row > div:nth-child(2) { min-width: 0; }
.store-admin-edit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid var(--border);
  background: var(--paper);
  color: var(--background);
  text-shadow: none;
  font-size: 12px;
  font-weight: 600;
}
.store-admin-edit:hover { background: white; }
.store-admin-row p {
  font-size: 11px;
  color: var(--muted-foreground);
  margin-top: 8px;
}
.store-admin-actions {
  display: flex;
  gap: 10px;
  margin-left: auto;
}
.store-icon-button {
  display: grid;
  place-items: center;
  background: transparent;
  border: 1px solid var(--border);
  width: 44px;
  height: 44px;
  color: var(--paper);
}
.store-icon-button:hover {
  background: #ffffff10;
}
.store-confirm {
  padding: 30px;
  margin: 24px 0;
  border-color: #73737380;
}
.store-confirm h2 {
  font-size: 30px;
}
.store-confirm p {
  font-size: 12px;
  line-height: 1.7;
  margin: 16px 0;
}
.store-confirm > div {
  display: flex;
  gap: 15px;
}
@keyframes store-arrive {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (max-width: 850px) {
  .store-grid {
    gap: 50px 5%;
  }
  .store-card-title {
    flex-direction: column;
    gap: 7px;
  }
  .store-card-1 {
    margin-top: 75px;
  }
  .store-card-2 {
    padding: 25px;
  }
  .store-auth-layout {
    gap: 6%;
  }
  .store-auth-form {
    padding: 25px;
  }
  .store-checkout-layout {
    gap: 25px;
    grid-template-columns: 1.2fr 0.8fr;
  }
  .store-checkout-form {
    padding: 25px;
  }
  .store-form-grid {
    gap: 14px;
  }
}
@media (max-width: 600px) {
  .store-shell {
    padding: 18px 6% 55px;
  }
  .store-toolbar {
    padding-bottom: 17px;
    font-size: 10px;
  }
  .store-intro {
    grid-template-columns: 1fr;
    gap: 30px;
    padding: 35px 0 40px;
  }
  .store-intro h1 {
    font-size: clamp(65px, 17vw, 100px);
  }
  .store-intro-note {
    justify-self: start;
    max-width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px 20px;
  }
  .store-intro-note p {
    font-size: 12px;
    margin: 0;
    grid-column: 1;
  }
  .store-intro-note > span {
    grid-column: 1/-1;
  }
  .store-intro-note a {
    font-size: 10px;
    gap: 12px;
    align-self: end;
  }
  .store-grid {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  .store-card {
    width: 94%;
  }
  .store-card-1 {
    margin-top: 0;
    width: 88%;
    justify-self: end;
  }
  .store-card-2 {
    display: block;
    width: 100%;
    padding: 18px;
  }
  .store-card-2 .store-card-body {
    padding-top: 20px;
  }
  .store-card-title {
    flex-direction: row;
    gap: 15px;
  }
  .store-card-title h2 {
    font-size: 32px;
  }
  .store-card-title > p {
    font-size: 13px;
  }
  .store-card-image img {
    max-height: 530px;
  }
  .store-card-1 .store-card-image img {
    aspect-ratio: 4/5;
  }
  .store-section-label {
    font-size: 8px;
    letter-spacing: 1px;
    padding-bottom: 25px;
  }
  .store-footnote {
    margin-top: 40px;
    align-items: start;
  }
  .store-footnote > span {
    display: none;
  }
  .store-footnote svg {
    flex: none;
  }
  .store-footnote p {
    font-size: 10px;
  }
  .store-detail {
    grid-template-columns: 1fr;
    gap: 25px;
  }
  .store-detail-copy {
    padding: 5px 0;
  }
  .store-detail h1 {
    font-size: 58px;
  }
  .store-detail-image img {
    max-height: 540px;
  }
  .store-price {
    margin-top: 22px;
  }
  .store-auth-layout {
    grid-template-columns: 1fr;
    margin-top: 0;
    gap: 25px;
  }
  .store-auth-story {
    padding: 0;
  }
  .store-auth-story h1 {
    max-width: 100%;
    font-size: clamp(52px, 16vw, 64px);
    overflow-wrap: normal;
  }
  .store-auth-story > p:not(.store-kicker) {
    margin-top: 23px;
    font-size: 12px;
  }
  .store-auth-story > span {
    margin-top: 20px;
  }
  .store-auth-form {
    padding: clamp(20px, 6vw, 25px);
  }
  .store-shell input,
  .store-shell select,
  .store-shell textarea {
    font-size: 16px;
  }
  .store-shell label {
    font-size: 12px;
  }
  .store-checkout-layout {
    display: flex;
    flex-direction: column-reverse;
    gap: 25px;
  }
  .store-checkout-summary,
  .store-checkout-form {
    width: 100%;
    position: static;
    padding: 23px;
  }
  .store-summary-image {
    float: left;
    width: 88px;
    margin: 0 18px 20px 0;
  }
  .store-summary-image img {
    height: 115px;
  }
  .store-checkout-summary .store-kicker {
    margin-top: 6px;
    font-size: 8px;
  }
  .store-checkout-summary h2 {
    font-size: 30px;
  }
  .store-checkout-summary > label,
  .store-checkout-summary > .store-observation {
    clear: both;
  }
  .store-checkout-summary .store-observation {
    padding-top: 10px;
  }
  .store-checkout-heading {
    margin-bottom: 28px;
  }
  .store-checkout-heading h1 {
    font-size: 65px;
  }
  .store-checkout-heading .store-kicker {
    font-size: 8px;
    letter-spacing: 1px;
  }
  .store-checkout-success {
    padding: 27px;
  }
  .store-order-row {
    align-items: start;
    gap: 18px;
  }
  .store-order-row h3 {
    font-size: 24px;
  }
  .store-order-row > div {
    min-width: 0;
  }
  .store-order-row strong {
    font-size: 14px;
  }
  .store-order-row span {
    font-size: 9px;
  }
  .store-account-bar {
    flex-wrap: wrap;
  }
  .store-account-panel h1 {
    font-size: 60px;
  }
  .store-admin-heading {
    align-items: start;
    flex-direction: column;
    gap: 25px;
  }
  .store-editor {
    padding: 22px;
  }
  .store-admin-row {
    gap: 15px;
    flex-wrap: wrap;
  }
  .store-admin-row h2 {
    font-size: 25px;
  }
  .store-admin-row > div:nth-child(2) {
    flex: 1;
  }
  .store-admin-actions {
    flex-basis: 100%;
    justify-content: end;
  }
  .store-admin-thumb {
    width: 60px;
  }
  .store-admin-thumb img {
    width: 60px;
    height: 75px;
  }
  .store-notice {
    padding: 25px;
  }
  .store-magnetic {
    margin-top: 20px;
  }
  .store-form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .store-card {
    animation: none;
  }
  .store-card-image img,
  .store-button,
  .store-magnetic,
  .store-magnetic > svg,
  .store-card-arrow {
    transition: none;
    transform: none !important;
  }
}

.store-drop-announcement {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 0.8fr);
  align-items: center;
  gap: 6%;
  margin: 15px 0 75px;
  border-block: 1px solid var(--border);
  background: linear-gradient(90deg, #0a0a0a, #181818 50%, #0a0a0a);
  padding: 38px clamp(18px, 3vw, 42px);
}
.store-drop-announcement h2 {
  overflow-wrap: anywhere;
  color: var(--paper);
  font-family: var(--font-brand);
  font-size: clamp(42px, 6vw, 82px);
  font-weight: 400;
  line-height: 1.05;
}
.store-drop-announcement-message {
  margin-top: 14px;
  color: var(--muted-foreground);
  font-size: 12px;
  letter-spacing: 0.04em;
}
.store-drop-countdown {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 7px;
  margin-top: 24px;
  border-top: 1px solid var(--border);
  padding-top: 18px;
  text-align: center;
}
.store-drop-countdown > span { min-width: 0; }
.store-drop-countdown strong {
  display: block;
  color: var(--paper);
  font-family: 'Barlow Condensed', Impact, sans-serif;
  font-size: clamp(29px, 3vw, 42px);
  line-height: 1;
}
.store-drop-countdown small {
  display: block;
  margin-top: 6px;
  color: var(--muted-foreground);
  font-size: 7px;
  letter-spacing: 0.8px;
}
.store-drop-countdown.is-compact {
  min-width: 270px;
  margin: 0;
  border: 0;
  padding: 0;
}
.store-drop-countdown.is-compact strong { font-size: 28px; }

@media (max-width: 700px) {
  .store-drop-announcement {
    grid-template-columns: 1fr;
    gap: 28px;
    margin-bottom: 55px;
    padding: 30px 18px;
  }
  .store-drop-countdown strong { font-size: 34px; }
}
```


