# Application Routes

File-based routes use the Vinext/Next App Router conventions. All routes inherit `app/layout.tsx` and the global styles from `app/globals.css`, `app/chat.css`, and `app/store.css`.

| URL | Entry file | Main UI |
| --- | --- | --- |
| `/` | `app/page.tsx` | Main Tesoob landing page from `components/tesoob.tsx` |
| `/vitrine` | `app/vitrine/page.tsx` | Public visual storefront redirect/view |
| `/loja` | `app/loja/page.tsx` | Product storefront from `components/storefront.tsx` |
| `/loja/produtos/:id` | `app/loja/produtos/[id]/page.tsx` | Product detail from `components/storefront.tsx` |
| `/loja/checkout/:id` | `app/loja/checkout/[id]/page.tsx` | Checkout from `components/store-checkout.tsx` |
| `/loja/conta` | `app/loja/conta/page.tsx` | Customer authentication/account from `components/store-account.tsx` |
| `/conta` | `app/conta/page.tsx` | Account compatibility route |
| `/admin` | `app/admin/page.tsx` | Conversation administration |
| `/admin/produtos` | `app/admin/produtos/page.tsx` | Product and drop administration |
| `/admin/clone` | `app/admin/clone/page.tsx` | Clone settings administration |
| `/clone` | `app/clone/page.tsx` | Public visual-only clone |
| `/pecas/:slug` | `app/pecas/[slug]/page.tsx` | Editorial piece detail |
| `/obrigado` | `app/obrigado/page.tsx` | Order thank-you page |
| `/politica-de-privacidade` | `app/politica-de-privacidade/page.tsx` | Privacy policy |
| `/termos-de-uso` | `app/termos-de-uso/page.tsx` | Terms of use |

API routes live under `/api/*` and the store proxy lives at `/store-api/:path+`; they do not render UI.
