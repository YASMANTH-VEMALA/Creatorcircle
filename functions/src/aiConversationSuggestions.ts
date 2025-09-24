import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

interface ConversationRequest {
  currentUserProfile: {
    name: string;
    skills: string[];
    interests: string[];
    college?: string;
    aboutMe?: string;
  };
  otherUserProfile: {
    name: string;
    skills: string[];
    interests: string[];
    college?: string;
    aboutMe?: string;
  };
  chatHistory: any[];
}

interface ConversationSuggestion {
  message: string;
  context: string;
  confidence: number;
}

/**
 * Generate conversation suggestions using Firebase AI
 */
export const generateConversationSuggestions = onCall(
  { region: 'us-central1' },
  async (request): Promise<{ suggestions: ConversationSuggestion[] }> => {
    try {
      const { currentUserProfile, otherUserProfile, chatHistory } = request.data as ConversationRequest;

      if (!currentUserProfile || !otherUserProfile) {
        throw new HttpsError('invalid-argument', 'User profiles are required');
      }

      logger.info('Generating conversation suggestions', {
        currentUser: currentUserProfile.name,
        otherUser: otherUserProfile.name,
        chatHistoryLength: chatHistory.length
      });

      // Generate suggestions based on profiles and chat history
      const suggestions = generateSmartSuggestions(currentUserProfile, otherUserProfile, chatHistory);

      return { suggestions };
    } catch (error) {
      logger.error('Error generating conversation suggestions:', error);
      throw new HttpsError('internal', 'Failed to generate conversation suggestions');
    }
  }
);

/**
 * Generate smart conversation suggestions based on user profiles
 */
function generateSmartSuggestions(
  currentUser: ConversationRequest['currentUserProfile'],
  otherUser: ConversationRequest['otherUserProfile'],
  chatHistory: any[]
): ConversationSuggestion[] {
  const otherName = otherUser.name || 'there';
  const otherSkills = otherUser.skills || [];
  const otherInterests = otherUser.interests || [];
  const otherCollege = otherUser.college || '';
  const currentSkills = currentUser.skills || [];
  const currentInterests = currentUser.interests || [];

  // Find common skills and interests
  const commonSkills = currentSkills.filter(skill => 
    otherSkills.some(otherSkill => 
      otherSkill.toLowerCase().includes(skill.toLowerCase()) || 
      skill.toLowerCase().includes(otherSkill.toLowerCase())
    )
  );

  const commonInterests = currentInterests.filter(interest => 
    otherInterests.some(otherInterest => 
      otherInterest.toLowerCase().includes(interest.toLowerCase()) || 
      interest.toLowerCase().includes(otherInterest.toLowerCase())
    )
  );

  const suggestions: ConversationSuggestion[] = [];

  // If there's chat history, generate contextual responses
  if (chatHistory.length > 0) {
    const lastMessage = chatHistory[chatHistory.length - 1];
    const messageText = lastMessage?.message || lastMessage?.text || lastMessage || '';
    
    suggestions.push(...generateContextualSuggestions(messageText, otherName));
  }

  // Generate profile-based suggestions
  suggestions.push(...generateProfileBasedSuggestions(
    currentUser, 
    otherUser, 
    commonSkills, 
    commonInterests
  ));

  // Ensure we have at least 5 suggestions
  while (suggestions.length < 5) {
    suggestions.push(generateGenericSuggestion(otherName, otherSkills, otherInterests));
  }

  return suggestions.slice(0, 7); // Return max 7 suggestions
}

/**
 * Generate contextual suggestions based on the last message
 */
