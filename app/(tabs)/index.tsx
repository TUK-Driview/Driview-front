import { analyzeDriverVideo, getUserStats } from '@/src/auth/api';
import { useAuth } from '@/src/auth/context';
import { colors } from '@/src/constants/colors';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type UserStatsPayload = {
  avgScore: number;
  totalDrives: number;
  totalKm: number;
  monthlyDrives: number;
  laneDepartureCount: number;
  drowsyCount: number;
};

type DriverVideoPick = {
  uri: string;
  name: string;
  mimeType: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuth() as {
    session: { accessToken: string } | null;
  };
  const [stats, setStats] = useState<UserStatsPayload | null>(null);
  const [roadVideo, setRoadVideo] = useState<DriverVideoPick | null>(null);
  const [driverVideo, setDriverVideo] = useState<DriverVideoPick | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadLabel, setUploadLabel] = useState('AI 분석 중...');

  useEffect(() => {
    if (!session?.accessToken) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const data = (await getUserStats(session.accessToken)) as UserStatsPayload | null;
        if (!cancelled && data) setStats(data);
      } catch {
        /* 오프라인·미설정 시 화면 기본값 유지 */
      }
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [session?.accessToken]);

  const pickVideo = (setter: (v: DriverVideoPick) => void) => {
    void (async () => {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
        });
        if (result.canceled) return;
        const asset = result.assets[0];
        if (!asset?.uri) return;
        const rawName = asset.name ?? `video_${Date.now()}.mp4`;
        const lower = rawName.toLowerCase();
        const videoExt = /\.(mp4|mov|m4v|3gp|webm|mkv|avi)$/i.test(lower);
        const videoMime = asset.mimeType?.startsWith('video/') ?? false;
        if (!videoExt && !videoMime) {
          Alert.alert('동영상만 선택', 'mp4, mov 등 영상 파일을 골라주세요.');
          return;
        }
        const mimeFromExt = lower.endsWith('.mov')
          ? 'video/quicktime'
          : lower.endsWith('.mp4') || lower.endsWith('.m4v')
            ? 'video/mp4'
            : lower.endsWith('.3gp')
              ? 'video/3gpp'
              : lower.endsWith('.webm')
                ? 'video/webm'
                : null;
        setter({
          uri: asset.uri,
          name: /\.[a-zA-Z0-9]+$/.test(rawName) ? rawName : `${rawName}.mp4`,
          mimeType: asset.mimeType ?? mimeFromExt ?? 'video/mp4',
        });
      } catch {
        Alert.alert('오류', '파일을 선택하지 못했습니다.');
      }
    })().catch(() => {});
  };

  const startUpload = async () => {
    if (!session?.accessToken) {
      Alert.alert('로그인 필요', '로그인 후 이용해주세요.');
      return;
    }
    if (!roadVideo) {
      Alert.alert('안내', '운전자 카메라(A) 영상을 선택해주세요.');
      return;
    }
    if (!driverVideo) {
      Alert.alert('안내', '후면 카메라(B) 영상을 선택해주세요.');
      return;
    }

    setIsUploading(true);
    setUploadPct(15);
    setUploadLabel('영상 업로드 중...');
    try {
      const result = await analyzeDriverVideo(session.accessToken, driverVideo);
      setUploadPct(85);
      setUploadLabel('분석 완료!');
      setUploadPct(100);
      setTimeout(() => {
        try {
          setIsUploading(false);
          setUploadPct(0);
          setUploadLabel('AI 분석 중...');
          router.push({
            pathname: '/report',
            params: {
              sessionId: String(result.sessionId),
              yawnCount: String(result.yawnCount ?? ''),
              durationSec: String(result.durationSec ?? ''),
              drowsinessEvents: JSON.stringify(result.drowsinessEvents ?? []),
            },
          });
        } catch {
          setIsUploading(false);
          setUploadPct(0);
          setUploadLabel('AI 분석 중...');
        }
      }, 500);
    } catch (e) {
      setIsUploading(false);
      setUploadPct(0);
      setUploadLabel('AI 분석 중...');
      Alert.alert('분석 실패', e instanceof Error ? e.message : '다시 시도해주세요.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/mypage')} activeOpacity={0.7}>
            <Text style={styles.greetingSub}>안녕하세요 👋</Text>
            <Text style={styles.greetingMain}>
              <Text style={styles.greetingName}>현수</Text>님의 운전 현황
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatar} onPress={() => router.push('/(tabs)/mypage')} activeOpacity={0.7}>
            <Text style={styles.avatarEmoji}>🧑</Text>
          </TouchableOpacity>
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
            {stats != null ? Math.round(stats.avgScore) : 87}
            <Text style={styles.scoreMax}>/100</Text>
          </Text>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreBadgeText}>
              {stats != null ? `누적 주행 ${stats.totalDrives ?? 0}회 · ${Number(stats.totalKm ?? 0).toLocaleString()}km` : '↑ 지난달 대비 +3점'}
            </Text>
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
            {
              icon: '🛣️',
              val: stats != null ? String(stats.monthlyDrives ?? 0) : '328',
              unit: stats != null ? '회' : 'km',
              label: stats != null ? '이번 달 운행' : '이번 달 주행',
              bg: 'rgba(29,158,117,0.15)',
            },
            {
              icon: '⚠️',
              val: stats != null ? String(stats.laneDepartureCount ?? 0) : '3',
              unit: '회',
              label: '차선 이탈',
              bg: 'rgba(186,117,23,0.15)',
            },
            {
              icon: '😴',
              val: stats != null ? String(stats.drowsyCount ?? 0) : '0',
              unit: '회',
              label: '졸음 감지',
              bg: 'rgba(226,75,74,0.15)',
            },
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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>영상 업로드</Text>
        </View>
        <View style={styles.uploadCard}>
          <Text style={styles.uploadHint}>듀얼 레코딩 영상을 업로드하면 AI가 운전 습관을 분석해드려요</Text>
          <View style={styles.uploadRow}>
            <View style={styles.uploadLeft}>
              <View style={[styles.uploadBadge, styles.uploadBadgeA]}><Text style={styles.uploadBadgeText}>A</Text></View>
              <View>
                <Text style={styles.uploadTitle}>외부 카메라</Text>
                <Text style={[styles.uploadSub, roadVideo && styles.uploadDone]}>{roadVideo?.name || '영상을 선택해주세요'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.uploadBtnSmall} onPress={() => pickVideo(setRoadVideo)}>
              <Text style={styles.uploadBtnSmallText}>{roadVideo ? '변경' : '선택'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.uploadDivider} />
          <View style={styles.uploadRow}>
            <View style={styles.uploadLeft}>
              <View style={[styles.uploadBadge, styles.uploadBadgeB]}><Text style={styles.uploadBadgeText}>B</Text></View>
              <View>
                <Text style={styles.uploadTitle}>내부 카메라</Text>
                <Text style={[styles.uploadSub, driverVideo && styles.uploadDone]}>
                  {driverVideo?.name || '영상을 선택해주세요'}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.uploadBtnSmall} onPress={() => pickVideo(setDriverVideo)}>
              <Text style={styles.uploadBtnSmallText}>{driverVideo ? '변경' : '선택'}</Text>

            </TouchableOpacity>
          </View>

          {!isUploading ? (
            <TouchableOpacity
              style={styles.uploadCta}
              onPress={() => {
                void startUpload().catch(() => {});
              }}
              activeOpacity={0.85}
            >
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
