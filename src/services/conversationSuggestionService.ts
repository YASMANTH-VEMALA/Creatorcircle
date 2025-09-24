import { Profile } from '../types';
import { API_CONFIG } from '../config/apiConfig';

export interface ConversationSuggestion {
  suggestion: string;
  reason: string;
  category: 'personal' | 'professional' | 'shared_interest' | 'icebreaker';
}

export interface UserProfileData {
  name: string;
  college: string;
  about: string;
  skills: string[];
  interests: string[];
  location?: string;
  age?: number;
}

export class ConversationSuggestionService {
  private static extractProfileData(profile: Profile | null): UserProfileData {
    if (!profile) {
      return {
        name: 'Unknown User',
        college: 'Not specified',
        about: 'No information available',
        skills: [],
        interests: [],
      };
    }

    return {
      name: profile.name || 'Unknown User',
      college: profile.college || 'Not specified',
      about: profile.about || 'No information available',
      skills: profile.skills || [],
      interests: profile.interests || [],
      location: profile.location,
      age: profile.age,
    };
  }

  private static async callGeminiAPI(userX: UserProfileData, userY: UserProfileData): Promise<ConversationSuggestion[]> {
    const prompt = `You are an expert conversation starter AI. Analyze these two user profiles and create 8 personalized conversation suggestions that will lead to engaging, meaningful conversations.

USER X PROFILE:
- Name: ${userX.name}
- College: ${userX.college}
- About: ${userX.about}
- Skills: ${userX.skills.join(', ')}
- Interests: ${userX.interests.join(', ')}
- Location: ${userX.location || 'Not specified'}
- Age: ${userX.age || 'Not specified'}

USER Y PROFILE:
- Name: ${userY.name}
- College: ${userY.college}
- About: ${userY.about}
- Skills: ${userY.skills.join(', ')}
- Interests: ${userY.interests.join(', ')}
- Location: ${userY.location || 'Not specified'}
- Age: ${userY.age || 'Not specified'}

ANALYSIS REQUIREMENTS:
1. Find common interests, skills, or experiences between both users
2. Identify unique aspects of each user that could spark curiosity
3. Consider their educational background and potential shared experiences
4. Think about conversation flow - suggestions should lead to deeper discussions
5. Make suggestions natural and engaging, not forced or generic

RESPONSE FORMAT:
Return exactly 8 suggestions in this JSON format:
[
  {
    "suggestion": "The actual conversation starter text",
    "reason": "Why this suggestion works for these two people",
    "category": "personal|professional|shared_interest|icebreaker"
  }
]

CATEGORIES:
- personal: About hobbies, experiences, personal stories
- professional: About work, career, skills, projects
- shared_interest: Based on common interests or experiences
- icebreaker: Fun, light conversation starters

Make each suggestion unique, engaging, and likely to lead to a meaningful conversation. Avoid generic small talk.`;

    const apiEndpoints = [
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
      'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent'
    ];

    let response;
    let lastError;

    for (const endpoint of apiEndpoints) {
      try {
        console.log(`Trying Gemini API endpoint: ${endpoint}`);
        response = await fetch(`${endpoint}?key=${API_CONFIG.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 1000,
            }
          }),
        });

        if (response.ok) {
          console.log(`Success with endpoint: ${endpoint}`);
          break;
        } else {
          const errorData = await response.json();
          console.log(`Failed with endpoint ${endpoint}:`, errorData);
          lastError = errorData;
        }
      } catch (error) {
        console.log(`Error with endpoint ${endpoint}:`, error);
        lastError = error;
      }
    }

    if (!response || !response.ok) {
      throw new Error(`All Gemini API endpoints failed. Last error: ${lastError?.error?.message || lastError?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Gemini API Response:', JSON.stringify(data, null, 2));

    if (data.error) {
      console.error('Gemini API Error:', data.error);
      throw new Error(`Gemini API Error: ${data.error.message}`);
    }

    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      const generatedText = data.candidates[0].content.parts[0].text;
      console.log('Generated text:', generatedText);

      try {
        // Try to extract JSON from the response
        const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const suggestions = JSON.parse(jsonMatch[0]);
          return suggestions;
        } else {
          throw new Error('No JSON array found in response');
        }
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        throw new Error('Failed to parse AI response');
      }
    } else {
      console.error('Invalid API response structure:', data);
      throw new Error('Invalid API response structure');
    }
  }

  static async generateConversationSuggestions(
    currentUserProfile: Profile | null,
    otherUserProfile: Profile | null
  ): Promise<ConversationSuggestion[]> {
    try {
      console.log('Generating conversation suggestions...');
      
      const userX = this.extractProfileData(currentUserProfile);
      const userY = this.extractProfileData(otherUserProfile);
      
      console.log('User X data:', userX);
      console.log('User Y data:', userY);

      const suggestions = await this.callGeminiAPI(userX, userY);
      
      console.log('Generated suggestions:', suggestions);
      return suggestions;
    } catch (error) {
      console.error('Error generating conversation suggestions:', error);
      
      // Fallback suggestions based on available profile data
      const userX = this.extractProfileData(currentUserProfile);
      const userY = this.extractProfileData(otherUserProfile);
      
      return this.generateFallbackSuggestions(userX, userY);
    }
  }

  private static generateFallbackSuggestions(
    userX: UserProfileData,
    userY: UserProfileData
  ): ConversationSuggestion[] {
    const suggestions: ConversationSuggestion[] = [];

    // Find common interests
    const commonInterests = userX.interests.filter(interest => 
      userY.interests.some(yInterest => 
        yInterest.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(yInterest.toLowerCase())
      )
    );

    // Find common skills
    const commonSkills = userX.skills.filter(skill => 
      userY.skills.some(ySkill => 
        ySkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(ySkill.toLowerCase())
      )
    );

    // Add suggestions based on common interests
    if (commonInterests.length > 0) {
      suggestions.push({
        suggestion: `I noticed we both share an interest in ${commonInterests[0]}. What got you into that?`,
        reason: `Both users are interested in ${commonInterests[0]}`,
        category: 'shared_interest'
      });
    }

    // Add suggestions based on common skills
    if (commonSkills.length > 0) {
      suggestions.push({
        suggestion: `I see you're also into ${commonSkills[0]}. What's your experience been like with it?`,
        reason: `Both users have ${commonSkills[0]} skills`,
        category: 'professional'
      });
    }

    // Add college-based suggestions
    if (userX.college !== 'Not specified' && userY.college !== 'Not specified') {
      suggestions.push({
        suggestion: `What's your experience been like at ${userY.college}? I'm curious about the campus culture there.`,
        reason: 'Both users have college information',
        category: 'personal'
      });
    }

    // Add general conversation starters
    suggestions.push(
      {
        suggestion: `Hi! I'd love to know more about what you're passionate about. What drives you?`,
        reason: 'General personal conversation starter',
        category: 'personal'
      },
      {
        suggestion: `What's the most interesting project you've worked on recently?`,
        reason: 'Professional conversation starter',
        category: 'professional'
      },
      {
        suggestion: `I'm always curious about people's backgrounds. What's your story?`,
        reason: 'Personal icebreaker',
        category: 'icebreaker'
      },
      {
        suggestion: `What's something you're really excited about these days?`,
        reason: 'Positive conversation starter',
        category: 'personal'
      },
      {
        suggestion: `I'd love to hear about your journey and what you've learned along the way.`,
        reason: 'Engaging personal question',
        category: 'personal'
      }
    );

    return suggestions.slice(0, 8); // Return max 8 suggestions
  }
}

export default ConversationSuggestionService;
