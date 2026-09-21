import type { ComponentProps } from 'react';

/**
 * Use document navigation on Pages. The current Vinext production router can
 * throw before navigating after intercepting a click. Native anchors preserve
 * keyboard navigation, modifier clicks, refs, query strings and hash targets.
 */
export function SiteLink({
  children,
  ...props
}: ComponentProps<'a'> & { href: string }) {
  return <a {...props}>{children}</a>;
}
