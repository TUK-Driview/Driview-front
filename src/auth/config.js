const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');

export const authConfig = {
  apiBaseUrl: API_BASE_URL,
  endpoints: {
    me: '/api/v1/auth/me',
    loginEmail: '/api/auth/login',
    signupEmail: '/api/auth/signup',
    /** POST, Authorization: Bearer {refreshToken} */
    reissue: '/api/auth/token/reissue',
    /** POST, Authorization: Bearer {accessToken} */
    logout: '/api/auth/logout',
    /** GET 내 프로필 — Bearer accessToken; data: { userId, nickname, email, avgScore, totalDriveCount, totalDistanceKm, createdAt } */
    myProfile: '/api/users/me',
    /** GET 통계 — Bearer accessToken, query year?, month? (프로필 me와 별개) */
    userStats: '/api/users/me/stats',
    /** POST multipart — 내부 카메라 영상, field `file` */
    faceAiAnalyze: '/api/faceai/analyze',
    /** POST multipart — 외부 카메라 영상, field `file` */
    driveAiAnalyze: '/api/driveai/analyze',
    /** GET 알림 설정 조회 — Bearer; data: { driveReportAlert, drowsinessAlert, communityCommentAlert, communityLikeAlert, marketingAlert } */
    notificationSettings: '/api/users/me/notification-settings',
    /** GET 내가 쓴 글 목록 — Bearer; 응답 data: { totalCount, posts[] } */
    myPosts: '/api/users/posts',
    /** GET 운전 세션 목록 — Bearer; query year(required), month(required); data: { year, month, sessions[{ sessionId, startedAt, durationMin, score }] } */
    drivingSessions: '/api/driving/session',
    /** GET 운행 리포트 상세 — Bearer; path /{sessionId}/report; data: { sessionId, score, grade, laneScore, focusScore, speedScore, laneViolationCount, drowsinessCount, speedViolationCount, hardBrakingCount, yawn_count, duration_sec, drowsinessEvents[] } */
    drivingReport: '/api/driving',
    /** GET 게시글 목록 — Bearer; 응답 data: { page, size, totalElements, posts[] } */
    postsList: '/api/v1/posts',
    /** POST 게시글 작성 — Bearer; body { category, title, content }; 200, data.postId */
    postsCreate: '/api/v1/posts',
  },
};

/** POST 좋아요 토글 — Bearer; 성공 시 `data`: { liked, likeCount } (200 등) */
export function getPostLikeTogglePath(postId) {
  return `/api/v1/posts/${encodeURIComponent(String(postId))}/likes`;
}

/** GET 게시글 단건 — `/likes`, `/comments` 와 동일하게 postId 뒤 trailing slash 없음 */
export function getPostDetailPath(postId) {
  return `/api/v1/posts/${encodeURIComponent(String(postId))}`;
}

/** GET/POST 게시글 댓글 — Bearer; POST body `{ content }`, 200 data `{ commentId, nickname, content, createdAt }` */
export function getPostCommentsPath(postId) {
  return `/api/v1/posts/${encodeURIComponent(String(postId))}/comments`;
}

/** POST 분석 트리거 — S3 key 전달 */
export function getDrivingAnalyzePath(sessionId) {
  return `${authConfig.endpoints.drivingReport}/${encodeURIComponent(String(sessionId))}/analyze`;
}

/** S3 object key (예: driving/{sessionId}/fr) */
export function getDrivingVideoObjectKey(sessionId, slot) {
  return `driving/${String(sessionId)}/${slot}`;
}

/** multipart 영상 업로드 — slot: `fr`(외부) | `d`(내부) */
export function getDrivingVideoUploadPath(sessionId, slot) {
  return `${authConfig.endpoints.drivingReport}/${encodeURIComponent(String(sessionId))}/${slot}`;
}

export const SESSION_STORAGE_KEY = 'driview.session.v1';
