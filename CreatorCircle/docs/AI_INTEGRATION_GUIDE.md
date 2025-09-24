# 🤖 AI Integration Guide - Perplexity & Gemini

## Overview

Your CreatorCircle app now includes powerful AI capabilities powered by both **Perplexity AI** and **Google Gemini AI**. This integration provides real-time information, intelligent conversation suggestions, and advanced content generation.

## 🔑 API Keys Configuration

- API keys are loaded from environment variables at runtime/build time.
- No API keys are committed to the repository.
- Active provider can be changed in `apiConfig.ts`.

## 🚀 Features Available

### 1. **Conversation Starters** (Gemini AI)
- **Smart Suggestions**: AI generates personalized conversation starters based on user profiles
- **Context Awareness**: Considers shared skills, interests, and chat history
- **Professional Tone**: Optimized for networking and professional communication

### 2. **Real-time Research** (Perplexity AI)
- **Live Information**: Get up-to-date information on any topic
- **Industry Insights**: Research current trends and developments
- **Collaboration Ideas**: Generate creative project ideas based on user skills

### 3. **Content Generation** (Gemini AI)
- **Post Ideas**: Generate engaging content ideas for social posts
- **Project Suggestions**: Create collaboration and project ideas
- **Writing Assistance**: Improve grammar and tone of messages

### 4. **Chat Analysis** (Gemini AI)
- **Conversation Analysis**: Analyze chat flow and engagement
- **Tone Detection**: Identify the conversation tone
- **Improvement Suggestions**: Get specific recommendations

## 📁 Files Created/Modified

### New Files:
- `src/services/perplexityAIService.ts` - Perplexity AI integration
- `src/services/geminiAIService.ts` - Gemini AI integration
- `src/components/EnhancedAIFeatures.tsx` - Comprehensive AI features UI

### Modified Files:
- `src/config/apiConfig.ts` - Added API keys and configuration
- `src/services/aiService.ts` - Integrated both AI services

## 🛠 How to Use

### 1. **In Chat Window**
```typescript
// Generate conversation starters
const suggestions = await aiService.generateConversationStarters(
  currentUserProfile,
  otherUserProfile,
  chatHistory
);

// Analyze chat conversation
const analysis = await aiService.analyzeChatConversation(chatHistory);
```

### 2. **Research Features**
```typescript
// Research a topic
const insights = await aiService.generateResearchInsights('artificial intelligence');

// Get industry insights
const industryInfo = await aiService.generateIndustryInsights('technology');
```

### 3. **Content Generation**
```typescript
// Generate content ideas
const ideas = await aiService.generateContentIdeas(
  userSkills,
  userInterests,
  'post'
);

// Improve message tone
const improvedMessage = await aiService.improveMessage(
  originalMessage,
  'professional'
);
```

## 🎯 AI Provider Selection

The app automatically selects the best AI provider based on the task:

- **Gemini AI**: Conversation, content generation, chat analysis
- **Perplexity AI**: Research, real-time information, industry insights
- **Firebase AI**: Fallback for basic suggestions

## 🔧 Configuration Options

### Change Active Provider
In `src/config/apiConfig.ts`:
```typescript
export const ACTIVE_PROVIDER: APIProvider = 'gemini'; // or 'perplexity'
```

### API Settings
```typescript
export const API_CONFIG = {
  MAX_TOKENS: 1000,
  TEMPERATURE: 0.7,
  TIMEOUT: 30000,
};
```

## 🎨 UI Components

### Enhanced AI Features Modal
The `EnhancedAIFeatures` component provides a comprehensive interface for all AI features:

- **Conversation Tab**: Generate conversation starters
- **Research Tab**: Research topics and get insights
- **Content Tab**: Generate content ideas
- **Analysis Tab**: Analyze chat conversations

### Usage in Components
```typescript
import EnhancedAIFeatures from '../components/EnhancedAIFeatures';

<EnhancedAIFeatures
  currentUserProfile={userProfile}
  otherUserProfile={otherUserProfile}
  chatHistory={messages}
  onSuggestionSelect={(suggestion) => setMessage(suggestion)}
  visible={showAIFeatures}
  onClose={() => setShowAIFeatures(false)}
/>
```

## 🔍 Error Handling

The AI services include comprehensive error handling:

- **API Key Validation**: Checks if API keys are valid
- **Fallback Responses**: Provides basic suggestions if AI fails
- **User Feedback**: Clear error messages and loading states

## 📊 Performance Features

- **Caching**: Responses are cached to reduce API calls
- **Rate Limiting**: Built-in rate limiting to prevent API overuse
- **Loading States**: Visual feedback during AI processing
- **Provider Status**: Real-time status of AI providers

## 🚨 Troubleshooting

### Common Issues:

1. **API Key Errors**
   - Check if API keys are correctly configured
   - Verify API key permissions and quotas

2. **Network Issues**
   - Ensure stable internet connection
   - Check API endpoint accessibility

3. **Rate Limiting**
   - Wait before making additional requests
   - Check API usage quotas

### Debug Information:
```typescript
// Check available providers
const providers = aiService.getAvailableProviders();
console.log('Available AI providers:', providers);
```

## 🔒 Security & Privacy

- **API Keys**: Stored securely in configuration files
- **Data Privacy**: No user data is stored by AI services
- **Request Logging**: Minimal logging for debugging only

## 🎉 Benefits

### For Users:
- **Better Conversations**: More engaging and relevant conversation starters
- **Real-time Information**: Access to current trends and insights
- **Content Ideas**: Never run out of things to post or discuss
- **Professional Communication**: Improved message quality and tone

### For Developers:
- **Easy Integration**: Simple API for all AI features
- **Flexible Configuration**: Easy to switch between AI providers
- **Comprehensive Error Handling**: Robust fallback systems
- **Extensible Architecture**: Easy to add new AI features

## 🚀 Next Steps

1. **Test the Integration**: Try all AI features in the app
2. **Customize Prompts**: Modify AI prompts for your specific use case
3. **Add More Features**: Extend the AI capabilities as needed
4. **Monitor Usage**: Track API usage and costs

## 📞 Support

If you encounter any issues:
1. Check the console logs for error messages
2. Verify API key configuration
3. Test with different AI providers
4. Check network connectivity

The AI integration is now fully functional and ready to enhance your CreatorCircle app with intelligent features! 🎉
