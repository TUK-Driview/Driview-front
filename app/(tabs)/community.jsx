import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/constants/colors';

const TABS = ['전체', '팁 공유', '점수 인증', '질문'];

const posts = [
  {
    id: 1,
    name: '김드라이버', initial: '김', avatarBg: 'rgba(55,138,221,0.2)', avatarColor: colors.blue200,
    time: '14분 전', score: 94,
    content: '드디어 94점 찍었습니다!! 한 달 동안 급제동 줄이는 연습했는데 효과 있었네요 😊 고속도로에서 앞차 간격 2초 이상 유지하는 게 핵심인 것 같아요.',
    likes: 24, comments: 8, tag: '점수 인증', liked: true,
  },
  {
    id: 2,
    name: '이안전운전', initial: '이', avatarBg: 'rgba(29,158,117,0.2)', avatarColor: colors.teal500,
    time: '1시간 전', score: null,
    content: '차선 이탈 감지가 너무 예민한 것 같지 않나요? 곡선 구간에서 자연스럽게 핸들 틀었는데도 이탈로 카운트되던데... 알고리즘 개선이 필요할 것 같습니다.',
    likes: 11, comments: 15, tag: '질문', liked: false,
  },
  {
    id: 3,
    name: '박주행왕', initial: '박', avatarBg: 'rgba(186,117,23,0.2)', avatarColor: '#EF9F27',
    time: '3시간 전', score: null,
    content: '야간 운전 팁 공유합니다. 졸음 감지 기능이 생각보다 정확해요. 저도 모르게 눈 감는 횟수가 늘었을 때 바로 경보가 울렸거든요.',
    likes: 38, comments: 6, tag: '팁 공유', liked: false,
  },
];

export default function CommunityScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('전체');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={14} color="rgba(255,255,255,0.3)" />
          <TextInput
            style={styles.searchInput}
            placeholder="검색"
            placeholderTextColor="rgba(255,255,255,0.3)"
            keyboardType="default"
            {...(Platform.OS === 'android'
              ? { autoComplete: 'off', importantForAutofill: 'no' }
              : {})}
          />
        </View>
        <TouchableOpacity
          style={styles.writeBtn}
          onPress={() => router.push('/write')}
        >
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* 카테고리 탭 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsRow}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 게시글 목록 */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {posts.map((post) => (
          <View key={post.id} style={styles.postCard}>
            {/* 포스트 헤더 */}
            <View style={styles.postHeader}>
              <View style={[styles.avatar, { backgroundColor: post.avatarBg }]}>
                <Text style={[styles.avatarText, { color: post.avatarColor }]}>{post.initial}</Text>
              </View>
              <View style={styles.postMeta}>
                <Text style={styles.postName}>{post.name}</Text>
                <Text style={styles.postTime}>{post.time}</Text>
              </View>
              {post.score && (
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreBadgeText}>{post.score}</Text>
                </View>
              )}
            </View>

            {/* 본문 */}
            <Text style={styles.postContent}>{post.content}</Text>

            {/* 푸터 */}
            <View style={styles.postFooter}>
              <TouchableOpacity style={styles.action}>
                <Text style={[styles.actionText, post.liked && styles.actionLiked]}>
                  ❤️ {post.likes}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.action}>
                <Text style={styles.actionText}>💬 {post.comments}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.action}>
                <Text style={styles.actionText}>↗ 공유</Text>
              </TouchableOpacity>
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>{post.tag}</Text>
              </View>
            </View>
          </View>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDark },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, gap: 12,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.bgInput,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#fff', padding: 0 },
  writeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.blue400,
    alignItems: 'center', justifyContent: 'center',
  },

  tabsScroll: { flexGrow: 0, marginBottom: 12 },
  tabsRow: { paddingHorizontal: 20, alignItems: 'center', gap: 8 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tabActive: {
    backgroundColor: 'rgba(55,138,221,0.15)',
    borderColor: 'rgba(55,138,221,0.4)',
  },
  tabText: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  tabTextActive: { color: colors.blue200, fontWeight: '500' },

  postCard: {
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16, padding: 16,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '600' },
  postMeta: { flex: 1 },
  postName: { fontSize: 13, fontWeight: '600', color: '#fff' },
  postTime: { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  scoreBadge: {
    backgroundColor: 'rgba(55,138,221,0.15)',
    borderWidth: 1, borderColor: 'rgba(55,138,221,0.25)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  scoreBadgeText: { fontSize: 14, fontWeight: '800', color: colors.blue200 },

  postContent: {
    fontSize: 13, color: 'rgba(255,255,255,0.65)',
    lineHeight: 22, marginBottom: 14,
  },
  postFooter: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  action: {},
  actionText: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },
  actionLiked: { color: colors.red400 },
  tagBadge: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(29,158,117,0.1)',
    borderWidth: 1, borderColor: 'rgba(29,158,117,0.2)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  tagText: { fontSize: 10, color: colors.teal500 },
});
