
// Axon — Modal configurare Gemini / ChatGPT
// Cheile se salvează local pe telefon, niciodată pe server

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useAIProvider, providerLabel } from '@/context/AIProviderContext';
import type { AIProvider } from '@/engine/aiProviders';

const { colors } = Colors;

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

interface Props {
  visible: boolean;
  onClose: () => void;
}

const PROVIDER_OPTIONS: { id: AIProvider; label: string; icon: FeatherIconName; desc: string }[] = [
  {
    id: 'none',
    label: 'Fără AI cloud',
    icon: 'cpu',
    desc: 'Axon folosește doar cunoașterea locală și căutarea web.',
  },
  {
    id: 'gemini',
    label: 'Gemini 1.5 Flash',
    icon: 'zap',
    desc: 'Model Google rapid, gratuit cu cheie API din Google AI Studio.',
  },
  {
    id: 'openai',
    label: 'ChatGPT (GPT-4o mini)',
    icon: 'message-circle',
    desc: 'Model OpenAI de calitate înaltă. Necesită cont cu credit.',
  },
];

export default function AIProviderModal({ visible, onClose }: Props) {
  const {
    settings, isTesting, testError,
    setActiveProvider, saveGeminiKey, saveOpenAIKey, testKey, clearError,
  } = useAIProvider();

  const [geminiInput, setGeminiInput] = useState(settings.geminiKey);
  const [openaiInput, setOpenaiInput] = useState(settings.openaiKey);
  const [savingProvider, setSavingProvider] = useState<AIProvider | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Sincronizează inputurile cu setările persitate la fiecare deschidere a modalului
  useEffect(() => {
    if (visible) {
      setGeminiInput(settings.geminiKey);
      setOpenaiInput(settings.openaiKey);
      setSuccessMsg('');
    }
  }, [visible, settings.geminiKey, settings.openaiKey]);

  const handleSelectProvider = async (provider: AIProvider) => {
    // Gemini/OpenAI require a stored key before activation
    if (provider === 'gemini' && !settings.geminiKey) {
      Alert.alert(
        'Cheie lipsă',
        'Adaugă și validează o cheie API Gemini mai întâi, apoi poți activa providerul.',
        [{ text: 'OK' }]
      );
      return;
    }
    if (provider === 'openai' && !settings.openaiKey) {
      Alert.alert(
        'Cheie lipsă',
        'Adaugă și validează o cheie API ChatGPT mai întâi, apoi poți activa providerul.',
        [{ text: 'OK' }]
      );
      return;
    }
    setSavingProvider(provider);
    clearError();
    setSuccessMsg('');
    await setActiveProvider(provider);
    setSavingProvider(null);
    if (provider !== 'none') {
      setSuccessMsg(`${providerLabel(provider)} activat!`);
      setTimeout(() => setSuccessMsg(''), 2500);
    }
  };

  const handleTestGemini = async () => {
    clearError();
    setSuccessMsg('');
    const ok = await testKey('gemini', geminiInput);
    if (ok) {
      await saveGeminiKey(geminiInput);
      setSuccessMsg('Cheie Gemini salvată și validată!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleTestOpenAI = async () => {
    clearError();
    setSuccessMsg('');
    const ok = await testKey('openai', openaiInput);
    if (ok) {
      await saveOpenAIKey(openaiInput);
      setSuccessMsg('Cheie ChatGPT salvată și validată!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleClose = () => {
    clearError();
    setSuccessMsg('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>AI Cloud Provider</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.desc}>
            Axon funcționează complet offline. Dacă adaugi o cheie API, va folosi și AI cloud
            pentru întrebări complexe. Cheile sunt stocate LOCAL, doar pe telefonul tău.
          </Text>

          <Text style={styles.sectionTitle}>Selectează providerul activ</Text>
          {PROVIDER_OPTIONS.map(opt => {
            const isActive = settings.activeProvider === opt.id;
            const isLoading = savingProvider === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.providerCard, isActive && styles.providerCardActive]}
                onPress={() => handleSelectProvider(opt.id)}
                activeOpacity={0.75}
              >
                <View style={[styles.providerIcon, isActive && styles.providerIconActive]}>
                  {isLoading
                    ? <ActivityIndicator size="small" color={colors.primary} />
                    : <Feather name={opt.icon} size={20} color={isActive ? colors.primary : colors.textSecondary} />
                  }
                </View>
                <View style={styles.providerInfo}>
                  <Text style={[styles.providerLabel, isActive && styles.providerLabelActive]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.providerDesc}>{opt.desc}</Text>
                </View>
                {isActive && (
                  <Feather name="check-circle" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}

          {/* Gemini Key */}
          <Text style={styles.sectionTitle}>Cheie API Gemini</Text>
          <View style={styles.card}>
            <Text style={styles.cardHint}>
              Obține gratuit de la{' '}
              <Text style={styles.link}>aistudio.google.com</Text>
            </Text>
            <View style={styles.keyRow}>
              <TextInput
                style={styles.keyInput}
                value={geminiInput}
                onChangeText={setGeminiInput}
                placeholder="AIza..."
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.testBtn, (!geminiInput.trim() || isTesting) && styles.testBtnDisabled]}
                onPress={handleTestGemini}
                disabled={!geminiInput.trim() || isTesting}
              >
                {isTesting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.testBtnText}>Testează</Text>
                }
              </TouchableOpacity>
            </View>
          </View>

          {/* OpenAI Key */}
          <Text style={styles.sectionTitle}>Cheie API ChatGPT</Text>
          <View style={styles.card}>
            <Text style={styles.cardHint}>
              Obține de la{' '}
              <Text style={styles.link}>platform.openai.com/api-keys</Text>
            </Text>
            <View style={styles.keyRow}>
              <TextInput
                style={styles.keyInput}
                value={openaiInput}
                onChangeText={setOpenaiInput}
                placeholder="sk-..."
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.testBtn, (!openaiInput.trim() || isTesting) && styles.testBtnDisabled]}
                onPress={handleTestOpenAI}
                disabled={!openaiInput.trim() || isTesting}
              >
                {isTesting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.testBtnText}>Testează</Text>
                }
              </TouchableOpacity>
            </View>
          </View>

          {/* Feedback */}
          {testError ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color={colors.error} />
              <Text style={styles.errorText}>{testError}</Text>
            </View>
          ) : null}
          {successMsg ? (
            <View style={styles.successBox}>
              <Feather name="check-circle" size={14} color={colors.success} />
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          ) : null}

          <View style={styles.infoBox}>
            <Feather name="shield" size={14} color={colors.textMuted} />
            <Text style={styles.infoText}>
              Pe Android/iOS cheile sunt stocate în Keystore/Keychain (zona securizată a sistemului). Pe simulatoare sau web, se folosește stocarea locală standard. Axon nu trimite cheile pe niciun server propriu.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.text },
  closeBtn: { padding: 4 },
  scroll: { flex: 1, padding: 16 },
  desc: {
    fontSize: 13, color: colors.textSecondary, fontFamily: 'Inter_400Regular',
    lineHeight: 20, marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1,
    marginTop: 20, marginBottom: 8, marginLeft: 4,
  },
  providerCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border, gap: 12,
  },
  providerCardActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(108,99,255,0.08)',
  },
  providerIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  providerIconActive: { backgroundColor: 'rgba(108,99,255,0.15)' },
  providerInfo: { flex: 1 },
  providerLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary },
  providerLabelActive: { color: colors.text },
  providerDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textMuted, marginTop: 2 },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12, padding: 14, marginBottom: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  cardHint: { fontSize: 12, color: colors.textMuted, fontFamily: 'Inter_400Regular', marginBottom: 10 },
  link: { color: colors.accent },
  keyRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  keyInput: {
    flex: 1,
    backgroundColor: colors.surfaceHigh,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13, color: colors.text, fontFamily: 'Inter_400Regular',
    borderWidth: 1, borderColor: colors.border,
  },
  testBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center', minWidth: 80,
  },
  testBtnDisabled: { backgroundColor: colors.surfaceHigh },
  testBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,82,82,0.1)',
    borderRadius: 10, padding: 12, marginTop: 8,
    borderWidth: 1, borderColor: 'rgba(255,82,82,0.2)',
  },
  errorText: { color: colors.error, fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,230,118,0.1)',
    borderRadius: 10, padding: 12, marginTop: 8,
    borderWidth: 1, borderColor: 'rgba(0,230,118,0.2)',
  },
  successText: { color: colors.success, fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10, padding: 12, marginTop: 20, marginBottom: 32, gap: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  infoText: { fontSize: 12, color: colors.textMuted, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 18 },
});
