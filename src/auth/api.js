import {
  authConfig,
  getPostCommentsPath,
  getPostDetailPath,
  getPostLikeTogglePath,
} from '@/src/auth/config';

function buildUrl(path, query) {
  const base = authConfig.apiBaseUrl?.replace(/\/$/, '');
  if (!base) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is not set.');
  }
  const url = new URL(`${base}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
}

/**
 * 공통 응답: { isSuccess, errorCode, message, data }
 */
async function requestApi(path, { method = 'GET', body, query, token } = {}) {
  const res = await fetch(buildUrl(path, query), {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const json = await res.json().catch(() => ({}));

  if (json && json.isSuccess === false) {
    throw new Error(json.message || '요청에 실패했습니다.');
  }
  if (!res.ok) {
    throw new Error(json?.message || '요청에 실패했습니다.');
  }
  return json;
}

/**
 * GET `/api/v1/posts` 목록 성공 응답 (Swagger)
 * {
 *   isSuccess, errorCode, message,
 *   data: { page, size, totalElements, posts: [{ postId, category, title, nickname, likeCount, commentCount, createdAt }] }
 * }
 */
function parsePostsListResponse(json) {
  const d = json?.data;
  if (d != null && typeof d === 'object' && !Array.isArray(d) && Array.isArray(d.posts)) {
    return {
      posts: d.posts,
      page: Number(d.page) || 0,
      size: Number(d.size) || 0,
      totalElements: Number(d.totalElements) || 0,
    };
  }
  /** 구버전·다른 스키마: data가 배열이거나 posts 대신 content/items 만 있는 경우 */
  if (Array.isArray(d)) {
    return {
      posts: d,
      page: 0,
      size: d.length,
      totalElements: d.length,
    };
  }
  if (d != null && typeof d === 'object' && !Array.isArray(d)) {
    if (Array.isArray(d.content)) {
      const list = d.content;
      return {
        posts: list,
        page: Number(d.page) || 0,
        size: Number(d.size) || list.length,
        totalElements: Number(d.totalElements) || list.length,
      };
    }
    if (Array.isArray(d.items)) {
      const list = d.items;
      return {
        posts: list,
        page: Number(d.page) || 0,
        size: Number(d.size) || list.length,
        totalElements: Number(d.totalElements) || list.length,
      };
    }
  }
  if (Array.isArray(json?.result)) {
    const r = json.result;
    return { posts: r, page: 0, size: r.length, totalElements: r.length };
  }
  return { posts: [], page: 0, size: 0, totalElements: 0 };
}

/**
 * GET `/api/v1/posts` — Bearer accessToken
 * Query: category?, page(기본 0), size(기본 20)
 * @returns {{ posts: object[]; page: number; size: number; totalElements: number }}
 */
export async function fetchCommunityPosts(
  accessToken,
  { page = 0, size = 20, category } = {},
) {
  const query = { page, size };
  if (category != null && String(category).trim() !== '') {
    query.category = String(category).trim();
  }
  const json = await requestApi(authConfig.endpoints.postsList, {
    method: 'GET',
    query,
    token: accessToken,
  });
  return parsePostsListResponse(json);
}

/**
 * 단건 GET이 목록과 동일하게 `data.posts: [ 한 건 ]`으로 오는 경우
 */
function unwrapPostDetailPayload(json) {
  const d = json?.data ?? json?.result;
  if (d == null || typeof d !== 'object' || Array.isArray(d)) return null;
  if (Array.isArray(d.posts) && d.posts.length > 0 && d.posts[0] != null) {
    return d.posts[0];
  }
  if (Array.isArray(d.content) && d.content.length > 0 && typeof d.content[0] === 'object') {
    return d.content[0];
  }
  return null;
}

/** GET `/api/v1/posts/{postId}` — 단건. `data`에 게시글 필드가 직접 오는 형태 */
export async function fetchPostDetail(accessToken, postId) {
  const json = await requestApi(getPostDetailPath(postId), {
    method: 'GET',
    token: accessToken,
  });
  const d = json?.data ?? json?.result;
  if (d != null && typeof d === 'object' && !Array.isArray(d)) {
    const singleId = d.postId ?? d.id;
    const looksLikeListWrapper = Array.isArray(d.posts) || Array.isArray(d.content);
    if (singleId != null && singleId !== '' && !looksLikeListWrapper) {
      return d;
    }
  }
  const fromListShape = unwrapPostDetailPayload(json);
  if (fromListShape != null) return fromListShape;
  const payload = json?.data ?? json?.result;
  return payload != null && typeof payload === 'object' ? payload : json;
}

function extractCommentsRows(json) {
  const d = json?.data;
  if (Array.isArray(d)) return d;
  if (d != null && typeof d === 'object' && !Array.isArray(d)) {
    if (Array.isArray(d.comments)) return d.comments;
    if (Array.isArray(d.content)) return d.content;
    if (Array.isArray(d.items)) return d.items;
    if (Array.isArray(d.results)) return d.results;
    if (Array.isArray(d.posts)) return d.posts;
  }
  if (Array.isArray(json?.result)) return json.result;
  return [];
}

/**
 * GET `/api/v1/posts/{postId}/comments`
 * Query: page?, size?
 */
export async function fetchPostComments(
  accessToken,
  postId,
  { page = 0, size = 50 } = {},
) {
  const json = await requestApi(getPostCommentsPath(postId), {
    method: 'GET',
    query: { page, size },
    token: accessToken,
  });
  return extractCommentsRows(json);
}

/**
 * POST `/api/v1/posts/{postId}/comments` — body `{ content }` (Swagger)
 * Response 200: `{ isSuccess, errorCode, message, data: { commentId, nickname, content, createdAt } }`
 * @returns {{ message?: string; errorCode?: string; data: { commentId: number|string; nickname?: string; content: string; createdAt?: string } }}
 */
export async function createPostComment(accessToken, postId, content) {
  const trimmed = typeof content === 'string' ? content.trim() : '';
  if (!trimmed) {
    throw new Error('댓글을 입력해주세요.');
  }
  const json = await requestApi(getPostCommentsPath(postId), {
    method: 'POST',
    body: { content: trimmed },
    token: accessToken,
  });
  const data = json?.data;
  if (json?.isSuccess === false) {
    throw new Error(json?.message || '댓글 등록에 실패했습니다.');
  }
  if (data == null || typeof data !== 'object') {
    throw new Error(json?.message || '댓글 응답이 올바르지 않습니다.');
  }
  const commentId = data.commentId ?? data.id;
  const bodyText = data.content != null && String(data.content).trim() !== '' ? String(data.content).trim() : trimmed;
  if (commentId == null && bodyText === '') {
    throw new Error(json?.message || '댓글 응답이 올바르지 않습니다.');
  }
  return {
    message: json?.message,
    errorCode: json?.errorCode,
    data: {
      commentId: commentId ?? `temp-${Date.now()}`,
      nickname: data.nickname,
      content: bodyText,
      createdAt: data.createdAt,
    },
  };
}

/**
 * POST `/api/v1/posts` — 게시글 작성 (Swagger: 200 OK)
 * Request: `{ category, title, content }`
 * Response: `{ isSuccess, errorCode, message, data: { postId } }`
 * @param {{ category: string; title: string; content: string }} payload
 */
export async function createPost(accessToken, { category, title, content }) {
  const trimmedTitle = typeof title === 'string' ? title.trim() : '';
  const trimmedContent = typeof content === 'string' ? content.trim() : '';
  if (!trimmedTitle) {
    throw new Error('제목을 입력해주세요.');
  }
  if (!trimmedContent) {
    throw new Error('내용을 입력해주세요.');
  }
  const categoryStr = typeof category === 'string' ? category.trim() : String(category ?? '');
  if (!categoryStr) {
    throw new Error('카테고리를 선택해주세요.');
  }

  if (!String(authConfig.apiBaseUrl || '').trim()) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL 이 설정되어 있지 않습니다.');
  }

  const json = await requestApi(authConfig.endpoints.postsCreate, {
    method: 'POST',
    body: {
      category: categoryStr,
      title: trimmedTitle,
      content: trimmedContent,
    },
    token: accessToken,
  });
  if (json?.isSuccess === false) {
    throw new Error(json?.message || '등록에 실패했습니다.');
  }
  const raw = json?.data;
  const data = raw != null && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const postObj = data.post && typeof data.post === 'object' ? data.post : {};
  const merged = { ...data, ...postObj };
  const postId = merged.postId ?? merged.id ?? merged.post_id;
  if (postId == null || postId === '') {
    throw new Error(json?.message || '등록 응답에 postId가 없습니다. 서버 스펙을 확인해 주세요.');
  }
  return {
    postId,
    message: json?.message,
    errorCode: json?.errorCode,
  };
}

export async function loginWithEmail(email, password) {
  const json = await requestApi(authConfig.endpoints.loginEmail, {
    method: 'POST',
    body: { email, password },
  });
  const tokens = json?.data;
  if (!tokens?.accessToken) {
    throw new Error('로그인 응답이 올바르지 않습니다.');
  }
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken ?? null,
  };
}

/** 이메일 회원가입 → 201, data: null */
export async function signupWithEmail({ email, password, passwordConfirm, nickname }) {
  await requestApi(authConfig.endpoints.signupEmail, {
    method: 'POST',
    body: { email, password, passwordConfirm, nickname },
  });
}

export async function getMe(accessToken) {
  return requestApi(authConfig.endpoints.me, { token: accessToken });
}

/** GET 운행 리포트 상세 — path: /api/driving/{sessionId}/report */
export async function getDrivingReport(accessToken, sessionId) {
  const json = await requestApi(
    `${authConfig.endpoints.drivingReport}/${encodeURIComponent(String(sessionId))}/report`,
    { token: accessToken },
  );
  return json?.data ?? null;
}

/** GET 운전 세션 목록 — query: year, month (required); data: { year, month, sessions[{ sessionId, startedAt, durationMin, score }] } */
export async function getDrivingSessions(accessToken, { year, month }) {
  const json = await requestApi(authConfig.endpoints.drivingSessions, {
    method: 'GET',
    query: { year, month },
    token: accessToken,
  });
  const d = json?.data;
  return {
    year: d?.year ?? year,
    month: d?.month ?? month,
    sessions: Array.isArray(d?.sessions) ? d.sessions : [],
  };
}

/** GET 알림 설정 — data: { driveReportAlert, drowsinessAlert, communityCommentAlert, communityLikeAlert, marketingAlert } */
export async function getNotificationSettings(accessToken) {
  const json = await requestApi(authConfig.endpoints.notificationSettings, { token: accessToken });
  return json?.data ?? null;
}

/** PATCH 알림 설정 변경 — body: 변경할 필드만 */
export async function updateNotificationSettings(accessToken, body) {
  const json = await requestApi(authConfig.endpoints.notificationSettings, {
    method: 'PATCH',
    body,
    token: accessToken,
  });
  return json?.data ?? null;
}

/** GET 내가 쓴 글 목록 — data: { totalCount, posts: [{ postId, category, title, content, likeCount, commentCount, createdAt }] } */
export async function getMyPosts(accessToken) {
  const json = await requestApi(authConfig.endpoints.myPosts, { token: accessToken });
  const d = json?.data;
  return {
    totalCount: d?.totalCount ?? 0,
    posts: Array.isArray(d?.posts) ? d.posts : [],
  };
}

/** GET 내 프로필 — data: { userId, nickname, email, avgScore, totalDriveCount, totalDistanceKm, createdAt } */
export async function getMyProfile(accessToken) {
  const json = await requestApi(authConfig.endpoints.myProfile, { token: accessToken });
  return json?.data ?? null;
}

/** GET 통계 — Authorization: Bearer accessToken; year·month 생략 시 서버 기본(현재 연·월) */
export async function getUserStats(accessToken, { year, month } = {}) {
  try {
    const json = await requestApi(authConfig.endpoints.userStats, {
      method: 'GET',
      query: { year, month },
      token: accessToken,
    });
    return json?.data ?? null;
  } catch {
    return null;
  }
}

/** 로그인 유지: Authorization: Bearer {refreshToken} */
export async function reissueTokens(refreshToken) {
  const json = await requestApi(authConfig.endpoints.reissue, {
    method: 'POST',
    token: refreshToken,
  });
  const tokens = json?.data;
  if (!tokens?.accessToken) {
    throw new Error('토큰 재발급 응답이 올바르지 않습니다.');
  }
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken ?? null,
  };
}

/** 로그아웃: Authorization: Bearer {accessToken} */
export async function logout(accessToken) {
  return requestApi(authConfig.endpoints.logout, {
    method: 'POST',
    token: accessToken,
  });
}

/**
 * multipart 영상 분석 공통 처리
 * @returns {{ sessionId: number|string; lane_departure_count?: number; duration_sec?: number; lane_departure_timestamps?: number[] }}
 */
async function postVideoAnalyze(accessToken, endpointPath, file, defaultName) {
  const base = authConfig.apiBaseUrl?.replace(/\/$/, '');
  if (!base) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is not set.');
  }
  const url = `${base}${endpointPath}`;
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name || defaultName,
    type: file.mimeType || 'video/mp4',
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  const json = await res.json().catch(() => ({}));

  if (json?.isSuccess === false || json?.success === false) {
    throw new Error(json?.message || '영상 분석에 실패했습니다.');
  }
  if (!res.ok) {
    throw new Error(json?.message || '영상 분석 요청에 실패했습니다.');
  }

  const payload =
    json?.data != null && typeof json.data === 'object'
      ? json.data
      : json && typeof json === 'object' && json.sessionId != null
        ? json
        : null;

  if (!payload || payload.sessionId == null) {
    throw new Error(json?.message || '분석 응답이 올바르지 않습니다.');
  }

  return payload;
}

/** POST `/api/faceai/analyze` — 내부 카메라 (multipart `file`) */
export async function analyzeDriverVideo(accessToken, file) {
  return postVideoAnalyze(accessToken, authConfig.endpoints.faceAiAnalyze, file, 'driver.mp4');
}

/**
 * POST `/api/driveai/analyze` — 외부 카메라 (multipart `file`)
 * Response: `{ success, message, data: { sessionId, lane_departure_count, duration_sec, lane_departure_timestamps } }`
 */
export async function analyzeExternalVideo(accessToken, file) {
  return postVideoAnalyze(accessToken, authConfig.endpoints.driveAiAnalyze, file, 'road.mp4');
}

/**
 * 게시글 좋아요 토글 POST `/api/v1/posts/{postId}/likes` (Swagger)
 * Response: `{ isSuccess, errorCode, message, data: { liked, likeCount } }`
 * @returns {{ liked: boolean; likeCount: number; message?: string; errorCode?: string }}
 */
export async function togglePostLike(accessToken, postId) {
  const json = await requestApi(getPostLikeTogglePath(postId), {
    method: 'POST',
    token: accessToken,
  });
  const data = json?.data;
  if (json?.isSuccess === false || data == null || typeof data !== 'object') {
    throw new Error(json?.message || '좋아요 처리에 실패했습니다.');
  }

  const rawLiked = data.liked;
  const liked =
    rawLiked === true ||
    rawLiked === 1 ||
    rawLiked === '1' ||
    (typeof rawLiked === 'string' && rawLiked.toLowerCase() === 'true');
  const rawCount = data.likeCount ?? data.likes ?? data.like_count;
  const likeCount = Number(rawCount);
  if (Number.isNaN(likeCount) || rawCount === undefined || rawCount === null || rawCount === '') {
    throw new Error(json?.message || '좋아요 처리에 실패했습니다.');
  }

  return {
    liked: Boolean(liked),
    likeCount,
    message: json?.message,
    errorCode: json?.errorCode,
  };
}
