import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ActiveSessionScreen } from '../screens/ActiveSessionScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { MetricDetailScreen, MetricKey } from '../screens/MetricDetailScreen';
import { theme } from '../theme';

export type HomeStackParamList = {
  ActiveSession: undefined;
  HomeMain: undefined;
  MetricDetail: { metric: MetricKey };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

const detailHeaderOptions = {
  headerBackButtonDisplayMode: 'minimal' as const,
  headerShadowVisible: false,
  headerStyle: { backgroundColor: theme.colors.background },
  headerTintColor: theme.colors.text,
};

export function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen component={HomeScreen} name="HomeMain" options={{ headerShown: false }} />
      <Stack.Screen component={MetricDetailScreen} name="MetricDetail" options={detailHeaderOptions} />
      <Stack.Screen
        component={ActiveSessionScreen}
        name="ActiveSession"
        options={{ ...detailHeaderOptions, title: 'Actividad en curso' }}
      />
    </Stack.Navigator>
  );
}
