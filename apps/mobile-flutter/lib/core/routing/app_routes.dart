/// Uygulamadaki tüm rota yolları tek yerde tanımlanır.
/// Ekranlar arası geçişlerde düz metin yol yazılmaz.
abstract final class AppRoutes {
  static const splash = '/';
  static const systemStatus = '/system-status';

  // Faz 2 ile eklenecek rotalar
  static const onboarding = '/onboarding';
  static const login = '/auth/login';
  static const register = '/auth/register';
  static const roleSelection = '/auth/role';
  static const verifyPhone = '/auth/verify-phone';

  // Faz 3+ rotaları
  static const customerHome = '/customer/home';
  static const masterHome = '/master/home';
}
