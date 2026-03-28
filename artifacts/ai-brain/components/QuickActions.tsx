
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '@/constants/colors';

const { colors } = Colors;

const QUICK_ACTIONS = [
  { label: 'Ce oră e?', icon: '🕐' },
  { label: 'Ce dată e?', icon: '📅' },
  { label: '12 × 15', icon: '🧮' },
  { label: 'Spune-mi o glumă', icon: '😄' },
  { label: 'Motivează-mă', icon: '💪' },
  { label: 'Ce poți face?', icon: '🤖' },
];

interface Props {
  onPress: (text: string) => void;
}

export default function QuickActions({ onPress }: Props) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.chip}
            onPress={() => onPress(action.label)}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{action.icon}</Text>
            <Text style={styles.label}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  container: {
    paddingHorizontal: 12,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 5,
  },
  icon: {
    fontSize: 13,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
});
