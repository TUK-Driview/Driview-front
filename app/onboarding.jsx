import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/src/constants/colors';
import { useAuth } from '@/src/auth/context';

export default function OnboardingScreen() {
  const router = useRouter();
  const { isAuthenticated, isBootstrapping } = useAuth();

  const onStart = useCallback(() => {
    if (isBootstrapping) return;
    if (isAuthenticated) {
      router.replace('/(tabs)');
      return;
    }
    router.replace('/login');
  }, [isAuthenticated, isBootstrapping, router]);

  return (
    <LinearGradient
      colors={['#0d1b3e', '#0a1628', '#071020']}
      style={styles.container}
    >
      <View style={styles.bgCircle1} pointerEvents="none" />
      <View style={styles.bgCircle2} pointerEvents="none" />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.mascot}>
              <Text style={styles.mascotEmoji}>🚗</Text>
              <View style={styles.aiBadgeSmall}>
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
            </View>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>AI 기반 운전 분석</Text>
            </View>

            <Text style={styles.title}>
              더 안전한 운전을{'\n'}
              <Text style={styles.titleHighlight}>시작하세요</Text>
            </Text>

            <Text style={styles.desc}>
              듀얼 카메라로 주행을 분석하고{'\n'}
              차선 이탈, 졸음 감지까지 잡아냅니다.{'\n'}
              운전 팁은 커뮤니티에서 나눠보세요.
            </Text>

            <View style={styles.features}>
              <View style={styles.featCard}>
                <Text style={styles.featIcon}>📹</Text>
                <Text style={styles.featLabel}>듀얼 카메라{'\n'}분석</Text>
              </View>
              <View style={styles.featCard}>
                <Text style={styles.featIcon}>🛣️</Text>
                <Text style={styles.featLabel}>AI 차선{'\n'}분석</Text>
              </View>
              <View style={styles.featCard}>
                <Text style={styles.featIcon}>💬</Text>
                <Text style={styles.featLabel}>운전팁{'\n'}커뮤니티</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.btn}
            onPress={onStart}
            activeOpacity={0.85}
            disabled={isBootstrapping}
          >
            <Text style={styles.btnText}>시작하기 →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.blue400,
    opacity: 0.08,
    top: -80,
    right: -80,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.teal400,
    opacity: 0.08,
    bottom: 100,
    left: -60,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 16,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 480,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 8,
  },
  mascot: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(55,138,221,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(55,138,221,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    position: 'relative',
  },
  mascotEmoji: {
    fontSize: 48,
    lineHeight: 56,
    includeFontPadding: false,
    textAlignVertical: 'center',
    marginBottom: 4,
  },
  aiBadgeSmall: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(55,138,221,0.35)',
    borderWidth: 1.5,
    borderColor: 'rgba(55,138,221,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.blue200,
  },
  badge: {
    backgroundColor: 'rgba(55,138,221,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(55,138,221,0.4)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 11,
    color: colors.blue200,
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 12,
  },
  titleHighlight: {
    color: colors.blue400,
  },
  desc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  features: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  featCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  featIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  featLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 15,
  },
  btn: {
    width: '100%',
    backgroundColor: colors.blue400,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
