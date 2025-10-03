import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LogoProps {
  size?: number;
  imageUrl?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 120, imageUrl }) => {
  const [imageError, setImageError] = useState(false);

  // If imageUrl is provided and no error, use the image instead of programmatic logo
  if (imageUrl && !imageError) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Image
          source={{ uri: imageUrl }}
          style={[styles.logoImage, { width: size, height: size }]}
          resizeMode="contain"
          onError={(error) => {
            console.log('Image load error:', error);
            setImageError(true);
          }}
          onLoad={() => {
            console.log('Image loaded successfully');
          }}
        />
      </View>
    );
  }

  // Fallback to programmatic logo
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer Arc - Thick rounded line with gradient */}
      <View style={[styles.outerArcContainer, { width: size, height: size }]}>
        <LinearGradient
          colors={['#007AFF', '#8A2BE2', '#FF69B4', '#FF6B35']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.outerArc}
        />
      </View>
      
      {/* Inner curved line - thinner, connecting left to top-center */}
      <View style={[styles.innerCurveContainer, { width: size * 0.85, height: size * 0.85 }]}>
        <LinearGradient
          colors={['#007AFF', '#8A2BE2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.innerCurve}
        />
      </View>
      
      {/* Connection line from top-center to top-right */}
      <View style={[styles.topConnectionContainer, { width: size * 0.35, height: size * 0.35 }]}>
        <LinearGradient
          colors={['#007AFF', '#8A2BE2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topConnection}
        />
      </View>
      
      {/* Central triangle/play symbol - left side blue, right side curved pink/orange */}
      <View style={[styles.triangleContainer, { width: size * 0.2, height: size * 0.2 }]}>
        <LinearGradient
          colors={['#007AFF', '#FF69B4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.triangle}
        />
      </View>
      
      {/* Curved right side of triangle connecting to pink dot */}
      <View style={[styles.triangleCurveContainer, { width: size * 0.25, height: size * 0.25 }]}>
        <LinearGradient
          colors={['#FF69B4', '#FF6B35']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.triangleCurve}
        />
      </View>
      
      {/* Bottom connection from pink dot to orange arc */}
      <View style={[styles.bottomConnectionContainer, { width: size * 0.2, height: size * 0.2 }]}>
        <LinearGradient
          colors={['#FF69B4', '#FF6B35']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bottomConnection}
        />
      </View>
      
      {/* Four Nodes/Dots - positioned exactly as in the image */}
      <View style={[styles.dot, styles.dot1, { backgroundColor: '#007AFF' }]} />
      <View style={[styles.dot, styles.dot2, { backgroundColor: '#8A2BE2' }]} />
      <View style={[styles.dot, styles.dot3, { backgroundColor: '#FF69B4' }]} />
      <View style={[styles.dot, styles.dot4, { backgroundColor: '#007AFF' }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  outerArcContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerArc: {
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    borderWidth: 16,
    borderColor: 'transparent',
    borderTopColor: '#007AFF',
    borderRightColor: '#8A2BE2',
    borderBottomColor: '#FF69B4',
    borderLeftColor: '#FF6B35',
    transform: [{ rotate: '-45deg' }],
  },
  innerCurveContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCurve: {
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    borderWidth: 8,
    borderColor: 'transparent',
    borderTopColor: '#007AFF',
    borderRightColor: '#8A2BE2',
    transform: [{ rotate: '-30deg' }],
  },
  topConnectionContainer: {
    position: 'absolute',
    top: '18%',
    right: '25%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topConnection: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    transform: [{ rotate: '20deg' }],
  },
  triangleContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  triangle: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    transform: [{ rotate: '-45deg' }],
  },
  triangleCurveContainer: {
    position: 'absolute',
    bottom: '25%',
    right: '15%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  triangleCurve: {
    width: '100%',
    height: 5,
    borderRadius: 3,
    transform: [{ rotate: '45deg' }],
  },
  bottomConnectionContainer: {
    position: 'absolute',
    bottom: '12%',
    right: '30%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomConnection: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    transform: [{ rotate: '35deg' }],
  },
  dot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  dot1: {
    top: '5%',
    left: '5%',
  },
  dot2: {
    top: '8%',
    right: '8%',
  },
  dot3: {
    bottom: '5%',
    alignSelf: 'center',
  },
  dot4: {
    top: '25%',
    alignSelf: 'center',
  },
});

export default Logo; 