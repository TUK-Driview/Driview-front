import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/src/constants/colors';
import { useAuth } from '@/src/auth/context';
import { getDrivingSessions, getDrivingReport } from '@/src/auth/api';

function ScoreRing({ score, color }) {
  const size = 120;
  const cx = 60;
  const radius = 50;
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
          fill="none" stroke={color} strokeWidth={12}
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
        <Text style={{ fontSize: 32, fontWeight: '800', color: '#fff', lineHeight: 36 }}>
          {score}
        </Text>
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
          / 100
        </Text>
      </View>
    </View>
  );
}


function scoreColor(score) {
  if (score >= 90) return colors.teal500;
  if (score >= 80) return colors.blue200;
  if (score >= 70) return '#EF9F27';
  return colors.red400;
}

function formatStartedAt(iso) {
  if (!iso) return { date: '—', time: '—' };
  const d = new Date(iso);
  const date = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return { date, time };
}


function formatVideoTime(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function ReportScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { sessionId: paramSessionId, fileName: paramFileName } = useLocalSearchParams();
  const [selected, setSelected] = useState(null);
  const [videoSec, setVideoSec] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reportDetail, setReportDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    if (!session?.accessToken) { setLoadingSessions(false); return; }
    setLoadingSessions(true);
    getDrivingSessions(session.accessToken, { year, month })
      .then(({ sessions: s }) => setSessions(s))
      .catch(() => setSessions([]))
      .finally(() => setLoadingSessions(false));
  }, [session?.accessToken, year, month]);

  useEffect(() => {
    if (paramSessionId) {
      let date = '—';
      let time = '—';
      const match = String(paramFileName ?? '').match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
      if (match) {
        date = `${match[1]}.${match[2]}.${match[3]}`;
        time = `${match[4]}:${match[5]}`;
      }
      setSelected({ sessionId: Number(paramSessionId), date, time, score: 0, color: colors.blue400, meta: '—' });
    }
  }, [paramSessionId]);

  const prevMonth = () => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  };

  useEffect(() => {
    if (!selected) return;
    setVideoSec(0);
    setIsPlaying(false);
    setReportDetail(null);
    if (!session?.accessToken) return;
    setLoadingDetail(true);
    getDrivingReport(session.accessToken, selected.sessionId)
      .then((data) => setReportDetail(data))
      .catch(() => {})
      .finally(() => setLoadingDetail(false));
  }, [selected?.sessionId]);

  const gradeText = useMemo(() => {
    if (!selected) return '';
    if (reportDetail?.grade) return reportDetail.grade;
    if (selected.score >= 90) return '안전 운전 우수 등급';
    if (selected.score >= 80) return '양호 등급';
    if (selected.score >= 70) return '주의 필요 등급';
    return '위험 운전 등급';
  }, [selected, reportDetail]);

  const metrics = useMemo(() => {
    if (!reportDetail) return [];
    return [
      { label: '차선 준수', val: reportDetail.laneScore ?? 0, sub: `이탈 ${reportDetail.laneViolationCount ?? 0}회 감지`, color: colors.teal500 },
      { label: '주의 집중', val: reportDetail.focusScore ?? 0, sub: `졸음 ${reportDetail.drowsinessCount ?? 0}회 감지`, color: colors.blue400 },
      { label: '속도 준수', val: reportDetail.speedScore ?? 0, sub: `과속 ${reportDetail.speedViolationCount ?? 0}회`, color: colors.amber400 },
      { label: '급가감속', val: Math.max(0, 100 - (reportDetail.hardBrakingCount ?? 0) * 10), sub: `급제동 ${reportDetail.hardBrakingCount ?? 0}회`, color: colors.red400 },
    ];
  }, [reportDetail]);

  const timelineItems = useMemo(() => {
    if (!reportDetail?.drowsinessEvents?.length) return [];
    return reportDetail.drowsinessEvents.map((ev, i) => {
      const sec = Math.round(ev.timestampSec ?? 0);
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      const timeLabel = `${m}:${String(s).padStart(2, '0')}`;
      const isDrowsy = String(ev.type ?? '').toLowerCase().includes('drow');
      return {
        id: `ev-${i}`,
        seekSec: sec,
        timeLabel,
        dotColor: isDrowsy ? colors.red400 : '#EF9F27',
        accent: isDrowsy ? colors.red400 : '#EF9F27',
        borderColor: isDrowsy ? 'rgba(226,75,74,0.45)' : 'rgba(239,159,39,0.4)',
        badgeBg: isDrowsy ? 'rgba(226,75,74,0.2)' : 'rgba(239,159,39,0.2)',
        icon: isDrowsy ? 'eye-off-outline' : 'alert-circle-outline',
        iconColor: isDrowsy ? colors.red400 : '#F5C842',
        title: isDrowsy ? '졸음 감지' : '하품',
        subtitle: `${ev.type ?? ''} · ${timeLabel}`,
      };
    });
  }, [reportDetail]);

  const adviceList = useMemo(() => {
    if (!reportDetail) return [];
    const items = [];
    if ((reportDetail.laneViolationCount ?? 0) > 0) items.push(`차선 이탈이 ${reportDetail.laneViolationCount}회 감지되었습니다. 핸들 유지와 집중에 신경 써주세요.`);
    if ((reportDetail.drowsinessCount ?? 0) > 0 || (reportDetail.yawn_count ?? 0) > 0) items.push(`졸음·하품이 감지되었습니다. 충분한 휴식 후 운전하세요.`);
    if ((reportDetail.hardBrakingCount ?? 0) > 0) items.push(`급제동이 ${reportDetail.hardBrakingCount}회 발생했습니다. 앞차와의 거리를 더 확보해보세요.`);
    if ((reportDetail.speedViolationCount ?? 0) > 0) items.push(`과속 구간이 ${reportDetail.speedViolationCount}회 있었습니다. 제한 속도를 준수해주세요.`);
    if (items.length === 0) items.push('전반적으로 안전한 운전 패턴입니다. 현재 수준을 유지하면 상위 등급이 가능합니다.');
    return items;
  }, [reportDetail]);

  const videoDurationSec = reportDetail?.duration_sec ?? 0;
  const scoreVal = reportDetail?.score ?? selected?.score ?? 0;
  const colorVal = scoreColor(scoreVal);

  const seekTo = (sec) => setVideoSec(Math.max(0, Math.min(sec, videoDurationSec)));
  const videoProgress = videoDurationSec > 0 ? videoSec / videoDurationSec : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {!selected ? (
        <>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.push('/(tabs)')}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="뒤로"
            >
              <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.55)" />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>운행 리포트</Text>
          </View>
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={prevMonth} style={styles.monthNavBtn}>
              <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
            <Text style={styles.monthNavLabel}>{year}년 {month}월</Text>
            <TouchableOpacity onPress={nextMonth} style={styles.monthNavBtn}>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {loadingSessions ? (
              <View style={styles.center}>
                <ActivityIndicator color={colors.blue400} />
              </View>
            ) : sessions.length === 0 ? (
              <View style={styles.center}>
                <Text style={styles.emptyText}>이번 달 운행 기록이 없습니다.</Text>
              </View>
            ) : (
              sessions.map((s) => {
                const { date, time } = formatStartedAt(s.startedAt);
                const color = scoreColor(s.score);
                const item = { sessionId: s.sessionId, date, time, score: s.score, color, meta: `${s.durationMin ?? 0}분` };
                return (
                  <TouchableOpacity key={s.sessionId} style={styles.driveCard} onPress={() => setSelected(item)} activeOpacity={0.85}>
                    <View style={[styles.driveIcon, { backgroundColor: 'rgba(55,138,221,0.12)' }]} />
                    <View style={styles.driveInfo}>
                      <Text style={styles.driveDate}>{date} · {time}</Text>
                      <Text style={styles.driveTitle}>운행 기록</Text>
                      <Text style={styles.driveMeta}>{s.durationMin ?? 0}분</Text>
                    </View>
                    <Text style={[styles.driveScore, { color }]}>{s.score}</Text>
                  </TouchableOpacity>
                );
              })
            )}
            <View style={{ height: 20 }} />
          </ScrollView>
        </>
      ) : (
        <>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setSelected(null)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="뒤로"
            >
              <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.55)" />
            </TouchableOpacity>
            <Text style={[styles.pageTitle, styles.pageTitleFlex]} numberOfLines={1}>
              {selected.date} 리포트
            </Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <LinearGradient colors={['#0d2a4a', '#0d3a2e']} style={styles.heroCard}>
              <Text style={styles.heroDate}>{selected.date} · {selected.time} · {selected.meta}</Text>
              <ScoreRing score={scoreVal} color={colorVal} />
              <Text style={styles.heroGrade}>{gradeText}</Text>
            </LinearGradient>

            {loadingDetail ? (
              <View style={styles.center}>
                <ActivityIndicator color={colors.blue400} style={{ marginVertical: 32 }} />
              </View>
            ) : (
            <>
            <View style={styles.metricsGrid}>
              {metrics.map((m) => (
                <View key={m.label} style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <View style={[styles.metricDot, { backgroundColor: m.color }]} />
                    <Text style={styles.metricTitle}>{m.label}</Text>
                  </View>
                  <Text style={styles.metricVal}>{m.val}<Text style={styles.metricUnit}>점</Text></Text>
                  <Text style={styles.metricSub}>{m.sub}</Text>
                  <View style={styles.metricBar}><View style={[styles.metricBarFill, { width: `${m.val}%`, backgroundColor: m.color }]} /></View>
                </View>
              ))}
            </View>

            <View style={styles.videoCard}>
              <Text style={styles.videoTitle}>영상 확인하기</Text>

              <View style={styles.videoStage}>
                <View style={styles.videoStageCenter}>
                  <TouchableOpacity
                    style={styles.videoPlayBtn}
                    onPress={() => setIsPlaying((p) => !p)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={isPlaying ? '일시정지' : '재생'}
                  >
                    <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#fff" style={isPlaying ? {} : { marginLeft: 3 }} />
                  </TouchableOpacity>
                  <Text style={styles.videoMockLabel}>전면 카메라 영상</Text>
                </View>

                <View style={styles.videoScrubRow}>
                  <Text style={styles.videoTimeLeft}>{formatVideoTime(videoSec)}</Text>
                  <View style={styles.videoTrackWrap}>
                    <View style={styles.videoTrack}>
                      <View style={[styles.videoTrackFill, { width: `${videoProgress * 100}%` }]} />
                    </View>
                    <View style={[styles.videoKnob, { left: `${videoProgress * 100}%` }]} />
                  </View>
                  <Text style={styles.videoTimeRight}>{formatVideoTime(videoDurationSec)}</Text>
                </View>
              </View>

              {timelineItems.length > 0 && (
                <Text style={styles.timelineTitle}>이벤트 타임라인</Text>
              )}

              {timelineItems.map((ev) => (
                <View key={ev.id} style={styles.timelineRow}>
                  <View style={styles.timelineGutter}>
                    <Text style={styles.timelineGutterTime}>{ev.timeLabel}</Text>
                    <View style={[styles.timelineDot, { backgroundColor: ev.dotColor }]} />
                  </View>
                  <TouchableOpacity
                    style={[styles.timelineCard, { borderColor: ev.borderColor }]}
                    onPress={() => seekTo(ev.seekSec)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.timelineCardBody}>
                      <View style={[styles.timelineIconWrap, { backgroundColor: `${ev.accent}18` }]}>
                        <Ionicons name={ev.icon} size={22} color={ev.iconColor} />
                      </View>
                      <View style={styles.timelineTextBlock}>
                        <Text style={styles.timelineCardTitle}>{ev.title}</Text>
                        <Text style={styles.timelineCardSub}>{ev.subtitle}</Text>
                      </View>
                      <View style={[styles.timelineBadge, { backgroundColor: ev.badgeBg }]}>
                        <Text style={[styles.timelineBadgeText, { color: ev.accent }]}>{ev.timeLabel}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {adviceList.length > 0 && (
              <View style={styles.adviceBox}>
                <Text style={styles.adviceHead}>AI 개선 조언</Text>
                {adviceList.map((text, i) => (
                  <View key={String(i)} style={styles.adviceItem}>
                    <View style={styles.adviceNum}><Text style={styles.adviceNumText}>{i + 1}</Text></View>
                    <Text style={styles.adviceText}>{text}</Text>
                  </View>
                ))}
              </View>
            )}
            <View style={{ height: 20 }} />
            </>
            )}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDark },
  header: { paddingHorizontal: 20, paddingTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  pageTitleFlex: { flex: 1, flexShrink: 1 },
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: 16,
  },
  monthNavBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  monthNavLabel: { fontSize: 15, fontWeight: '700', color: '#fff', minWidth: 100, textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: 'rgba(255,255,255,0.3)' },
  monthLabel: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.3)', letterSpacing: 1 },
  driveCard: {
    marginHorizontal: 20, marginBottom: 12, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  driveIcon: { width: 42, height: 42, borderRadius: 12 },
  driveInfo: { flex: 1 },
  driveDate: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },
  driveTitle: { fontSize: 14, fontWeight: '500', color: '#fff', marginVertical: 2 },
  driveMeta: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  driveScore: { fontSize: 20, fontWeight: '800' },

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

  videoCard: {
    marginHorizontal: 20,
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: colors.bgCard,
    padding: 14,
  },
  videoTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 12 },
  videoStage: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#000',
    overflow: 'hidden',
    minHeight: 200,
  },
  videoStageCenter: {
    flexGrow: 1,
    minHeight: 148,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  videoPlayBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.blue400,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  videoMockLabel: { fontSize: 12, color: 'rgba(255,255,255,0.42)' },
  videoScrubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4,
    gap: 10,
  },
  videoTimeLeft: { fontSize: 11, fontWeight: '600', color: '#fff', width: 36 },
  videoTimeRight: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.45)', width: 36, textAlign: 'right' },
  videoTrackWrap: {
    flex: 1,
    height: 22,
    justifyContent: 'center',
    position: 'relative',
  },
  videoTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  videoTrackFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.blue400,
  },
  videoKnob: {
    position: 'absolute',
    top: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
    marginLeft: -7,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  timelineTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 16,
    marginBottom: 10,
    fontWeight: '600',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    marginBottom: 10,
  },
  timelineGutter: {
    width: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    paddingTop: 14,
  },
  timelineGutterTime: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
  },
  timelineDot: { width: 6, height: 6, borderRadius: 3 },
  timelineCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  timelineCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  timelineIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineTextBlock: { flex: 1, minWidth: 0 },
  timelineCardTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  timelineCardSub: { fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 3 },
  timelineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timelineBadgeText: { fontSize: 11, fontWeight: '700' },
});
