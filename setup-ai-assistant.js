#!/usr/bin/env node

/**
 * AI Assistant Setup Script
 * This script helps you configure the Perplexity API key for the AI Assistant
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const API_KEYS_FILE = path.join(__dirname, 'src', 'config', 'apiKeys.ts');

console.log('🤖 CreatorCircle AI Assistant Setup');
console.log('=====================================\n');

console.log('This script will help you configure the Perplexity API key for the AI Assistant.\n');

console.log('📋 Prerequisites:');
console.log('1. Go to https://www.perplexity.ai/');
console.log('2. Sign up or log in to your account');
console.log('3. Navigate to the API section in your dashboard');
console.log('4. Generate a new API key (it should start with "pplx-")\n');

rl.question('Enter your Perplexity API key: ', (apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    console.log('❌ No API key provided. Setup cancelled.');
    rl.close();
    return;
  }

  if (!apiKey.startsWith('pplx-')) {
    console.log('⚠️  Warning: API key should start with "pplx-". Continuing anyway...\n');
  }

  try {
    // Read the current file
    let content = fs.readFileSync(API_KEYS_FILE, 'utf8');
    
    // Replace the placeholder with the actual API key
    const updatedContent = content.replace(
      "PERPLEXITY_API_KEY: 'your-perplexity-api-key-here'",
      `PERPLEXITY_API_KEY: '${apiKey.trim()}'`
    );

    // Write the updated content back
    fs.writeFileSync(API_KEYS_FILE, updatedContent);
    
    console.log('✅ API key configured successfully!');
    console.log('🎉 AI Assistant is now ready to use!');
    console.log('\n📱 Next steps:');
    console.log('1. Restart your development server');
    console.log('2. Go to More → AI Assistant');
    console.log('3. Start chatting with your AI assistant!');
    
  } catch (error) {
    console.error('❌ Error configuring API key:', error.message);
    console.log('\n🔧 Manual setup:');
    console.log('1. Open src/config/apiKeys.ts');
    console.log('2. Replace "your-perplexity-api-key-here" with your actual API key');
  }

  rl.close();
});

rl.on('close', () => {
  console.log('\n👋 Setup complete! Happy coding!');
  process.exit(0);
});
