import React, { useState, useEffect, useRef, useMemo } from 'react';
import { format } from 'date-fns';
import { safeFormat } from '../utils/dateUtils';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Linking,
  Alert,
  Image,
  Modal,
  Dimensions,
  Pressable
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { Avatar, BackButton } from '../components';
import { 
  CaretLeft, 
  PaperPlaneRight, 
  Image as ImageIcon, 
  Phone, 
  Warning, 
  Lock, 
  DotsThreeVertical, 
  Check, 
  Checks,
  File as FileIcon,
  Plus,
  CircleNotch,
  X,
  DownloadSimple,
  ShareNetwork,
  WarningCircle
} from 'phosphor-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { MessageType } from '@repo/shared';
import * as DocumentPicker from 'expo-document-picker';
import { getDisplayName } from '../utils/userUtils';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export const ChatScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  // Support both roomId and chatId (from notifications)
  const params = route.params || {};
  const roomId = params.roomId || params.chatId || 'demo';
  const initialOtherUserName = params.otherUserName || params.senderName || 'User';
  const otherPhone = params.otherPhone;

  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const { data: roomInfo, isLoading: isRoomLoading } = useQuery({
    queryKey: ['chat-room-info', roomId],
    queryFn: async () => {
      if (roomId === 'demo') return null;
      const res = await api.get(`/chat/rooms/${roomId}`);
      return res.data;
    },
    enabled: roomId !== 'demo'
  });

  const markAsReadMutation = useMutation({
    mutationFn: () => api.patch(`/chat/rooms/${roomId}/read`),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    }
  });

  useEffect(() => {
    if (roomId !== 'demo') {
        markAsReadMutation.mutate();
    }
  }, [roomId]);

  const chatPartnerName = useMemo(() => {
    if (roomInfo?.partner?.fullName) return roomInfo.partner.fullName;
    if (roomInfo?.partner?.email) return roomInfo.partner.email.split('@')[0];
    return initialOtherUserName !== 'User' ? initialOtherUserName : 'User';
  }, [roomInfo, initialOtherUserName]);

  const [message, setMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState<{ url: string, type: 'IMAGE' | 'DOCUMENT', fileName?: string, id?: string } | null>(null);

  const isLocked = useMemo(() => {
      if (!roomInfo) return false;
      const status = roomInfo.status;
      const chatClosesAt = roomInfo.chatClosesAt;
      
      const isArchived = status === 'ARCHIVED';
      const isDisputed = status === 'DISPUTED';
      const isExpired = chatClosesAt && new Date() > new Date(chatClosesAt);
      
      return isArchived || isDisputed || isExpired;
  }, [roomInfo]);

  const lockReason = useMemo(() => {
      if (!roomInfo) return '';
      const status = roomInfo.status;
      if (status === 'DISPUTED') return 'This chat is locked due to an active dispute.';
      if (status === 'ARCHIVED') return 'This chat has been archived and is now read-only.';
      return 'The consultation window has closed. This chat is now read-only.';
  }, [roomInfo]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 12,
    },
    headerName: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
    },
    headerStatus: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAction: {
      padding: 8,
      marginLeft: 4,
    },
    loading: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
    },
    messageList: {
      padding: theme.spacing.xl,
      paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    sessionDivider: {
        alignItems: 'center',
        marginVertical: 24,
    },
    sessionDividerBadge: {
        backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    sessionDividerText: {
        fontSize: 11,
        fontFamily: theme.typography.fontFamilyBold,
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    messageWrapper: {
      flexDirection: 'row',
      marginBottom: 16,
      maxWidth: '85%',
    },
    myMessageWrapper: {
      alignSelf: 'flex-end',
    },
    otherMessageWrapper: {
      alignSelf: 'flex-start',
    },
    chatAvatar: {
      marginRight: 8,
      alignSelf: 'flex-end',
    },
    messageBubble: {
      padding: 12,
      borderRadius: 18,
    },
    myBubble: {
      backgroundColor: theme.colors.primary,
      borderBottomRightRadius: 4,
    },
    otherBubble: {
      backgroundColor: isDarkMode ? '#1C1C1E' : '#E5E5EA',
      borderBottomLeftRadius: 4,
    },
    messageText: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily,
      lineHeight: 22,
    },
    myMessageText: {
      color: 'white',
    },
    otherMessageText: {
      color: theme.colors.textPrimary,
    },
    messageTime: {
      fontSize: 10,
      marginTop: 4,
      alignSelf: 'flex-end',
    },
    myTime: {
      color: 'rgba(255,255,255,0.7)',
    },
    otherTime: {
      color: theme.colors.textSecondary,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      paddingBottom: Platform.OS === 'ios' ? 30 : theme.spacing.md,
    },
    iconBtn: {
      marginRight: 12,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDarkMode ? '#1C1C1E' : '#F2F2F7',
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 12,
        maxHeight: 100,
    },
    input: {
      flex: 1,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textPrimary,
      fontSize: 16,
      padding: 0,
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
      backgroundColor: isDarkMode ? '#2C2C2E' : '#E5E5EA',
    },
    lockedContainer: {
        backgroundColor: isDarkMode ? '#1C1C1E' : '#F2F2F7',
        padding: 20,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    lockedText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        fontFamily: theme.typography.fontFamilyMedium,
        textAlign: 'center',
        marginTop: 8,
    },
    messageImage: {
        width: 200,
        height: 150,
        borderRadius: 12,
        marginBottom: 8,
    },
    docWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 8,
        marginBottom: 8,
    },
    fileName: {
        fontSize: 14,
        fontFamily: theme.typography.fontFamilySemiBold,
    },
    fileSize: {
        fontSize: 11,
    },
    reactionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        position: 'absolute',
        bottom: -15,
        right: 10,
        zIndex: 10,
    },
    reactionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7',
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginRight: 4,
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    reactionCount: {
        fontSize: 10,
        marginLeft: 2,
        color: theme.colors.textSecondary,
        fontFamily: theme.typography.fontFamilyBold,
    },
    replyContainer: {
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
        borderRadius: 6,
        marginBottom: 8,
        overflow: 'hidden',
    },
    replyBorder: {
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: 3,
        backgroundColor: theme.colors.primary,
    },
    replyName: {
        fontSize: 12,
        fontFamily: theme.typography.fontFamilyBold,
        color: theme.colors.primary,
    },
    replyText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontFamily: theme.typography.fontFamily,
    },
    replyInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: isDarkMode ? '#1C1C1E' : '#F2F2F7',
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    previewContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    previewCloseBtn: { padding: 8 },
    previewTitle: {
        flex: 1,
        fontSize: 16,
        fontFamily: theme.typography.fontFamilyBold,
        color: theme.colors.textPrimary,
        marginHorizontal: 12,
        textAlign: 'center',
    },
    previewActionBtn: { padding: 8 },
    previewContent: { flex: 1 },
    previewImage: { width: '100%', height: '100%' },
    previewWebview: { flex: 1, backgroundColor: 'transparent' },
    previewLoader: {
        position: 'absolute',
        top: '50%', left: '50%',
        marginLeft: -15, marginTop: -15,
    }
  }), [theme, isDarkMode]);

  const { data: messages, isLoading: isMessagesLoading } = useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: async () => {
      if (roomId === 'demo') return [];
      const res = await api.get(`/chat/rooms/${roomId}/messages`);
      return res.data?.items || [];
    }
  });

  const transformedMessages = useMemo(() => {
    if (!messages) return [];
    const result = [];
    let lastConsultationLabel = null;
    
    for (const msg of messages) {
        if (msg.consultationLabel && msg.consultationLabel !== lastConsultationLabel) {
            result.push({ 
                id: `session-divider-${msg.id}`, 
                isSessionDivider: true, 
                label: msg.consultationLabel 
            });
            lastConsultationLabel = msg.consultationLabel;
        }
        result.push(msg);
    }
    return result;
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string, type?: MessageType, replyToId?: string, fileUrl?: string, fileName?: string, fileSize?: number, mimeType?: string }) => {
      const res = await api.post(`/chat/rooms/${roomId}/messages`, data);
      return res.data;
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData(['chat-messages', roomId], (old: any) => [...(old || []), newMessage]);
      setMessage('');
      setReplyingTo(null);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    },
    onError: (err: any) => {
        Alert.alert('Error', err?.response?.data?.message || 'Failed to send message');
    }
  });

  const uploadFile = async () => {
    try {
        const result = await DocumentPicker.getDocumentAsync({ type: ['*/*'], copyToCacheDirectory: true });
        if (!result.canceled && result.assets?.[0]) {
            const asset = result.assets[0];
            const formData = new FormData();
            const fileToUpload = {
                uri: asset.uri,
                name: asset.name || `file_${Date.now()}`,
                type: asset.mimeType || 'application/octet-stream'
            };
            // @ts-ignore
            formData.append('file', fileToUpload);
            const uploadRes = await api.post('/users/upload', formData, { transformRequest: (data) => data });
            if (uploadRes.data?.url) {
                sendMessageMutation.mutate({
                    content: `Sent a file: ${asset.name}`,
                    type: asset.mimeType?.startsWith('image/') ? MessageType.IMAGE : MessageType.DOCUMENT,
                    fileUrl: uploadRes.data.url,
                    fileName: asset.name,
                    fileSize: asset.size,
                    mimeType: asset.mimeType
                });
            }
        }
    } catch (error) {
        Alert.alert('Upload Error', 'Failed to upload file');
    }
  };

  const downloadAndViewFile = async (url: string, fileName: string, messageId: string) => {
    try {
      setDownloadingFileId(messageId);
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const fileUri = FileSystem.cacheDirectory + sanitizedName;
      const downloadRes = await FileSystem.downloadAsync(url, fileUri);
      if (downloadRes.status === 200) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, { UTI: 'public.item', mimeType: downloadRes.headers['content-type'] || 'application/octet-stream' });
        } else {
          Alert.alert('Not Supported', 'Viewing files is not supported on this device');
        }
      } else {
        Alert.alert('Download Error', `Failed to download file (Status: ${downloadRes.status})`);
      }
    } catch (error: any) {
      Alert.alert('Error', `Could not open file: ${error.message || 'Unknown error'}`);
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handleFilePress = (url: string, type: 'IMAGE' | 'DOCUMENT', fileName: string, messageId: string) => {
    setPreviewData({ url, type, fileName, id: messageId });
    setPreviewVisible(true);
  };

  const toggleReaction = async (msgId: string, emoji: string) => {
      try {
          await api.post(`/chat/messages/${msgId}/reactions`, { emoji });
          queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
      } catch (e) {}
  };

  const renderStatusTicks = (item: any) => {
      if (item.readAt) return <Checks size={14} color="#34B7F1" weight="bold" />;
      if (item.deliveredAt) return <Checks size={14} color={isDarkMode ? '#8E8E93' : '#999'} weight="bold" />;
      return <Check size={14} color={isDarkMode ? '#8E8E93' : '#999'} weight="bold" />;
  };

  const renderMessage = ({ item }: { item: any }) => {
    if (item.isSessionDivider) {
        return (
            <View style={styles.sessionDivider}>
                <View style={styles.sessionDividerBadge}>
                    <Text style={styles.sessionDividerText}>{item.label}</Text>
                </View>
            </View>
        );
    }

    const isMe = item.sender?.id === user?.id || item.isMe;
    const isImage = item.type === MessageType.IMAGE;
    const isDoc = item.type === MessageType.DOCUMENT;
    
    return (
      <View style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.otherMessageWrapper]}>
        {!isMe && <Avatar name={chatPartnerName} size={32} style={styles.chatAvatar} />}
        <Pressable 
          onLongPress={() => {
            Alert.alert('Message Actions', 'What would you like to do?', [
                { text: 'Reply', onPress: () => setReplyingTo(item) },
                { text: 'React 👍', onPress: () => toggleReaction(item.id, '👍') },
                { text: 'React ❤️', onPress: () => toggleReaction(item.id, '❤️') },
                { text: 'Cancel', style: 'cancel' }
            ]);
          }}
          style={({ pressed }) => [styles.messageBubble, isMe ? styles.myBubble : styles.otherBubble, pressed && { opacity: 0.9 }]}
        >
          {item.replyTo && (
              <View style={[styles.replyContainer, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                  <View style={styles.replyBorder} />
                  <View style={{ padding: 8 }}>
                    <Text style={styles.replyName}>{isMe ? 'You' : chatPartnerName}</Text>
                    <Text style={styles.replyText} numberOfLines={2}>{item.replyTo.content}</Text>
                  </View>
              </View>
          )}

          {isImage && (
              <Pressable onPress={() => handleFilePress(item.fileUrl, 'IMAGE', item.fileName || 'image.jpg', item.id)}>
                  <Image source={{ uri: item.fileUrl }} style={styles.messageImage} />
              </Pressable>
          )}

          {isDoc && (
              <Pressable style={styles.docWrapper} onLongPress={() => {}} onPress={() => handleFilePress(item.fileUrl, 'DOCUMENT', item.fileName || 'file', item.id)}>
                  <FileIcon size={24} color={isMe ? 'white' : theme.colors.primary} weight="fill" />
                  <View style={{ marginLeft: 8, flex: 1 }}>
                      <Text style={[styles.fileName, { color: isMe ? 'white' : theme.colors.textPrimary }]} numberOfLines={1}>{item.fileName || 'Document'}</Text>
                      {item.fileSize && <Text style={[styles.fileSize, { color: isMe ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary }]}>{(item.fileSize / 1024).toFixed(1)} KB</Text>}
                  </View>
              </Pressable>
          )}

          <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>{item.content}</Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
            <Text style={[styles.messageTime, isMe ? styles.myTime : styles.otherTime]}>{item.createdAt ? safeFormat(item.createdAt, 'HH:mm') : ''}</Text>
            {isMe && renderStatusTicks(item)}
          </View>

          {item.reactions && item.reactions.length > 0 && (
              <View style={styles.reactionsContainer}>
                  {item.reactions.map((r: any, idx: number) => (
                      <View key={idx} style={styles.reactionBadge}>
                          <Text style={{ fontSize: 12 }}>{r.emoji}</Text>
                          {r.userIds.length > 1 && <Text style={styles.reactionCount}>{r.userIds.length}</Text>}
                      </View>
                  ))}
              </View>
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton style={{ padding: 4 }} />
        <View style={styles.headerInfo}>
          <Avatar name={chatPartnerName} size={40} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.headerName}>{chatPartnerName}</Text>
            <Text style={styles.headerStatus}>{isLocked ? 'Read-only' : 'Online'}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
            <Pressable 
                style={({ pressed }) => [styles.headerAction, pressed && { opacity: 0.7 }]} 
                onPress={() => otherPhone ? Linking.openURL(`tel:${otherPhone}`) : Alert.alert('Not Available', 'Phone number is not provided.')}
            >
                <Phone color={theme.colors.primary} size={22} weight="fill" />
            </Pressable>
            <Pressable style={({ pressed }) => [styles.headerAction, pressed && { opacity: 0.7 }]}>
                <DotsThreeVertical color={theme.colors.textPrimary} size={22} weight="bold" />
            </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} style={{ flex: 1 }}>
        {isMessagesLoading ? (
          <View style={styles.loading}><ActivityIndicator color={theme.colors.primary} /></View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={transformedMessages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          />
        )}

        {isLocked ? (
            <View style={styles.lockedContainer}>
                <Lock size={24} color={theme.colors.textSecondary} weight="bold" />
                <Text style={styles.lockedText}>{lockReason}</Text>
            </View>
        ) : (
            <View style={{ backgroundColor: theme.colors.background }}>
                {replyingTo && (
                    <View style={styles.replyInputContainer}>
                        <View style={[styles.replyContainer, { flex: 1, marginBottom: 0 }]}>
                            <View style={styles.replyBorder} />
                            <View style={{ padding: 8 }}>
                                <Text style={styles.replyName}>{replyingTo.sender?.fullName || 'User'}</Text>
                                <Text style={styles.replyText} numberOfLines={1}>{replyingTo.content}</Text>
                            </View>
                        </View>
                        <Pressable 
                            onPress={() => setReplyingTo(null)} 
                            style={({ pressed }) => [{ padding: 8 }, pressed && { opacity: 0.7 }]}
                            hitSlop={10}
                        >
                            <X size={20} color={theme.colors.textSecondary} />
                        </Pressable>
                    </View>
                )}
                <View style={styles.inputContainer}>
                    <Pressable 
                        style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]} 
                        onPress={uploadFile}
                        hitSlop={10}
                    >
                        <Plus color={theme.colors.textSecondary} size={26} />
                    </Pressable>
                    <View style={styles.inputWrapper}>
                       <TextInput style={styles.input} placeholder="Type a message..." placeholderTextColor={theme.colors.textSecondary} value={message} onChangeText={setMessage} multiline={true} blurOnSubmit={false} />
                    </View>
                    <Pressable 
                       style={({ pressed }) => [styles.sendBtn, (!message.trim() || sendMessageMutation.isPending) && styles.sendBtnDisabled, pressed && { opacity: 0.7 }]} 
                       disabled={!message.trim() || sendMessageMutation.isPending} 
                       onPress={() => sendMessageMutation.mutate({ content: message.trim(), replyToId: replyingTo?.id })}
                       hitSlop={10}
                    >
                     <PaperPlaneRight color="white" size={20} weight="fill" />
                    </Pressable>
                    </View>

            </View>
        )}
      </KeyboardAvoidingView>

      <Modal visible={previewVisible} transparent={false} animationType="slide" onRequestClose={() => setPreviewVisible(false)}>
        <View style={[styles.previewContainer, { paddingTop: insets.top }]}>
          <View style={styles.previewHeader}>
            <Pressable 
                onPress={() => setPreviewVisible(false)} 
                style={({ pressed }) => [styles.previewCloseBtn, pressed && { opacity: 0.7 }]}
                hitSlop={10}
            >
                <X size={28} color={theme.colors.textPrimary} weight="bold" />
            </Pressable>
            <Text style={styles.previewTitle} numberOfLines={1}>{previewData?.fileName || 'Preview'}</Text>
            <Pressable 
                onPress={() => previewData && downloadAndViewFile(previewData.url, previewData.fileName || 'file', previewData.id || '')} 
                style={({ pressed }) => [styles.previewActionBtn, pressed && { opacity: 0.7 }]}
                hitSlop={10}
            >
                {downloadingFileId === previewData?.id ? <ActivityIndicator size="small" color={theme.colors.primary} /> : <DownloadSimple size={24} color={theme.colors.primary} weight="bold" />}
            </Pressable>
          </View>
          <View style={styles.previewContent}>
            {previewData?.type === 'IMAGE' ? <Image source={{ uri: previewData.url }} style={styles.previewImage} resizeMode="contain" /> : <WebView source={{ uri: Platform.OS === 'android' ? `https://docs.google.com/viewer?url=${encodeURIComponent(previewData?.url || '')}&embedded=true` : previewData?.url || '' }} style={styles.previewWebview} startInLoadingState={true} renderLoading={() => <ActivityIndicator size="large" color={theme.colors.primary} style={styles.previewLoader} />} scalesPageToFit={true} />}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
