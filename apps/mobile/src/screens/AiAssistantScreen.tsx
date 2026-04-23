import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { BackButton } from '../components';
import { PaperPlaneRight, Robot, Sparkle, User } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Avatar } from '../components/Avatar';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export const AiAssistantScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Fetch History
  const { data: history, isLoading: isHistoryLoading } = useQuery({
      queryKey: ['ai-chat-history'],
      queryFn: async () => {
          const res = await api.get('/ai/history');
          return res.data;
      }
  });

  const [messages, setMessages] = useState<Message[]>([]);

  // Initialize messages with history
  useEffect(() => {
      if (history) {
          const historyMsgs: Message[] = [];
          history.forEach((h: any) => {
              historyMsgs.push({
                  id: h.id + '-user',
                  text: h.message,
                  sender: 'user',
                  timestamp: new Date(h.createdAt)
              });
              historyMsgs.push({
                  id: h.id + '-ai',
                  text: h.response,
                  sender: 'ai',
                  timestamp: new Date(h.createdAt)
              });
          });
          
          if (historyMsgs.length === 0) {
              historyMsgs.push({
                  id: 'welcome',
                  text: "Hello! I'm your Rubimedik AI assistant. How can I help you today? You can ask me in English or Nigerian Pidgin! 🇳🇬",
                  sender: 'ai',
                  timestamp: new Date()
              });
          }
          setMessages(historyMsgs);
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
      }
  }, [history]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await api.post('/ai/chat', { message });
      return res.data;
    },
    onSuccess: (data) => {
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: data.reply,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    },
    onError: () => {
      Alert.alert('Error', 'AI is currently unavailable. Please try again later.');
    }
  });

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = input.trim();
    setInput('');
    chatMutation.mutate(messageToSend);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginLeft: 12,
    },
    messageList: {
      padding: 16,
      paddingBottom: 32,
    },
    messageWrapper: {
      marginBottom: 20,
      maxWidth: '85%',
    },
    userWrapper: {
      alignSelf: 'flex-end',
    },
    aiWrapper: {
      alignSelf: 'flex-start',
    },
    bubble: {
      padding: 14,
      borderRadius: 20,
    },
    userBubble: {
      backgroundColor: theme.colors.primary,
      borderBottomRightRadius: 4,
    },
    aiBubble: {
      backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7',
      borderBottomLeftRadius: 4,
    },
    messageText: {
      fontSize: 15,
      lineHeight: 20,
      fontFamily: theme.typography.fontFamily,
    },
    userText: {
      color: 'white',
    },
    aiText: {
      color: theme.colors.textPrimary,
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 12,
        backgroundColor: isDarkMode ? '#1C1C1E' : '#F2F2F7',
        borderRadius: 16,
        alignSelf: 'flex-start',
        marginBottom: 20,
        marginLeft: 16,
    },
    typingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.primary,
        opacity: 0.6,
    },
    inputArea: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingBottom: Platform.OS === 'ios' ? 32 : 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    inputWrapper: {
      flex: 1,
      backgroundColor: isDarkMode ? '#1C1C1E' : '#F9FAFB',
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginRight: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    textInput: {
      fontSize: 15,
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.fontFamily,
      maxHeight: 100,
    },
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendBtnDisabled: {
      backgroundColor: theme.colors.border,
    },
    aiAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    }
  }), [theme, isDarkMode]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isAi = item.sender === 'ai';
    return (
      <View style={[styles.messageWrapper, isAi ? styles.aiWrapper : styles.userWrapper]}>
        {isAi && (
            <View style={styles.aiAvatar}>
                <Robot size={18} color={theme.colors.primary} weight="fill" />
            </View>
        )}
        <View style={[styles.bubble, isAi ? styles.aiBubble : styles.userBubble]}>
          <Text style={[styles.messageText, isAi ? styles.aiText : styles.userText]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Robot size={28} color={theme.colors.primary} weight="fill" style={{ marginLeft: 12 }} />
        <Text style={styles.headerTitle}>Rubimedik AI Assistant</Text>
      </View>

      {isHistoryLoading ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={{ textAlign: 'center', marginTop: 12, color: theme.colors.textSecondary }}>Loading history...</Text>
          </View>
      ) : (
        <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {chatMutation.isPending && (
          <View style={styles.typingIndicator}>
              <View style={styles.typingDot} />
              <View style={[styles.typingDot, { opacity: 0.8 }]} />
              <View style={[styles.typingDot, { opacity: 1 }]} />
              <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginLeft: 4 }}>AI is thinking...</Text>
          </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <View style={styles.inputArea}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask anything (English/Pidgin)..."
              placeholderTextColor={theme.colors.textSecondary}
              value={input}
              onChangeText={setInput}
              multiline
            />
          </View>
          <TouchableOpacity 
            style={[styles.sendBtn, (!input.trim() || chatMutation.isPending) && styles.sendBtnDisabled]} 
            onPress={handleSend}
            disabled={!input.trim() || chatMutation.isPending}
          >
            {chatMutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <PaperPlaneRight size={20} color="white" weight="fill" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
