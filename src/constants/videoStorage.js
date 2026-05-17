import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'driview_session_videos';

async function getMap() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveSessionVideo(sessionId, uri) {
  try {
    const map = await getMap();
    map[String(sessionId)] = uri;
    await AsyncStorage.setItem(KEY, JSON.stringify(map));
  } catch {}
}

export async function getSessionVideo(sessionId) {
  const map = await getMap();
  return map[String(sessionId)] ?? null;
}
