
import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ChatBubble from '@/components/ChatBubble';
import ThinkingIndicator from '@/components/ThinkingIndicator';
import QuickActions from '@/components/QuickActions';
import MemoryModal from '@/components/MemoryModal';
import FileUploadModal from '@/components/FileUploadModal';
import PinScreen from '@/components/PinScreen';
import { useBrain } from '@/context/BrainContext';
import { usePin } from '@/context/PinContext';
import { Message } from '@/engine/brain';
import Colors from '@/constants/colors';

const { colors } = Colors;

type PinMode = 'unlock' | 'set' | 'confirm' | 'verify_old' | null;

export default function ChatScreen() {
  const {
    messages, isThinking, brainState,
    sendMessage, clearConversation, addDocument, removeDocument,
  } = useBrain();

  const { isLocked, hasPin, pinLoaded, unlock, setPin, removePin, lock } = usePin();

  const [inputText, setInputText] = useState('');
  const [showMemory, setShowMemory] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [showQuick, setShowQuick] = useState(true);

  // PIN flow state
  const [pinMode, setPinMode] = useState<PinMode>(null);
  const [pendingNewPin, setPendingNewPin] = useState('');
  const [pinError, setPinError] = useState('');

  const flatListRef = useRef<FlatList<Message>>(null);
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 120);
  }, []);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isThinking) return;
    setInputText('');
    setShowQuick(false);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await sendMessage(text);
    scrollToBottom();
  }, [inputText, isThinking, sendMessage, scrollToBottom]);

  const handleQuickAction = useCallback((text: string) => {
    setShowQuick(false);
    sendMessage(text);
    scrollToBottom();
  }, [sendMessage, scrollToBottom]);

  const handleClear = useCallback(() => {
    setShowMemory(false);
    clearConversation();
    setShowQuick(true);
  }, [clearConversation]);

  const renderItem = useCallback(({ item, index }: { item: Message; index: number }) => (
    <ChatBubble message={item} index={index} />
  ), []);

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const topInset = isWeb ? 67 : insets.top;
  const bottomInset = isWeb ? 34 : 0;
  const docCount = brainState.learnedDocuments.length;

  // ── PIN handlers ────────────────────────────────────────────────────────────

  const handlePinButton = useCallback(() => {
    if (hasPin) {
      // Are PIN — arata meniu: lock / change / remove
      // Simplu: prima data lock, tine apasat pentru optiuni
      lock();
    } else {
      // Nu are PIN — seteaza
      setPinMode('set');
      setPendingNewPin('');
      setPinError('');
    }
  }, [hasPin, lock]);

  const handlePinSuccess = useCallback(async (pin: string) => {
    if (pinMode === 'unlock') {
      const ok = unlock(pin);
      if (!ok) {
        setPinError('PIN incorect. Încearcă din nou.');
        setPinMode('unlock');
      }
    } else if (pinMode === 'set') {
      setPendingNewPin(pin);
      setPinMode('confirm');
      setPinError('');
    } else if (pinMode === 'confirm') {
      if (pin === pendingNewPin) {
        await setPin(pin);
        setPinMode(null);
        setPendingNewPin('');
      } else {
        setPinError('PIN-urile nu coincid. Reîncearcă.');
        setPinMode('set');
        setPendingNewPin('');
      }
    } else if (pinMode === 'verify_old') {
      const ok = unlock(pin);
      if (ok) {
        setPinMode('set');
        setPendingNewPin('');
        setPinError('');
      } else {
        setPinError('PIN incorect.');
        setPinMode('verify_old');
      }
    }
  }, [pinMode, pendingNewPin, unlock, setPin]);

  const handlePinCancel = useCallback(() => {
    setPinMode(null);
    setPendingNewPin('');
    setPinError('');
  }, []);

  const handleChangPin = useCallback(() => {
    if (hasPin) {
      setPinMode('verify_old');
    } else {
      setPinMode('set');
    }
    setPinError('');
  }, [hasPin]);

  const handleRemovePin = useCallback(async () => {
    await removePin();
    setPinMode(null);
  }, [removePin]);

  // ── Asteapta incarcarea PIN ─────────────────────────────────────────────────
  if (!pinLoaded) return null;

  // ── Ecran deblocare PIN ─────────────────────────────────────────────────────
  if (isLocked) {
    return (
      <PinScreen
        mode="unlock"
        subtitle={pinError || undefined}
        onSuccess={(pin) => {
          const ok = unlock(pin);
          if (!ok) setPinError('PIN incorect. Încearcă din nou.');
        }}
      />
    );
  }

  // ── Flux setare PIN ─────────────────────────────────────────────────────────
  if (pinMode === 'set') {
    return (
      <PinScreen
        mode="set"
        subtitle={pinError || 'Alege un cod din 4 cifre'}
        onSuccess={handlePinSuccess}
        onCancel={handlePinCancel}
      />
    );
  }
  if (pinMode === 'confirm') {
    return (
      <PinScreen
        mode="confirm"
        subtitle={pinError || 'Introduceți din nou PIN-ul pentru confirmare'}
        onSuccess={handlePinSuccess}
        onCancel={handlePinCancel}
      />
    );
  }
  if (pinMode === 'verify_old') {
    return (
      <PinScreen
        mode="unlock"
        subtitle="Introduceți PIN-ul curent pentru a-l schimba"
        onSuccess={handlePinSuccess}
        onCancel={handlePinCancel}
      />
    );
  }

  // ── UI principal ─────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.statusDot} />
          <View>
            <Text style={styles.headerTitle}>Axon</Text>
            <Text style={styles.headerSub}>
              {docCount > 0
                ? `${docCount} doc. • Offline`
                : `v${brainState.selfKnowledge?.intelligenceVersion ?? 1} • Offline`}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowFiles(true)}>
            <View>
              <Feather name="paperclip" size={20} color={docCount > 0 ? colors.primary : colors.textSecondary} />
              {docCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{docCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowMemory(true)}>
            <Feather name="cpu" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={handlePinButton}
            onLongPress={hasPin ? handleChangPin : undefined}
          >
            <Feather
              name={hasPin ? 'lock' : 'unlock'}
              size={20}
              color={hasPin ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages + Input */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={0}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!!messages.length}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={isThinking ? <ThinkingIndicator /> : null}
        />

        {showQuick && !isThinking && <QuickActions onPress={handleQuickAction} />}

        <View style={[styles.inputContainer, { paddingBottom: bottomInset + 8 }]}>
          <TouchableOpacity style={styles.attachBtn} onPress={() => setShowFiles(true)}>
            <Feather name="paperclip" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Scrie un mesaj..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={1000}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            blurOnSubmit={false}
          />

          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || isThinking) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isThinking}
            activeOpacity={0.8}
          >
            <Feather
              name="send"
              size={18}
              color={inputText.trim() && !isThinking ? '#fff' : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* PIN tip */}
      {!hasPin && (
        <TouchableOpacity style={styles.pinTip} onPress={() => setPinMode('set')}>
          <Feather name="lock" size={13} color={colors.textMuted} />
          <Text style={styles.pinTipText}>Setează PIN de protecție</Text>
        </TouchableOpacity>
      )}
      {hasPin && (
        <TouchableOpacity style={styles.pinTip} onLongPress={handleRemovePin}>
          <Feather name="shield" size={13} color={colors.success} />
          <Text style={[styles.pinTipText, { color: colors.success }]}>Protejat cu PIN • ține apăsat pentru schimbare</Text>
        </TouchableOpacity>
      )}

      {/* Modals */}
      <MemoryModal
        visible={showMemory}
        brainState={brainState}
        onClose={() => setShowMemory(false)}
        onClear={handleClear}
      />
      <FileUploadModal
        visible={showFiles}
        documents={brainState.learnedDocuments}
        onClose={() => setShowFiles(false)}
        onAddDocument={addDocument}
        onRemoveDocument={removeDocument}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 4,
  },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.text },
  headerSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.success },
  headerRight: { flexDirection: 'row', gap: 4 },
  headerBtn: { padding: 8, borderRadius: 8 },
  badge: {
    position: 'absolute', top: -5, right: -6,
    backgroundColor: colors.primary,
    borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontFamily: 'Inter_700Bold' },
  messageList: { paddingTop: 12, paddingBottom: 8 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 10, paddingTop: 10, gap: 6,
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  attachBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2, borderWidth: 1, borderColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: colors.text,
    fontFamily: 'Inter_400Regular',
    borderWidth: 1, borderColor: colors.border,
    maxHeight: 120,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  sendBtnDisabled: { backgroundColor: colors.surfaceHigh },
  pinTip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 6, backgroundColor: colors.background,
  },
  pinTipText: {
    fontSize: 11, color: colors.textMuted, fontFamily: 'Inter_400Regular',
  },
});
