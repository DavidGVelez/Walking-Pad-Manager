import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '../screens/HomeScreen';
import { MetricDetailScreen, MetricKey } from '../screens/MetricDetailScreen';
import { theme } from '../theme';

export type HomeStackParamList = {
  HomeMain: undefined;
  MetricDetail: { metric: MetricKey };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen component={HomeScreen} name="HomeMain" options={{ headerShown: false }} />
      <Stack.Screen
        component={MetricDetailScreen}
        name="MetricDetail"
        options={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
        }}
      />
    </Stack.Navigator>
  );
}
