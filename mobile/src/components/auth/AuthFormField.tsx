import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '@/theme/tokens';

type IconName = keyof typeof Ionicons.glyphMap;

type Props = TextInputProps & {
  icon?: IconName;
  error?: boolean;
};

export function AuthFormField({ icon, error, secureTextEntry, style, ...rest }: Props) {
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));
  const isPassword = Boolean(secureTextEntry);

  return (
    <View style={[styles.wrap, error && styles.wrapError]}>
      {icon ? (
        <Ionicons
          name={icon}
          size={18}
          color={colors.mutedForeground}
          style={styles.leadingIcon}
        />
      ) : null}
      <TextInput
        {...rest}
        secureTextEntry={isPassword ? hidden : false}
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, icon ? styles.inputWithIcon : null, style]}
      />
      {isPassword ? (
        <Pressable
          onPress={() => setHidden((v) => !v)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
        >
          <Ionicons
            name={hidden ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color={colors.mutedForeground}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

export function AuthErrorBox({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
    minHeight: 52,
  },
  wrapError: {
    borderColor: colors.destructive,
  },
  leadingIcon: {
    marginLeft: 2,
  },
  input: {
    flex: 1,
    color: colors.foreground,
    fontSize: 15,
    paddingVertical: 12,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  errorBox: {
    borderWidth: 1,
    borderColor: colors.destructive + '55',
    backgroundColor: colors.destructive + '12',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 13,
    lineHeight: 18,
  },
});
