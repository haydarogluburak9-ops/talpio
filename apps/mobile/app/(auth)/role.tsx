import { Redirect } from 'expo-router';

/** Alıcı / satıcı seçimi kalktı; kayıt tek hesaba gider. */
export default function RoleSelectScreen() {
  return <Redirect href="/(auth)/register" />;
}
