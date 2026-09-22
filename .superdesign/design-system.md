# Tesoob Design System

## Product and audience

Tesoob is an independent fashion label and editorial storefront. The public experience combines brand storytelling, limited pieces, scheduled drops, checkout, account access, and direct ordering. The tone is bold, underground, concise, and authorial rather than conventional ecommerce.

## Visual direction

- Use only black, white, and neutral gray.
- Backgrounds are nearly black (`#0a0a0a`) with subtle layered charcoal surfaces.
- Primary text is off-white (`#f5f5f5`); secondary text uses medium-light grays.
- Thin neutral borders and large empty areas create editorial rhythm.
- Corners are square or nearly square; avoid friendly rounded SaaS styling.
- White display text may use the layered `--brand-frost` glow to echo the blurred Tesoob wordmark.
- Never introduce colored gradients, saturated accents, or unrelated brand colors.

## Typography

- Display headings are oversized, compressed, uppercase, and high contrast.
- The Tesoob brand face is irregular/editorial and uses the existing `--font-brand` token.
- Body and UI typography remains compact, direct, and legible.
- Small labels use uppercase text, generous tracking, and muted gray.

## Components

- Buttons: rectangular, 1px border, high-contrast black/white states, compact uppercase/semibold label.
- Inputs: dark flat surfaces with subtle gray borders and clear white focus treatment.
- Cards/panels: border-led separation, low-elevation charcoal backgrounds, no soft consumer-app rounding.
- Icons: monochrome line or geometric marks; when emphasized, apply the same restrained frost glow used by brand text.
- Google login icon: recognizable geometric `G`, monochrome, integrated into the button rather than using Google's multicolor identity.

## Layout and spacing

- Desktop uses editorial two-column grids with substantial negative space.
- Mobile collapses to a single column without losing the large heading hierarchy.
- Prefer 8px-based spacing with larger 24–80px sectional gaps.

## Motion and accessibility

- Motion is short and purposeful; respect `prefers-reduced-motion`.
- Preserve strong contrast, visible focus states, semantic labels, and screen-reader text.
- Decorative logos/icons should be hidden from assistive technology when adjacent text already provides the action name.
