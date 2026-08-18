'use client';

import { Button, LoadingState } from '@talpio/ui';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { isStaff, useLogout, useSession } from './use-session';

/**
 * Panel sayfalarının önündeki istemci tarafı kapı.
 *
 * Yetkiyi asıl uygulayan backend'dir; bu katman yalnızca yetkisiz kullanıcının
 * boş tablolara ve arka arkaya 403 hatasına bakmasını önler.
 */
export function StaffGuard({ children }: { children: ReactNode }) {
  const session = useSession();
  const logout = useLogout();
  const router = useRouter();
  const authenticated = session.data != null;

  useEffect(() => {
    if (session.isSuccess && session.data === null) router.replace('/login');
  }, [session.isSuccess, session.data, router]);

  if (session.isPending) {
    return <LoadingState label="Oturum doğrulanıyor…" className="min-h-screen" />;
  }

  if (session.isError) {
    return (
      <div role="alert" className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-base font-semibold">Sunucuya ulaşılamadı</p>
        <p className="max-w-sm text-sm text-foreground-muted">
          API sunucusunun çalıştığını doğrulayın, ardından tekrar deneyin.
        </p>
        <Button variant="outline" size="sm" onClick={() => void session.refetch()}>
          Tekrar dene
        </Button>
      </div>
    );
  }

  if (authenticated && !isStaff(session.data)) {
    return (
      <div role="alert" className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-base font-semibold">Bu panele erişim yetkiniz yok</p>
        <p className="max-w-sm text-sm text-foreground-muted">
          {session.data?.email} hesabı müşteri veya satıcı rolünde. Personel hesabıyla giriş yapın.
        </p>
        <Button variant="outline" size="sm" onClick={() => logout.mutate()} disabled={logout.isPending}>
          Çıkış yap
        </Button>
      </div>
    );
  }

  // Yönlendirme etkiye bırakıldığı için oturumsuz durumda bir kare boyunca
  // içerik basılmamalıdır; aksi halde korunan tablolar kısa süre görünür.
  if (!authenticated) return <LoadingState label="Giriş sayfasına yönlendiriliyor…" className="min-h-screen" />;

  return <>{children}</>;
}
