import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/constants/colors';

const TAGS = ['팁 공유', '점수 인증', '질문', '자유'];

export default function WritePostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [selectedTag, setSelectedTag] = useState(params.autoTag ?? '팁 공유');
  const [title, setTitle]     = useState(params.autoTitle   ?? '');
  const [content, setContent] = useState(params.autoContent ?? '');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 리포트 자동 첨부 안내 배너 */}
      {params.autoTitle ? (
        <View style={styles.autoBanner}>
          <Ionicons name="document-text-outline" size={14} color={colors.teal500} />
          <Text style={styles.autoBannerText}>운행 리포트 내용이 자동으로 첨부됐어요</Text>
        </View>
      ) : null}

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>글 작성</Text>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Text style={styles.submitBtnText}>등록</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
      >
        {/* 카테고리 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>카테고리</Text>
          <View style={styles.tagRow}>
            {TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.tagOption, selectedTag === tag && styles.tagOptionSelected]}
                onPress={() => setSelectedTag(tag)}
              >
                <Text style={[styles.tagOptionText, selectedTag === tag && styles.tagOptionTextSelected]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 제목 */}
        <TextInput
          style={styles.titleInput}
          placeholder="제목을 입력하세요"
          placeholderTextColor="rgba(255,255,255,0.2)"
          value={title}
          onChangeText={setTitle}
          keyboardType="default"
          {...(Platform.OS === 'android'
            ? { autoComplete: 'off', importantForAutofill: 'no' }
            : {})}
        />

        <View style={styles.divider} />

        {/* 본문 */}
        <TextInput
          style={styles.contentInput}
          placeholder="내용을 입력하세요. 운전 경험, 팁, 질문을 자유롭게 공유해보세요."
          placeholderTextColor="rgba(255,255,255,0.2)"
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          blurOnSubmit={false}
          {...(Platform.OS === 'android'
            ? { autoComplete: 'off', importantForAutofill: 'no' }
            : {})}
        />

        {/* 툴바 */}
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.toolBtn}>
            <Text style={styles.toolBtnText}>B</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBtn}>
            <Text style={[styles.toolBtnText, { fontStyle: 'italic' }]}>I</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBtn}>
            <Ionicons name="image-outline" size={14} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBtn}>
            <Ionicons name="link-outline" size={14} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
          <Text style={styles.charCount}>{content.length} / 500</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDark },
  autoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 12,
    backgroundColor: 'rgba(29,158,117,0.1)',
    borderWidth: 1, borderColor: 'rgba(29,158,117,0.25)',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
  },
  autoBannerText: { fontSize: 13, color: colors.teal500 },
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
  submitBtn: {
    backgroundColor: colors.blue400, borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 8,
  },
  submitBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  body: { padding: 20, gap: 16 },

  section: {},
  sectionLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.35)',
    fontWeight: '500', letterSpacing: 0.5, marginBottom: 10,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagOption: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tagOptionSelected: {
    backgroundColor: 'rgba(55,138,221,0.15)',
    borderColor: 'rgba(55,138,221,0.4)',
  },
  tagOptionText: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  tagOptionTextSelected: { color: colors.blue200 },

  titleInput: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12, paddingHorizontal: 0,
    fontSize: 18, fontWeight: '700', color: '#fff',
  },
  divider: { height: 0.5, backgroundColor: 'rgba(255,255,255,0.06)' },
  contentInput: {
    backgroundColor: 'transparent',
    fontSize: 14, color: 'rgba(255,255,255,0.7)',
    minHeight: 200, lineHeight: 26,
  },
  toolbar: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  toolBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  toolBtnText: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  charCount: { marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.2)' },
});
