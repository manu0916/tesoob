# Extractable Components

## SiteHeader

- Source: `components/tesoob.tsx`
- Category: layout
- Description: Public navigation with the real Tesoob logo, section links, order action, and account link.
- Extractable props: `cloneContact` for clone-only contact routing.
- Hardcoded: logo asset, navigation labels, account icon, typography and CSS classes.

## SiteFooter

- Source: `components/tesoob.tsx`
- Category: layout
- Description: Public footer with logo, slogan, social link, legal links, and credits.
- Extractable props: `cloneContact` for clone-only social routing.
- Hardcoded: logo asset, labels, brand copy, and styling.

## StoreFrame

- Source: `components/storefront.tsx`
- Category: layout
- Description: Store page wrapper combining SiteHeader, main store content, and SiteFooter.
- Extractable props: content slot only.
- Hardcoded: shell composition and store CSS class.

## AdminNavigation

- Source: `components/admin-navigation.tsx`
- Category: layout
- Description: Navigation shared by administration screens.
- Extractable props: current route/active page.
- Hardcoded: destinations, icons, labels, and styling.

## StoreNotice

- Source: `components/storefront.tsx`
- Category: basic
- Description: Store status message with optional retry action.
- Extractable props: message content and retry visibility.
- Hardcoded: retry icon and label.

## DropCountdown

- Source: `components/drop-countdown.tsx`
- Category: basic
- Description: Four-part drop timer for days, hours, minutes, and seconds.
- Extractable props: target timestamp and compact state.
- Hardcoded: timer labels and visual structure.
