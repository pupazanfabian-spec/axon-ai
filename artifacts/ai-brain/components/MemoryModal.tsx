
import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { BrainState } from '@/engine/brain';

const { colors } = Colors;

interface Props {
  visible: boolean;
  brainState: BrainState;
  onClose: () => void;
  onClear: () => void;
}

export default function MemoryModal({ visible, brainState, onClose, onClear }: Props) {
  const memories = Object.entries(brainState.memory).filter(([k]) => !k.startsWith('name:'));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Memoria Axon</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {brainState.userName && (
            <View style={styles.card}>
              <Feather name="user" size={16} color={colors.primary} />
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Numele tău</Text>
                <Text style={styles.cardValue}>{brainState.userName}</Text>
              </View>
            </View>
          )}

          <View style={styles.card}>
            <Feather name="message-circle" size={16} color={colors.accent} />
            <View style={styles.cardContent}>
              <Text style={styles.cardLabel}>Mesaje trimise</Text>
              <Text style={styles.cardValue}>{brainState.conversationCount}</Text>
            </View>
          </View>

          {memories.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Informații reținute</Text>
              {memories.map(([key, value], i) => (
                <View key={key} style={styles.card}>
                  <Feather name="bookmark" size={16} color={colors.warning} />
                  <View style={styles.cardContent}>
                    <Text style={styles.cardLabel}>Notă {i + 1}</Text>
                    <Text style={styles.cardValue}>{value}</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {memories.length === 0 && !brainState.userName && (
            <View style={styles.empty}>
              <Feather name="inbox" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>Nicio informație reținută</Text>
              <Text style={styles.emptyHint}>
                Spune-mi "Reține că..." și voi memora!
              </Text>
            </View>
          )}

          <View style={styles.infoBox}>
            <Feather name="info" size={14} color={colors.textMuted} />
            <Text style={styles.infoText}>
              Axon funcționează 100% offline. Memoria este stocată local pe dispozitiv.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.clearBtn} onPress={onClear}>
            <Feather name="trash-2" size={16} color={colors.error} />
            <Text style={styles.clearText}>Șterge tot</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: 'Inter_500Medium',
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 15,
    color: colors.text,
    fontFamily: 'Inter_500Medium',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium',
  },
  emptyHint: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: 'Inter_400Regular',
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,82,82,0.1)',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,82,82,0.2)',
  },
  clearText: {
    color: colors.error,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
