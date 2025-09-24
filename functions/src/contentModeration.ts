import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { LanguageServiceClient } from '@google-cloud/language';
import * as nodemailer from 'nodemailer';

const vision = new ImageAnnotatorClient();
const language = new LanguageServiceClient();

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'yasmanthvemala007@gmail.com', // Your email
    pass: process.env.EMAIL_PASSWORD // Set this in Firebase Functions config
  }
});

export const moderateImage = onCall(async (request) => {
  try {
    const { imageUrl } = request.data;
    
    if (!imageUrl) {
      throw new HttpsError('invalid-argument', 'Image URL is required');
    }

    // Use Cloud Vision API to detect inappropriate content
    const [result] = await vision.safeSearchDetection(imageUrl);
    const safeSearch = result.safeSearchAnnotation;

    const isAppropriate = 
      safeSearch && safeSearch.adult === 'VERY_UNLIKELY' &&
      safeSearch.violence === 'VERY_UNLIKELY' &&
      safeSearch.racy === 'VERY_UNLIKELY' &&
      safeSearch.spoof === 'VERY_UNLIKELY' &&
      safeSearch.medical === 'VERY_UNLIKELY';

    return {
      isAppropriate,
      confidence: {
        adult: safeSearch?.adult || 'UNKNOWN',
        violence: safeSearch?.violence || 'UNKNOWN',
        racy: safeSearch?.racy || 'UNKNOWN',
        spoof: safeSearch?.spoof || 'UNKNOWN',
        medical: safeSearch?.medical || 'UNKNOWN'
      }
    };
  } catch (error) {
    console.error('Error moderating image:', error);
    throw new HttpsError('internal', 'Failed to moderate image');
  }
});

export const moderateText = onCall(async (request) => {
  try {
    const { text } = request.data;
    
    if (!text) {
      throw new HttpsError('invalid-argument', 'Text is required');
    }

    // Use Cloud Natural Language API to detect toxicity
    const [result] = await language.analyzeSentiment({
      document: {
        content: text,
        type: 'PLAIN_TEXT',
      },
    });

    // Check for toxicity using the sentiment analysis
    const sentiment = result.documentSentiment;
    const isAppropriate = sentiment && sentiment.score && sentiment.score > -0.5; // Adjust threshold as needed

    return {
      isAppropriate,
      sentiment: sentiment?.score || 0,
      magnitude: sentiment?.magnitude || 0
    };
  } catch (error) {
    console.error('Error moderating text:', error);
    throw new HttpsError('internal', 'Failed to moderate text');
  }
});

