import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useAuth } from '@/src/auth/context';

/** 앱 진입 시 1회만 분기. `<Redirect>`는 index가 스택에 남으면 로그인으로 가도 다시 온보딩으로 끌어옴 */
export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isBootstrapping } = useAuth();

  useFocusEffect(
    useCallback(() => {
      if (isBootstrapping) return;
      router.replace(isAuthenticated ? '/(tabs)' : '/onboarding');
    }, [isAuthenticated, isBootstrapping, router]),
  );

  return null;
}