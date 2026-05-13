import { authConfig } from '@/src/auth/config';

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
      'Content-Type': 'application/json',
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

/** 이메일 로그인 → data에 accessToken, refreshToken */
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
