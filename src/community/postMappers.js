import { colors } from '@/src/constants/colors';

export const COMMUNITY_TABS = ['전체', '팁 공유', '점수 인증', '질문'];

const AVATAR_PALETTE = [
  { avatarBg: 'rgba(55,138,221,0.2)', avatarColor: colors.blue200 },
  { avatarBg: 'rgba(29,158,117,0.2)', avatarColor: colors.teal500 },
  { avatarBg: 'rgba(186,117,23,0.2)', avatarColor: '#EF9F27' },
];

export function formatPostTime(value) {
  if (value == null || value === '') return '';
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes(),
    ).padStart(2, '0')}`;
  }
  return String(value);
}

export function pickFirstNonEmptyString(...candidates) {
  for (const v of candidates) {
    if (v == null) continue;
    if (typeof v === 'object' && !Array.isArray(v)) continue;
    const s = String(v).trim();
    if (s !== '') return s;
  }
  return '';
}

export function mergePostRecord(raw) {
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

export function mergePostRecordDeep(raw) {
  return mergePostRecord(mergePostRecord(mergePostRecord(raw)));
}

/** 피드 정렬용: 작성(또는 수정) 시각 epoch ms. 없거나 파싱 불가면 0 */
export function postCreatedAtMs(raw) {
  const m = mergePostRecord(raw);
  const v =
    m.createdAt ??
    m.created_at ??
    m.createdDate ??
    m.regDate ??
    m.registeredAt ??
    m.modifiedAt ??
    m.updatedAt;
  if (v == null || v === '') return 0;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export function extractContentFromMerged(m) {
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

export function hasExplicitLikeField(m) {
  if (!m || typeof m !== 'object') return false;
  if (m.likeStatus != null || m.reaction != null) return true;
  return LIKE_FLAG_KEYS.some((k) => m[k] !== undefined && m[k] !== null);
}

export function parseLikedFromRecord(m) {
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

/** 목록·상세 원본 행에서 작성자 표시명 (내가 쓴 글 필터 등) */
export function authorDisplayNameFromPostRow(raw) {
  const m = mergePostRecord(raw);
  return String(
    m.authorNickname ?? m.nickname ?? m.writerName ?? m.authorName ?? m.author ?? m.writer ?? '',
  ).trim();
}

export function categoryToTabLabel(category) {
  const s = category == null ? '' : String(category);
  if (COMMUNITY_TABS.includes(s)) return s;
  if (s.includes('팁')) return '팁 공유';
  if (s.includes('점수') || s.includes('인증')) return '점수 인증';
  if (s.includes('질문')) return '질문';
  if (s.includes('자유')) return '자유';
  return '자유';
}

/** 서버 게시글 한 건 → 카드 UI 모델 */
export function mapServerPostToCard(raw, index) {
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

export function mapCommentRow(raw, index) {
  const m = mergePostRecord(raw);
  const id = m.commentId ?? m.id ?? m.replyId ?? `row-${index}`;
  const body = pickFirstNonEmptyString(
    m.content,
    m.text,
    m.body,
    m.comment,
    m.message,
    m.replyContent,
  );
  const name = String(
    m.nickname ?? m.authorNickname ?? m.writerName ?? m.authorName ?? m.author ?? '드라이버',
  ).trim() || '드라이버';
  const initial = name.charAt(0) || '?';
  const palette = AVATAR_PALETTE[index % AVATAR_PALETTE.length];
  return {
    id: String(id),
    body,
    name,
    initial,
    ...palette,
    time: formatPostTime(m.createdAt ?? m.created_at ?? m.updatedAt) || '방금 전',
  };
}
