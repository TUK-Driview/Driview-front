import { Stack } from 'expo-router';
import { colors } from '@/src/constants/colors';

export default function CommunityStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.bgDark },
      }}
    />
  );
}
