import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AgoraUIKit from 'agora-rn-uikit';
import { useNavigation, useRoute } from '@react-navigation/native';

const AgoraCallScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const { 
    channelName = 'test-channel', 
    token = null,
    appId = process.env.EXPO_PUBLIC_AGORA_APP_ID,
    remainingSeconds = 1800 
  } = (route.params as any) || {};

  const [videoCall, setVideoCall] = useState(true);
  const [timeLeft, setRemainingTime] = useState(remainingSeconds);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (videoCall && timeLeft > 0) {
      interval = setInterval(() => {
        setRemainingTime(prev => {
            if (prev <= 1) {
                clearInterval(interval);
                Alert.alert('Session Ended', 'Your consultation time has expired.');
                setVideoCall(false);
                navigation.goBack();
                return 0;
            }
            return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [videoCall]);

  const connectionData = {
    appId: appId || '',
    channel: channelName,
    token: token,
    rtmToken: null, // Disable RTM
  };

  const rtcCallbacks = {
    EndCall: () => {
      console.log(`Call ended. Time remaining: ${timeLeft} seconds`);
      setVideoCall(false);
      navigation.goBack();
    },
    UserJoined: (uid: number) => {
        console.log('Remote user joined:', uid);
    }
  };

  if (!appId || appId === 'undefined' || appId === 'YOUR_AGORA_APP_ID') {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Agora App ID not configured</Text>
        <Text style={styles.subErrorText}>
          Make sure EXPO_PUBLIC_AGORA_APP_ID is set in apps/mobile/.env and restart Metro.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[
          styles.timerContainer, 
          timeLeft < 120 && { backgroundColor: '#D32F2F' }
      ]}>
         <Text style={styles.timerText}>
            {timeLeft < 300 ? 'Remaining: ' : ''}
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
         </Text>
      </View>
      {videoCall ? (
        <AgoraUIKit 
          connectionData={connectionData} 
          rtcCallbacks={rtcCallbacks}
          settings={{
            displayRtmOptions: false,
          }}
          styleProps={{
            container: { flex: 1 },
            localVideoContainer: { width: 120, height: 160, bottom: 100, right: 10 },
          }}
        />
      ) : (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D32F2F" />
          <Text style={styles.loadingText}>Ending Call...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  timerContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  timerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subErrorText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});

export default AgoraCallScreen;
