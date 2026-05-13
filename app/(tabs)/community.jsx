import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/constants/colors';
import { fetchCommunityPosts, fetchPostDetail, togglePostLike } from '@/src/auth/api';
import { useAuth } from '@/src/auth/context';
import { loadLikedPostIds, rememberLikedPost } from '@/src/community/likedPostIdsStorage';
import { TAG_TO_POST_CATEGORY_API } from '@/src/constants/postBoardCategories';

const TABS = ['전체', '팁 공유', '점수 인증', '질문'];

/** AsyncStorage 분리용 — 로그인 사용자 식별자 */
function likesUserKey(session) {
  const u = session?.user;
  if (u && typeof u === 'object') {
    const k = u.email ?? u.id ?? u.memberId ?? u.userId ?? u.nickname;
    if (k != null && String(k).trim() !== '') return String(k).trim();
  }
  return 'default';
}

const AVATAR_PALETTE = [
  { avatarBg: 'rgba(55,138,221,0.2)', avatarColor: colors.blue200 },
  { avatarBg: 'rgba(29,158,117,0.2)', avatarColor: colors.teal500 },
  { avatarBg: 'rgba(186,117,23,0.2)', avatarColor: '#EF9F27' },
];

function formatPostTime(value) {
  if (value == null || value === '') return '';
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes(),
    ).padStart(2, '0')}`;
  }
  return String(value);
}

function pickFirstNonEmptyString(...candidates) {
  for (const v of candidates) {
    if (v == null) continue;
    if (typeof v === 'object' && !Array.isArray(v)) continue;
    const s = String(v).trim();
    if (s !== '') return s;
  }
  return '';
}

/** 목록/단건 응답에서 흔한 중첩(post, data, result)을 한 객체로 합침 */
function mergePostRecord(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const post = raw.post && typeof raw.post === 'object' ? raw.post : {};
  const data = raw.data && typeof raw.data === 'object' ? raw.data : {};
  const result = raw.result && typeof raw.result === 'object' ? raw.result : {};
  const dataPost = data.post && typeof data.post === 'object' ? data.post : {};
  const postData = post.data && typeof post.data === 'object' ? post.data : {};
  const postDetail = raw.postDetail && typeof raw.postDetail === 'object' ? raw.postDetail : {};
  const postResponse = raw.postResponse && typeof raw.postResponse === 'object' ? raw.postResponse : {};
  const postInfo = raw.postInfo && typeof raw.postInfo === 'object' ? raw.postInfo : {};
  const view = raw.view && typeof raw.view === 'object' ? raw.view : {};
  return {
    ...raw,
    ...post,
    ...data,
    ...result,
    ...dataPost,
    ...postData,
    ...postDetail,
    ...postResponse,
    ...postInfo,
    ...view,
  };
}

/** 단건 등 중첩이 여러 겹일 때 본문 필드가 안 올라오는 경우 대비 */
function mergePostRecordDeep(raw) {
  return mergePostRecord(mergePostRecord(mergePostRecord(raw)));
}

function extractContentFromMerged(m) {
  if (!m || typeof m !== 'object') return '';
  const direct = pickFirstNonEmptyString(
    m.content,
    m.body,
    m.text,
    m.description,
    m.postContent,
    m.postBody,
    m.mainContent,
    m.boardContent,
    m.articleContent,
    m.detail,
    m.post_content,
    m.post_body,
    m.textBody,
    m.plainText,
    m.message,
    m.answer,
    m.memo,
    m.preview,
    m.summary,
    m.snippet,
    m.oneLine,
    m.contentSummary,
    m.article,
    m.subTitle,
    m.subtitle,
    m.detailContent,
    m.fullText,
    m.mainText,
    m.htmlContent,
    m.html,
    m.markdown,
    m.markdownBody,
    m.editorContent,
    m.richContent,
    m.writing,
    m.contentBody,
    m.articleBody,
    m.textContent,
  );
  if (direct) return direct;
  const arr = m.contents ?? m.blocks ?? m.paragraphs;
  if (Array.isArray(arr)) {
    const joined = arr
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          return pickFirstNonEmptyString(
            item.content,
            item.text,
            item.body,
            item.value,
            item.data,
          );
        }
        return '';
      })
      .filter((s) => String(s).trim() !== '')
      .join('\n');
    if (joined.trim()) return joined.trim();
  }
  return '';
}

const LIKE_FLAG_KEYS = [
  'liked',
  'isLiked',
  'is_liked',
  'likedByMe',
  'myLike',
  'userLiked',
  'hasLiked',
  'isLike',
  'likeYn',
  'likedYn',
  'liked_yn',
];

function hasExplicitLikeField(m) {
  if (!m || typeof m !== 'object') return false;
  if (m.likeStatus != null || m.reaction != null) return true;
  return LIKE_FLAG_KEYS.some((k) => m[k] !== undefined && m[k] !== null);
}

function parseLikedFromRecord(m) {
  if (!m || typeof m !== 'object') return false;
  const st = m.likeStatus ?? m.reaction;
  if (typeof st === 'string') {
    const u = st.toUpperCase();
    if (u.includes('LIKE') || u === 'Y' || u === 'TRUE') return true;
    if (u.includes('NONE') || u === 'N' || u === 'FALSE') return false;
  }
  for (const k of LIKE_FLAG_KEYS) {
    const v = m[k];
    if (v === undefined || v === null) continue;
    if (v === true || v === 1 || v === '1' || v === 'Y' || v === 'y' || v === 'true' || v === 'YES') return true;
    if (v === false || v === 0 || v === '0' || v === 'N' || v === 'n' || v === 'false' || v === 'NO') return false;
  }
  return false;
}

/** API `category` 값(예: 자유게시판) → 탭 필터용 짧은 라벨 */
function categoryToTabLabel(category) {
  const s = category == null ? '' : String(category);
  if (TABS.includes(s)) return s;
  if (s.includes('팁')) return '팁 공유';
  if (s.includes('점수') || s.includes('인증')) return '점수 인증';
  if (s.includes('질문')) return '질문';
  if (s.includes('자유')) return '자유';
  return '자유';
}

/** 서버 게시글 한 건 → 카드 UI 모델 (필드명은 백엔드에 맞게 넓게 매핑) */
function mapServerPostToCard(raw, index) {
  const m = mergePostRecord(raw);
  const id = m.postId ?? m.id ?? raw?.postId ?? raw?.id;
  if (id == null) return null;

  const name = String(
    m.authorNickname ?? m.nickname ?? m.writerName ?? m.authorName ?? m.author ?? m.writer ?? '드라이버',
  ).trim() || '드라이버';
  const initial = name.charAt(0) || '?';
  const palette = AVATAR_PALETTE[index % AVATAR_PALETTE.length];

  const tagRaw = m.category ?? m.tag ?? m.postType ?? raw?.category;
  const tag = categoryToTabLabel(tagRaw);

  const title = pickFirstNonEmptyString(
    m.title,
    m.postTitle,
    m.subject,
    m.headline,
    m.post_title,
    m.postName,
  );

  const content = extractContentFromMerged(m);

  const likes = Number(m.likeCount ?? m.likes ?? m.like_count ?? 0) || 0;
  const comments = Number(m.commentCount ?? m.comments ?? m.comment_count ?? 0) || 0;
  const liked = hasExplicitLikeField(m) ? parseLikedFromRecord(m) : false;
  const scoreRaw = m.drivingScore ?? m.score;
  const score = scoreRaw != null && scoreRaw !== '' ? Number(scoreRaw) : null;

  return {
    id,
    title,
    name,
    initial,
    ...palette,
    time: formatPostTime(m.createdAt ?? m.created_at ?? m.modifiedAt ?? m.updatedAt) || '방금 전',
    score: Number.isFinite(score) ? score : null,
    content: content || '',
    likes,
    comments,
    tag,
    liked,
  };
}

export default function CommunityScreen() {
  const router = useRouter();
  const { session, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('전체');
  const [posts, setPosts] = useState([]);
  const [likingPostId, setLikingPostId] = useState(null);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedRefreshing, setFeedRefreshing] = useState(false);
  const [feedError, setFeedError] = useState(null);

  const loadPosts = useCallback(async () => {
    if (!session?.accessToken) {
      setPosts([]);
      setFeedError(null);
      setFeedLoading(false);
      return;
    }
    setFeedError(null);
    try {
      const likedLocally = await loadLikedPostIds(likesUserKey(session));
      const listCategory =
        activeTab === '전체' ? undefined : TAG_TO_POST_CATEGORY_API[activeTab];
      const { posts: rows } = await fetchCommunityPosts(session.accessToken, {
        page: 0,
        size: 20,
        category: listCategory,
      });
      const pairs = rows
        .map((row, index) => {
          const card = mapServerPostToCard(row, index);
          if (!card) return null;
          return { row: mergePostRecord(row), card };
        })
        .filter(Boolean);

      let mapped = pairs.map((p) => p.card);

      const DETAIL_FETCH_CAP = 30;
      const needDetail = pairs
        .filter((p) => {
          const noBody = !String(p.card.content || '').trim();
          const noLikeMeta = !hasExplicitLikeField(p.row);
          const likesPositive = (p.card.likes ?? 0) > 0;
          const listSaysNotLiked =
            hasExplicitLikeField(p.row) && !parseLikedFromRecord(p.row);
          return noBody || noLikeMeta || (likesPositive && listSaysNotLiked);
        })
        .slice(0, DETAIL_FETCH_CAP);

      const patchById = new Map();
      await Promise.all(
        needDetail.map(async ({ card }) => {
          try {
            const detail = await fetchPostDetail(session.accessToken, card.id);
            const merged = mergePostRecordDeep(detail);
            const patch = {};
            const txt = extractContentFromMerged(merged);
            if (txt) patch.content = txt;
            if (hasExplicitLikeField(merged)) {
              patch.liked = parseLikedFromRecord(merged);
            }
            const lc = merged.likeCount ?? merged.likes ?? merged.like_count;
            if (lc !== undefined && lc !== null && lc !== '') {
              patch.likes = Number(lc) || 0;
            }
            if (Object.keys(patch).length) patchById.set(String(card.id), patch);
          } catch {
            /* 단건 GET 미구현·404 등 */
          }
        }),
      );

      mapped = mapped.map((c) => ({ ...c, ...(patchById.get(String(c.id)) ?? {}) }));
      mapped = mapped.map((c) => ({
        ...c,
        liked: likedLocally.has(String(c.id)) || Boolean(c.liked),
      }));

      setPosts(mapped);
    } catch (e) {
      setFeedError(e?.message || '게시글을 불러오지 못했습니다.');
      setPosts([]);
    } finally {
      setFeedLoading(false);
      setFeedRefreshing(false);
    }
  }, [session?.accessToken, session?.user, activeTab]);

  useEffect(() => {
    setFeedLoading(true);
    void loadPosts();
  }, [loadPosts]);

  const onRefresh = useCallback(() => {
    if (!session?.accessToken) return;
    setFeedRefreshing(true);
    void loadPosts();
  }, [loadPosts, session?.accessToken]);

  const filteredPosts = useMemo(() => {
    if (activeTab === '전체') return posts;
    return posts.filter((p) => p.tag === activeTab);
  }, [posts, activeTab]);

  const onToggleLike = async (postId) => {
    if (!isAuthenticated || !session?.accessToken) {
      Alert.alert('알림', '로그인 후 이용할 수 있습니다.');
      return;
    }
    if (String(likingPostId) === String(postId)) return;

    const prev = posts.find((p) => String(p.id) === String(postId));
    if (!prev) return;
    /** 이미 좋아요한 글은 재탭 시 API·상태 변경 없음 */
    if (prev.liked) return;

    const optimisticLikes = Math.max(0, prev.likes + 1);
    void rememberLikedPost(likesUserKey(session), postId);
    setPosts((p) =>
      p.map((row) =>
        String(row.id) === String(postId)
          ? { ...row, liked: true, likes: optimisticLikes }
          : row,
      ),
    );

    try {
      setLikingPostId(postId);
      const { likeCount } = await togglePostLike(session.accessToken, postId);
      void rememberLikedPost(likesUserKey(session), postId);
      setPosts((p) =>
        p.map((row) =>
          String(row.id) === String(postId)
            ? { ...row, liked: true, likes: likeCount }
            : row,
        ),
      );
    } catch (e) {
      setPosts((p) =>
        p.map((row) =>
          String(row.id) === String(postId)
            ? { ...row, liked: true, likes: prev.likes }
            : row,
        ),
      );
      Alert.alert('오류', e?.message || '좋아요 처리에 실패했습니다.');
    } finally {
      setLikingPostId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
        <TouchableOpacity style={styles.writeBtn} onPress={() => router.push('/write')}>
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

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
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={feedRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.blue400}
            colors={[colors.blue400]}
          />
        }
        contentContainerStyle={
          filteredPosts.length === 0 && !feedLoading ? styles.listEmptyGrow : undefined
        }
      >
        {feedLoading ? (
          <View style={styles.feedState}>
            <ActivityIndicator size="large" color={colors.blue400} />
            <Text style={styles.feedStateText}>게시글 불러오는 중…</Text>
          </View>
        ) : null}

        {!feedLoading && feedError ? (
          <View style={styles.feedState}>
            <Text style={styles.feedErrorText}>{feedError}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                setFeedLoading(true);
                void loadPosts();
              }}
            >
              <Text style={styles.retryBtnText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!feedLoading && !feedError && !isAuthenticated ? (
          <View style={styles.feedState}>
            <Text style={styles.feedStateText}>로그인하면 서버에 등록된 게시글을 볼 수 있어요.</Text>
          </View>
        ) : null}

        {!feedLoading && !feedError && isAuthenticated && filteredPosts.length === 0 ? (
          <View style={styles.feedState}>
            <Text style={styles.feedStateText}>표시할 게시글이 없어요.</Text>
          </View>
        ) : null}

        {filteredPosts.map((post) => (
          <View key={String(post.id)} style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={[styles.avatar, { backgroundColor: post.avatarBg }]}>
                <Text style={[styles.avatarText, { color: post.avatarColor }]}>{post.initial}</Text>
              </View>
              <View style={styles.postMeta}>
                <Text style={styles.postName}>{post.name}</Text>
                <Text style={styles.postTime}>{post.time}</Text>
              </View>
              {post.score != null && post.score !== '' ? (
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreBadgeText}>{post.score}</Text>
                </View>
              ) : null}
            </View>

            {post.title ? <Text style={styles.postTitle}>{post.title}</Text> : null}
            {post.content ? (
              <Text style={styles.postContent}>{post.content}</Text>
            ) : post.title ? null : (
              <Text style={styles.postContentMuted}>
                목록 응답에 제목·본문이 없습니다. API JSON 필드명을 알려주세요.
              </Text>
            )}

            <View style={styles.postFooter}>
              <TouchableOpacity
                style={[styles.action, styles.likeRow]}
                onPress={() => onToggleLike(post.id)}
                disabled={post.liked || String(likingPostId) === String(post.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View style={styles.likeIconSlot}>
                  {String(likingPostId) === String(post.id) ? (
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#fff', padding: 0 },
  writeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.blue400,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabsScroll: { flexGrow: 0, marginBottom: 12 },
  tabsRow: { paddingHorizontal: 20, alignItems: 'center', gap: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tabActive: {
    backgroundColor: 'rgba(55,138,221,0.15)',
    borderColor: 'rgba(55,138,221,0.4)',
  },
  tabText: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  tabTextActive: { color: colors.blue200, fontWeight: '500' },

  listEmptyGrow: { flexGrow: 1 },

  feedState: {
    paddingHorizontal: 28,
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  feedStateText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  feedErrorText: { fontSize: 14, color: colors.red400, textAlign: 'center' },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(55,138,221,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(55,138,221,0.35)',
  },
  retryBtnText: { fontSize: 13, color: colors.blue200, fontWeight: '600' },

  postCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: 16,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '600' },
  postMeta: { flex: 1 },
  postName: { fontSize: 13, fontWeight: '600', color: '#fff' },
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
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    lineHeight: 22,
  },
  postContent: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 22,
    marginBottom: 14,
  },
  postContentMuted: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    lineHeight: 20,
    marginBottom: 14,
    fontStyle: 'italic',
  },
  postFooter: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  action: {},
  likeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  likeIconSlot: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  likeCount: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)', minWidth: 8 },
  actionText: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },
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
});
