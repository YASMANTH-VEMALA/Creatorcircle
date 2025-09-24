# AI Assistant Setup Guide

## Overview
The AI Assistant feature has been successfully integrated into CreatorCircle using the Perplexity API. This guide will help you set up the API key and configure the feature.

## Features
- 🤖 **Smart Chat Interface**: Clean, modern chat UI with message bubbles
- 🧠 **Perplexity AI Integration**: Powered by Perplexity's advanced AI models
- 💡 **Content Creation Focus**: Specialized for creative content advice
- 🔄 **Real-time Responses**: Instant AI responses with loading indicators
- 📱 **Mobile Optimized**: Responsive design for mobile devices
- 🎨 **Modern UI**: Beautiful interface with CreatorCircle branding

## Setup Instructions

### 1. Get Perplexity API Key
1. Visit [Perplexity AI](https://www.perplexity.ai/)
2. Sign up or log in to your account
3. Navigate to the API section in your dashboard
4. Generate a new API key
5. Copy the API key for the next step

### 2. Configure API Key
1. Open `/src/config/apiKeys.ts`
2. Replace `'your-perplexity-api-key-here'` with your actual API key:
   ```typescript
   export const API_KEY = {
     PERPLEXITY_API_KEY: 'pplx-your-actual-api-key-here',
   };
   ```

### 3. Test the Integration
1. Open the app and go to **Settings**
2. Find the **"AI Assistant"** section
3. Tap **"Chat with AI Assistant"**
4. Try asking a question like:
   - "How can I improve my Instagram content?"
   - "What are some creative video ideas for creators?"
   - "How do I grow my social media following?"

## File Structure
```
src/
├── services/
│   └── aiService.ts          # AI service with Perplexity API integration
├── screens/
│   └── AIAssistantScreen.tsx # Main AI Assistant chat interface
├── config/
│   └── apiKeys.ts            # API keys configuration
└── types/
    └── index.ts              # TypeScript interfaces
```

## API Configuration
The AI Assistant uses the following Perplexity API settings:
- **Model**: `llama-3.1-sonar-small-128k-online`
- **Max Tokens**: 1000
- **Temperature**: 0.7
- **Top P**: 0.9

## Customization
You can customize the AI Assistant by modifying:
- **System Prompt**: Edit the system message in `aiService.ts`
- **UI Design**: Modify styles in `AIAssistantScreen.tsx`
- **API Settings**: Adjust model parameters in `aiService.ts`

## Troubleshooting
- **API Key Error**: Ensure your Perplexity API key is correct and active
- **Network Issues**: Check your internet connection
- **Rate Limits**: Perplexity has rate limits; wait if you hit them
- **Model Availability**: Ensure the specified model is available in your region

## Security Notes
- Never commit API keys to version control
- Use environment variables for production
- Consider implementing API key rotation
- Monitor API usage and costs

## Support
If you encounter any issues:
1. Check the console for error messages
2. Verify your API key is correct
3. Ensure you have an active Perplexity subscription
4. Check Perplexity's API status page

## Future Enhancements
- Context-aware responses based on user profile
- Conversation history persistence
- Voice input/output
- Image analysis capabilities
- Integration with user's content for personalized advice
