import { Redirect } from 'expo-router';
import { useAuth } from '@/src/auth/context';

export default function Index() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  if (isBootstrapping) return null;
  return <Redirect href={isAuthenticated ? '/(tabs)' : '/onboarding'} />;
}