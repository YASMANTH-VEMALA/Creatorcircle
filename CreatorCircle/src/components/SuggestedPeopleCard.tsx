import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SuggestedUser } from '../services/suggestedPeopleService';

interface SuggestedPeopleCardProps {
  user: SuggestedUser;
}

const { width } = Dimensions.get('window');
const isMobile = width < 768;
const cardsPerRow = isMobile ? 2 : 4;
const cardWidth = (width - 40 - (cardsPerRow - 1) * 12) / cardsPerRow;

const SuggestedPeopleCard: React.FC<SuggestedPeopleCardProps> = ({
  user,
}) => {
  const navigation = useNavigation();
  const handleCardPress = () => {
    navigation.navigate('UserProfile' as never, { 
      userId: user.uid, 
      userName: user.name 
    } as never);
  };

  const getVerifiedBadgeColor = () => {
    switch (user.verifiedBadge) {
      case 'gold':
        return '#FFD700';
      case 'silver':
        return '#C0C0C0';
      default:
        return 'transparent';
    }
  };

  const renderSkillsAndInterests = () => {
    // Combine all types of matches for display
    const allItems = [
      ...user.sharedSkills,
      ...user.sharedInterests,
      ...user.skillsToInterests,
      ...user.interestsToSkills
    ];
    const displayItems = allItems.slice(0, 3);
    const remainingCount = allItems.length - 3;

    return (
      <View style={styles.skillsContainer}>
        {displayItems.map((item, index) => (
          <View key={index} style={styles.skillTag}>
            <Text style={styles.skillText}>{item}</Text>
          </View>
        ))}
        {remainingCount > 0 && (
          <Text style={styles.moreText}>+{remainingCount} more</Text>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity 
      style={[styles.card, { width: cardWidth }]}
      onPress={handleCardPress}
      activeOpacity={0.8}
    >
      {/* CreatorCircle Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          <Text style={styles.creatorText}>Creator</Text>
          <Text style={styles.circleText}>Circle</Text>
        </Text>
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Image
            source={
              user.profilePhotoUrl
                ? { uri: user.profilePhotoUrl }
                : { uri: 'https://via.placeholder.com/60x60/007AFF/FFFFFF?text=' + (user.name?.charAt(0) || 'U') }
            }
            style={styles.avatar}
            defaultSource={{ uri: 'https://via.placeholder.com/60x60/007AFF/FFFFFF?text=' + (user.name?.charAt(0) || 'U') }}
          />
          {user.verifiedBadge !== 'none' && (
            <View style={[styles.verifiedBadge, { backgroundColor: getVerifiedBadgeColor() }]}>
              <Ionicons name="checkmark" size={12} color="white" />
            </View>
          )}
        </View>

        <Text style={styles.name} numberOfLines={1}>
          {user.name}
        </Text>

        <Text style={styles.college} numberOfLines={1}>
          {user.college}
        </Text>

        {renderSkillsAndInterests()}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  banner: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  bannerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  creatorText: {
    color: 'white',
  },
  circleText: {
    color: '#FFD700', // Yellow color
  },
  profileSection: {
    padding: 12,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  college: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 4,
  },
  skillTag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  skillText: {
    fontSize: 10,
    color: '#666',
  },
  moreText: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default SuggestedPeopleCard; 