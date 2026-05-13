import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/src/constants/colors';

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#0d1b3e', '#0a1628', '#071020']}
      style={styles.container}
    >
      {/* 배경 원 */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <View style={styles.content}>
        {/* 마스코트 */}
        <View style={styles.mascot}>
          <Text style={styles.mascotEmoji}>🚗</Text>
          <View style={styles.aiBadgeSmall}>
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </View>

        {/* 배지 */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>AI 기반 운전 분석</Text>
        </View>

        {/* 타이틀 */}
        <Text style={styles.title}>
          더 안전한 운전을{'\n'}
          <Text style={styles.titleHighlight}>시작하세요</Text>
        </Text>

        {/* 설명 */}
        <Text style={styles.desc}>
          듀얼 카메라 + GPS로 실시간 분석.{'\n'}
          차선 이탈, 졸음 감지, 신호 위반까지{'\n'}
          모두 잡아냅니다.
        </Text>

        {/* 기능 카드 3개 */}
        <View style={styles.features}>
          <View style={styles.featCard}>
            <Text style={styles.featIcon}>📹</Text>
            <Text style={styles.featLabel}>듀얼 카메라{'\n'}녹화</Text>
          </View>
          <View style={styles.featCard}>
            <Text style={styles.featIcon}>🧠</Text>
            <Text style={styles.featLabel}>AI 차선{'\n'}분석</Text>
          </View>
          <View style={styles.featCard}>
            <Text style={styles.featIcon}>📍</Text>
            <Text style={styles.featLabel}>GPS 경로{'\n'}추적</Text>
          </View>
        </View>

        {/* 시작 버튼 */}
        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.replace('/login')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>시작하기 →</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
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
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.blue400,
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
    marginBottom: 32,
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
