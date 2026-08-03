import { BrandMark, Card, CardContent, CardDescription, CardHeader, CardTitle, Wordmark } from '@ustapilot/ui';
import type { Metadata } from 'next';

import { LoginForm } from '@/features/auth/login-form';

export const metadata: Metadata = { title: 'Giriş' };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-muted p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandMark className="size-12" />
          <div>
            <Wordmark className="block text-lg" />
            <p className="text-sm text-foreground-muted">Yönetim Paneli</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personel girişi</CardTitle>
            <CardDescription>
              Panele yalnızca admin, süper admin ve destek hesapları erişebilir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
