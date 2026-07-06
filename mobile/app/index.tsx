import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useMockAuth } from '@/context/MockAuthContext';
import { colors } from '@/theme/tokens';

export default function Index() {
  const { sessionReady, hasSession } = useMockAuth();

  if (!sessionReady) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!hasSession) {
    return <Redirect href="/welcome" />;
  }

  return <Redirect href="/(tabs)/home" />;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
