import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/src/constants/colors';

const recentDrives = [
  { id: 1, date: '2026.01.22 · 22:30', title: '안산 → 수원', meta: '32km · 48분', score: 91, scoreColor: colors.teal500 },
  { id: 2, date: '2026.01.20 · 18:15', title: '안산 → 시흥', meta: '18km · 31분', score: 78, scoreColor: colors.amber400 },
  { id: 3, date: '2026.01.18 · 10:00', title: '안산 → 인천', meta: '44km · 62분', score: 88, scoreColor: colors.teal500 },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingSub}>안녕하세요 👋</Text>
            <Text style={styles.greetingMain}>
              <Text style={styles.greetingName}>현수</Text>님의 운전 현황
            </Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>🧑</Text>
          </View>
        </View>

        {/* 점수 카드 */}
        <LinearGradient
          colors={['rgba(55,138,221,0.15)', 'rgba(29,158,117,0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.scoreCard}
        >
          <Text style={styles.scoreLabel}>이번 달 종합 점수</Text>
          <Text style={styles.scoreNumber}>
            87<Text style={styles.scoreMax}>/100</Text>
          </Text>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreBadgeText}>↑ 지난달 대비 +3점</Text>
          </View>
          <View style={styles.scoreBars}>
            {[
              { label: '차선 준수', pct: 0.92, color: colors.teal500 },
              { label: '주의 집중', pct: 0.85, color: colors.blue400 },
              { label: '속도 준수', pct: 0.78, color: colors.amber400 },
            ].map((bar) => (
              <View key={bar.label} style={styles.barItem}>
                <Text style={styles.barLabel}>{bar.label}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${bar.pct * 100}%`, backgroundColor: bar.color }]} />
                </View>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* 통계 카드 3개 */}
        <View style={styles.statCards}>
          {[
            { icon: '🛣️', val: '328', unit: 'km', label: '이번 달 주행', bg: 'rgba(29,158,117,0.15)' },
            { icon: '⚠️', val: '3', unit: '회', label: '차선 이탈', bg: 'rgba(186,117,23,0.15)' },
            { icon: '😴', val: '0', unit: '회', label: '졸음 감지', bg: 'rgba(226,75,74,0.15)' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                <Text style={{ fontSize: 16 }}>{stat.icon}</Text>
              </View>
              <Text style={styles.statVal}>{stat.val}<Text style={styles.statUnit}>{stat.unit}</Text></Text>
              <Text style={styles.statName}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* 최근 운행 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>최근 운행</Text>
          <TouchableOpacity onPress={() => router.push('/report' as any)}>
            <Text style={styles.sectionMore}>전체 보기</Text>
          </TouchableOpacity>
        </View>

        {recentDrives.map((drive) => (
          <TouchableOpacity
            key={drive.id}
            style={styles.driveCard}
            onPress={() => router.push('/report' as any)}
            activeOpacity={0.8}
          >
            <View style={styles.driveIcon}>
              <Text style={{ fontSize: 18 }}>🕐</Text>
            </View>
            <View style={styles.driveInfo}>
              <Text style={styles.driveDate}>{drive.date}</Text>
              <Text style={styles.driveTitle}>{drive.title}</Text>
              <Text style={styles.driveMeta}>{drive.meta}</Text>
            </View>
            <Text style={[styles.driveScore, { color: drive.scoreColor }]}>{drive.score}</Text>
          </TouchableOpacity>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  greetingSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  greetingMain: { fontSize: 18, fontWeight: '700', color: '#fff' },
  greetingName: { color: colors.blue400 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(55,138,221,0.2)',
    borderWidth: 2, borderColor: 'rgba(55,138,221,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 20 },

  scoreCard: {
    marginHorizontal: 20, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(55,138,221,0.2)',
    borderRadius: 20, padding: 24,
  },
  scoreLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 },
  scoreNumber: { fontSize: 64, fontWeight: '800', color: '#fff', lineHeight: 72, marginBottom: 8 },
  scoreMax: { fontSize: 20, color: 'rgba(255,255,255,0.4)' },
  scoreBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(29,158,117,0.2)',
    borderWidth: 1, borderColor: 'rgba(29,158,117,0.3)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3,
    marginBottom: 20,
  },
  scoreBadgeText: { fontSize: 12, color: colors.teal500, fontWeight: '500' },
  scoreBars: { flexDirection: 'row', gap: 8 },
  barItem: { flex: 1 },
  barLabel: { fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 6 },
  barTrack: { height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },

  statCards: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14, padding: 14,
  },
  statIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statVal: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statUnit: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  statName: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  sectionMore: { fontSize: 12, color: colors.blue400 },

  driveCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
  },
  driveIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(55,138,221,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  driveInfo: { flex: 1 },
  driveDate: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },
  driveTitle: { fontSize: 14, fontWeight: '500', color: '#fff', marginVertical: 2 },
  driveMeta: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  driveScore: { fontSize: 20, fontWeight: '800' },
});
