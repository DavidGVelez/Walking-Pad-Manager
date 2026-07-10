import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

export function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await signIn(email.trim(), password);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo iniciar sesion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Walking Pad</Text>
          <Text style={styles.title}>Manager</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Iniciar sesion</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="tu@email.com"
              placeholderTextColor={theme.colors.textMuted}
              style={styles.input}
              value={email}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Contrasena</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="password"
              onChangeText={setPassword}
              placeholder="********"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry
              style={styles.input}
              value={password}
            />
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={!canSubmit}
            onPress={handleSubmit}
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          >
            {isSubmitting ? (
              <Text style={styles.submitButtonText}>Entrando...</Text>
            ) : (
              <>
                <MaterialCommunityIcons color={theme.colors.background} name="login" size={20} />
                <Text style={styles.submitButtonText}>Entrar</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
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
  form: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  formTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  field: {
    gap: theme.spacing.xs,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.sm,
    color: theme.colors.text,
    fontSize: 16,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    minHeight: 48,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '800',
  },
});
