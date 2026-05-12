import { colors } from '@/src/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const recentDrives = [
  { id: 1, date: '2026.01.22 · 22:30', title: '안산 → 수원', meta: '32km · 48분', score: 91, scoreColor: colors.teal500 },
  { id: 2, date: '2026.01.20 · 18:15', title: '안산 → 시흥', meta: '18km · 31분', score: 78, scoreColor: colors.amber400 },
  { id: 3, date: '2026.01.18 · 10:00', title: '안산 → 인천', meta: '44km · 62분', score: 88, scoreColor: colors.teal500 },
];

export default function HomeScreen() {
  const router = useRouter();
  const [isDriving, setIsDriving] = useState(false);
  const [drivingSeconds, setDrivingSeconds] = useState(0);
  const [uploadA, setUploadA] = useState('');
  const [uploadB, setUploadB] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadLabel, setUploadLabel] = useState('AI 분석 중...');

  useEffect(() => {
    if (!isDriving) return undefined;
    const timer = setInterval(() => {
      setDrivingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isDriving]);

  useEffect(() => {
    if (!isUploading) return undefined;
    const steps = [
      { pct: 30, label: '영상 업로드 중...' },
      { pct: 60, label: 'AI 분석 중...' },
      { pct: 85, label: '위반 구간 추출 중...' },
      { pct: 100, label: '분석 완료!' },
    ];
    let idx = 0;
    const iv = setInterval(() => {
      setUploadPct((prev) => {
        const next = Math.min(prev + 2, 100);
        if (idx < steps.length && next >= steps[idx].pct) {
          setUploadLabel(steps[idx].label);
          idx += 1;
        }
        if (next >= 100) {
          clearInterval(iv);
          setTimeout(() => {
            setIsUploading(false);
            setUploadPct(0);
            setUploadLabel('AI 분석 중...');
            router.push('/report');
          }, 800);
        }
        return next;
      });
    }, 50);
    return () => clearInterval(iv);
  }, [isUploading, router]);

  const drivingTimer = useMemo(() => {
    const m = String(Math.floor(drivingSeconds / 60)).padStart(2, '0');
    const s = String(drivingSeconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  }, [drivingSeconds]);

  const pickUpload = (slot: 'a' | 'b') => {
    const names = {
      a: ['front_20260122.mp4', 'driving_A_0120.mp4', 'cam_front.mp4'],
      b: ['driver_20260122.mp4', 'interior_B_0120.mp4', 'cam_driver.mp4'],
    };
    const selected = names[slot][Math.floor(Math.random() * 3)];
    if (slot === 'a') setUploadA(selected);
    if (slot === 'b') setUploadB(selected);
  };

  const startUpload = () => {
    if (!uploadA) pickUpload('a');
    if (!uploadB) pickUpload('b');
    setIsUploading(true);
    setUploadPct(0);
    setUploadLabel('AI 분석 중...');
  };

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

        <View style={styles.driveBtnWrap}>
          <TouchableOpacity
            style={[styles.driveBtn, isDriving ? styles.driveBtnStop : styles.driveBtnStart]}
            onPress={() => {
              if (isDriving) {
                setIsDriving(false);
              } else {
                setDrivingSeconds(0);
                setIsDriving(true);
              }
            }}
            activeOpacity={0.85}
          >
            <Text style={[styles.driveBtnText, isDriving ? styles.driveStopText : styles.driveStartText]}>
              {isDriving ? '주행 종료' : '주행 시작'}
            </Text>
          </TouchableOpacity>
          {isDriving ? (
            <View style={styles.drivingStatus}>
              <View style={styles.liveDot} />
              <Text style={styles.drivingLabel}>주행 중</Text>
              <Text style={styles.drivingTime}>{drivingTimer}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>영상 업로드</Text>
        </View>
        <View style={styles.uploadCard}>
          <Text style={styles.uploadHint}>듀얼 레코딩 영상을 업로드하면 AI가 운전 습관을 분석해드려요</Text>
          <View style={styles.uploadRow}>
            <View style={styles.uploadLeft}>
              <View style={[styles.uploadBadge, styles.uploadBadgeA]}><Text style={styles.uploadBadgeText}>A</Text></View>
              <View>
                <Text style={styles.uploadTitle}>전면 카메라</Text>
                <Text style={[styles.uploadSub, uploadA && styles.uploadDone]}>{uploadA || '영상을 선택해주세요'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.uploadBtnSmall} onPress={() => pickUpload('a')}>
              <Text style={styles.uploadBtnSmallText}>{uploadA ? '변경' : '선택'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.uploadDivider} />
          <View style={styles.uploadRow}>
            <View style={styles.uploadLeft}>
              <View style={[styles.uploadBadge, styles.uploadBadgeB]}><Text style={styles.uploadBadgeText}>B</Text></View>
              <View>
                <Text style={styles.uploadTitle}>운전자 카메라</Text>
                <Text style={[styles.uploadSub, uploadB && styles.uploadDone]}>{uploadB || '영상을 선택해주세요'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.uploadBtnSmall} onPress={() => pickUpload('b')}>
              <Text style={styles.uploadBtnSmallText}>{uploadB ? '변경' : '선택'}</Text>
            </TouchableOpacity>
          </View>

          {!isUploading ? (
            <TouchableOpacity style={styles.uploadCta} onPress={startUpload} activeOpacity={0.85}>
              <Text style={styles.uploadCtaText}>분석 시작하기</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.progressArea}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>{uploadLabel}</Text>
                <Text style={styles.progressPct}>{uploadPct}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${uploadPct}%` }]} />
              </View>
            </View>
          )}
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
  driveBtnWrap: { marginHorizontal: 20, marginBottom: 8 },
  driveBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  driveBtnStart: {
    backgroundColor: 'rgba(29,158,117,0.12)',
    borderColor: 'rgba(29,158,117,0.3)',
  },
  driveBtnStop: {
    backgroundColor: 'rgba(226,75,74,0.12)',
    borderColor: 'rgba(226,75,74,0.3)',
  },
  driveBtnText: { fontSize: 13, fontWeight: '700' },
  driveStartText: { color: colors.teal500 },
  driveStopText: { color: colors.red400 },
  drivingStatus: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(29,158,117,0.2)',
    backgroundColor: 'rgba(29,158,117,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.teal500 },
  drivingLabel: { fontSize: 11, color: colors.teal500, fontWeight: '500' },
  drivingTime: { marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  uploadCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: 'rgba(55,138,221,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(55,138,221,0.15)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  uploadHint: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 10 },
  uploadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  uploadLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  uploadBadge: {
    width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  uploadBadgeA: { backgroundColor: 'rgba(55,138,221,0.2)' },
  uploadBadgeB: { backgroundColor: 'rgba(29,158,117,0.2)' },
  uploadBadgeText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  uploadTitle: { fontSize: 13, fontWeight: '600', color: '#fff' },
  uploadSub: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  uploadDone: { color: colors.teal500 },
  uploadBtnSmall: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(55,138,221,0.25)',
    backgroundColor: 'rgba(55,138,221,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  uploadBtnSmallText: { fontSize: 11, color: colors.blue200 },
  uploadDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 10 },
  uploadCta: {
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(55,138,221,0.3)',
    backgroundColor: 'rgba(55,138,221,0.15)',
    paddingVertical: 13,
    alignItems: 'center',
  },
  uploadCtaText: { fontSize: 13, fontWeight: '700', color: colors.blue200 },
  progressArea: { marginTop: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  progressPct: { fontSize: 11, color: colors.blue200, fontWeight: '700' },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.blue400, borderRadius: 2 },
});
