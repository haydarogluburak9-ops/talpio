import Link from 'next/link';
import type { ReactNode } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ustapilot/ui';

/**
 * Giriş ve kayıt sayfalarının ortak kabuğu. Dar ekranda tek sütun, geniş
 * ekranda ortalanmış kart olarak yerleşir.
 */
export function AuthShell({
  title,
  description,
  children,
  footerText,
  footerHref,
  footerLinkLabel,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footerText: string;
  footerHref: string;
  footerLinkLabel: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10 sm:py-16">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>

      <p className="text-center text-sm text-foreground-muted">
        {footerText}{' '}
        <Link href={footerHref} className="font-medium text-brand-600 underline-offset-4 hover:underline">
          {footerLinkLabel}
        </Link>
      </p>
    </div>
  );
}
