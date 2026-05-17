import { Stack } from 'expo-router';
import { useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/src/auth/context';

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isBootstrapping } = useAuth();

  useEffect(() => {
    if (isBootstrapping) return;
    const root = segments[0];
    const isAuthScreen = root === 'login' || root === 'signup' || root === 'onboarding';
    const isProtectedScreen =
      root === '(tabs)' || root === 'write' || root === 'myposts' || root === 'community';

    if (!isAuthenticated && isProtectedScreen) {
      router.replace('/login');
      return;
    }
    // onboarding → login 은 허용. 로그인·회원가입만 홈으로 보냄
    if (isAuthenticated && (root === 'login' || root === 'signup')) {
      router.replace('/(tabs)');
    }
  }, [segments, isAuthenticated, isBootstrapping, router]);

  return null;
}

export default function RootLayout() {
  return (
    <>
      <AuthProvider>
        <AuthGate />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="write" />
          <Stack.Screen name="myposts" />
          <Stack.Screen name="community" />
        </Stack>
        <StatusBar style="light" />
      </AuthProvider>
    </>
  );
}
