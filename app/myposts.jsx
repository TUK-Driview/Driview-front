import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/constants/colors';
import { useAuth } from '@/src/auth/context';
import { getMyPosts } from '@/src/auth/api';

const categoryColors = {
  '팁 공유': { bg: 'rgba(29,158,117,0.1)', border: 'rgba(29,158,117,0.2)', text: colors.teal500 },
  '점수 인증': { bg: 'rgba(55,138,221,0.1)', border: 'rgba(55,138,221,0.2)', text: colors.blue200 },
  '질문': { bg: 'rgba(186,117,23,0.1)', border: 'rgba(186,117,23,0.2)', text: colors.amber400 },
  '자유': { bg: colors.bgCard, border: colors.border, text: colors.textSecondary },
};

function formatDate(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(isoString).toLocaleDateString('ko-KR');
}

export default function MyPostsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session?.accessToken) { setLoading(false); return; }
    getMyPosts(session.accessToken)
      .then(({ posts: p }) => setPosts(p))
      .catch((e) => setError(e.message || '불러오기에 실패했습니다.'))
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>내가 쓴 글</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.blue400} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>작성한 글이 없습니다.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {posts.map((post) => {
            const tc = categoryColors[post.category] ?? categoryColors['자유'];
            return (
              <TouchableOpacity key={post.postId} style={styles.postCard} activeOpacity={0.8}>
                <View style={styles.postTop}>
                  <View style={[styles.tagBadge, { backgroundColor: tc.bg, borderColor: tc.border }]}>
                    <Text style={[styles.tagText, { color: tc.text }]}>{post.category}</Text>
                  </View>
                  <Text style={styles.postTime}>{formatDate(post.createdAt)}</Text>
                </View>

                <Text style={styles.postTitle}>{post.title}</Text>

                {post.content ? (
                  <Text style={styles.postPreview} numberOfLines={2}>{post.content}</Text>
                ) : null}

                <View style={styles.postFooter}>
                  <Text style={styles.actionText}>❤️ {post.likeCount ?? 0}</Text>
                  <Text style={styles.actionText}>💬 {post.commentCount ?? 0}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 20 }} />
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
  emptyText: { fontSize: 14, color: 'rgba(255,255,255,0.3)' },
  errorText: { fontSize: 13, color: colors.red400, textAlign: 'center', paddingHorizontal: 24 },

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
  postTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 6 },
  postPreview: {
    fontSize: 13, color: 'rgba(255,255,255,0.5)',
    lineHeight: 20, marginBottom: 14,
  },
  postFooter: { flexDirection: 'row', gap: 14 },
  actionText: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },
});
