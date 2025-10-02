import React, { useState } from 'react';
import { View, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ImageUtils } from '../../utils/imageUtils';

interface AvatarProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  source?: string;
  fallback?: string;
  verified?: boolean;
  style?: ViewStyle;
}

interface AvatarImageProps {
  source: string;
  size: 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle;
  onFail?: () => void;
}

interface AvatarFallbackProps {
  text: string;
  size: 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle;
}

interface VerifiedBadgeProps {
  size: 'small' | 'medium' | 'large' | 'xlarge';
}

const AvatarImage: React.FC<AvatarImageProps> = ({ source, size, style, onFail }) => {
  const sizeConfig = getSizeConfig(size);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Validate and clean the image URL
  const validatedSource = ImageUtils.validateImageUrl(source);
  
  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };
  
  const handleLoadEnd = () => {
    setIsLoading(false);
  };
  
  const handleError = (error: any) => {
    console.warn('Avatar image failed to load:', { source, validatedSource, error });
    setIsLoading(false);
    setHasError(true);
    if (onFail) onFail();
  };
  
  return (
    <View style={{ position: 'relative' }}>
      <Image
        source={{ uri: validatedSource }}
        style={[
          styles.avatarImage,
          {
            width: sizeConfig.size,
            height: sizeConfig.size,
            borderRadius: sizeConfig.size / 2,
          },
          style,
        ]}
        placeholder={require('../../../assets/icon.png') as any}
        contentFit="cover"
        cachePolicy="disk"
        transition={150}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <View
          style={[
            styles.loadingOverlay,
            {
              width: sizeConfig.size,
              height: sizeConfig.size,
              borderRadius: sizeConfig.size / 2,
            },
          ]}
        >
          <ActivityIndicator 
            size={sizeConfig.size > 60 ? "large" : "small"} 
            color="#FFD700" 
          />
        </View>
      )}
    </View>
  );
};

const AvatarFallback: React.FC<AvatarFallbackProps> = ({ text, size, style }) => {
  const sizeConfig = getSizeConfig(size);
  
  return (
    <View
      style={[
        styles.avatarFallback,
        {
          width: sizeConfig.size,
          height: sizeConfig.size,
          borderRadius: sizeConfig.size / 2,
        },
        style,
      ]}
    >
      <Text style={[styles.fallbackText, { fontSize: sizeConfig.fontSize }]}>
        {text}
      </Text>
    </View>
  );
};

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ size }) => {
  const sizeConfig = getSizeConfig(size);
  
  return (
    <View
      style={[
        styles.verifiedBadge,
        {
          width: sizeConfig.badgeSize,
          height: sizeConfig.badgeSize,
          borderRadius: sizeConfig.badgeSize / 2,
        },
      ]}
    >
      <Ionicons
        name="checkmark-circle"
        size={sizeConfig.badgeIconSize}
        color="#FFFFFF"
      />
    </View>
  );
};

const getSizeConfig = (size: 'small' | 'medium' | 'large' | 'xlarge') => {
  switch (size) {
    case 'small':
      return { size: 40, fontSize: 14, badgeSize: 16, badgeIconSize: 10 };
    case 'medium':
      return { size: 50, fontSize: 16, badgeSize: 20, badgeIconSize: 12 };
    case 'large':
      return { size: 70, fontSize: 24, badgeSize: 24, badgeIconSize: 14 };
    case 'xlarge':
      return { size: 120, fontSize: 36, badgeSize: 32, badgeIconSize: 18 };
    default:
      return { size: 50, fontSize: 16, badgeSize: 20, badgeIconSize: 12 };
  }
};

const Avatar: React.FC<AvatarProps> = ({
  size = 'medium',
  source,
  fallback = 'U',
  verified = false,
  style,
}) => {
  const sizeConfig = getSizeConfig(size);
  const [failed, setFailed] = React.useState(false);
  
  // Validate the source URL before using it
  const shouldShowImage = source && 
    source.trim() !== '' && 
    source !== 'undefined' && 
    source !== 'null';
  
  return (
    <View style={[styles.container, style]}>
      {shouldShowImage && !failed ? (
        <AvatarImage source={source} size={size} onFail={() => setFailed(true)} />
      ) : (
        <AvatarFallback text={fallback} size={size} />
      )}
      
      {verified && (
        <VerifiedBadge size={size} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatarImage: {
    resizeMode: 'cover',
  },
  avatarFallback: {
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

export { Avatar, AvatarImage, AvatarFallback, VerifiedBadge }; 