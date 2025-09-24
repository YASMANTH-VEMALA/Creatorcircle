import React, { useEffect, useRef } from 'react';
import { View, Animated, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScroll } from '../contexts/ScrollContext';
import NotificationIndicator from './NotificationIndicator';

const AnimatedTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const { addScrollListener, removeScrollListener } = useScroll();
  const insets = useSafeAreaInsets();

  // Detect if device has gesture navigation (Android)
  const hasGestureNavigation = Platform.OS === 'android' && insets.bottom > 0;
  
  // Calculate dynamic bottom position
  const getBottomPosition = () => {
    if (Platform.OS === 'android' && hasGestureNavigation) {
      // Position above gesture bar with some padding
      // Add extra padding for better visual separation
      return insets.bottom + 12;
    }
    // Default position for devices without gestures
    return 16;
  };

  // Debug logging for gesture detection (remove in production)
  useEffect(() => {
    if (__DEV__) {
      console.log('Gesture Navigation Detection:', {
        platform: Platform.OS,
        bottomInset: insets.bottom,
        hasGestureNavigation,
        calculatedBottom: getBottomPosition(),
      });
    }
  }, [insets.bottom, hasGestureNavigation]);

  // Listen to scroll events from screens
  useEffect(() => {
    const handleScroll = (scrollY: number) => {
      // Hide tab bar when scrolling down (any amount)
      if (scrollY > lastScrollY.current && scrollY > 5) {
        Animated.timing(translateY, {
          toValue: 150, // Move further down to completely hide
          duration: 150, // Faster animation
          useNativeDriver: true,
        }).start();
      }
      
      // Show tab bar when scrolling up or at top
      if (scrollY < lastScrollY.current || scrollY <= 5) {
        Animated.timing(translateY, {
          toValue: 0,
          duration: 150, // Faster animation
          useNativeDriver: true,
        }).start();
      }
      
      lastScrollY.current = scrollY;
      
      // Clear existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      
      // Show tab bar after scrolling stops (faster)
      scrollTimeout.current = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200, // Fast return animation
          useNativeDriver: true,
        }).start();
      }, 100); // Reduced delay for faster response
    };

    addScrollListener(handleScroll);
    
    return () => {
      removeScrollListener(handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [addScrollListener, removeScrollListener, translateY]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          bottom: getBottomPosition(),
        },
      ]}
    >
        {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined
          ? options.tabBarLabel
          : options.title !== undefined
          ? options.title
          : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        let iconName: keyof typeof Ionicons.glyphMap;
        if (route.name === 'Home') {
          iconName = isFocused ? 'home' : 'home-outline';
        } else if (route.name === 'FindPeople') {
          iconName = isFocused ? 'people' : 'people-outline';
        } else if (route.name === 'Post') {
          iconName = isFocused ? 'add-circle' : 'add-circle-outline';
        } else if (route.name === 'More') {
          iconName = isFocused ? 'menu' : 'menu-outline';
        } else if (route.name === 'Profile') {
          iconName = isFocused ? 'person' : 'person-outline';
        } else {
          iconName = 'help-outline';
        }

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={iconName}
                size={24}
                color={isFocused ? '#007AFF' : '#8E8E93'}
              />
              {route.name === 'More' && (
                <NotificationIndicator size="small" showCount={false} />
              )}
            </View>
            <Text style={[styles.label, { color: isFocused ? '#007AFF' : '#8E8E93' }]}>
              {typeof label === 'string' ? label : route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    marginHorizontal: 16,
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    flexDirection: 'row',
    paddingBottom: 8,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 2,
  },
  iconContainer: {
    position: 'relative',
    padding: 4,
    borderRadius: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default AnimatedTabBar; 