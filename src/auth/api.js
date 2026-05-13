import { authConfig, getPostDetailPath, getPostLikeTogglePath } from '@/src/auth/config';

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
  /** 구버전·로컬 목업: data가 배열이거나 posts 대신 다른 키만 있는 경우 */
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

/** GET `/api/v1/posts/{postId}` — 단건(목록에 본문 없을 때 보강) */
export async function fetchPostDetail(accessToken, postId) {
  const json = await requestApi(getPostDetailPath(postId), {
    method: 'GET',
    token: accessToken,
  });
  const fromListShape = unwrapPostDetailPayload(json);
  if (fromListShape != null) return fromListShape;
  const payload = json?.data ?? json?.result;
  return payload != null && typeof payload === 'object' ? payload : json;
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
  const json = await requestApi(authConfig.endpoints.postsCreate, {
    method: 'POST',
    body: {
      category: categoryStr,
      title: trimmedTitle,
      content: trimmedContent,
    },
    token: accessToken,
  });
  const data = json?.data;
  const postId = data?.postId ?? data?.id;
  if (json?.isSuccess === false || postId == null) {
    throw new Error(json?.message || '등록에 실패했습니다.');
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
 * 운전자 영상 업로드 · multipart/form-data (필드명 file)
 * @param {{ uri: string; name: string; mimeType?: string }} file
 */
export async function analyzeDriverVideo(accessToken, file) {
  const base = authConfig.apiBaseUrl?.replace(/\/$/, '');
  if (!base) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is not set.');
  }
  const url = `${base}${authConfig.endpoints.faceAiAnalyze}`;
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name || 'driver.mp4',
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

  if (json && json.isSuccess === false) {
    throw new Error(json.message || '영상 분석에 실패했습니다.');
  }
  if (!res.ok) {
    throw new Error(json?.message || '영상 분석 요청에 실패했습니다.');
  }

  const payload =
    json && typeof json.isSuccess === 'boolean' && json.data !== undefined
      ? json.data
      : json;

  if (!payload || payload.sessionId == null) {
    throw new Error('분석 응답이 올바르지 않습니다.');
  }

  return payload;
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
