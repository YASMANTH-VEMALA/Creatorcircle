import { ContentModerationService } from '../services/contentModerationService';

export const testContentModeration = async () => {
  console.log('🧪 Testing Content Moderation...');
  
  // Test 1: Clean content
  console.log('\n📝 Test 1: Clean content');
  const cleanResult = await ContentModerationService.moderatePost(
    'Hello everyone! How are you doing today?',
    [],
    []
  );
  console.log('Clean content result:', cleanResult.isAppropriate ? '✅ APPROVED' : '❌ BLOCKED');
  
  // Test 2: Sexual content
  console.log('\n📝 Test 2: Sexual content');
  const sexualResult = await ContentModerationService.moderatePost(
    'Check out this sexy photo of me',
    [],
    []
  );
  console.log('Sexual content result:', sexualResult.isAppropriate ? '✅ APPROVED' : '❌ BLOCKED');
  console.log('Reasons:', sexualResult.reasons);
  console.log('Flagged words:', sexualResult.textResult.flaggedWords);
  
  // Test 3: Explicit content
  console.log('\n📝 Test 3: Explicit content');
  const explicitResult = await ContentModerationService.moderatePost(
    'Fuck this assignment, I hate it so much',
    [],
    []
  );
  console.log('Explicit content result:', explicitResult.isAppropriate ? '✅ APPROVED' : '❌ BLOCKED');
  console.log('Reasons:', explicitResult.reasons);
  console.log('Flagged words:', explicitResult.textResult.flaggedWords);
  
  // Test 4: Nude content
  console.log('\n📝 Test 4: Nude content');
  const nudeResult = await ContentModerationService.moderatePost(
    'Want to see my nude pics?',
    [],
    []
  );
  console.log('Nude content result:', nudeResult.isAppropriate ? '✅ APPROVED' : '❌ BLOCKED');
  console.log('Reasons:', nudeResult.reasons);
  console.log('Flagged words:', nudeResult.textResult.flaggedWords);
  
  console.log('\n🎯 Moderation test completed!');
};
