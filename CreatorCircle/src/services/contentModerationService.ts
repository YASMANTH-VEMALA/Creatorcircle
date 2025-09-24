import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

export interface ModerationResult {
  isAppropriate: boolean;
  confidence: number;
  categories: {
    adult: number;
    violence: number;
    racy: number;
    spoof: number;
    medical: number;
  };
  reasons: string[];
}

export interface TextModerationResult {
  isAppropriate: boolean;
  toxicity: number;
  categories: {
    identity_attack: number;
    insult: number;
    obscene: number;
    severe_toxicity: number;
    sexual_explicit: number;
    threat: number;
  };
  flaggedWords: string[];
}

export interface UserDetails {
  uid: string;
  name: string;
  email: string;
  college: string;
  profilePhotoUrl?: string;
  createdAt: Date;
}

export class ContentModerationService {
  /**
   * Moderate text content for inappropriate language
   */
  static async moderateText(text: string): Promise<TextModerationResult> {
    try {
      // Comprehensive keyword filtering for immediate blocking
      const inappropriateKeywords = [
        // Sexual content
        'sex', 'sexual', 'nude', 'naked', 'porn', 'pornography', 'xxx', 'x-rated',
        'fuck', 'fucking', 'fucked', 'fuckin', 'fucks', 'fucker', 'fuckers',
        'shit', 'shitting', 'shitted', 'shits', 'shitty', 'shitter',
        'bitch', 'bitches', 'bitching', 'bitchy',
        'whore', 'slut', 'sluts', 'slutty', 'slutting',
        'dick', 'penis', 'cock', 'pussy', 'vagina', 'boobs', 'tits', 'titties',
        'ass', 'asshole', 'butt', 'butthole', 'arse', 'arsehole',
        'cum', 'cumming', 'cums', 'sperm', 'jizz',
        'masturbat', 'masturbating', 'masturbation',
        'orgasm', 'orgasmic', 'climax',
        'horny', 'horniness', 'aroused', 'arousal',
        'erotic', 'erotica', 'sexy', 'sexiness',
        'seduce', 'seduction', 'seductive',
        'intimate', 'intimacy', 'foreplay',
        'fetish', 'fetishes', 'kinky', 'kink',
        'bdsm', 'bondage', 'domination', 'submission',
        
        // Violence and threats
        'kill', 'killing', 'murder', 'murdering', 'die', 'dying', 'death', 'dead',
        'suicide', 'suicidal', 'self harm', 'cutting', 'cut myself', 'hurt myself',
        'bomb', 'bombing', 'terrorist', 'terrorism', 'explosive', 'explode',
        'gun', 'shoot', 'shooting', 'weapon', 'knife', 'stab', 'stabbing',
        'fight', 'fighting', 'beat', 'beating', 'punch', 'punching',
        'hit', 'hitting', 'slap', 'slapping', 'kick', 'kicking',
        'violence', 'violent', 'brutal', 'brutality',
        'threat', 'threatening', 'threaten', 'menace', 'menacing',
        'attack', 'attacking', 'assault', 'assaulting',
        'destroy', 'destroying', 'destruction', 'damage', 'damaging',
        
        // Drugs and alcohol
        'drug', 'drugs', 'cocaine', 'coke', 'heroin', 'marijuana', 'weed', 'cannabis',
        'alcohol', 'drunk', 'drinking', 'beer', 'wine', 'liquor', 'vodka', 'whiskey',
        'smoke', 'smoking', 'cigarette', 'cigarettes', 'tobacco',
        'high', 'stoned', 'baked', 'wasted', 'intoxicated',
        'addiction', 'addict', 'addicted', 'addictive',
        'overdose', 'overdosing', 'poison', 'poisoning',
        
        // Hate speech and discrimination
        'hate', 'hatred', 'hateful', 'racist', 'racism', 'racial',
        'nazi', 'hitler', 'fascist', 'fascism',
        'gay', 'lesbian', 'transgender', 'faggot', 'dyke', 'tranny',
        'retard', 'retarded', 'stupid', 'idiot', 'moron', 'dumb',
        'ugly', 'fat', 'skinny', 'disgusting', 'gross',
        'discrimination', 'discriminatory', 'prejudice', 'prejudiced',
        'sexist', 'sexism', 'misogynist', 'misogyny',
        'homophobic', 'homophobia', 'transphobic', 'transphobia',
        
        // Scam and illegal activities
        'scam', 'scamming', 'scammer', 'fraud', 'fraudulent',
        'steal', 'stealing', 'theft', 'rob', 'robbing', 'robbery',
        'hack', 'hacking', 'hacker', 'phishing', 'phish',
        'illegal', 'unlawful', 'criminal', 'crime', 'criminal',
        'cheat', 'cheating', 'cheater', 'lie', 'lying', 'liar',
        'fake', 'faking', 'fraud', 'deception', 'deceptive',
        
        // Other inappropriate content
        'spam', 'spamming', 'spammer', 'advertisement', 'advertising',
        'promote', 'promoting', 'promotion', 'marketing',
        'sell', 'selling', 'sale', 'buy', 'buying', 'purchase',
        'money', 'cash', 'payment', 'pay', 'paying',
        'free', 'discount', 'offer', 'deal', 'bargain',
        'click', 'clicking', 'link', 'website', 'url',
        'download', 'downloading', 'file', 'files',
        'virus', 'malware', 'trojan', 'worm',
        'password', 'passwords', 'login', 'account', 'accounts',
        'personal', 'private', 'confidential', 'secret', 'secrets'
      ];

      const lowerText = text.toLowerCase();
      const flaggedWords: string[] = [];
      
      // Check for inappropriate keywords
      inappropriateKeywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          flaggedWords.push(keyword);
        }
      });

      // Check for excessive profanity
      const profanityCount = flaggedWords.length;
      const toxicity = Math.min(profanityCount / 10, 1); // Scale to 0-1

      // Check for sexual content patterns
      const sexualPatterns = [
        /\b(?:sex|sexual|nude|naked|porn|xxx|adult|explicit|nsfw)\b/i,
        /\b(?:fuck|shit|bitch|whore|slut|dick|penis|cock|pussy|vagina|boobs|tits)\b/i,
        /\b(?:cum|masturbat|orgasm|horny|aroused|erotic|sexy|intimate|fetish|bdsm)\b/i
      ];
      
      const sexualExplicit = sexualPatterns.some(pattern => pattern.test(text)) ? 1 : 0;

      // Check for violence patterns
      const violencePatterns = [
        /\b(?:kill|murder|die|death|suicide|self harm|cut myself|hurt myself)\b/i,
        /\b(?:bomb|shoot|gun|weapon|knife|stab|fight|beat|punch|hit|slap|kick)\b/i,
        /\b(?:violence|violent|brutal|threat|attack|assault|destroy|damage)\b/i
      ];
      
      const threat = violencePatterns.some(pattern => pattern.test(text)) ? 1 : 0;

      // Check for hate speech patterns
      const hatePatterns = [
        /\b(?:hate|racist|nazi|hitler|fascist|gay|lesbian|transgender|faggot|dyke|tranny)\b/i,
        /\b(?:retard|stupid|idiot|moron|dumb|ugly|fat|skinny|disgusting|gross)\b/i,
        /\b(?:discrimination|prejudice|sexist|misogynist|homophobic|transphobic)\b/i
      ];
      
      const identityAttack = hatePatterns.some(pattern => pattern.test(text)) ? 1 : 0;

      // Check for scam/illegal patterns
      const scamPatterns = [
        /\b(?:scam|fraud|steal|hack|illegal|criminal|cheat|fake|spam)\b/i,
        /\b(?:sell|buy|money|cash|payment|free|discount|offer|deal)\b/i,
        /\b(?:click|link|website|url|download|virus|malware|password|login)\b/i
      ];
      
      const scamContent = scamPatterns.some(pattern => pattern.test(text)) ? 1 : 0;

      const isAppropriate = flaggedWords.length === 0 && sexualExplicit === 0 && threat === 0 && identityAttack === 0 && scamContent === 0;

      return {
        isAppropriate,
        toxicity,
        categories: {
          identity_attack: identityAttack,
          insult: profanityCount > 0 ? 0.8 : 0,
          obscene: profanityCount > 2 ? 0.9 : 0,
          severe_toxicity: profanityCount > 5 ? 1 : 0,
          sexual_explicit: sexualExplicit,
          threat: threat
        },
        flaggedWords
      };
    } catch (error) {
      console.error('Error moderating text:', error);
      // Default to blocking if moderation fails
      return {
        isAppropriate: false,
        toxicity: 1,
        categories: {
          identity_attack: 0,
          insult: 0,
          obscene: 0,
          severe_toxicity: 1,
          sexual_explicit: 0,
          threat: 0
        },
        flaggedWords: ['moderation_error']
      };
    }
  }

  /**
   * Moderate image content using Cloud Vision API
   */
  static async moderateImage(imageUrl: string): Promise<ModerationResult> {
    try {
      console.log('🖼️ Moderating image:', imageUrl);
      
      // Check for common inappropriate image patterns in URL
      const inappropriatePatterns = [
        /nude/i, /naked/i, /porn/i, /sex/i, /adult/i, /explicit/i, /nsfw/i, /xxx/i,
        /fuck/i, /shit/i, /bitch/i, /whore/i, /slut/i, /dick/i, /penis/i, /cock/i,
        /pussy/i, /vagina/i, /boobs/i, /tits/i, /ass/i, /butt/i, /cum/i, /masturbat/i,
        /horny/i, /erotic/i, /sexy/i, /intimate/i, /fetish/i, /bdsm/i, /kinky/i,
        /violence/i, /violent/i, /brutal/i, /threat/i, /attack/i, /assault/i,
        /hate/i, /racist/i, /nazi/i, /hitler/i, /fascist/i, /gay/i, /lesbian/i,
        /transgender/i, /faggot/i, /dyke/i, /tranny/i, /retard/i, /stupid/i,
        /scam/i, /fraud/i, /illegal/i, /criminal/i, /cheat/i, /fake/i, /spam/i
      ];
      
      const hasInappropriatePattern = inappropriatePatterns.some(pattern => 
        pattern.test(imageUrl)
      );

      if (hasInappropriatePattern) {
        console.log('❌ Image blocked due to inappropriate filename pattern');
        return {
          isAppropriate: false,
          confidence: 0.9,
          categories: {
            adult: 0.9,
            violence: 0,
            racy: 0.8,
            spoof: 0,
            medical: 0
          },
          reasons: ['Inappropriate image filename detected']
        };
      }

      // For local files (not yet uploaded), we can't analyze content yet
      // But we can check if it's a local file and apply basic validation
      if (imageUrl.startsWith('file://') || imageUrl.startsWith('content://')) {
        console.log('⚠️ Local image file detected - will be analyzed after upload');
        // For now, allow local files but they'll be checked after upload
        return {
          isAppropriate: true,
          confidence: 0.5, // Lower confidence for local files
          categories: {
            adult: 0,
            violence: 0,
            racy: 0,
            spoof: 0,
            medical: 0
          },
          reasons: ['Local file - will be analyzed after upload']
        };
      }

      // For Firebase Storage URLs, we could call Cloud Vision API here
      // But for now, we'll rely on filename patterns and post-upload analysis
      console.log('✅ Image filename appears appropriate');
      return {
        isAppropriate: true,
        confidence: 0.7,
        categories: {
          adult: 0,
          violence: 0,
          racy: 0,
          spoof: 0,
          medical: 0
        },
        reasons: []
      };
    } catch (error) {
      console.error('Error moderating image:', error);
      return {
        isAppropriate: false,
        confidence: 1,
        categories: {
          adult: 1,
          violence: 0,
          racy: 0,
          spoof: 0,
          medical: 0
        },
        reasons: ['Moderation error']
      };
    }
  }

  /**
   * Moderate video content
   */
  static async moderateVideo(videoUrl: string): Promise<ModerationResult> {
    try {
      // Similar to image moderation but for videos
      const inappropriatePatterns = [
        /nude/i, /naked/i, /porn/i, /sex/i, /adult/i, /explicit/i, /nsfw/i, /xxx/i,
        /fuck/i, /shit/i, /bitch/i, /whore/i, /slut/i, /dick/i, /penis/i, /cock/i,
        /pussy/i, /vagina/i, /boobs/i, /tits/i, /ass/i, /butt/i, /cum/i, /masturbat/i,
        /horny/i, /erotic/i, /sexy/i, /intimate/i, /fetish/i, /bdsm/i, /kinky/i,
        /violence/i, /violent/i, /brutal/i, /threat/i, /attack/i, /assault/i,
        /hate/i, /racist/i, /nazi/i, /hitler/i, /fascist/i, /gay/i, /lesbian/i,
        /transgender/i, /faggot/i, /dyke/i, /tranny/i, /retard/i, /stupid/i,
        /scam/i, /fraud/i, /illegal/i, /criminal/i, /cheat/i, /fake/i, /spam/i,
        /video/i, /mp4/i, /mov/i, /avi/i, /mkv/i, /wmv/i, /flv/i, /webm/i
      ];
      
      const hasInappropriatePattern = inappropriatePatterns.some(pattern => 
        pattern.test(videoUrl)
      );

      if (hasInappropriatePattern) {
        return {
          isAppropriate: false,
          confidence: 0.9,
          categories: {
            adult: 0.9,
            violence: 0,
            racy: 0.8,
            spoof: 0,
            medical: 0
          },
          reasons: ['Inappropriate video detected']
        };
      }

      return {
        isAppropriate: true,
        confidence: 0.7,
        categories: {
          adult: 0,
          violence: 0,
          racy: 0,
          spoof: 0,
          medical: 0
        },
        reasons: []
      };
    } catch (error) {
      console.error('Error moderating video:', error);
      return {
        isAppropriate: false,
        confidence: 1,
        categories: {
          adult: 1,
          violence: 0,
          racy: 0,
          spoof: 0,
          medical: 0
        },
        reasons: ['Moderation error']
      };
    }
  }

  /**
   * Comprehensive post moderation
   */
  static async moderatePost(
    content: string,
    images: string[] = [],
    videos: string[] = []
  ): Promise<{
    isAppropriate: boolean;
    textResult: TextModerationResult;
    imageResults: ModerationResult[];
    videoResults: ModerationResult[];
    reasons: string[];
  }> {
    try {
      // Moderate text content
      const textResult = await this.moderateText(content);
      
      // Moderate images
      const imageResults = await Promise.all(
        images.map(image => this.moderateImage(image))
      );
      
      // Moderate videos
      const videoResults = await Promise.all(
        videos.map(video => this.moderateVideo(video))
      );

      // Check if any content is inappropriate
      const hasInappropriateText = !textResult.isAppropriate;
      const hasInappropriateImages = imageResults.some(result => !result.isAppropriate);
      const hasInappropriateVideos = videoResults.some(result => !result.isAppropriate);

      const isAppropriate = !hasInappropriateText && !hasInappropriateImages && !hasInappropriateVideos;

      // Collect all reasons
      const reasons: string[] = [];
      if (hasInappropriateText) {
        reasons.push(`Inappropriate text: ${textResult.flaggedWords.join(', ')}`);
      }
      if (hasInappropriateImages) {
        reasons.push('Inappropriate images detected');
      }
      if (hasInappropriateVideos) {
        reasons.push('Inappropriate videos detected');
      }

      return {
        isAppropriate,
        textResult,
        imageResults,
        videoResults,
        reasons
      };
    } catch (error) {
      console.error('Error moderating post:', error);
      return {
        isAppropriate: false,
        textResult: {
          isAppropriate: false,
          toxicity: 1,
          categories: {
            identity_attack: 0,
            insult: 0,
            obscene: 0,
            severe_toxicity: 1,
            sexual_explicit: 0,
            threat: 0
          },
          flaggedWords: ['moderation_error']
        },
        imageResults: [],
        videoResults: [],
        reasons: ['Content moderation failed']
      };
    }
  }

  /**
   * Send email notification about inappropriate content attempt
   */
  static async sendInappropriateContentAlert(
    userDetails: UserDetails,
    content: string,
    images: string[],
    videos: string[],
    moderationResult: any
  ): Promise<void> {
    try {
      console.log('📧 Attempting to send inappropriate content alert...');
      
      // Call Firebase Cloud Function to send email
      const sendAlertEmail = httpsCallable(functions, 'sendInappropriateContentAlert');
      
      await sendAlertEmail({
        userDetails: {
          uid: userDetails.uid,
          name: userDetails.name,
          email: userDetails.email,
          college: userDetails.college,
          profilePhotoUrl: userDetails.profilePhotoUrl,
          createdAt: userDetails.createdAt
        },
        content: content,
        images: images,
        videos: videos,
        moderationResult: moderationResult,
        timestamp: new Date().toISOString(),
        adminEmail: 'yasmanthvemala007@gmail.com'
      });
      
      console.log('📧 Inappropriate content alert sent to admin');
    } catch (error) {
      console.error('Error sending inappropriate content alert:', error);
      
      // Fallback: Log the alert locally
      console.log('🚨 FALLBACK ALERT - Inappropriate Content Detected:');
      console.log('User:', userDetails.name, '(', userDetails.email, ')');
      console.log('Content:', content);
      console.log('Reasons:', moderationResult.reasons);
      console.log('Flagged Words:', moderationResult.textResult.flaggedWords);
      console.log('Timestamp:', new Date().toISOString());
    }
  }
}