export const sendInappropriateContentAlert = onCall(async (request) => {
  try {
    const { userDetails, content, images, videos, moderationResult, timestamp, adminEmail } = request.data;
    
    if (!userDetails || !content) {
      throw new HttpsError('invalid-argument', 'User details and content are required');
    }

    // Create email content
    const emailSubject = `🚨 INAPPROPRIATE CONTENT ALERT - CreatorCircle Student App`;
    
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Inappropriate Content Alert</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #ff4444; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .user-info { background-color: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .content-section { background-color: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .flagged-content { background-color: #ffe6e6; padding: 10px; border-left: 4px solid #ff4444; margin: 10px 0; }
        .footer { background-color: #333; color: white; padding: 15px; text-align: center; font-size: 12px; }
        .badge { background-color: #ff4444; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px; }
        .success { background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚨 INAPPROPRIATE CONTENT ALERT</h1>
        <p>CreatorCircle Student Networking App</p>
    </div>
    
    <div class="content">
        <h2>⚠️ Content Moderation Alert</h2>
        <p>A student has attempted to post inappropriate content that was automatically blocked by our content moderation system.</p>
        
        <div class="user-info">
            <h3>👤 User Information</h3>
            <p><strong>Name:</strong> ${userDetails.name || 'Not provided'}</p>
            <p><strong>Email:</strong> ${userDetails.email || 'Not provided'}</p>
            <p><strong>User ID:</strong> ${userDetails.uid}</p>
            <p><strong>College:</strong> ${userDetails.college || 'Not provided'}</p>
            <p><strong>Profile Photo:</strong> ${userDetails.profilePhotoUrl ? 'Yes' : 'No'}</p>
            <p><strong>Account Created:</strong> ${new Date(userDetails.createdAt).toLocaleString()}</p>
        </div>
        
        <div class="content-section">
            <h3>📝 Attempted Content</h3>
            <div class="flagged-content">
                <p><strong>Text Content:</strong></p>
                <p>${content || 'No text content'}</p>
            </div>
            
            ${images && images.length > 0 ? `
            <p><strong>Images (${images.length}):</strong></p>
            <ul>
                ${images.map((img: string, index: number) => `<li>Image ${index + 1}: ${img}</li>`).join('')}
            </ul>
            ` : ''}
            
            ${videos && videos.length > 0 ? `
            <p><strong>Videos (${videos.length}):</strong></p>
            <ul>
                ${videos.map((vid: string, index: number) => `<li>Video ${index + 1}: ${vid}</li>`).join('')}
            </ul>
            ` : ''}
        </div>
        
        <div class="content-section">
            <h3>🔍 Moderation Results</h3>
            <p><strong>Status:</strong> <span class="badge">BLOCKED</span></p>
            <p><strong>Timestamp:</strong> ${new Date(timestamp).toLocaleString()}</p>
            
            ${moderationResult.reasons && moderationResult.reasons.length > 0 ? `
            <p><strong>Reasons for Blocking:</strong></p>
            <ul>
                ${moderationResult.reasons.map((reason: string) => `<li>${reason}</li>`).join('')}
            </ul>
            ` : ''}
            
            ${moderationResult.textResult && moderationResult.textResult.flaggedWords ? `
            <p><strong>Flagged Words:</strong> ${moderationResult.textResult.flaggedWords.join(', ')}</p>
            ` : ''}
        </div>
        
        <div class="content-section">
            <h3>🛡️ Action Taken</h3>
            <p>✅ Content was automatically blocked before publication</p>
            <p>✅ User was shown appropriate error message</p>
            <p>✅ This alert was sent to administrators</p>
            <p>✅ User details have been logged for review</p>
        </div>
        
        <div class="content-section">
            <h3>📋 Recommended Actions</h3>
            <ul>
                <li>Review user's posting history for patterns</li>
                <li>Consider sending educational content about appropriate posting</li>
                <li>Monitor user for repeated violations</li>
                <li>Consider temporary restrictions if violations continue</li>
            </ul>
        </div>
    </div>
    
    <div class="footer">
        <p>This is an automated alert from CreatorCircle Content Moderation System</p>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>
    `;

    // Send email
    const mailOptions = {
      from: 'yasmanthvemala007@gmail.com',
      to: adminEmail || 'yasmanthvemala007@gmail.com',
      subject: emailSubject,
      html: emailContent
    };

    await transporter.sendMail(mailOptions);
    
    console.log('📧 Inappropriate content alert email sent successfully');
    
    return {
      success: true,
      message: 'Alert email sent successfully',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error sending inappropriate content alert:', error);
    throw new HttpsError('internal', 'Failed to send alert email');
  }
});

export const moderateContentAdvanced = onCall(async (request) => {
  try {
    const { content, images, videos } = request.data;
    
    if (!content && (!images || images.length === 0) && (!videos || videos.length === 0)) {
      throw new HttpsError('invalid-argument', 'Content, images, or videos are required');
    }

    const results: any = {
      text: null,
      images: [],
      videos: [],
      overall: {
        isAppropriate: true,
        confidence: 0,
        reasons: []
      }
    };

    // Moderate text content
    if (content) {
      try {
        const [textResult] = await language.analyzeSentiment({
          document: {
            content: content,
            type: 'PLAIN_TEXT',
          },
        });
        
        results.text = {
          isAppropriate: textResult.documentSentiment && textResult.documentSentiment.score && textResult.documentSentiment.score > -0.5,
          sentiment: textResult.documentSentiment?.score || 0,
          magnitude: textResult.documentSentiment?.magnitude || 0
        };
        
        if (!results.text.isAppropriate) {
          results.overall.isAppropriate = false;
          results.overall.reasons.push('Inappropriate text content detected');
        }
      } catch (error) {
        console.error('Error moderating text:', error);
        results.text = { isAppropriate: false, sentiment: -1, magnitude: 1 };
        results.overall.isAppropriate = false;
        results.overall.reasons.push('Text moderation failed');
      }
    }

    // Moderate images
    if (images && images.length > 0) {
      for (const imageUrl of images) {
        try {
          const [imageResult] = await vision.safeSearchDetection(imageUrl);
          const safeSearch = imageResult.safeSearchAnnotation;
          
          const isAppropriate = 
            safeSearch && safeSearch.adult === 'VERY_UNLIKELY' &&
            safeSearch.violence === 'VERY_UNLIKELY' &&
            safeSearch.racy === 'VERY_UNLIKELY' &&
            safeSearch.spoof === 'VERY_UNLIKELY' &&
            safeSearch.medical === 'VERY_UNLIKELY';
          
          results.images.push({
            url: imageUrl,
            isAppropriate,
            confidence: {
              adult: safeSearch?.adult || 'UNKNOWN',
              violence: safeSearch?.violence || 'UNKNOWN',
              racy: safeSearch?.racy || 'UNKNOWN',
              spoof: safeSearch?.spoof || 'UNKNOWN',
              medical: safeSearch?.medical || 'UNKNOWN'
            }
          });
          
          if (!isAppropriate) {
            results.overall.isAppropriate = false;
            results.overall.reasons.push('Inappropriate image detected');
          }
        } catch (error) {
          console.error('Error moderating image:', error);
          results.images.push({
            url: imageUrl,
            isAppropriate: false,
            confidence: { adult: 'LIKELY', violence: 'LIKELY', racy: 'LIKELY', spoof: 'LIKELY', medical: 'LIKELY' }
          });
          results.overall.isAppropriate = false;
          results.overall.reasons.push('Image moderation failed');
        }
      }
    }

    // Moderate videos (basic URL pattern checking for now)
    if (videos && videos.length > 0) {
      for (const videoUrl of videos) {
        const inappropriatePatterns = [
          /nude/i, /naked/i, /porn/i, /sex/i, /adult/i, /explicit/i, /nsfw/i, /xxx/i
        ];
        
        const hasInappropriatePattern = inappropriatePatterns.some(pattern => 
          pattern.test(videoUrl)
        );
        
        results.videos.push({
          url: videoUrl,
          isAppropriate: !hasInappropriatePattern,
          confidence: hasInappropriatePattern ? 0.9 : 0.1
        });
        
        if (hasInappropriatePattern) {
          results.overall.isAppropriate = false;
          results.overall.reasons.push('Inappropriate video detected');
        }
      }
    }

    // Calculate overall confidence
    const allResults = [
      results.text,
      ...results.images,
      ...results.videos
    ].filter(result => result !== null);
    
    if (allResults.length > 0) {
      results.overall.confidence = allResults.reduce((sum, result) => {
        return sum + (result.isAppropriate ? 1 : 0);
      }, 0) / allResults.length;
    }

    return results;
    
  } catch (error) {
    console.error('Error in advanced content moderation:', error);
    throw new HttpsError('internal', 'Failed to moderate content');
  }
});
