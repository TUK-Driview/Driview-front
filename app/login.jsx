import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { colors } from '@/src/constants/colors';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <LinearGradient colors={['#0d1b3e', '#0a1628']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
              keyboardType="email-address"
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
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.85}
          >
            <Text style={styles.loginBtnText}>로그인</Text>
          </TouchableOpacity>

          {/* 구분선 */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* 소셜 로그인 */}
          <View style={styles.socialBtns}>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
              <Text style={styles.socialBtnText}>🌐 Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
              <Text style={styles.socialBtnText}>💛 카카오</Text>
            </TouchableOpacity>
          </View>

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
});
