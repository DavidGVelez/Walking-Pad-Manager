import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import {
  DAILY_GOAL_STEP_MINUTES,
  DEFAULT_DAILY_GOAL_MINUTES,
  getDailyGoalMinutes,
  MAX_DAILY_GOAL_MINUTES,
  MIN_DAILY_GOAL_MINUTES,
  saveDailyGoalMinutes,
} from '../storage/dailyGoal';
import { theme } from '../theme';

export function SettingsScreen() {
  const { session, signOut } = useAuth();
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(DEFAULT_DAILY_GOAL_MINUTES);
  const userId = session?.user.id;

  useFocusEffect(
    useCallback(() => {
      if (!userId) {
        return;
      }

      getDailyGoalMinutes(userId)
        .then(setDailyGoalMinutes)
        .catch(() => {});
    }, [userId]),
  );

  const updateGoal = (delta: number) => {
    const nextValue = Math.min(
      MAX_DAILY_GOAL_MINUTES,
      Math.max(MIN_DAILY_GOAL_MINUTES, dailyGoalMinutes + delta),
    );
    setDailyGoalMinutes(nextValue);

    if (userId) {
      saveDailyGoalMinutes(userId, nextValue).catch(() => {});
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Ajustes</Text>
          <Text style={styles.title}>Cuenta</Text>
        </View>

        <View style={styles.panel}>
          <View>
            <Text style={styles.panelLabel}>Cuenta</Text>
            <Text style={styles.accountEmail}>{session?.user.email}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={signOut} style={styles.secondaryButton}>
            <MaterialCommunityIcons name="logout" size={20} color={theme.colors.text} />
            <Text style={styles.secondaryButtonText}>Cerrar sesion</Text>
          </Pressable>
        </View>

        <View style={styles.panel}>
          <View>
            <Text style={styles.panelLabel}>Objetivo diario</Text>
            <Text style={styles.accountEmail}>{dailyGoalMinutes} min</Text>
          </View>
          <View style={styles.stepperControls}>
            <Pressable
              accessibilityLabel="Reducir objetivo diario"
              accessibilityRole="button"
              disabled={dailyGoalMinutes <= MIN_DAILY_GOAL_MINUTES}
              onPress={() => updateGoal(-DAILY_GOAL_STEP_MINUTES)}
              style={styles.stepperButton}
            >
              <MaterialCommunityIcons color={theme.colors.text} name="minus" size={20} />
            </Pressable>
            <Pressable
              accessibilityLabel="Aumentar objetivo diario"
              accessibilityRole="button"
              disabled={dailyGoalMinutes >= MAX_DAILY_GOAL_MINUTES}
              onPress={() => updateGoal(DAILY_GOAL_STEP_MINUTES)}
              style={styles.stepperButton}
            >
              <MaterialCommunityIcons color={theme.colors.text} name="plus" size={20} />
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  header: {
    gap: theme.spacing.xs,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text,
    fontSize: 36,
    fontWeight: '800',
  },
  panel: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },
  panelLabel: {
    color: theme.colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  accountEmail: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.sm,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  stepperControls: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  stepperButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
});
