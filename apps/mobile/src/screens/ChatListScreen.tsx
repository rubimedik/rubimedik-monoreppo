import React, { useState, useMemo } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    ActivityIndicator, 
    Platform, 
    TextInput,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { Avatar } from '../components/Avatar';
import { ChatTeardropDots, MagnifyingGlass, Check, Checks } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { format, isToday, isYesterday, isValid } from 'date-fns';
import { getDisplayName } from '../utils/userUtils';

export const ChatListScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: chatRooms, isLoading, refetch } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: async () => {
      try {
        const res = await api.get('/chat/rooms');
        return res.data || [];
      } catch (err) {
        return [];
      }
    },
    enabled: !!user?.id,
    refetchInterval: 10000, // Refetch every 10s to update unread counts/last messages
  });

  const filteredRooms = useMemo(() => {
    if (!searchQuery) return chatRooms;
    return chatRooms?.filter((room: any) => 
        room.partner?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [chatRooms, searchQuery]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 15,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
      fontSize: 32,
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.fontFamilyBold,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDarkMode ? '#1C1C1E' : '#F2F2F7',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: theme.colors.textPrimary,
        fontFamily: theme.typography.fontFamily,
    },
    listContent: {
      paddingBottom: Platform.OS === 'ios' ? 120 : 100,
    },
    chatItem: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      height: 72,
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    avatarContainer: {
      position: 'relative',
    },
    statusDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4ADE80',
        borderWidth: 2,
        borderColor: theme.colors.background,
    },
    contentContainer: {
      flex: 1,
      marginLeft: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: isDarkMode ? '#2C2C2E' : '#E5E5EA',
      height: '100%',
      justifyContent: 'center',
      paddingRight: 4,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    nameText: {
      fontSize: 17,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.textSecondary,
    },
    timeText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontFamily: theme.typography.fontFamily,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    messagePreview: {
      fontSize: 15,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary, // We'll make this textPrimary if unread later
      flex: 1,
      marginRight: 10,
    },
    unreadBadge: {
        backgroundColor: '#25D366', // WhatsApp Green
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadText: {
        color: 'white',
        fontSize: 12,
        fontFamily: theme.typography.fontFamilyBold,
    },
    emptyContainer: {
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 64,
    },
    emptyText: {
      marginTop: 16,
      fontSize: 16,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    }
  }), [theme, isDarkMode]);

  const formatMessageTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (!isValid(date)) return '';
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'dd/MM/yyyy');
  };

  const renderStatusTicks = (item: any) => {
      if (item.readAt) return <Checks size={16} color="#34B7F1" weight="bold" />;
      if (item.deliveredAt) return <Checks size={16} color={isDarkMode ? '#8E8E93' : '#999'} weight="bold" />;
      return <Check size={16} color={isDarkMode ? '#8E8E93' : '#999'} weight="bold" />;
  };

  const renderItem = ({ item }: { item: any }) => {
    const hasUnread = item.unreadCount > 0;
    const partnerName = getDisplayName(item.partner);
    
    return (
      <TouchableOpacity 
        style={styles.chatItem}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Chat', { 
            roomId: item.id, 
            otherUserName: partnerName,
            otherPhone: item.partner.phone,
            isSupport: item.isSupport,
            ticketStatus: item.ticketStatus
        })}
      >
        <View style={styles.avatarContainer}>
          <Avatar uri={item.partner?.avatarUrl} name={partnerName} size={48} />
          <View style={styles.statusDot} />
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.topRow}>
            <Text style={[styles.nameText, hasUnread && { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamilyBold }]} numberOfLines={1}>
              {partnerName}
            </Text>
            <Text style={[styles.timeText, hasUnread && { color: '#25D366', fontFamily: theme.typography.fontFamilyBold }]}>
                {formatMessageTime(item.lastMessage?.createdAt)}
            </Text>
          </View>
          
          <View style={styles.bottomRow}>
            <Text 
                style={[
                  styles.messagePreview, 
                  hasUnread ? { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamilySemiBold } : { color: theme.colors.textSecondary }
                ]} 
                numberOfLines={1}
            >{item.lastMessage?.senderId === user?.id ? 'You: ' : ''}{item.lastMessage?.content || 'No messages yet'}</Text>
            
            {hasUnread && (
                <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
            <Text style={styles.title}>Chats</Text>
            {/* Placeholder for header actions if any */}
        </View>
        
        <View style={styles.searchContainer}>
            <MagnifyingGlass size={20} color={theme.colors.textSecondary} />
            <TextInput 
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor={theme.colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                selectionColor={theme.colors.primary}
            />
        </View>
      </View>
      
      {isLoading && !chatRooms ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.primary} />
      ) : (
        <FlatList
          data={filteredRooms}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
                refreshing={isLoading} 
                onRefresh={refetch} 
                tintColor={theme.colors.primary} 
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ChatTeardropDots size={64} color={theme.colors.border} weight="light" />
              <Text style={styles.emptyText}>
                {searchQuery ? `No chats matching "${searchQuery}"` : 'No active chats found.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};
