
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
import { useBrain } from '@/context/BrainContext';
import { Message } from '@/engine/brain';
import Colors from '@/constants/colors';

const { colors } = Colors;

export default function ChatScreen() {
  const { messages, isThinking, brainState, sendMessage, clearConversation } = useBrain();
  const [inputText, setInputText] = useState('');
  const [showMemory, setShowMemory] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const flatListRef = useRef<FlatList<Message>>(null);
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    setShowQuickActions(false);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await sendMessage(text);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [inputText, sendMessage]);

  const handleQuickAction = useCallback((text: string) => {
    setShowQuickActions(false);
    sendMessage(text);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [sendMessage]);

  const handleClear = useCallback(() => {
    setShowMemory(false);
    clearConversation();
    setShowQuickActions(true);
  }, [clearConversation]);

  const renderItem = useCallback(({ item, index }: { item: Message; index: number }) => (
    <ChatBubble message={item} index={index} />
  ), []);

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const topInset = isWeb ? 67 : insets.top;
  const bottomInset = isWeb ? 34 : 0;

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.statusDot} />
          <View>
            <Text style={styles.headerTitle}>Axon</Text>
            <Text style={styles.headerSub}>AI Offline • Activ</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setShowMemory(true)}
          >
            <Feather name="cpu" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={handleClear}
          >
            <Feather name="refresh-cw" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[styles.messageList, { paddingBottom: 8 }]}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          scrollEnabled={messages.length > 0}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={isThinking ? <ThinkingIndicator /> : null}
        />

        {/* Quick Actions */}
        {showQuickActions && !isThinking && (
          <QuickActions onPress={handleQuickAction} />
        )}

        {/* Input */}
        <View style={[styles.inputContainer, { paddingBottom: bottomInset + 8 }]}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Scrie un mesaj..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isThinking}
            activeOpacity={0.8}
          >
            <Feather
              name="send"
              size={18}
              color={inputText.trim() ? '#fff' : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <MemoryModal
        visible={showMemory}
        brainState={brainState}
        onClose={() => setShowMemory(false)}
        onClear={handleClear}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: colors.text,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: colors.success,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 4,
  },
  headerBtn: {
    padding: 8,
    borderRadius: 8,
  },
  messageList: {
    paddingTop: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    fontFamily: 'Inter_400Regular',
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 120,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: {
    backgroundColor: colors.surfaceHigh,
  },
});
