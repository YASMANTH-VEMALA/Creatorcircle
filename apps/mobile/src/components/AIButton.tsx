import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AIButtonProps {
  onPress: () => void;
  disabled?: boolean;
  hasContent?: boolean;
}

export const AIButton: React.FC<AIButtonProps> = ({ onPress, disabled = false, hasContent = false }) => {
  const iconName = hasContent ? "pencil" : "add";
  const iconColor = disabled ? "#999" : "#007AFF";
  
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={iconName} 
        size={20} 
        color={iconColor} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginRight: 4,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  buttonDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
});

export default AIButton;
