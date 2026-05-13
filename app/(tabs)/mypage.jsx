import { useRouter } from 'expo-router';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/constants/colors';
import { useAuth } from '@/src/auth/context';

const profileStats = [
  { val: '87', label: '평균 점수' },
  { val: '42', label: '총 운행' },
  { val: '1.2k', label: '총 주행km' },
];

const menuGroups = [
  {
    title: '내 활동',
    items: [
      { icon: '📋', label: '내가 쓴 글', route: '/myposts' },
      { icon: '❤️', label: '좋아요한 글', route: null },
    ],
  },
  {
    title: '설정',
    items: [
      { icon: '🔔', label: '알림 설정', route: null, badge: '3' },
      { icon: '🔒', label: '개인정보 처리방침', route: null },
      { icon: '🚪', label: '로그아웃', route: '/login', danger: true },
    ],
  },
];

export default function MyPageScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 프로필 히어로 */}
        <View style={styles.hero}>
          <View style={styles.avatarBig}>
            <Text style={{ fontSize: 36 }}>🧑</Text>
          </View>
          <Text style={styles.profileName}>현수</Text>
          <Text style={styles.profileEmail}>hyunsu@driview.com</Text>
          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editBtnText}>프로필 편집</Text>
          </TouchableOpacity>
        </View>

        {/* 통계 */}
        <View style={styles.statsRow}>
          {profileStats.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* 메뉴 */}
        {menuGroups.map((group) => (
          <View key={group.title} style={styles.menuSection}>
            <Text style={styles.menuGroupTitle}>{group.title}</Text>
            {group.items.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.menuItem}
                onPress={async () => {
                  if (item.label === '로그아웃') {
                    await signOut();
                    router.replace('/login');
                    return;
                  }
                  if (item.route) router.push(item.route);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.menuIcon}>
                  <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                </View>
                <Text style={[styles.menuText, item.danger && { color: colors.red400 }]}>
                  {item.label}
                </Text>
                {item.badge && (
                  <View style={styles.menuBadge}>
                    <Text style={styles.menuBadgeText}>{item.badge}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDark },

  hero: {
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24,
    alignItems: 'center',
  },
  avatarBig: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(55,138,221,0.15)',
    borderWidth: 3, borderColor: 'rgba(55,138,221,0.4)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  profileName: { fontSize: 20, fontWeight: '700', color: '#fff' },
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4 },
  editBtn: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10, paddingHorizontal: 20, paddingVertical: 8,
  },
  editBtnText: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },

  statsRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 20, marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14, padding: 14, alignItems: 'center',
  },
  statVal: { fontSize: 22, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 },

  menuSection: { paddingHorizontal: 20 },
  menuGroupTitle: {
    fontSize: 11, color: 'rgba(255,255,255,0.25)',
    fontWeight: '500', letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8, marginTop: 20,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  menuText: { flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  menuBadge: {
    backgroundColor: colors.red400, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2, marginRight: 6,
  },
  menuBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
});
