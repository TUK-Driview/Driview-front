import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, Switch, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/constants/colors';
import { useAuth } from '@/src/auth/context';
import { getNotificationSettings, updateNotificationSettings } from '@/src/auth/api';

const DEFAULT_SETTINGS = {
  driveReportAlert: true,
  drowsinessAlert: true,
  communityCommentAlert: true,
  communityLikeAlert: false,
  marketingAlert: false,
};

const ITEMS = [
  { key: 'driveReportAlert', label: '운행 리포트 알림', desc: '운행 분석 결과가 준비되면 알려드려요' },
  { key: 'drowsinessAlert', label: '졸음 감지 알림', desc: '운전 중 졸음이 감지되면 알려드려요' },
  { key: 'communityCommentAlert', label: '커뮤니티 댓글 알림', desc: '내 게시글에 댓글이 달리면 알려드려요' },
  { key: 'communityLikeAlert', label: '커뮤니티 좋아요 알림', desc: '내 게시글에 좋아요가 달리면 알려드려요' },
  { key: 'marketingAlert', label: '마케팅 알림', desc: '이벤트·혜택 정보를 알려드려요' },
];

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session?.accessToken) { setLoading(false); return; }
    getNotificationSettings(session.accessToken)
      .then((data) => setSettings(data ?? DEFAULT_SETTINGS))
      .catch(() => setSettings(DEFAULT_SETTINGS))
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  const toggle = async (key, value) => {
    const prev = settings;
    const next = { ...settings, [key]: value };
    setSettings(next);
    setSaving(true);
    try {
      await updateNotificationSettings(session.accessToken, { [key]: value });
    } catch {
      setSettings(prev);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>알림 설정</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.blue400} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {ITEMS.map((item, i) => (
            <View
              key={item.key}
              style={[styles.row, i < ITEMS.length - 1 && styles.rowBorder]}
            >
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowDesc}>{item.desc}</Text>
              </View>
              <Switch
                value={!!settings[item.key]}
                onValueChange={(v) => toggle(item.key, v)}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.blue400 }}
                thumbColor="#fff"
                disabled={saving}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDark },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  pageTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 13, color: colors.red400 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 18,
  },
  rowBorder: {
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  rowText: { flex: 1, marginRight: 12 },
  rowLabel: { fontSize: 14, color: '#fff', fontWeight: '500', marginBottom: 4 },
  rowDesc: { fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 18 },
});
