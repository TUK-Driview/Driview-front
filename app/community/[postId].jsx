import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/constants/colors';
import {
  createPostComment,
  fetchPostComments,
  fetchPostDetail,
  togglePostLike,
} from '@/src/auth/api';
import { useAuth } from '@/src/auth/context';
import { loadLikedPostIds, rememberLikedPost, likesUserKey } from '@/src/community/likedPostIdsStorage';
import {
  mapCommentRow,
  mapServerPostToCard,
  mergePostRecordDeep,
} from '@/src/community/postMappers';

export default function CommunityPostDetailScreen() {
  const router = useRouter();
  const { postId: postIdParam } = useLocalSearchParams();
  const postId = Array.isArray(postIdParam) ? postIdParam[0] : postIdParam;
  const { session, isAuthenticated } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liking, setLiking] = useState(false);

  const loadAll = useCallback(async () => {
    if (!session?.accessToken || postId == null || String(postId).trim() === '') {
      setPost(null);
      setComments([]);
      setLoading(false);
      return;
    }
    setLoadError(null);
    setLoading(true);
    try {
      const likedLocally = await loadLikedPostIds(likesUserKey(session));
      const [detailRaw, commentRows] = await Promise.all([
        fetchPostDetail(session.accessToken, postId),
        fetchPostComments(session.accessToken, postId, { page: 0, size: 100 }).catch(() => []),
      ]);
      const merged = mergePostRecordDeep(detailRaw);
      const card = mapServerPostToCard(merged, 0);
      if (!card) {
        setLoadError('게시글을 찾을 수 없습니다.');
        setPost(null);
      } else {
        setPost({
          ...card,
          liked: likedLocally.has(String(card.id)) || Boolean(card.liked),
        });
      }
      setComments(
        Array.isArray(commentRows) ? commentRows.map((row, i) => mapCommentRow(row, i)) : [],
      );
    } catch (e) {
      setLoadError(e?.message || '불러오지 못했습니다.');
      setPost(null);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [session, postId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const onToggleLike = async () => {
    if (!isAuthenticated || !session?.accessToken || !post) {
      Alert.alert('알림', '로그인 후 이용할 수 있습니다.');
      return;
    }
    if (liking) return;
    if (post.liked) return;
    const prevLikes = post.likes;
    void rememberLikedPost(likesUserKey(session), post.id);
    setPost((p) => (p ? { ...p, liked: true, likes: Math.max(0, p.likes + 1) } : p));
    try {
      setLiking(true);
      const { likeCount } = await togglePostLike(session.accessToken, post.id);
      void rememberLikedPost(likesUserKey(session), post.id);
      setPost((p) => (p ? { ...p, liked: true, likes: likeCount } : p));
    } catch (e) {
      setPost((p) => (p ? { ...p, liked: true, likes: prevLikes } : p));
      Alert.alert('오류', e?.message || '좋아요 처리에 실패했습니다.');
    } finally {
      setLiking(false);
    }
  };

  const onSubmitComment = async () => {
    const t = commentText.trim();
    if (!t) return;
    if (!isAuthenticated || !session?.accessToken) {
      Alert.alert('알림', '로그인 후 댓글을 달 수 있습니다.');
      return;
    }
    try {
      setSubmittingComment(true);
      const res = await createPostComment(session.accessToken, postId, t);
      setCommentText('');
      const d = res?.data;
      if (d && (d.commentId != null || d.content)) {
        const rowForMap = {
          commentId: d.commentId,
          id: d.commentId,
          content: d.content ?? t,
          nickname: d.nickname,
          createdAt: d.createdAt,
        };
        setComments((prev) => {
          const mapped = mapCommentRow(rowForMap, prev.length);
          return [...prev, mapped];
        });
        setPost((p) => (p ? { ...p, comments: (p.comments ?? 0) + 1 } : p));
      } else {
        const rows = await fetchPostComments(session.accessToken, postId, { page: 0, size: 100 });
        const mapped = Array.isArray(rows) ? rows.map((row, i) => mapCommentRow(row, i)) : [];
        setComments(mapped);
        setPost((p) => (p ? { ...p, comments: mapped.length } : p));
      }
    } catch (e) {
      Alert.alert('오류', e?.message || '댓글 등록에 실패했습니다.');
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>게시글</Text>
          <View style={styles.headerRight} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.blue400} />
            <Text style={styles.muted}>불러오는 중…</Text>
          </View>
        ) : loadError ? (
          <View style={styles.center}>
            <Text style={styles.error}>{loadError}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => void loadAll()}>
              <Text style={styles.retryText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        ) : post ? (
          <>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={[styles.avatar, { backgroundColor: post.avatarBg }]}>
                    <Text style={[styles.avatarText, { color: post.avatarColor }]}>{post.initial}</Text>
                  </View>
                  <View style={styles.postMeta}>
                    <Text style={styles.postName}>{post.name}</Text>
                    <Text style={styles.postTime}>{post.time}</Text>
                  </View>
                  {post.score != null ? (
                    <View style={styles.scoreBadge}>
                      <Text style={styles.scoreBadgeText}>{post.score}</Text>
                    </View>
                  ) : null}
                </View>

                {post.title ? <Text style={styles.postTitle}>{post.title}</Text> : null}
                {post.content ? (
                  <Text style={styles.postContent}>{post.content}</Text>
                ) : (
                  <Text style={styles.postContentMuted}>본문이 없습니다.</Text>
                )}

                <View style={styles.postFooter}>
                  <TouchableOpacity
                    style={[styles.action, styles.likeRow]}
                    onPress={() => void onToggleLike()}
                    disabled={post.liked || liking}
                  >
                    <View style={styles.likeIconSlot}>
                      {liking ? (
                        <ActivityIndicator size="small" color={colors.blue400} />
                      ) : (
                        <Ionicons
                          name={post.liked ? 'heart' : 'heart-outline'}
                          size={22}
                          color={post.liked ? '#FF3040' : 'rgba(255,255,255,0.45)'}
                        />
                      )}
                    </View>
                    <Text style={styles.likeCount}>{post.likes}</Text>
                  </TouchableOpacity>
                  <View style={styles.action}>
                    <Text style={styles.actionText}>💬 {comments.length || post.comments}</Text>
                  </View>
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>{post.tag}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.sectionTitle}>
                댓글 {comments.length || post.comments || 0}
              </Text>

              {comments.length === 0 ? (
                <Text style={styles.noComments}>첫 댓글을 남겨보세요.</Text>
              ) : (
                comments.map((c, idx) => (
                  <View key={`${c.id}-${idx}`} style={styles.commentCard}>
                    <View style={styles.commentHeader}>
                      <View style={[styles.avatarSm, { backgroundColor: c.avatarBg }]}>
                        <Text style={[styles.avatarSmText, { color: c.avatarColor }]}>{c.initial}</Text>
                      </View>
                      <View style={styles.commentMeta}>
                        <Text style={styles.commentName}>{c.name}</Text>
                        <Text style={styles.commentTime}>{c.time}</Text>
                      </View>
                    </View>
                    <Text style={styles.commentBody}>{c.body || ' '}</Text>
                  </View>
                ))
              )}
              <View style={{ height: 120 }} />
            </ScrollView>

            <SafeAreaView edges={['bottom']} style={styles.inputBar}>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="댓글을 입력하세요"
                  placeholderTextColor={colors.textMuted}
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  maxLength={2000}
                  editable={!submittingComment}
                  {...(Platform.OS === 'android'
                    ? { autoComplete: 'off', importantForAutofill: 'no' }
                    : {})}
                />
                <Pressable
                  style={[styles.sendBtn, (!commentText.trim() || submittingComment) && styles.sendBtnDisabled]}
                  onPress={() => void onSubmitComment()}
                  disabled={!commentText.trim() || submittingComment}
                >
                  {submittingComment ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.sendBtnText}>등록</Text>
                  )}
                </Pressable>
              </View>
            </SafeAreaView>
          </>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgDark },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerRight: { width: 44 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  muted: { fontSize: 14, color: colors.textSecondary },
  error: { fontSize: 14, color: colors.red400, textAlign: 'center' },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(55,138,221,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(55,138,221,0.35)',
  },
  retryText: { fontSize: 13, color: colors.blue200, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },
  postCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '600' },
  postMeta: { flex: 1 },
  postName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  postTime: { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  scoreBadge: {
    backgroundColor: 'rgba(55,138,221,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(55,138,221,0.25)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scoreBadgeText: { fontSize: 14, fontWeight: '800', color: colors.blue200 },
  postTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
    lineHeight: 24,
  },
  postContent: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 24,
    marginBottom: 14,
  },
  postContentMuted: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 14,
    fontStyle: 'italic',
  },
  postFooter: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  action: {},
  likeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  likeIconSlot: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  likeCount: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  actionText: { fontSize: 13, color: 'rgba(255,255,255,0.35)' },
  tagBadge: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(29,158,117,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(29,158,117,0.2)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: { fontSize: 10, color: colors.teal500 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  noComments: { fontSize: 13, color: colors.textMuted, marginBottom: 16 },
  commentCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  avatarSm: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmText: { fontSize: 11, fontWeight: '600' },
  commentMeta: { flex: 1 },
  commentName: { fontSize: 13, fontWeight: '600', color: '#fff' },
  commentTime: { fontSize: 10, color: 'rgba(255,255,255,0.3)' },
  commentBody: { fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 20 },
  inputBar: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgDark,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  sendBtn: {
    backgroundColor: colors.blue400,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.45 },
  sendBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
