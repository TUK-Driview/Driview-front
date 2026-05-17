import { useEffect, useMemo, useState, memo, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { Video, ResizeMode } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '@/src/constants/colors';
import { useAuth } from '@/src/auth/context';
import { getDrivingSessions, getDrivingReport } from '@/src/auth/api';
import { getSessionVideo } from '@/src/constants/videoStorage';

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

function formatDuration(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return null;
  const rounded = Math.round(totalSeconds);
  const m = Math.floor(rounded / 60);
  const s = rounded % 60;
  return s > 0 ? `${m}분 ${s}초` : `${m}분`;
}

const VideoPlayer = memo(({ videoRef, videoUri, onPlaybackStatusUpdate, onPickVideo }) => {
  if (!videoUri) {
    return (
      <View style={styles.videoStageCenter}>
        <Ionicons name="videocam-off-outline" size={32} color="rgba(255,255,255,0.25)" />
        <Text style={styles.videoMockLabel}>영상 없음</Text>
        <TouchableOpacity style={styles.videoPickBtn} onPress={onPickVideo} activeOpacity={0.8}>
          <Ionicons name="folder-open-outline" size={14} color={colors.blue200} />
          <Text style={styles.videoPickBtnText}>영상 불러오기</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <Video
      ref={videoRef}
      source={{ uri: videoUri }}
      style={styles.videoPlayer}
      resizeMode={ResizeMode.CONTAIN}
      shouldPlay={false}
      useNativeControls={false}
      onPlaybackStatusUpdate={onPlaybackStatusUpdate}
    />
  );
});

export default function ReportScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { sessionId: paramSessionId, _reset: paramReset } = useLocalSearchParams();
  const [localVideoUri, setLocalVideoUri] = useState(null);

  const videoRef = useRef(null);
  const [playerDuration, setPlayerDuration] = useState(0);
  const statusCallbackRef = useRef(null);

  const onPlaybackStatusUpdate = useCallback((status) => {
    statusCallbackRef.current?.(status);
  }, []);

  statusCallbackRef.current = (status) => {
    if (!status.isLoaded) return;
    setIsPlaying(status.isPlaying ?? false);
    setVideoSec(Math.round((status.positionMillis ?? 0) / 1000));
    if (status.durationMillis) {
      const dur = Math.round(status.durationMillis / 1000);
      if (dur !== playerDuration) setPlayerDuration(dur);
    }
  };

  const pickVideo = useCallback(() => {
    void (async () => {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset?.uri) return;
      const lower = (asset.name ?? '').toLowerCase();
      const isVideo = /\.(mp4|mov|m4v|3gp|webm|mkv|avi)$/i.test(lower) || asset.mimeType?.startsWith('video/');
      if (!isVideo) return;
      setLocalVideoUri(asset.uri);
    })();
  }, []);

  const [selected, setSelected] = useState(null);
  const [showScoreInfo, setShowScoreInfo] = useState(false);
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
    if (!paramSessionId) return;
    setSelected({ sessionId: Number(paramSessionId), date: '—', time: '—', score: 0, color: colors.blue400, meta: '—' });
  }, [paramSessionId]);

  useEffect(() => {
    if (!paramReset) return;
    setSelected(null);
    setLocalVideoUri(null);
  }, [paramReset]);

  useEffect(() => {
    if (!selected || selected.date !== '—' || sessions.length === 0) return;
    const match = sessions.find((s) => s.sessionId === selected.sessionId);
    if (!match) return;
    const { date, time } = formatStartedAt(match.startedAt);
    const scoreNum = match.score != null ? Math.round(match.score) : null;
    const color = scoreNum != null ? scoreColor(scoreNum) : colors.blue400;
    const durationLabel = match.durationSec > 0 ? `${Math.floor(match.durationSec / 60)}분 ${match.durationSec % 60}초` : '—';
    setSelected((prev) => ({ ...prev, date, time, score: scoreNum ?? 0, color, meta: durationLabel }));
  }, [sessions, selected?.sessionId]);

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
    setPlayerDuration(0);
    setReportDetail(null);
    videoRef.current?.pauseAsync().catch(() => {});
    videoRef.current?.setPositionAsync(0).catch(() => {});

    getSessionVideo(selected.sessionId).then((uri) => {
      if (uri && uri !== localVideoUri) setLocalVideoUri(uri);
    }).catch(() => {});

    if (!session?.accessToken) return;
    setLoadingDetail(true);
    getDrivingReport(session.accessToken, selected.sessionId)
      .then((data) => setReportDetail(data))
      .catch(() => {})
      .finally(() => setLoadingDetail(false));
  }, [selected?.sessionId]);

  const gradeText = useMemo(() => {
    if (!selected) return '';
    const score = Math.round(reportDetail?.score ?? selected.score ?? 0);
    if (score === 100) return '만점 달성!';
    if (reportDetail?.grade) return reportDetail.grade;
    if (score >= 90) return '안전 운전 우수 등급';
    if (score >= 80) return '양호 등급';
    if (score >= 70) return '주의 필요 등급';
    return '위험 운전 등급';
  }, [selected, reportDetail]);

  const partScores = useMemo(() => {
    if (!reportDetail) return [];
    const brakingScore =
      reportDetail.brakingScore ??
      Math.max(0, 100 - (reportDetail.hardBrakingCount ?? 0) * 10);
    return [
      { label: '차선 준수', score: reportDetail.laneScore ?? 0 },
      { label: '주의 집중', score: reportDetail.focusScore ?? 0 },
      { label: '속도 준수', score: reportDetail.speedScore ?? 0 },
      { label: '급가감속', score: brakingScore },
    ];
  }, [reportDetail]);

  const metrics = useMemo(() => {
    if (!reportDetail) return [];
    return [
      { label: '차선 준수', val: partScores[0]?.score ?? 0, sub: `이탈 ${reportDetail.laneViolationCount ?? 0}회 감지`, color: colors.teal500 },
      { label: '주의 집중', val: partScores[1]?.score ?? 0, sub: `졸음 ${reportDetail.drowsinessCount ?? 0}회 감지`, color: colors.blue400 },
      { label: '속도 준수', val: partScores[2]?.score ?? 0, sub: `과속 ${reportDetail.speedViolationCount ?? 0}회`, color: colors.amber400 },
      { label: '급가감속', val: partScores[3]?.score ?? 0, sub: `급제동 ${reportDetail.hardBrakingCount ?? 0}회`, color: colors.red400 },
    ];
  }, [reportDetail, partScores]);

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

  const scoreVal = reportDetail?.score ?? selected?.score ?? 0;
  const isPerfectScore = Math.round(scoreVal) === 100;

  /** 종합 score = 차선·집중·속도·급가감속 4항목 평균 (항목별 100점 기준, 감점 규칙은 백엔드 산정) */
  const scoreBreakdown = useMemo(() => {
    if (!reportDetail || partScores.length !== 4) return null;
    const sum = partScores.reduce((acc, p) => acc + p.score, 0);
    const average = Math.round(sum / 4);
    return {
      partLines: partScores.map((p) => ({ label: p.label, value: `${Math.round(p.score)}점` })),
      average,
    };
  }, [reportDetail, partScores]);

  const adviceList = useMemo(() => {
    if (!reportDetail) return [];
    if (isPerfectScore) {
      return [
        '완벽한 운전이었어요! 차선·집중·속도 모두 훌륭합니다.',
        '이번 운행은 모범 사례로 기록할 만한 수준이에요. 다음에도 안전 운전 이어가 주세요.',
      ];
    }
    const items = [];
    const lane = reportDetail.laneViolationCount ?? 0;
    const drowsy = reportDetail.drowsinessCount ?? 0;
    const yawns = reportDetail.yawn_count ?? 0;
    if (lane > 0) {
      items.push(`차선 이탈 ${lane}회 (항목당 −3점). 핸들 유지와 집중에 신경 써주세요.`);
    }
    if (drowsy > 0 || yawns > 0) {
      const yawnNote = yawns > 0 ? `하품 ${yawns}회` : '';
      const drowsyNote = drowsy > 0 ? `졸음 ${drowsy}회 (항목당 −10점)` : '';
      items.push(
        [yawnNote, drowsyNote].filter(Boolean).join(', ') + '. 10분 내 하품 3회는 졸음 1회로 집계됩니다. 충분히 쉬고 운전하세요.',
      );
    }
    if ((reportDetail.hardBrakingCount ?? 0) > 0) items.push(`급제동이 ${reportDetail.hardBrakingCount}회 발생했습니다. 앞차와의 거리를 더 확보해보세요.`);
    if ((reportDetail.speedViolationCount ?? 0) > 0) items.push(`과속 구간이 ${reportDetail.speedViolationCount}회 있었습니다. 제한 속도를 준수해주세요.`);
    if (items.length === 0) items.push('전반적으로 안전한 운전 패턴입니다. 현재 수준을 유지하면 상위 등급이 가능합니다.');
    return items;
  }, [reportDetail, isPerfectScore]);


  const videoDurationSec = playerDuration > 0
    ? playerDuration
    : Math.round(reportDetail?.duration_sec ?? 0);
  const colorVal = scoreColor(Math.min(100, Math.round(scoreVal)));

  const seekTo = (sec) => {
    const clamped = Math.max(0, Math.min(sec, videoDurationSec));
    setVideoSec(clamped);
    videoRef.current?.setPositionAsync(clamped * 1000).catch(() => {});
  };
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
                const scoreNum = s.score != null ? Math.round(s.score) : null;
                const color = scoreColor(scoreNum ?? 0);
                const durationLabel = s.durationSec > 0 ? `${Math.floor(s.durationSec / 60)}분 ${s.durationSec % 60}초` : '—';
                const item = { sessionId: s.sessionId, date, time, score: scoreNum ?? 0, color, meta: durationLabel };
                return (
                  <TouchableOpacity key={s.sessionId} style={styles.driveCard} onPress={() => setSelected(item)} activeOpacity={0.85}>
                    <View style={styles.driveInfo}>
                      <Text style={styles.driveDate}>{date} · {time}</Text>
                      <Text style={styles.driveTitle}>운행 기록</Text>
                      <Text style={styles.driveMeta}>{durationLabel}</Text>
                    </View>
                    <Text style={[styles.driveScore, { color }]}>{scoreNum ?? '—'}</Text>
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
            {scoreBreakdown && (
              <TouchableOpacity style={styles.scoreInfoBtn} onPress={() => setShowScoreInfo(true)} activeOpacity={0.75}>
                <Text style={styles.scoreInfoBtnText}>?</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView showsVerticalScrollIndicator={false} removeClippedSubviews={false}>
            <LinearGradient colors={['#0d2a4a', '#0d3a2e']} style={styles.heroCard}>
              <Text style={styles.heroDate}>{selected.date} · {selected.time} · {formatDuration(reportDetail?.duration_sec) ?? selected.meta}</Text>
              <ScoreRing score={Math.min(100, Math.round(scoreVal))} color={colorVal} />
              <Text style={styles.heroGrade}>{gradeText}</Text>
            </LinearGradient>

            {isPerfectScore && !loadingDetail && (
              <LinearGradient
                colors={['rgba(29,158,117,0.35)', 'rgba(55,138,221,0.2)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.celebrateCard}
              >
                <Text style={styles.celebrateEmoji}>🎉</Text>
                <Text style={styles.celebrateTitle}>100점 만점 축하해요!</Text>
                <Text style={styles.celebrateSub}>
                  이번 운행은 완벽에 가까운 안전 운전이었습니다.{'\n'}정말 잘하셨어요!
                </Text>
              </LinearGradient>
            )}

            {scoreBreakdown && !loadingDetail && (
              <>
                <Modal visible={showScoreInfo} transparent animationType="fade" onRequestClose={() => setShowScoreInfo(false)}>
                  <Pressable style={styles.modalBackdrop} onPress={() => setShowScoreInfo(false)}>
                    <Pressable style={styles.modalBox} onPress={() => {}}>
                      <Text style={styles.modalTitle}>점수 산정 방식</Text>
                      <Text style={styles.modalRule}>
                        종합 점수 = 차선 준수 · 주의 집중 · 속도 준수 · 급가감속{'\n'}4개 항목 점수의 평균
                      </Text>
                      <View style={styles.modalDivider} />
                      <Text style={styles.modalSubTitle}>감점 기준</Text>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>졸음 감지</Text>
                        <Text style={styles.modalDeduct}>1회당 −10점</Text>
                      </View>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>하품 (10분 내 3회 → 졸음 1회)</Text>
                        <Text style={styles.modalDeduct}>누적 집계</Text>
                      </View>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>차선 이탈</Text>
                        <Text style={styles.modalDeduct}>1회당 −3점</Text>
                      </View>
                      <View style={styles.modalDivider} />
                      <Text style={styles.modalSubTitle}>이번 운행</Text>
                      {scoreBreakdown.partLines.map((row) => (
                        <View key={row.label} style={styles.modalRow}>
                          <Text style={styles.modalLabel}>{row.label}</Text>
                          <Text style={styles.modalVal}>{row.value}</Text>
                        </View>
                      ))}
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabelBold}>종합 점수</Text>
                        <Text style={styles.modalFinal}>{Math.round(scoreVal)}점</Text>
                      </View>
                      <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowScoreInfo(false)}>
                        <Text style={styles.modalCloseBtnText}>닫기</Text>
                      </TouchableOpacity>
                    </Pressable>
                  </Pressable>
                </Modal>
              </>
            )}

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

              {/* 영상 영역 */}
              <View style={styles.videoStage} collapsable={false}>
                <VideoPlayer videoRef={videoRef} videoUri={localVideoUri} onPlaybackStatusUpdate={onPlaybackStatusUpdate} onPickVideo={pickVideo} />
              </View>

              {/* 컨트롤 바 */}
              <View style={styles.videoScrubRow}>
                <TouchableOpacity
                  style={styles.videoPlayBtnSmall}
                  onPress={() => isPlaying ? videoRef.current?.pauseAsync() : videoRef.current?.playAsync()}
                  activeOpacity={0.85}
                  disabled={!localVideoUri}
                >
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={16} color={localVideoUri ? '#fff' : 'rgba(255,255,255,0.3)'} style={isPlaying ? {} : { marginLeft: 2 }} />
                </TouchableOpacity>
                <Text style={styles.videoTimeLeft}>{formatVideoTime(videoSec)}</Text>
                <View style={styles.videoTrackWrap}>
                  <View style={styles.videoTrack}>
                    <View style={[styles.videoTrackFill, { width: `${videoProgress * 100}%` }]} />
                  </View>
                  <View style={[styles.videoKnob, { left: `${videoProgress * 100}%` }]} />
                </View>
                <Text style={styles.videoTimeRight}>{formatVideoTime(videoDurationSec)}</Text>
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
                <Text style={styles.adviceHead}>{isPerfectScore ? 'AI 축하 메시지' : 'AI 개선 조언'}</Text>
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
  driveIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  driveInfo: { flex: 1 },
  driveDate: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },
  driveTitle: { fontSize: 14, fontWeight: '500', color: '#fff', marginVertical: 2 },
  driveMeta: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  driveScore: { fontSize: 20, fontWeight: '800' },

  scoreInfoBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(55,138,221,0.2)',
    borderWidth: 1, borderColor: 'rgba(55,138,221,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  scoreInfoBtnText: { fontSize: 13, fontWeight: '700', color: colors.blue200 },

  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#1a2235',
    borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(55,138,221,0.2)',
    padding: 22,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 10 },
  modalRule: { fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 18, marginBottom: 14 },
  modalSubTitle: { fontSize: 11, fontWeight: '700', color: colors.blue200, marginBottom: 8, letterSpacing: 0.5 },
  modalDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginVertical: 12 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  modalLabel: { fontSize: 12, color: 'rgba(255,255,255,0.55)', flex: 1 },
  modalLabelBold: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)', flex: 1 },
  modalDeduct: { fontSize: 12, color: colors.red400, fontWeight: '600' },
  modalVal: { fontSize: 12, color: 'rgba(255,255,255,0.45)' },
  modalFinal: { fontSize: 15, fontWeight: '800', color: colors.teal500 },
  modalCloseBtn: {
    marginTop: 18,
    backgroundColor: 'rgba(55,138,221,0.15)',
    borderWidth: 1, borderColor: 'rgba(55,138,221,0.3)',
    borderRadius: 12, paddingVertical: 11,
    alignItems: 'center',
  },
  modalCloseBtnText: { fontSize: 13, fontWeight: '700', color: colors.blue200 },

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

  celebrateCard: {
    marginHorizontal: 20,
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(29,158,117,0.45)',
    paddingVertical: 20,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  celebrateEmoji: { fontSize: 36, marginBottom: 8 },
  celebrateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.teal500,
    marginBottom: 8,
    textAlign: 'center',
  },
  celebrateSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 20,
  },

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
    aspectRatio: 16 / 9,
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(55,138,221,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayBtnSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.blue400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoStageCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  videoMockLabel: { fontSize: 12, color: 'rgba(255,255,255,0.42)', marginBottom: 10 },
  videoPickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(55,138,221,0.15)',
    borderWidth: 1, borderColor: 'rgba(55,138,221,0.3)',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
  },
  videoPickBtnText: { fontSize: 12, color: colors.blue200, fontWeight: '600' },
  videoScrubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
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
