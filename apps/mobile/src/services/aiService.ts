import { API_KEY } from '../config/apiKeys';

export interface AIMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
}

export interface AIResponse {
  content: string;
  sources?: string[];
  model?: string;
}

export class AIService {
  private static readonly PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
  private static readonly MODEL = 'sonar-pro';

  static async sendMessage(message: string): Promise<AIResponse> {
    try {
      // Check if API key is configured
      if (!API_KEY.PERPLEXITY_API_KEY || API_KEY.PERPLEXITY_API_KEY === 'your-perplexity-api-key-here') {
        console.warn('⚠️ Perplexity API key not configured, using fallback response');
        return this.getFallbackResponse(message);
      }

      console.log('🤖 Sending message to Perplexity API:', message);
      
      const response = await fetch(this.PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are CreatorCircle AI, a helpful assistant for content creators. Provide helpful, accurate, and creative advice for content creation, social media strategies, and creative projects. Be encouraging and professional. Keep responses concise but informative.'
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
          top_p: 0.9,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Perplexity API response received');
      console.log('📊 Response data:', data);

      // Extract the content from the response
      const content = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
      console.log('💬 AI Response:', content);

      return {
        content: content,
        sources: data.sources || [],
        model: data.model || this.MODEL
      };
    } catch (error) {
      console.error('❌ Error calling Perplexity API:', error);
      
      // If it's a 401 error, provide helpful message
      if (error instanceof Error && error.message.includes('401')) {
        throw new Error('API key not configured. Please set up your Perplexity API key in the config file.');
      }
      
      throw new Error('Failed to get AI response. Please try again.');
    }
  }

  private static getFallbackResponse(message: string): AIResponse {
    const responses = [
      "I'd love to help you with that! However, I need to be connected to the Perplexity API to provide accurate responses. Please configure your API key in the settings.",
      "That's a great question! To give you the best answer, I need access to the Perplexity API. Please set up your API key to enable full AI functionality.",
      "I'm here to help with your content creation needs! To provide you with real-time, accurate information, please configure your Perplexity API key.",
      "Thanks for reaching out! For the most helpful responses about content creation, I need to be connected to the Perplexity API. Please set up your API key.",
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      content: randomResponse,
      sources: [],
      model: 'fallback'
    };
  }

  static async sendMessageWithContext(message: string, context: string): Promise<AIResponse> {
    try {
      // Check if API key is configured
      if (!API_KEY.PERPLEXITY_API_KEY || API_KEY.PERPLEXITY_API_KEY === 'your-perplexity-api-key-here') {
        console.warn('⚠️ Perplexity API key not configured, using fallback response');
        return this.getFallbackResponse(message);
      }

      console.log('🤖 Sending contextual message to Perplexity API');
      
      const response = await fetch(this.PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: 'system',
              content: `You are CreatorCircle AI, a helpful assistant for content creators. Here's the context: ${context}. Provide helpful, accurate, and creative advice based on this context.`
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
          top_p: 0.9,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Perplexity API contextual response received');
      console.log('📊 Contextual response data:', data);

      // Extract the content from the response
      const content = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
      console.log('💬 AI Contextual Response:', content);

      return {
        content: content,
        sources: data.sources || [],
        model: data.model || this.MODEL
      };
    } catch (error) {
      console.error('❌ Error calling Perplexity API with context:', error);
      throw new Error('Failed to get AI response. Please try again.');
    }
  }

  static generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static createUserMessage(text: string): AIMessage {
    return {
      id: this.generateMessageId(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date()
    };
  }

  static createAIMessage(text: string, isLoading: boolean = false): AIMessage {
    return {
      id: this.generateMessageId(),
      text: text.trim(),
      isUser: false,
      timestamp: new Date(),
      isLoading
    };
  }
}