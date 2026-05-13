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
    /** GET 통계 — Bearer accessToken, query year?, month? (프로필 me와 별개) */
    userStats: '/api/users/me/stats',
    /** POST multipart — Bearer accessToken, field name `file` */
    faceAiAnalyze: '/api/faceai/analyze',
  },
};

export const SESSION_STORAGE_KEY = 'driview.session.v1';
