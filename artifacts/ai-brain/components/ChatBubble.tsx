
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Message } from '@/engine/brain';
import Colors from '@/constants/colors';

const { colors } = Colors;

interface Props {
  message: Message;
  index: number;
}

function formatContent(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={i} style={styles.bold}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return <Text key={i}>{part}</Text>;
  });
}

export default function ChatBubble({ message, index }: Props) {
  const isUser = message.role === 'user';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isUser ? 20 : -20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const timeStr = message.timestamp.toLocaleTimeString('ro-RO', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Animated.View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.aiContainer,
        { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
      ]}
    >
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>A</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.aiText]}>
          {formatContent(message.content)}
        </Text>
        <Text style={[styles.time, isUser ? styles.userTime : styles.aiTime]}>
          {timeStr}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
    alignItems: 'flex-end',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  aiContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    paddingBottom: 6,
  },
  userBubble: {
    backgroundColor: colors.userBubble,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: colors.aiBubble,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: colors.userBubbleText,
    fontFamily: 'Inter_400Regular',
  },
  aiText: {
    color: colors.aiBubbleText,
    fontFamily: 'Inter_400Regular',
  },
  bold: {
    fontFamily: 'Inter_700Bold',
  },
  time: {
    fontSize: 10,
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },
  userTime: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
  },
  aiTime: {
    color: colors.textMuted,
  },
});
