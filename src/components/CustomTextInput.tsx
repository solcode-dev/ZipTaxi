import React from 'react';
import {TextInput as PaperTextInput, useTheme} from 'react-native-paper';
import {StyleSheet} from 'react-native';

interface CustomTextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  error?: boolean;
  disabled?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  testID?: string;
}

export const CustomTextInput: React.FC<CustomTextInputProps> = ({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  error = false,
  disabled = false,
  autoCapitalize = 'none',
  keyboardType = 'default',
  testID,
}) => {
  const theme = useTheme();

  return (
    <PaperTextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      error={error}
      disabled={disabled}
      autoCapitalize={autoCapitalize}
      keyboardType={keyboardType}
      mode="outlined"
      style={styles.input}
      testID={testID}
      theme={{
        colors: {
          primary: theme.colors.primary,
        },
      }}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    marginBottom: 16,
  },
});
