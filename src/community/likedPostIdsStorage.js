import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'driview.community.likedPostIds.v1';

/** AsyncStorage 분리용 — 로그인 사용자 식별자 */
export function likesUserKey(session) {
  const u = session?.user;
  if (u && typeof u === 'object') {
    const k = u.email ?? u.id ?? u.memberId ?? u.userId ?? u.nickname;
    if (k != null && String(k).trim() !== '') return String(k).trim();
  }
  return 'default';
}

function storageKey(userKey) {
  const safe = userKey != null && String(userKey).trim() !== '' ? String(userKey).trim() : 'default';
  return `${PREFIX}:${safe}`;
}

export async function loadLikedPostIds(userKey) {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userKey));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.map((id) => String(id)));
  } catch {
    return new Set();
  }
}

export async function rememberLikedPost(userKey, postId) {
  const id = String(postId);
  const set = await loadLikedPostIds(userKey);
  if (set.has(id)) return;
  set.add(id);
  await AsyncStorage.setItem(storageKey(userKey), JSON.stringify([...set]));
}
