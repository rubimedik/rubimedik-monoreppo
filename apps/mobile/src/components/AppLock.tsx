import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { useSecurityStore } from '../store/useSecurityStore';
import { useAppTheme } from '../hooks/useAppTheme';
import { Fingerprint, Key, Backspace, Smiley } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';

export const AppLock = ({ children }: { children: React.ReactNode }) => {
    const { theme, isDarkMode } = useAppTheme();
    const { isPinEnabled, isBiometricsEnabled, verifyPin, authenticate, supportedBiometrics } = useSecurityStore();
    
    const [isLocked, setIsLocked] = useState(false);
    const [enteredPin, setEnteredPin] = useState('');
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const isFaceID = supportedBiometrics.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);

    useEffect(() => {
        if (isPinEnabled) {
            setIsLocked(true);
            if (isBiometricsEnabled) {
                handleBiometricAuth();
            }
        }
    }, [isPinEnabled]);

    const handleBiometricAuth = async () => {
        setIsAuthenticating(true);
        const success = await authenticate();
        if (success) {
            setIsLocked(false);
        }
        setIsAuthenticating(false);
    };

    const handleKeyPress = async (val: string) => {
        if (enteredPin.length >= 4) return;
        
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const newPin = enteredPin + val;
        setEnteredPin(newPin);

        if (newPin.length === 4) {
            const valid = await verifyPin(newPin);
            if (valid) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setIsLocked(false);
                setEnteredPin('');
            } else {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert('Incorrect PIN', 'The PIN you entered is incorrect.');
                setEnteredPin('');
            }
        }
    };

    const handleBackspace = () => {
        setEnteredPin(prev => prev.slice(0, -1));
    };

    if (!isLocked) return <>{children}</>;

    return (
        <Animated.View 
            entering={FadeIn} 
            exiting={FadeOut}
            style={[styles.container, { backgroundColor: theme.colors.background }]}
        >
            <View style={styles.header}>
                <View style={styles.iconCircle}>
                    <Key size={32} color={theme.colors.primary} weight="fill" />
                </View>
                <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Welcome Back</Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                    Enter your PIN to unlock RubiMedik
                </Text>
            </View>

            <View style={styles.pinDots}>
                {[1, 2, 3, 4].map(idx => (
                    <View 
                        key={idx} 
                        style={[
                            styles.dot, 
                            { borderColor: theme.colors.border },
                            enteredPin.length >= idx && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                        ]} 
                    />
                ))}
            </View>

            <View style={styles.numpad}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <TouchableOpacity 
                        key={num} 
                        style={[styles.numBtn, { backgroundColor: isDarkMode ? '#1C1C1E' : '#F2F2F7' }]}
                        onPress={() => handleKeyPress(String(num))}
                    >
                        <Text style={[styles.numText, { color: theme.colors.textPrimary }]}>{num}</Text>
                    </TouchableOpacity>
                ))}
                
                <TouchableOpacity 
                    style={[styles.numBtn, { backgroundColor: 'transparent' }]}
                    onPress={handleBiometricAuth}
                >
                    {isFaceID ? (
                        <Smiley size={32} color={theme.colors.primary} weight="fill" />
                    ) : (
                        <Fingerprint size={28} color={theme.colors.primary} weight="fill" />
                    )}
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.numBtn, { backgroundColor: isDarkMode ? '#1C1C1E' : '#F2F2F7' }]}
                    onPress={() => handleKeyPress('0')}
                >
                    <Text style={[styles.numText, { color: theme.colors.textPrimary }]}>0</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.numBtn, { backgroundColor: 'transparent' }]}
                    onPress={handleBackspace}
                >
                    <Backspace size={28} color={theme.colors.textSecondary} />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        paddingTop: 100,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#D32F2F15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
    },
    pinDots: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 60,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
    },
    numpad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: 280,
        justifyContent: 'center',
        gap: 20,
    },
    numBtn: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
    },
    numText: {
        fontSize: 28,
        fontWeight: '600',
    }
});
