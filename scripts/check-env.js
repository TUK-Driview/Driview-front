/**
 * .env 가 없을 때 터미널에 안내 (pull 직후 실수 방지).
 * 앱 실행은 막지 않음 — UI만 볼 때도 있을 수 있음.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env');

if (!fs.existsSync(envPath)) {
  console.warn('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.warn('[Driview-front] .env 파일이 없습니다.');
  console.warn('로그인·회원가입·통계 API에 EXPO_PUBLIC_API_BASE_URL 이 필요합니다.');
  console.warn('');
  console.warn('  cp .env.example .env');
  console.warn('  # .env 를 열어 Swagger UI 의 Servers 와 같은 베이스 URL 로 수정');
  console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}
