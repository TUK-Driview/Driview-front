import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/constants/colors';

export default function EditProfileScreen() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSave = () => {
    if (newPassword && newPassword !== newPasswordConfirm) {
      Alert.alert('오류', '새 비밀번호가 일치하지 않습니다.');
      return;
    }
    Alert.alert('안내', 'API 연동 후 저장 기능이 활성화됩니다.');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgDark }} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* 헤더 */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>프로필 편집</Text>
              <View style={{ width: 36 }} />
            </View>

            {/* 아바타 */}
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={{ fontSize: 36 }}>🧑</Text>
              </View>
            </View>

            {/* 닉네임 변경 */}
            <Text style={styles.sectionTitle}>닉네임 변경</Text>
            <View style={styles.formGroup}>
              <Text style={styles.label}>새 닉네임</Text>
              <TextInput
                style={styles.input}
                placeholder="변경할 닉네임 입력"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={nickname}
                onChangeText={setNickname}
              />
            </View>

            <View style={styles.divider} />

            {/* 비밀번호 변경 */}
            <Text style={styles.sectionTitle}>비밀번호 변경</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>현재 비밀번호</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.inputInner}
                  placeholder="현재 비밀번호"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrent}
                  autoCorrect={false}
                  spellCheck={false}
                />
                <TouchableOpacity onPress={() => setShowCurrent((v) => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showCurrent ? 'eye' : 'eye-off'} size={18} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>새 비밀번호</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.inputInner}
                  placeholder="8자 이상"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNew}
                  autoCorrect={false}
                  spellCheck={false}
                />
                <TouchableOpacity onPress={() => setShowNew((v) => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showNew ? 'eye' : 'eye-off'} size={18} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>새 비밀번호 확인</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.inputInner}
                  placeholder="새 비밀번호 재입력"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={newPasswordConfirm}
                  onChangeText={setNewPasswordConfirm}
                  secureTextEntry={!showConfirm}
                  autoCorrect={false}
                  spellCheck={false}
                />
                <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showConfirm ? 'eye' : 'eye-off'} size={18} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>저장하기</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingTop: 16, flexGrow: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 28,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  avatarWrap: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(55,138,221,0.15)',
    borderWidth: 3, borderColor: 'rgba(55,138,221,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 11, color: 'rgba(255,255,255,0.35)',
    fontWeight: '600', letterSpacing: 1,
    textTransform: 'uppercase', marginBottom: 14,
  },
  formGroup: { marginBottom: 14 },
  label: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: '500' },
  input: {
    backgroundColor: colors.bgInput,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 14, color: '#fff',
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  inputInner: {
    flex: 1, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 14, color: '#fff',
  },
  eyeBtn: { paddingHorizontal: 14 },
  divider: {
    height: 1, backgroundColor: 'rgba(255,255,255,0.07)',
    marginVertical: 24,
  },
  saveBtn: {
    backgroundColor: colors.blue400,
    borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 12,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
