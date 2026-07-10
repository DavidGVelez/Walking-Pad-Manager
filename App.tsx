import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme, RouteProp } from '@react-navigation/native';
import { BottomTabNavigationOptions, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { HomeStack } from './src/navigation/HomeStack';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { WalkingPadBleProvider } from './src/context/WalkingPadBleContext';
import { theme } from './src/theme';

const Tab = createBottomTabNavigator();

const tabIcons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  Inicio: 'run',
  Historial: 'history',
  Ajustes: 'cog',
};

function TabBarIcon({ routeName, color, size }: { routeName: string; color: string; size: number }) {
  return <MaterialCommunityIcons name={tabIcons[routeName] ?? 'circle'} size={size} color={color} />;
}

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.colors.background,
    card: theme.colors.surface,
    border: theme.colors.border,
    primary: theme.colors.primary,
    text: theme.colors.text,
  },
};

function getScreenOptions({ route }: { route: RouteProp<Record<string, object | undefined>, string> }): BottomTabNavigationOptions {
  return {
    headerShown: false,
    tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: theme.colors.textMuted,
    tabBarStyle: {
      backgroundColor: theme.colors.surface,
      borderTopColor: theme.colors.border,
    },
    tabBarIcon: ({ color, size }) => <TabBarIcon routeName={route.name} color={color} size={size} />,
  };
}

function AuthenticatedApp() {
  const { session } = useAuth();

  return (
    <WalkingPadBleProvider userId={session?.user.id ?? null}>
      <Tab.Navigator screenOptions={getScreenOptions}>
        <Tab.Screen name="Inicio" component={HomeStack} />
        <Tab.Screen name="Historial" component={HistoryScreen} />
        <Tab.Screen name="Ajustes" component={SettingsScreen} />
      </Tab.Navigator>
    </WalkingPadBleProvider>
  );
}

function RootNavigator() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return session ? <AuthenticatedApp /> : <LoginScreen />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <NavigationContainer theme={navigationTheme}>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    flex: 1,
    justifyContent: 'center',
  },
});
