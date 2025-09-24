import { Profile } from '../types';

export interface ConversationSuggestion {
  message: string;
  context: string;
  confidence: number;
}

export interface ChatAnalysis {
  mood: string;
  behavior: string;
  interests: string[];
  communicationStyle: string;
  responseSuggestions: ConversationSuggestion[];
  analysis: string;
}

export class FirebaseAIService {
  private static instance: FirebaseAIService;
  private userId: string | null = null;
  private isInitialized: boolean = false;

  private constructor() {
    console.log('✅ Firebase AI Service initialized (using local AI)');
  }

  static getInstance(): FirebaseAIService {
    if (!FirebaseAIService.instance) {
      FirebaseAIService.instance = new FirebaseAIService();
    }
    return FirebaseAIService.instance;
  }

  /**
   * Initialize the Firebase AI service
   */
  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    this.isInitialized = true;
    console.log('🤖 Firebase AI Service initialized for user:', userId);
  }

  /**
   * Check if Firebase AI is available
   */
  isAIAvailable(): boolean {
    return this.isInitialized && !!this.userId;
  }

  /**
   * Generate conversation starters using local AI
   */
  async generateConversationStarters(
    currentUserProfile: Profile,
    otherUserProfile: Profile,
    chatHistory: any[] = []
  ): Promise<ConversationSuggestion[]> {
    console.log('🤖 Generating conversation starters with local AI:', {
      currentUser: currentUserProfile.name,
      otherUser: otherUserProfile.name,
      chatHistoryLength: chatHistory.length
    });

    try {
      if (!this.isAIAvailable()) {
        throw new Error('AI not available');
      }

      // Use local AI to generate suggestions
      return this.generateLocalSuggestions(currentUserProfile, otherUserProfile, chatHistory);
      
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      // Fallback to basic suggestions
      return this.getFallbackSuggestions(currentUserProfile, otherUserProfile, chatHistory);
    }
  }

  /**
   * Generate local AI suggestions based on profiles and chat history
   */
  private generateLocalSuggestions(
    currentUser: Profile,
    otherUser: Profile,
    chatHistory: any[]
  ): ConversationSuggestion[] {
    const otherName = otherUser.name || 'there';
    const otherSkills = otherUser.skills || [];
    const otherInterests = otherUser.interests || [];
    const otherCollege = otherUser.college || '';
    const currentSkills = currentUser.skills || [];
    const currentInterests = currentUser.interests || [];

    // Find common skills and interests
    const commonSkills = this.findCommonItems(currentSkills, otherSkills);
    const commonInterests = this.findCommonItems(currentInterests, otherInterests);

    const suggestions: ConversationSuggestion[] = [];

    // If there's chat history, generate contextual responses based on current user's perspective
    if (chatHistory.length > 0) {
      const lastMessage = this.getLastMessage(chatHistory);
      const lastMessageSender = this.getLastMessageSender(chatHistory);
      suggestions.push(...this.generateContextualSuggestions(
        lastMessage, 
        otherName, 
        currentUser, 
        otherUser,
        lastMessageSender === currentUser.uid
      ));
    }

    // Generate user-specific profile-based suggestions
    suggestions.push(...this.generateUserSpecificSuggestions(
      currentUser, 
      otherUser, 
      commonSkills, 
      commonInterests
    ));

    // Add conversation flow suggestions
    suggestions.push(...this.generateConversationFlowSuggestions(
      currentUser,
      otherUser,
      chatHistory
    ));

    // Ensure we have at least 5 suggestions with randomization
    while (suggestions.length < 5) {
      suggestions.push(this.generateGenericSuggestion(otherName, otherSkills, otherInterests, currentUser));
    }

    // Shuffle suggestions to avoid same order every time
    return this.shuffleArray(suggestions).slice(0, 7);
  }

  /**
   * Find common items between two arrays
   */
  private findCommonItems(array1: string[], array2: string[]): string[] {
    return array1.filter(item1 => 
      array2.some(item2 => 
        item2.toLowerCase().includes(item1.toLowerCase()) || 
        item1.toLowerCase().includes(item2.toLowerCase())
      )
    );
  }

  /**
   * Get the last message from chat history safely
   */
  private getLastMessage(chatHistory: any[]): string {
    if (chatHistory.length === 0) return '';
    
    const lastMessage = chatHistory[chatHistory.length - 1];
    if (!lastMessage) return '';
    
    return (lastMessage.message || lastMessage.text || lastMessage || '').toString();
  }

  /**
   * Get the sender ID of the last message
   */
  private getLastMessageSender(chatHistory: any[]): string | null {
    if (chatHistory.length === 0) return null;
    
    const lastMessage = chatHistory[chatHistory.length - 1];
    if (!lastMessage) return null;
    
    return lastMessage.senderId || lastMessage.userId || lastMessage.uid || null;
  }

  /**
   * Generate contextual suggestions based on the last message and user perspective
   */
  private generateContextualSuggestions(
    lastMessage: string, 
    otherName: string, 
    currentUser: Profile, 
    otherUser: Profile,
    isCurrentUserLastSender: boolean
  ): ConversationSuggestion[] {
    const message = lastMessage.toLowerCase();
    const suggestions: ConversationSuggestion[] = [];
    const currentName = currentUser.name || 'I';

    // If current user sent the last message, suggest follow-up questions
    if (isCurrentUserLastSender) {
      if (message.includes('how are you') || message.includes('how\'s it going')) {
        suggestions.push({
          message: "How did your day go? Any interesting projects you worked on?",
          context: 'Follow-up',
          confidence: 0.9
        });
        suggestions.push({
          message: "What's been keeping you busy lately?",
          context: 'Follow-up',
          confidence: 0.8
        });
      }

      if (message.includes('work') || message.includes('project')) {
        suggestions.push({
          message: "What challenges did you face with that project?",
          context: 'Follow-up',
          confidence: 0.9
        });
        suggestions.push({
          message: "That's impressive! How long have you been working on it?",
          context: 'Follow-up',
          confidence: 0.8
        });
      }

      if (message.includes('collaborate') || message.includes('work together')) {
        suggestions.push({
          message: "What specific skills do you think we could combine?",
          context: 'Follow-up',
          confidence: 0.9
        });
        suggestions.push({
          message: "I'm curious about your approach to [specific skill/interest]",
          context: 'Follow-up',
          confidence: 0.8
        });
      }
    } else {
      // If other user sent the last message, suggest responses
      if (message.includes('how are you') || message.includes('how\'s it going')) {
        suggestions.push({
          message: "I'm doing great, thanks for asking! How about you?",
          context: 'Response',
          confidence: 0.9
        });
        suggestions.push({
          message: `Pretty good! I've been working on ${this.getRandomSkill(currentUser.skills || [])} lately. What about you?`,
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
        suggestions.push({
          message: `That's awesome! I work with ${this.getRandomSkill(currentUser.skills || [])} too - maybe we could share ideas?`,
          context: 'Response',
          confidence: 0.7
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
        suggestions.push({
          message: `I could contribute my ${this.getRandomSkill(currentUser.skills || [])} skills to that!`,
          context: 'Response',
          confidence: 0.7
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate user-specific profile-based conversation starters
   */
  private generateUserSpecificSuggestions(
    currentUser: Profile,
    otherUser: Profile,
    commonSkills: string[],
    commonInterests: string[]
  ): ConversationSuggestion[] {
    const otherName = otherUser.name || 'there';
    const otherSkills = otherUser.skills || [];
    const otherInterests = otherUser.interests || [];
    const otherCollege = otherUser.college || '';
    const currentSkills = currentUser.skills || [];
    const currentName = currentUser.name || 'I';

    const suggestions: ConversationSuggestion[] = [];

    // Common skills suggestions - from current user's perspective
    if (commonSkills.length > 0) {
      const skill = commonSkills[0];
      suggestions.push({
        message: `Hey ${otherName}! I noticed we both work with ${skill} - that's awesome! I'd love to learn more about your experience with it`,
        context: 'Skills-based',
        confidence: 0.9
      });
      suggestions.push({
        message: `Hi! I see we both have ${skill} in common. What's your favorite aspect of working with it?`,
        context: 'Skills-based',
        confidence: 0.8
      });
    }

    // Common interests suggestions - personalized
    if (commonInterests.length > 0) {
      const interest = commonInterests[0];
      suggestions.push({
        message: `Hi ${otherName}! I'm also really into ${interest}. Maybe we could share ideas or collaborate on something?`,
        context: 'Interest-based',
        confidence: 0.8
      });
      suggestions.push({
        message: `That's cool that you're into ${interest} too! What got you interested in it?`,
        context: 'Interest-based',
        confidence: 0.7
      });
    }

    // College/background suggestions - personalized
    if (otherCollege) {
      suggestions.push({
        message: `Hey ${otherName}! Your ${otherCollege} background caught my attention. Would love to connect and learn more about your journey!`,
        context: 'Background-based',
        confidence: 0.8
      });
      suggestions.push({
        message: `I'm curious about your experience at ${otherCollege}. What was your favorite part about it?`,
        context: 'Background-based',
        confidence: 0.7
      });
    }

    // Skills-based suggestions - from current user's perspective
    if (otherSkills.length > 0) {
      const skill = otherSkills[0];
      suggestions.push({
        message: `Hi ${otherName}! I'd love to hear about your work with ${skill}. What's your favorite part about it?`,
        context: 'Skills-based',
        confidence: 0.7
      });
      suggestions.push({
        message: `That's impressive that you work with ${skill}! I'm always looking to learn from others in this field`,
        context: 'Skills-based',
        confidence: 0.6
      });
    }

    // Interest-based suggestions - personalized
    if (otherInterests.length > 0) {
      const interest = otherInterests[0];
      suggestions.push({
        message: `Hey there! I'm curious about your interest in ${interest}. What got you started with that?`,
        context: 'Interest-based',
        confidence: 0.7
      });
      suggestions.push({
        message: `I'd love to learn more about your passion for ${interest}. Any recommendations for someone interested in it?`,
        context: 'Interest-based',
        confidence: 0.6
      });
    }

    // Collaboration suggestions - personalized
    if (currentSkills.length > 0 && otherSkills.length > 0) {
      const currentSkill = currentSkills[0];
      const otherSkill = otherSkills[0];
      suggestions.push({
        message: `Hi ${otherName}! I work with ${currentSkill} and noticed you're into ${otherSkill}. I think we could create something amazing together!`,
        context: 'Collaboration',
        confidence: 0.6
      });
      suggestions.push({
        message: `I'm working on some ${currentSkill} projects and would love to get your ${otherSkill} perspective on them`,
        context: 'Collaboration',
        confidence: 0.5
      });
    }

    return suggestions;
  }

  /**
   * Generate conversation flow suggestions based on chat history
   */
  private generateConversationFlowSuggestions(
    currentUser: Profile,
    otherUser: Profile,
    chatHistory: any[]
  ): ConversationSuggestion[] {
    const suggestions: ConversationSuggestion[] = [];
    const otherName = otherUser.name || 'there';
    const currentSkills = currentUser.skills || [];
    const otherSkills = otherUser.skills || [];

    if (chatHistory.length === 0) {
      // First conversation starters
      suggestions.push({
        message: `Hi ${otherName}! I'd love to connect and learn more about your work`,
        context: 'First Contact',
        confidence: 0.8
      });
      suggestions.push({
        message: `Hey there! I'm excited to connect with someone who shares similar interests`,
        context: 'First Contact',
        confidence: 0.7
      });
    } else if (chatHistory.length < 5) {
      // Early conversation - build rapport
      suggestions.push({
        message: `I'm really enjoying our conversation! What's been the highlight of your week?`,
        context: 'Rapport Building',
        confidence: 0.8
      });
      suggestions.push({
        message: `This is great! I'd love to hear more about your background`,
        context: 'Rapport Building',
        confidence: 0.7
      });
    } else {
      // Established conversation - deeper topics
      suggestions.push({
        message: `I'm really enjoying our conversation! What's your biggest challenge right now?`,
        context: 'Deep Dive',
        confidence: 0.8
      });
      suggestions.push({
        message: `This is fascinating! What's your long-term vision for your work?`,
        context: 'Deep Dive',
        confidence: 0.7
      });
    }

    return suggestions;
  }

  /**
   * Get a random skill from the user's skills array
   */
  private getRandomSkill(skills: string[]): string {
    if (skills.length === 0) return 'various projects';
    return skills[Math.floor(Math.random() * skills.length)];
  }

  /**
   * Shuffle array to randomize suggestions
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Generate a generic conversation starter
   */
  private generateGenericSuggestion(
    otherName: string, 
    otherSkills: string[], 
    otherInterests: string[],
    currentUser: Profile
  ): ConversationSuggestion {
    const currentName = currentUser.name || 'I';
    const currentSkills = currentUser.skills || [];
    
    const suggestions = [
      `Hi ${otherName}! Love connecting with fellow creators. What's your latest project?`,
      `Hey there! What's the most exciting thing you're working on right now?`,
      `Hi ${otherName}! I'd love to hear about your creative journey and what inspires you`,
      `Hey! What's your favorite part about being a creator?`,
      `Hi there! What's the most interesting project you've worked on recently?`,
      `Hey ${otherName}! What's something you're really passionate about right now?`,
      `Hi! What's the coolest thing you've learned or created lately?`,
      `Hi! I'm ${currentName} and I'd love to get to know you better`,
      `Hey there! I'm curious about your perspective on ${this.getRandomSkill(otherSkills)}`,
      `Hello! I'm working on some interesting projects and would love to share ideas`,
      `Hi ${otherName}! I'm always looking for new collaboration opportunities`
    ];

    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    
    return {
      message: randomSuggestion,
      context: 'General',
      confidence: 0.5
    };
  }

  /**
   * Parse AI response into conversation suggestions
   */
  private parseAISuggestions(response: string): ConversationSuggestion[] {
    if (!response) {
      throw new Error('No response from Firebase AI');
    }

    const lines = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^\d+\./))
      .slice(0, 7);

    return lines.map((line, index) => ({
      message: line,
      context: 'Firebase AI Generated',
      confidence: 0.9 - (index * 0.1)
    }));
  }

  /**
   * Fallback suggestions when Firebase AI fails
   */
  private getFallbackSuggestions(
    currentUser: Profile,
    otherUser: Profile,
    chatHistory: any[]
  ): ConversationSuggestion[] {
    const otherName = otherUser.name || 'there';
    const otherSkills = otherUser.skills || [];
    const otherInterests = otherUser.interests || [];
    const currentSkills = currentUser.skills || [];

    // Find common skills and interests
    const commonSkills = currentSkills.filter(skill => 
      otherSkills.some(otherSkill => 
        otherSkill.toLowerCase().includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(otherSkill.toLowerCase())
      )
    );

    const suggestions: ConversationSuggestion[] = [];

    // Common skills suggestions
    if (commonSkills.length > 0) {
      suggestions.push({
        message: `Hey ${otherName}! I noticed we both work with ${commonSkills[0]} - that's awesome! I'd love to learn more about your experience`,
        context: 'Skills-based',
        confidence: 0.9
      });
    }

    // Skills-based suggestions
    if (otherSkills.length > 0) {
      suggestions.push({
        message: `Hi ${otherName}! I'd love to hear about your work with ${otherSkills[0]}. What's your favorite part about it?`,
        context: 'Skills-based',
        confidence: 0.8
      });
    }

    // Interest-based suggestions
    if (otherInterests.length > 0) {
      suggestions.push({
        message: `Hey there! I'm curious about your interest in ${otherInterests[0]}. What got you started with that?`,
        context: 'Interest-based',
        confidence: 0.7
      });
    }

    // Generic suggestions
    suggestions.push(
      {
        message: `Hi ${otherName}! Love connecting with fellow creators. What's your latest project?`,
        context: 'General',
        confidence: 0.6
      },
      {
        message: `Hey there! What's the most exciting thing you're working on right now?`,
        context: 'General',
        confidence: 0.5
      },
      {
        message: `Hi ${otherName}! I'd love to hear about your creative journey and what inspires you`,
        context: 'General',
        confidence: 0.4
      }
    );

    return suggestions.slice(0, 7);
  }

  /**
   * Analyze chat history and generate response suggestions
   */
  async analyzeChat(
    currentUserProfile: Profile,
    otherUserProfile: Profile,
    chatHistory: any[]
  ): Promise<ChatAnalysis> {
    console.log('🔍 Analyzing chat history for mood and behavior...');
    
    try {
      if (!this.isAIAvailable()) {
        throw new Error('AI not available');
      }

      // Use local AI analysis
      return this.getLocalChatAnalysis(currentUserProfile, otherUserProfile, chatHistory);
      
    } catch (error) {
      console.error('Error analyzing chat:', error);
      return this.getFallbackChatAnalysis(currentUserProfile, otherUserProfile, chatHistory);
    }
  }

  /**
   * Local chat analysis using pattern matching and heuristics
   */
  private getLocalChatAnalysis(
    currentUser: Profile,
    otherUser: Profile,
    chatHistory: any[]
  ): ChatAnalysis {
    const otherName = otherUser.name || 'there';
    const otherSkills = otherUser.skills || [];
    const otherInterests = otherUser.interests || [];
    
    // Analyze recent messages for mood and behavior
    const recentMessages = chatHistory.slice(-10);
    const otherMessages = recentMessages.filter(msg => msg.senderId === otherUser.uid);
    
    let mood = 'neutral';
    let behavior = 'conversational';
    let interests: string[] = [...otherInterests];
    let communicationStyle = 'casual';
    
    // Mood detection based on message patterns
    if (otherMessages.some(msg => (msg.message || '').toLowerCase().includes('!'))) {
      mood = 'enthusiastic';
    } else if (otherMessages.some(msg => (msg.message || '').toLowerCase().includes('?'))) {
      mood = 'curious';
    } else if (otherMessages.some(msg => (msg.message || '').toLowerCase().includes('thanks'))) {
      mood = 'grateful';
    } else if (otherMessages.some(msg => (msg.message || '').toLowerCase().includes('awesome') || (msg.message || '').toLowerCase().includes('amazing'))) {
      mood = 'excited';
    }
    
    // Behavior detection
    const avgMessageLength = otherMessages.reduce((sum, msg) => sum + (msg.message || '').length, 0) / otherMessages.length;
    if (avgMessageLength > 50) {
      behavior = 'detailed';
    } else if (avgMessageLength < 20) {
      behavior = 'brief';
    } else if (otherMessages.some(msg => (msg.message || '').toLowerCase().includes('?'))) {
      behavior = 'asking questions';
    }
    
    // Communication style detection
    if (otherMessages.some(msg => (msg.message || '').toLowerCase().includes('please') || (msg.message || '').toLowerCase().includes('thank you'))) {
      communicationStyle = 'polite';
    } else if (otherMessages.some(msg => (msg.message || '').toLowerCase().includes('lol') || (msg.message || '').toLowerCase().includes('haha'))) {
      communicationStyle = 'casual';
    }
    
    // Generate contextual response suggestions from current user's perspective
    const responseSuggestions: ConversationSuggestion[] = [];
    
    // Analyze the last message from the other user to provide contextual suggestions
    const lastOtherMessage = recentMessages
      .filter(msg => msg.senderId === otherUser.uid)
      .slice(-1)[0];
    
    if (lastOtherMessage) {
      const messageText = (lastOtherMessage.message || lastOtherMessage.text || '').toLowerCase();
      
      // Video editing related suggestions (based on the conversation context)
      if (messageText.includes('video') || messageText.includes('editing') || messageText.includes('film')) {
        responseSuggestions.push(
          {
            message: `That sounds amazing! I'd love to see some of your work. Maybe we can collaborate on something creative together?`,
            context: 'Portfolio Sharing',
            confidence: 0.9
          },
          {
            message: `I have some project ideas that could use your video editing skills. Would you be interested in hearing about them?`,
            context: 'Project Proposal',
            confidence: 0.8
          },
          {
            message: `What's your favorite style of video editing? I'm curious about the types of projects you enjoy most.`,
            context: 'Specific Questions',
            confidence: 0.7
          }
        );
      }
      
      // Collaboration related suggestions
      if (messageText.includes('collaborat') || messageText.includes('work together') || messageText.includes('project')) {
        responseSuggestions.push(
          {
            message: `Definitely interested in collaborating! Would you be open to discussing some ideas?`,
            context: 'Meeting Proposal',
            confidence: 0.9
          },
          {
            message: `I think our skills could complement each other really well! Want to share some examples of our work?`,
            context: 'Portfolio Examples',
            confidence: 0.8
          },
          {
            message: `How about we start with a small project to see how our styles work together?`,
            context: 'Test Project',
            confidence: 0.7
          }
        );
      }
      
      // General engagement suggestions
      responseSuggestions.push(
        {
          message: `That sounds really interesting! What got you into video editing?`,
          context: 'Personal Interest',
          confidence: 0.6
        },
        {
          message: `I'd love to learn more about your creative process and what inspires you.`,
          context: 'Creative Discussion',
          confidence: 0.5
        }
      );
    } else {
      // Default suggestions if no specific context
      responseSuggestions.push(
        {
          message: `I'd love to hear more about your thoughts on this!`,
          context: 'Engagement',
          confidence: 0.8
        },
        {
          message: `That's really interesting! What made you think of that?`,
          context: 'Curiosity',
          confidence: 0.7
        },
        {
          message: `What's your take on this? I'd love to hear your thoughts`,
          context: 'Opinion',
          confidence: 0.6
        }
      );
    }

    return {
      mood,
      behavior,
      interests,
      communicationStyle,
      responseSuggestions,
      analysis: `The conversation shows ${mood} engagement. ${otherName} seems to communicate in a ${behavior} style and is interested in discussing various topics.`
    };
  }


  /**
   * Fallback chat analysis when Firebase AI fails
   */
  private getFallbackChatAnalysis(
    currentUser: Profile,
    otherUser: Profile,
    chatHistory: any[]
  ): ChatAnalysis {
    const otherName = otherUser.name || 'there';
    const otherSkills = otherUser.skills || [];
    const otherInterests = otherUser.interests || [];
    
    // Simple mood detection based on message patterns
    const recentMessages = chatHistory.slice(-10);
    const otherMessages = recentMessages.filter(msg => msg.senderId === otherUser.uid);
    
    let mood = 'neutral';
    if (otherMessages.some(msg => (msg.message || '').toLowerCase().includes('!'))) {
      mood = 'enthusiastic';
    } else if (otherMessages.some(msg => (msg.message || '').toLowerCase().includes('?'))) {
      mood = 'curious';
    }

    const responseSuggestions: ConversationSuggestion[] = [
      {
        message: `Hi ${otherName}! I'd love to hear more about your thoughts on this`,
        context: 'Engagement',
        confidence: 0.9
      },
      {
        message: `That's really interesting! What made you think of that?`,
        context: 'Curiosity',
        confidence: 0.8
      },
      {
        message: `I'm curious about your perspective on this topic`,
        context: 'Discussion',
        confidence: 0.7
      },
      {
        message: `What's your take on this? I'd love to hear your thoughts`,
        context: 'Opinion',
        confidence: 0.6
      },
      {
        message: `That sounds fascinating! Tell me more about it`,
        context: 'Interest',
        confidence: 0.5
      }
    ];

    return {
      mood,
      behavior: 'conversational',
      interests: otherInterests,
      communicationStyle: 'casual',
      responseSuggestions,
      analysis: `The conversation shows ${mood} engagement. ${otherName} seems interested in discussing various topics.`
    };
  }

  /**
   * Generate conversation analysis
   */
  async analyzeConversation(
    currentUserProfile: Profile,
    otherUserProfile: Profile,
    chatHistory: any[]
  ): Promise<string> {
    try {
      if (!this.isAIAvailable()) {
        throw new Error('AI not available');
      }

      // Use enhanced local analysis
      return this.generateEnhancedConversationAnalysis(
        currentUserProfile,
        otherUserProfile,
        chatHistory
      );
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      return "The conversation is going well! Consider asking about their projects or suggesting collaboration opportunities.";
    }
  }

  /**
   * Generate enhanced conversation analysis
   */
  private generateEnhancedConversationAnalysis(
    currentUser: Profile,
    otherUser: Profile,
    chatHistory: any[]
  ): string {
    const currentName = currentUser.name || 'You';
    const otherName = otherUser.name || 'them';
    const currentSkills = currentUser.skills || [];
    const otherSkills = otherUser.skills || [];
    const currentInterests = currentUser.interests || [];
    const otherInterests = otherUser.interests || [];

    const commonSkills = this.findCommonItems(currentSkills, otherSkills);
    const commonInterests = this.findCommonItems(currentInterests, otherInterests);

    let analysis = `## Conversation Analysis for ${currentName}\n\n`;

    // Analyze conversation length and engagement
    if (chatHistory.length === 0) {
      analysis += `**First Contact Opportunity**\n`;
      analysis += `This is your chance to make a great first impression! `;
      if (commonSkills.length > 0) {
        analysis += `You both share ${commonSkills[0]} - this is a perfect conversation starter. `;
      } else if (commonInterests.length > 0) {
        analysis += `You both have ${commonInterests[0]} in common - great foundation for connection. `;
      }
      analysis += `Ask about their latest projects or what they're passionate about.\n\n`;
    } else if (chatHistory.length < 5) {
      analysis += `**Early Conversation Stage**\n`;
      analysis += `Great start! You're building rapport. `;
      if (this.hasRecentActivity(chatHistory)) {
        analysis += `The conversation is active and engaging. `;
      }
      analysis += `Consider asking deeper questions about their work or interests to strengthen the connection.\n\n`;
    } else {
      analysis += `**Established Conversation**\n`;
      analysis += `Excellent! You've built a good foundation. `;
      if (this.hasCollaborationPotential(chatHistory)) {
        analysis += `The conversation shows potential for collaboration. `;
      }
      analysis += `Consider suggesting specific ways to work together or share resources.\n\n`;
    }

    // Analyze commonalities
    if (commonSkills.length > 0) {
      analysis += `**Shared Skills: ${commonSkills.join(', ')}**\n`;
      analysis += `This is a strong foundation for collaboration! You could discuss techniques, share resources, or work on projects together.\n\n`;
    }

    if (commonInterests.length > 0) {
      analysis += `**Shared Interests: ${commonInterests.join(', ')}**\n`;
      analysis += `Great common ground! You can bond over these shared passions and explore them together.\n\n`;
    }

    // Analyze conversation topics
    const topics = this.analyzeConversationTopics(chatHistory);
    if (topics.length > 0) {
      analysis += `**Conversation Topics:** ${topics.join(', ')}\n`;
      analysis += `The conversation has covered interesting ground. `;
      if (topics.includes('collaboration') || topics.includes('work')) {
        analysis += `There's clear potential for working together. `;
      }
      analysis += `\n\n`;
    }

    // Provide specific suggestions
    analysis += `**Suggestions for ${currentName}:**\n`;
    if (chatHistory.length === 0) {
      analysis += `• Start with a personalized question about their work\n`;
      analysis += `• Mention your shared ${commonSkills.length > 0 ? 'skills' : 'interests'}\n`;
      analysis += `• Ask about their current projects or challenges\n`;
    } else {
      analysis += `• Ask about their biggest challenges or goals\n`;
      analysis += `• Suggest specific collaboration opportunities\n`;
      analysis += `• Share relevant resources or insights\n`;
      analysis += `• Ask about their long-term vision\n`;
    }

    return analysis;
  }

  /**
   * Check if conversation has recent activity
   */
  private hasRecentActivity(chatHistory: any[]): boolean {
    if (chatHistory.length === 0) return false;
    
    const lastMessage = chatHistory[chatHistory.length - 1];
    if (!lastMessage) return false;
    
    const messageTime = lastMessage.timestamp || lastMessage.createdAt;
    if (!messageTime) return true; // Assume recent if no timestamp
    
    const now = new Date();
    const messageDate = new Date(messageTime);
    const hoursDiff = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff < 24; // Recent if within 24 hours
  }

  /**
   * Check if conversation shows collaboration potential
   */
  private hasCollaborationPotential(chatHistory: any[]): boolean {
    const collaborationKeywords = [
      'collaborate', 'work together', 'project', 'team', 'partnership',
      'help', 'assist', 'support', 'share', 'exchange', 'combine'
    ];
    
    return chatHistory.some(message => {
      const text = (message.message || message.text || '').toLowerCase();
      return collaborationKeywords.some(keyword => text.includes(keyword));
    });
  }

  /**
   * Analyze conversation topics
   */
  private analyzeConversationTopics(chatHistory: any[]): string[] {
    const topics: string[] = [];
    const topicKeywords = {
      'work': ['work', 'job', 'career', 'profession'],
      'projects': ['project', 'build', 'create', 'develop'],
      'collaboration': ['collaborate', 'together', 'team', 'partnership'],
      'skills': ['skill', 'expertise', 'experience', 'knowledge'],
      'interests': ['interest', 'passion', 'hobby', 'love'],
      'education': ['school', 'college', 'university', 'learn', 'study'],
      'technology': ['tech', 'software', 'programming', 'coding', 'digital'],
      'creative': ['creative', 'art', 'design', 'music', 'writing']
    };

    chatHistory.forEach(message => {
      const text = (message.message || message.text || '').toLowerCase();
      Object.entries(topicKeywords).forEach(([topic, keywords]) => {
        if (keywords.some(keyword => text.includes(keyword)) && !topics.includes(topic)) {
          topics.push(topic);
        }
      });
    });

    return topics;
  }
}
