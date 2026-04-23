import React, { useMemo, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Share,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { Skeleton } from '../components/Skeleton';
import { Avatar } from '../components/Avatar';
import { BackButton } from '../components/BackButton';
import { ShareNetwork, Copy, Gift, Trophy } from 'phosphor-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../hooks/useAppTheme';
import * as Clipboard from 'expo-clipboard';

export const ReferralsScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.xl,
      gap: 16,
    },
    backBtn: {
      padding: 4,
    },
    title: {
      fontSize: 24,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.text,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: 40,
    },
    referralCard: {
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      padding: theme.spacing.xl,
      borderRadius: 24,
    },
    referralTitle: {
      color: theme.colors.white,
      fontSize: 20,
      fontFamily: theme.typography.fontFamilyBold,
      marginTop: 12,
      marginBottom: 8,
    },
    referralDesc: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 14,
      fontFamily: theme.typography.fontFamily,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    codeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.white,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      marginBottom: 20,
    },
    codeText: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamilyBold,
      color: '#0F172A', // Keep dark for contrast on white
      letterSpacing: 2,
    },
    copyBtn: {
      marginLeft: 12,
      padding: 4,
    },
    shareBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
    },
    shareBtnText: {
      color: theme.colors.white,
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 14,
    },
    statsRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginTop: theme.spacing.xl,
    },
    statCard: {
      flex: 1,
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.card,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 20,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.primary,
    },
    section: {
      marginTop: theme.spacing['2xl'],
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    referralItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surface,
    },
    referralName: {
      fontSize: 15,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.text,
    },
    referralDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    referralStatus: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilyBold,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    leaderboardCard: {
      padding: 32,
      alignItems: 'center',
      backgroundColor: theme.colors.card,
    },
    emptyText: {
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
    }
  }), [theme]);

  const { data: wallet, isLoading: isWalletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await api.get('/wallet/balance');
      return res.data;
    }
  });

  const { data: config } = useQuery({
    queryKey: ['admin-config'],
    queryFn: async () => {
      const res = await api.get('/admin/config');
      return res.data;
    }
  });

  const referralAmount = config?.referralPointValue || 500;

  const { data: referrals, isLoading: isReferralsLoading } = useQuery({
    queryKey: ['my-referrals'],
    queryFn: async () => {
      const res = await api.get('/referrals/invites');
      return res.data;
    }
  });

  const { data: leaderboard, isLoading: isLeaderboardLoading } = useQuery({
    queryKey: ['referral-leaderboard'],
    queryFn: async () => {
      const res = await api.get('/referrals/leaderboard');
      return res.data;
    }
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      return res.data;
    }
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['wallet'] }),
      queryClient.invalidateQueries({ queryKey: ['my-referrals'] }),
      queryClient.invalidateQueries({ queryKey: ['profile'] }),
      queryClient.invalidateQueries({ queryKey: ['referral-leaderboard'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-config'] }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  const referralCode = profile?.referralCode || user?.referralCode || '';

  const handleCopy = async () => {
    if (referralCode) {
      await Clipboard.setStringAsync(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on Rubimedik and get health rewards! Use my code: ${referralCode}`,
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title}>Refer & Earn</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Referral Card */}
        <Card style={styles.referralCard}>
          <Gift color={theme.colors.white} size={40} weight="fill" />
          <Text style={styles.referralTitle}>Invite your friends</Text>
          <Text style={styles.referralDesc}>
            Earn ₦{referralAmount} for every friend who signs up and completes their first consultation.
          </Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{referralCode || 'Generating...'}</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
              {copied ? (
                <CheckCircle color={theme.colors.success} size={20} weight="fill" />
              ) : (
                <Copy color={theme.colors.primary} size={20} />
              )}
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <ShareNetwork color={theme.colors.white} size={20} />
            <Text style={styles.shareBtnText}>Share Invitation</Text>
          </TouchableOpacity>
        </Card>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard} variant="outlined">
            <Text style={styles.statLabel}>Points</Text>
            <Text style={styles.statValue}>{wallet?.points || 0}</Text>
          </Card>
          <Card style={styles.statCard} variant="outlined">
            <Text style={styles.statLabel}>Referrals</Text>
            <Text style={styles.statValue}>{referrals?.length || 0}</Text>
          </Card>
        </View>

        {/* My Referrals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Referrals</Text>
          {isReferralsLoading ? (
            <Skeleton width="100%" height={60} style={{ marginBottom: 12 }} />
          ) : (
            referrals?.map((ref: any) => (
              <View key={ref.id} style={styles.referralItem}>
                <Avatar name={ref.fullName || ref.email} size={40} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.referralName}>{ref.fullName || 'New User'}</Text>
                  <Text style={styles.referralDate}>Joined {new Date(ref.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.referralStatus, { color: ref.status === 'COMPLETED' ? theme.colors.success : theme.colors.warning }]}>
                        {ref.status === 'COMPLETED' ? `+₦${referralAmount}` : 'Pending'}
                    </Text>
                    {ref.status !== 'COMPLETED' && (
                        <Text style={{ fontSize: 10, color: theme.colors.textSecondary }}>Awaiting booking</Text>
                    )}
                </View>
              </View>
            )) || <Text style={styles.emptyText}>No referrals yet.</Text>
          )}
        </View>

        {/* Leaderboard */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trophy color={theme.colors.warning} size={20} weight="fill" />
            <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8 }]}>Leaderboard</Text>
          </View>
          <Card style={styles.leaderboardCard} variant="flat">
            {isLeaderboardLoading ? (
                <ActivityIndicator color={theme.colors.primary} />
            ) : leaderboard?.length > 0 ? (
                leaderboard.map((item: any, index: number) => (
                    <View key={item.id} style={[styles.referralItem, { borderBottomWidth: index === leaderboard.length - 1 ? 0 : 1, width: '100%' }]}>
                        <Text style={{ fontSize: 16, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textSecondary, width: 30 }}>{index + 1}</Text>
                        <Avatar name={item.fullName} size={40} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.referralName}>{item.fullName || 'Anonymous'}</Text>
                            <Text style={styles.referralDate}>{item.referralCount} referrals</Text>
                        </View>
                        {index === 0 && <Trophy color={theme.colors.warning} size={20} weight="fill" />}
                    </View>
                ))
            ) : (
                <Text style={styles.emptyText}>No rankings yet.</Text>
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

