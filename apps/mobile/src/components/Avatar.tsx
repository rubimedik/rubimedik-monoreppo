import React from 'react';
import { 
  View, 
  Image, 
  Text, 
  StyleSheet, 
  ViewStyle 
} from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { CheckCircle } from 'phosphor-react-native';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
  isVerified?: boolean;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 48,
  isVerified = false,
  style,
}) => {
  const { theme } = useAppTheme();
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : '?';

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {uri ? (
        <Image 
          source={{ uri }} 
          style={[styles.image, { borderRadius: size / 2 }]} 
        />
      ) : (
        <View style={[
          styles.placeholder, 
          { 
            borderRadius: size / 2,
            backgroundColor: theme.colors.lightRedTint 
          }
        ]}>
          <Text style={[
            styles.initials, 
            { 
              fontSize: size * 0.4,
              color: theme.colors.primary,
              fontFamily: theme.typography.fontFamilyBold 
            }
          ]}>
            {initials}
          </Text>
        </View>
      )}
      {isVerified === true ? (
        <View style={[styles.verifiedBadge, { backgroundColor: theme.colors.surface }]}>
          <CheckCircle 
            color="#1976D2" 
            size={size * 0.3} 
            weight="fill" 
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    // Colors moved to inline for dynamic support
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderRadius: 10,
  },
});
