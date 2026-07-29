export const THEME_STORAGE_KEY = 'ustapilot-admin-theme';

/**
 * Hidrasyondan önce <head> içinde çalışan betik.
 * Tema sınıfını ilk boyamadan önce uygular, böylece açık/koyu geçiş sıçraması olmaz.
 */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var useDark = stored ? stored === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', useDark);
  } catch (error) {
    // localStorage erişilemiyorsa varsayılan açık tema kullanılır.
  }
})();
`;

export function setTheme(dark: boolean): void {
  document.documentElement.classList.toggle('dark', dark);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light');
  } catch {
    // Gizli sekmede localStorage yazılamayabilir; tema yine de oturum boyunca geçerlidir.
  }
}

/** Tema sınıfındaki değişiklikleri izler; React dışı DOM değişimini bileşene taşır. */
export function subscribeToTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}

export function readIsDark(): boolean {
  return document.documentElement.classList.contains('dark');
}
