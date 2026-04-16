import { useRouter } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/constants/colors';

const myPosts = [
  {
    id: 1, tag: '팁 공유',
    title: '야간 운전 졸음 방지 꿀팁 모음',
    content: '야간 운전 팁 공유합니다. 창문 환기, 껌 씹기, 음악 바꾸기...',
    time: '2일 전', likes: 38, comments: 6,
  },
  {
    id: 2, tag: '점수 인증',
    title: '드디어 94점 달성했습니다!',
    content: '한 달 동안 급제동 줄이는 연습을 했는데 효과가 있었네요.',
    time: '1주 전', likes: 24, comments: 8,
  },
  {
    id: 3, tag: '질문',
    title: '차선 이탈 감지 알고리즘 질문',
    content: '곡선 구간에서 자연스럽게 핸들을 틀었는데도 이탈로 카운트되는데...',
    time: '2주 전', likes: 11, comments: 15,
  },
];

const tagColors = {
  '팁 공유': { bg: 'rgba(29,158,117,0.1)', border: 'rgba(29,158,117,0.2)', text: colors.teal500 },
  '점수 인증': { bg: 'rgba(55,138,221,0.1)', border: 'rgba(55,138,221,0.2)', text: colors.blue200 },
  '질문': { bg: 'rgba(186,117,23,0.1)', border: 'rgba(186,117,23,0.2)', text: colors.amber400 },
  '자유': { bg: colors.bgCard, border: colors.border, text: colors.textSecondary },
};

export default function MyPostsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>내가 쓴 글</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {myPosts.map((post) => {
          const tc = tagColors[post.tag] ?? tagColors['자유'];
          return (
            <TouchableOpacity key={post.id} style={styles.postCard} activeOpacity={0.8}>
              {/* 태그 + 시간 */}
              <View style={styles.postTop}>
                <View style={[styles.tagBadge, { backgroundColor: tc.bg, borderColor: tc.border }]}>
                  <Text style={[styles.tagText, { color: tc.text }]}>{post.tag}</Text>
                </View>
                <Text style={styles.postTime}>{post.time}</Text>
              </View>

              {/* 제목 */}
              <Text style={styles.postTitle}>{post.title}</Text>

              {/* 미리보기 */}
              <Text style={styles.postPreview} numberOfLines={2}>{post.content}</Text>

              {/* 액션 */}
              <View style={styles.postFooter}>
                <Text style={styles.actionText}>❤️ {post.likes}</Text>
                <Text style={styles.actionText}>💬 {post.comments}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 20 }} />
      </ScrollView>
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

  postCard: {
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16, padding: 16,
  },
  postTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  tagBadge: {
    borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  tagText: { fontSize: 11, fontWeight: '500' },
  postTime: { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  postTitle: {
    fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 6,
  },
  postPreview: {
    fontSize: 13, color: 'rgba(255,255,255,0.5)',
    lineHeight: 20, marginBottom: 14,
  },
  postFooter: { flexDirection: 'row', gap: 14 },
  actionText: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },
});
