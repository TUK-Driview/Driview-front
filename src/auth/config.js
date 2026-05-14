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
    /** POST multipart — Bearer accessToken, field name `file` */
    faceAiAnalyze: '/api/faceai/analyze',
    /** GET 알림 설정 조회 — Bearer; data: { driveReportAlert, drowsinessAlert, communityCommentAlert, communityLikeAlert, marketingAlert } */
    notificationSettings: '/api/users/me/notification-settings',
    /** GET 내가 쓴 글 목록 — Bearer; 응답 data: { totalCount, posts[] } */
    myPosts: '/api/users/posts',
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

/** GET 게시글 단건(본문 보강용) */
export function getPostDetailPath(postId) {
  return `/api/v1/posts/${encodeURIComponent(String(postId))}`;
}

export const SESSION_STORAGE_KEY = 'driview.session.v1';
