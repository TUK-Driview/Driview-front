import { useRouter } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/constants/colors';

const sections = [
  {
    title: '1. 수집하는 개인정보 항목',
    body: `Driview는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.

• 필수 항목: 이메일 주소, 비밀번호, 닉네임
• 자동 수집 항목: 서비스 이용 기록, 접속 일시, 기기 정보(OS, 앱 버전), 운전 분석 데이터(영상 파일, GPS 위치, 주행 통계)`,
  },
  {
    title: '2. 개인정보 수집 및 이용 목적',
    body: `수집한 개인정보는 다음 목적으로만 이용됩니다.

• 회원 가입·관리 및 본인 확인
• 운전 습관 분석 서비스 제공
• 서비스 개선 및 신규 기능 개발
• 고객 문의 응대 및 공지사항 전달`,
  },
  {
    title: '3. 개인정보 보유 및 이용 기간',
    body: `회원 탈퇴 시 즉시 파기합니다. 단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.

• 소비자 불만·분쟁 기록: 3년 (전자상거래법)
• 서비스 이용 기록: 3개월 (통신비밀보호법)`,
  },
  {
    title: '4. 개인정보의 제3자 제공',
    body: `Driview는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만 이용자가 사전에 동의한 경우 또는 법령에 의거한 경우에는 예외로 합니다.`,
  },
  {
    title: '5. 개인정보 처리 위탁',
    body: `Driview는 원활한 서비스 운영을 위해 아래와 같이 업무를 위탁할 수 있습니다.

• 수탁자: AWS (Amazon Web Services) — 서버 운영 및 데이터 저장
• 위탁 업무 종료 시 개인정보는 즉시 파기됩니다.`,
  },
  {
    title: '6. 이용자의 권리',
    body: `이용자는 언제든지 다음 권리를 행사할 수 있습니다.

• 개인정보 열람·수정·삭제 요청
• 개인정보 처리 정지 요청
• 회원 탈퇴를 통한 동의 철회

앱 내 프로필 편집 또는 고객센터를 통해 요청하실 수 있습니다.`,
  },
  {
    title: '7. 개인정보 보호책임자',
    body: `개인정보 관련 문의사항은 아래로 연락해 주세요.

• 이메일: gustn5522@gmail.com
• 처리 기간: 영업일 기준 3일 이내`,
  },
  {
    title: '8. 개인정보처리방침 변경',
    body: `본 방침은 법령·정책 변경에 따라 사전 공지 후 변경될 수 있습니다. 변경 시 앱 공지사항을 통해 안내합니다.

시행일: 2026년 2월 7일`,
  },
];

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>개인정보 처리방침</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.intro}>
          Driview(이하 "회사")는 이용자의 개인정보를 중요하게 여기며,「개인정보 보호법」등 관련 법령을 준수합니다.
          본 방침은 회사가 운영하는 Driview 애플리케이션에 적용됩니다.
        </Text>

        {sections.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDark },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  pageTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  content: { paddingHorizontal: 20, paddingTop: 4 },
  intro: {
    fontSize: 13, color: 'rgba(255,255,255,0.45)',
    lineHeight: 21, marginBottom: 24,
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 14, fontWeight: '700', color: '#fff',
    marginBottom: 10,
  },
  sectionBody: {
    fontSize: 13, color: 'rgba(255,255,255,0.55)',
    lineHeight: 22,
  },
});
