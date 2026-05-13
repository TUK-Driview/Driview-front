import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/constants/colors';
import { useAuth } from '@/src/auth/context';

export default function SignupScreen() {
  const router = useRouter();
  const { signUpEmail } = useAuth();
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const onEmailSignup = async () => {
    if (!nickname || !email || !password || !passwordConfirm) {
      setErrorMessage('모든 항목을 입력해주세요.');
      return;
    }
    if (password !== passwordConfirm) {
      setErrorMessage('비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    try {
      setErrorMessage('');
      setIsLoading(true);
      await signUpEmail({ email, password, passwordConfirm, nickname });
      router.replace('/login');
    } catch (e) {
      setErrorMessage(e.message || '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const onGoogleSignup = () => {
    Alert.alert('안내', 'Google 회원가입은 준비 중입니다.');
  };

  const onKakaoSignup = () => {
    Alert.alert('안내', '카카오 회원가입은 준비 중입니다.');
  };

  return (
    <LinearGradient colors={['#0d1b3e', '#0a1628']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>회원가입</Text>
            <View style={{ width: 36 }} />
          </View>

          <Text style={styles.heading}>Driview에 오신 걸{'\n'}환영합니다 🎉</Text>
          <Text style={styles.sub}>계정을 만들어 운전 분석을 시작하세요.</Text>

          {/* 소셜 가입 */}
          <View style={styles.socialBtns}>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8} disabled={isLoading} onPress={onGoogleSignup}>
              <Text style={styles.socialBtnText}>🌐 Google로 가입</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8} disabled={isLoading} onPress={onKakaoSignup}>
              <Text style={styles.socialBtnText}>💛 카카오로 가입</Text>
            </TouchableOpacity>
          </View>

          {/* 구분선 */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>또는 이메일로 가입</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* 닉네임 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>닉네임</Text>
            <TextInput
              style={styles.input}
              placeholder="드라이버"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={nickname}
              onChangeText={setNickname}
              keyboardType="default"
              autoCapitalize="none"
              {...(Platform.OS === 'android'
                ? { autoComplete: 'off', importantForAutofill: 'no' }
                : {})}
            />
          </View>

          {/* 이메일 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              style={styles.input}
              placeholder="name@example.com"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={email}
              onChangeText={setEmail}
              keyboardType={Platform.OS === 'android' ? 'default' : 'email-address'}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              autoComplete="email"
            />
          </View>

          {/* 비밀번호 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              style={styles.input}
              placeholder="8자 이상"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCorrect={false}
              spellCheck={false}
              textContentType="password"
              autoComplete="password-new"
            />
          </View>

          {/* 비밀번호 확인 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>비밀번호 확인</Text>
            <TextInput
              style={styles.input}
              placeholder="비밀번호 재입력"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              secureTextEntry
              autoCorrect={false}
              spellCheck={false}
              textContentType="password"
              autoComplete="password"
            />
          </View>

          {/* 가입 버튼 */}
          <TouchableOpacity
            style={styles.signupBtn}
            onPress={onEmailSignup}
            activeOpacity={0.85}
            disabled={isLoading}
          >
            <Text style={styles.signupBtnText}>{isLoading ? '가입 중...' : '가입하기'}</Text>
          </TouchableOpacity>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          {/* 로그인 링크 */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>이미 계정이 있으신가요? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLink}>로그인</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 28,
    paddingTop: 56,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    lineHeight: 32,
  },
  sub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 28,
  },
  socialBtns: {
    gap: 10,
    marginBottom: 20,
  },
  socialBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  socialBtnText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  formGroup: { marginBottom: 14 },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#fff',
  },
  signupBtn: {
    backgroundColor: colors.blue400,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  signupBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  loginLink: {
    fontSize: 13,
    color: colors.blue400,
    fontWeight: '500',
  },
  errorText: {
    marginTop: 14,
    fontSize: 12,
    color: colors.red400,
    textAlign: 'center',
  },
});
