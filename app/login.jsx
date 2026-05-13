import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
  Alert,
} from 'react-native';
import { colors } from '@/src/constants/colors';
import { useAuth } from '@/src/auth/context';

export default function LoginScreen() {
  const router = useRouter();
  const { signInEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const onEmailLogin = async () => {
    if (!email || !password) {
      setErrorMessage('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    try {
      setErrorMessage('');
      setIsLoading(true);
      await signInEmail({ email, password });
      router.replace('/(tabs)');
    } catch (e) {
      setErrorMessage(e.message || '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const onGoogleLogin = () => {
    Alert.alert('안내', 'Google 로그인은 준비 중입니다.');
  };

  const onKakaoLogin = () => {
    Alert.alert('안내', '카카오 로그인은 준비 중입니다.');
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
          {/* 로고 */}
          <View style={styles.logo}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoEmoji}>🚗</Text>
            </View>
            <Text style={styles.logoText}>
              Dri<Text style={styles.logoAccent}>view</Text>
            </Text>
          </View>

          <Text style={styles.heading}>다시 돌아오셨군요! 👋</Text>
          <Text style={styles.sub}>계속하려면 로그인하세요.</Text>

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
            />
          </View>

          {/* 비밀번호 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* 로그인 버튼 */}
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={onEmailLogin}
            activeOpacity={0.85}
            disabled={isLoading}
          >
            <Text style={styles.loginBtnText}>{isLoading ? '로그인 중...' : '로그인'}</Text>
          </TouchableOpacity>

          {/* 구분선 */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* 소셜 로그인 */}
          <View style={styles.socialBtns}>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8} disabled={isLoading} onPress={onGoogleLogin}>
              <Text style={styles.socialBtnText}>🌐 Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8} disabled={isLoading} onPress={onKakaoLogin}>
              <Text style={styles.socialBtnText}>💛 카카오</Text>
            </TouchableOpacity>
          </View>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          {/* 회원가입 링크 */}
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>계정이 없으신가요? </Text>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={styles.signupLink}>회원가입</Text>
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
    paddingTop: 60,
    flexGrow: 1,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 36,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(55,138,221,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(55,138,221,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: { fontSize: 20 },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  logoAccent: { color: colors.blue400 },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  sub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  formGroup: { marginBottom: 16 },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
    letterSpacing: 0.3,
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
  loginBtn: {
    backgroundColor: colors.blue400,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
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
  socialBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialBtnText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  signupLink: {
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
