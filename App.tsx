import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme, RouteProp } from '@react-navigation/native';
import { BottomTabNavigationOptions, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { HomeScreen } from './src/screens/HomeScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { DeviceScreen } from './src/screens/DeviceScreen';
import { WalkingPadBleProvider } from './src/context/WalkingPadBleContext';
import { theme } from './src/theme';

const Tab = createBottomTabNavigator();

const tabIcons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  Inicio: 'run',
  Historial: 'history',
  Dispositivo: 'bluetooth',
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

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <WalkingPadBleProvider>
        <NavigationContainer theme={navigationTheme}>
          <Tab.Navigator screenOptions={getScreenOptions}>
            <Tab.Screen name="Inicio" component={HomeScreen} />
            <Tab.Screen name="Historial" component={HistoryScreen} />
            <Tab.Screen name="Dispositivo" component={DeviceScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </WalkingPadBleProvider>
    </SafeAreaProvider>
  );
}
