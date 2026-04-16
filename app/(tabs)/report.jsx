import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/constants/colors';

function ScoreRing({ score }) {
  const size = 140;
  const cx = size / 2;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={cx} cy={cx} r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={12}
        />
        <Circle
          cx={cx} cy={cx} r={radius}
          fill="none" stroke={colors.teal500} strokeWidth={12}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90, ${cx}, ${cx})`}
          opacity={0.9}
        />
      </Svg>
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 32, fontWeight: '800', color: '#fff', lineHeight: 38 }}>
          {score}
        </Text>
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
          / 100
        </Text>
      </View>
    </View>
  );
}

const metrics = [
  { label: '차선 준수', val: 95, sub: '이탈 1회 감지', color: colors.teal500 },
  { label: '주의 집중', val: 90, sub: '졸음 0회 감지', color: colors.blue400 },
  { label: '속도 준수', val: 88, sub: '과속 구간 1회', color: colors.amber400 },
  { label: '급가감속',  val: 82, sub: '급제동 2회',    color: colors.red400 },
];

const adviceItems = [
  '1호선 고가 구간에서 차선 이탈이 1회 감지되었습니다. 속도를 줄이고 핸들을 안정적으로 유지하세요.',
  '수원IC 진입 구간에서 급제동이 발생했습니다. 앞차와의 거리를 더 확보하세요.',
  '전반적으로 안전한 운전 패턴입니다. 이 수준을 유지하면 최상위 등급을 달성할 수 있습니다.',
];

const REPORT = {
  date:    '2026.01.22 · 안산 → 수원 · 32km',
  score:   91,
  grade:   '안전 운전 우수 등급',
  metrics: metrics,
};

export default function ReportScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>운행 리포트</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 점수 히어로 */}
        <LinearGradient
          colors={['#0d2a4a', '#0d3a2e']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroDate}>2026.01.22 · 안산 → 수원 · 32km</Text>
          <ScoreRing score={91} />
          <Text style={styles.heroGrade}>✅ 안전 운전 우수 등급</Text>
        </LinearGradient>

        {/* 세부 지표 */}
        <View style={styles.metricsGrid}>
          {metrics.map((m) => (
            <View key={m.label} style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <View style={[styles.metricDot, { backgroundColor: m.color }]} />
                <Text style={styles.metricTitle}>{m.label}</Text>
              </View>
              <Text style={styles.metricVal}>
                {m.val}<Text style={styles.metricUnit}>점</Text>
              </Text>
              <Text style={styles.metricSub}>{m.sub}</Text>
              <View style={styles.metricBar}>
                <View style={[styles.metricBarFill, { width: `${m.val}%`, backgroundColor: m.color }]} />
              </View>
            </View>
          ))}
        </View>

        {/* AI 조언 */}
        <View style={styles.adviceBox}>
          <Text style={styles.adviceHead}>💡 AI 개선 조언</Text>
          {adviceItems.map((text, i) => (
            <View key={i} style={styles.adviceItem}>
              <View style={styles.adviceNum}>
                <Text style={styles.adviceNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.adviceText}>{text}</Text>
            </View>
          ))}
        </View>

        {/* 커뮤니티 공유 버튼 */}
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => {
            const autoTitle = `운행 점수 ${REPORT.score}점 달성 (${REPORT.date})`;
            const autoContent =
              `📊 운행 리포트 공유\n\n` +
              `• 종합 점수: ${REPORT.score}점 (${REPORT.grade})\n` +
              REPORT.metrics.map(m => `• ${m.label}: ${m.val}점 (${m.sub})`).join('\n') +
              `\n\nDriview 앱으로 분석한 리포트입니다.`;
            router.push({
              pathname: '/write',
              params: { autoTitle, autoContent, autoTag: '점수 인증' },
            });
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="share-social-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.shareBtnText}>이 운행 리포트 커뮤니티에 공유하기</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDark },
  header: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 0,
    flexDirection: 'row', alignItems: 'center',
  },
  pageTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },

  heroCard: {
    margin: 20, marginTop: 20,
    borderWidth: 1, borderColor: 'rgba(55,138,221,0.2)',
    borderRadius: 20, padding: 24,
    alignItems: 'center',
  },
  heroDate: { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 12 },
  heroGrade: { fontSize: 13, color: colors.teal500, fontWeight: '500', marginTop: 6 },

  metricsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: 20, marginBottom: 14,
  },
  metricCard: {
    width: '47.5%',
    backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14, padding: 14,
  },
  metricHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  metricDot: { width: 8, height: 8, borderRadius: 4 },
  metricTitle: { fontSize: 12, color: 'rgba(255,255,255,0.45)' },
  metricVal: { fontSize: 22, fontWeight: '800', color: '#fff' },
  metricUnit: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  metricSub: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  metricBar: {
    height: 4, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2, marginTop: 10, overflow: 'hidden',
  },
  metricBarFill: { height: '100%', borderRadius: 2 },

  adviceBox: {
    marginHorizontal: 20, marginBottom: 14,
    backgroundColor: 'rgba(55,138,221,0.08)',
    borderWidth: 1, borderColor: 'rgba(55,138,221,0.15)',
    borderRadius: 14, padding: 16,
  },
  adviceHead: { fontSize: 12, color: colors.blue200, fontWeight: '600', marginBottom: 12 },
  adviceItem: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  adviceNum: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(55,138,221,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1, flexShrink: 0,
  },
  adviceNumText: { fontSize: 10, color: colors.blue200, fontWeight: '700' },
  adviceText: { flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 20 },

  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 6,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: 'rgba(55,138,221,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(55,138,221,0.35)',
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.blue200,
  },
});
