# Page Dependency Trees

## `/` — Home

- `app/page.tsx`
  - `components/tesoob.tsx`
    - `components/site-link.tsx`
    - `components/order-chat.tsx`
    - `lib/clone-settings.ts`
    - `lib/site-config.ts`

## `/loja/conta` — Customer Account

- `app/loja/conta/page.tsx`
  - `components/store-account.tsx`
    - `components/site-link.tsx`
    - `components/storefront.tsx`
      - `components/tesoob.tsx`
      - `components/drop-countdown.tsx`
      - `lib/store-api.ts`
    - `lib/store-profile.ts`
    - `lib/store-api.ts`

## `/loja` — Storefront

- `app/loja/page.tsx`
  - `components/storefront.tsx`
    - `components/site-link.tsx`
    - `components/tesoob.tsx`
    - `components/drop-countdown.tsx`
    - `lib/store-api.ts`

## `/loja/produtos/:id` — Product Detail

- `app/loja/produtos/[id]/page.tsx`
  - `components/storefront.tsx`
    - `components/tesoob.tsx`
    - `components/site-link.tsx`
    - `lib/store-api.ts`

## `/loja/checkout/:id` — Checkout

- `app/loja/checkout/[id]/page.tsx`
  - `components/store-checkout.tsx`
    - `components/site-link.tsx`
    - `components/storefront.tsx`
    - `lib/store-api.ts`

## `/admin/produtos` — Store Administration

- `app/admin/produtos/page.tsx`
  - `components/store-admin.tsx`
    - `components/admin-navigation.tsx`
    - `components/drop-countdown.tsx`
    - `components/product-image-input.tsx`
    - `lib/store-api.ts`

## `/admin` — Conversation Administration

- `app/admin/page.tsx`
  - `components/admin-dashboard.tsx`
    - `components/admin-navigation.tsx`
    - `components/ui/button.tsx`
    - `components/ui/input.tsx`
    - `lib/chat-api.ts`

## `/clone` — Visual Clone

- `app/clone/page.tsx`
  - `components/tesoob.tsx`
  - `lib/clone-settings.ts`
  - `lib/clone-whatsapp.ts`

All pages inherit `app/layout.tsx`, `app/globals.css`, `app/chat.css`, and `app/store.css`.
