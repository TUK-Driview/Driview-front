import { router } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function Login() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>로그인 화면</Text>

      <Button
        title="로그인"
        onPress={() => router.push('/home')}
      />
    </View>
  );
}