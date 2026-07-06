import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/ui/ThemedText';
import { colors, radius, spacing } from '@/theme/tokens';
import type { BuyerDetails } from '@/types/buyer-details';

type Props = {
  value: BuyerDetails;
  onChange: (next: BuyerDetails) => void;
  disabled?: boolean;
};

const fieldStyle = {
  height: 44,
  paddingHorizontal: spacing.lg,
  borderRadius: radius.lg,
  backgroundColor: colors.secondary,
  color: colors.foreground,
  fontSize: 14,
};

export function BuyerDetailsForm({ value, onChange, disabled }: Props) {
  const set = (patch: Partial<BuyerDetails>) => onChange({ ...value, ...patch });

  return (
    <View style={styles.wrap}>
      <Field label="Full name *">
        <TextInput
          style={fieldStyle}
          value={value.fullName}
          onChangeText={(fullName) => set({ fullName })}
          placeholder="Jane Doe"
          placeholderTextColor={colors.mutedForeground}
          editable={!disabled}
        />
      </Field>
      <Field label="Phone *">
        <TextInput
          style={fieldStyle}
          value={value.phone}
          onChangeText={(phone) => set({ phone })}
          placeholder="+1 555 0100"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="phone-pad"
          editable={!disabled}
        />
      </Field>
      <Field label="Address line 1 *">
        <TextInput
          style={fieldStyle}
          value={value.line1}
          onChangeText={(line1) => set({ line1 })}
          placeholder="123 Main St"
          placeholderTextColor={colors.mutedForeground}
          editable={!disabled}
        />
      </Field>
      <Field label="Address line 2 (optional)">
        <TextInput
          style={fieldStyle}
          value={value.line2}
          onChangeText={(line2) => set({ line2 })}
          placeholder="Apt 4B"
          placeholderTextColor={colors.mutedForeground}
          editable={!disabled}
        />
      </Field>
      <View style={styles.row}>
        <View style={styles.half}>
          <Field label="City *">
            <TextInput
              style={fieldStyle}
              value={value.city}
              onChangeText={(city) => set({ city })}
              placeholder="City"
              placeholderTextColor={colors.mutedForeground}
              editable={!disabled}
            />
          </Field>
        </View>
        <View style={styles.half}>
          <Field label="State">
            <TextInput
              style={fieldStyle}
              value={value.state}
              onChangeText={(state) => set({ state })}
              placeholder="CA"
              placeholderTextColor={colors.mutedForeground}
              editable={!disabled}
            />
          </Field>
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.half}>
          <Field label="Postal code *">
            <TextInput
              style={fieldStyle}
              value={value.postalCode}
              onChangeText={(postalCode) => set({ postalCode })}
              placeholder="90210"
              placeholderTextColor={colors.mutedForeground}
              editable={!disabled}
            />
          </Field>
        </View>
        <View style={styles.half}>
          <Field label="Country *">
            <TextInput
              style={fieldStyle}
              value={value.countryCode}
              onChangeText={(countryCode) => set({ countryCode: countryCode.toUpperCase().slice(0, 2) })}
              placeholder="US"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="characters"
              maxLength={2}
              editable={!disabled}
            />
          </Field>
        </View>
      </View>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <ThemedText variant="caption" muted style={styles.label}>
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  field: { gap: 6 },
  label: { marginBottom: 2 },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
});