function generateContextualSuggestions(lastMessage: string, otherName: string): ConversationSuggestion[] {
  const message = lastMessage.toLowerCase();
  const suggestions: ConversationSuggestion[] = [];

  if (message.includes('how are you') || message.includes('how\'s it going')) {
    suggestions.push({
      message: "I'm doing great, thanks for asking! How about you?",
      context: 'Response',
      confidence: 0.9
    });
    suggestions.push({
      message: "Pretty good! What have you been working on lately?",
      context: 'Response',
      confidence: 0.8
    });
  }

  if (message.includes('work') || message.includes('project')) {
    suggestions.push({
      message: "That sounds really interesting! Tell me more about it",
      context: 'Response',
      confidence: 0.9
    });
    suggestions.push({
      message: "What kind of project is it? I'd love to hear more details",
      context: 'Response',
      confidence: 0.8
    });
  }

  if (message.includes('thanks') || message.includes('thank you')) {
    suggestions.push({
      message: "You're welcome! Happy to help",
      context: 'Response',
      confidence: 0.9
    });
    suggestions.push({
      message: "No problem at all! Let me know if you need anything else",
      context: 'Response',
      confidence: 0.8
    });
  }

  if (message.includes('collaborate') || message.includes('work together')) {
    suggestions.push({
      message: "I'd love to collaborate! What did you have in mind?",
      context: 'Response',
      confidence: 0.9
    });
    suggestions.push({
      message: "That sounds exciting! I'm definitely interested",
      context: 'Response',
      confidence: 0.8
    });
  }

  return suggestions;
}

/**
 * Generate profile-based conversation starters
 */
function generateProfileBasedSuggestions(
  currentUser: ConversationRequest['currentUserProfile'],
  otherUser: ConversationRequest['otherUserProfile'],
  commonSkills: string[],
  commonInterests: string[]
): ConversationSuggestion[] {
  const otherName = otherUser.name || 'there';
  const otherSkills = otherUser.skills || [];
  const otherInterests = otherUser.interests || [];
  const otherCollege = otherUser.college || '';
  const currentSkills = currentUser.skills || [];

  const suggestions: ConversationSuggestion[] = [];

  // Common skills suggestions
  if (commonSkills.length > 0) {
    const skill = commonSkills[0];
    suggestions.push({
      message: `Hey ${otherName}! I noticed we both work with ${skill} - that's awesome! I'd love to learn more about your experience`,
      context: 'Skills-based',
      confidence: 0.9
    });
  }

  // Common interests suggestions
  if (commonInterests.length > 0) {
    const interest = commonInterests[0];
    suggestions.push({
      message: `Hi ${otherName}! I'm also really into ${interest}. Maybe we could share ideas or collaborate on something?`,
      context: 'Interest-based',
      confidence: 0.8
    });
  }

  // College/background suggestions
  if (otherCollege) {
    suggestions.push({
      message: `Hey ${otherName}! Your ${otherCollege} background caught my attention. Would love to connect and learn more about your journey!`,
      context: 'Background-based',
      confidence: 0.8
    });
  }

  // Skills-based suggestions
  if (otherSkills.length > 0) {
    const skill = otherSkills[0];
    suggestions.push({
      message: `Hi ${otherName}! I'd love to hear about your work with ${skill}. What's your favorite part about it?`,
      context: 'Skills-based',
      confidence: 0.7
    });
  }

  // Interest-based suggestions
  if (otherInterests.length > 0) {
    const interest = otherInterests[0];
    suggestions.push({
      message: `Hey there! I'm curious about your interest in ${interest}. What got you started with that?`,
      context: 'Interest-based',
      confidence: 0.7
    });
  }

  // Collaboration suggestions
  if (currentSkills.length > 0 && otherSkills.length > 0) {
    const currentSkill = currentSkills[0];
    const otherSkill = otherSkills[0];
    suggestions.push({
      message: `Hi ${otherName}! I work with ${currentSkill} and noticed you're into ${otherSkill}. I think we could create something amazing together!`,
      context: 'Collaboration',
      confidence: 0.6
    });
  }

  return suggestions;
}

/**
 * Generate a generic conversation starter
 */
function generateGenericSuggestion(
  otherName: string, 
  otherSkills: string[], 
  otherInterests: string[]
): ConversationSuggestion {
  const suggestions = [
    `Hi ${otherName}! Love connecting with fellow creators. What's your latest project?`,
    `Hey there! What's the most exciting thing you're working on right now?`,
    `Hi ${otherName}! I'd love to hear about your creative journey and what inspires you`,
    `Hey! What's your favorite part about being a creator?`,
    `Hi there! What's the most interesting project you've worked on recently?`,
    `Hey ${otherName}! What's something you're really passionate about right now?`,
    `Hi! What's the coolest thing you've learned or created lately?`
  ];

  const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
  
  return {
    message: randomSuggestion,
    context: 'General',
    confidence: 0.5
  };
}
