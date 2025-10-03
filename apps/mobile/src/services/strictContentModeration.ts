export interface ModerationResult {
  isAppropriate: boolean;
  confidence: number;
  reasons: string[];
  flaggedWords: string[];
  category: 'sexual' | 'violence' | 'hate' | 'drugs' | 'spam' | 'clean';
}

export class StrictContentModeration {
  // Comprehensive list of inappropriate keywords
  private static readonly INAPPROPRIATE_KEYWORDS = [
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
    'rough', 'hardcore', 'anal', 'oral',
    'blowjob', 'handjob', 'fingering',
    'threesome', 'orgy', 'gangbang',
    'milf', 'cougar', 'teen', 'young',
    'stepbrother', 'stepsister', 'incest',
    'rape', 'forced', 'non-consensual',
    
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
    
    // Hate speech
    'hate', 'hatred', 'hateful', 'racist', 'racism', 'racial',
    'nazi', 'hitler', 'fascist', 'fascism',
    'gay', 'lesbian', 'transgender', 'faggot', 'dyke', 'tranny',
    'retard', 'retarded', 'stupid', 'idiot', 'moron', 'dumb',
    'ugly', 'fat', 'skinny', 'disgusting', 'gross',
    'discrimination', 'discriminatory', 'prejudice', 'prejudiced',
    'sexist', 'sexism', 'misogynist', 'misogyny',
    'homophobic', 'homophobia', 'transphobic', 'transphobia',
    
    // Scam and illegal
    'scam', 'scamming', 'scammer', 'fraud', 'fraudulent',
    'steal', 'stealing', 'theft', 'rob', 'robbing', 'robbery',
    'hack', 'hacking', 'hacker', 'phishing', 'phish',
    'illegal', 'unlawful', 'criminal', 'crime', 'criminal',
    'cheat', 'cheating', 'cheater', 'lie', 'lying', 'liar',
    'fake', 'faking', 'fraud', 'deception', 'deceptive',
    
    // Other inappropriate
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

  // Sexual content patterns
  private static readonly SEXUAL_PATTERNS = [
    /\b(?:sex|sexual|nude|naked|porn|xxx|adult|explicit|nsfw)\b/i,
    /\b(?:fuck|shit|bitch|whore|slut|dick|penis|cock|pussy|vagina|boobs|tits)\b/i,
    /\b(?:cum|masturbat|orgasm|horny|aroused|erotic|sexy|intimate|fetish|bdsm)\b/i,
    /\b(?:rough|hardcore|anal|oral|blowjob|handjob|fingering)\b/i,
    /\b(?:threesome|orgy|gangbang|milf|cougar|teen|young)\b/i,
    /\b(?:stepbrother|stepsister|incest|rape|forced|non-consensual)\b/i
  ];

  // Violence patterns
  private static readonly VIOLENCE_PATTERNS = [
    /\b(?:kill|murder|die|death|suicide|self harm|cut myself|hurt myself)\b/i,
    /\b(?:bomb|shoot|gun|weapon|knife|stab|fight|beat|punch|hit|slap|kick)\b/i,
    /\b(?:violence|violent|brutal|threat|attack|assault|destroy|damage)\b/i
  ];

  // Hate speech patterns
  private static readonly HATE_PATTERNS = [
    /\b(?:hate|racist|nazi|hitler|fascist|gay|lesbian|transgender|faggot|dyke|tranny)\b/i,
    /\b(?:retard|stupid|idiot|moron|dumb|ugly|fat|skinny|disgusting|gross)\b/i,
    /\b(?:discrimination|prejudice|sexist|misogynist|homophobic|transphobic)\b/i
  ];

  /**
   * Analyze text content for inappropriate content
   */
  static analyzeText(text: string): ModerationResult {
    const lowerText = text.toLowerCase();
    const flaggedWords: string[] = [];
    let category: 'sexual' | 'violence' | 'hate' | 'drugs' | 'spam' | 'clean' = 'clean';
    let confidence = 0;

    // Check for inappropriate keywords
    this.INAPPROPRIATE_KEYWORDS.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        flaggedWords.push(keyword);
      }
    });

    // Check for sexual content patterns
    const hasSexualContent = this.SEXUAL_PATTERNS.some(pattern => pattern.test(text));
    if (hasSexualContent) {
      category = 'sexual';
      confidence = Math.max(confidence, 0.9);
    }

    // Check for violence patterns
    const hasViolence = this.VIOLENCE_PATTERNS.some(pattern => pattern.test(text));
    if (hasViolence) {
      category = 'violence';
      confidence = Math.max(confidence, 0.8);
    }

    // Check for hate speech patterns
    const hasHateSpeech = this.HATE_PATTERNS.some(pattern => pattern.test(text));
    if (hasHateSpeech) {
      category = 'hate';
      confidence = Math.max(confidence, 0.8);
    }

    // Calculate overall confidence based on flagged words
    if (flaggedWords.length > 0) {
      confidence = Math.max(confidence, Math.min(flaggedWords.length / 5, 1));
    }

    const isAppropriate = flaggedWords.length === 0 && !hasSexualContent && !hasViolence && !hasHateSpeech;

    return {
      isAppropriate,
      confidence,
      reasons: this.generateReasons(flaggedWords, hasSexualContent, hasViolence, hasHateSpeech),
      flaggedWords,
      category
    };
  }

  /**
   * Analyze image content (basic filename analysis)
   */
  static analyzeImage(imageUrl: string): ModerationResult {
    const inappropriatePatterns = [
      /nude/i, /naked/i, /porn/i, /sex/i, /adult/i, /explicit/i, /nsfw/i, /xxx/i,
      /fuck/i, /shit/i, /bitch/i, /whore/i, /slut/i, /dick/i, /penis/i, /cock/i,
      /pussy/i, /vagina/i, /boobs/i, /tits/i, /ass/i, /butt/i, /cum/i, /masturbat/i,
      /horny/i, /erotic/i, /sexy/i, /intimate/i, /fetish/i, /bdsm/i, /kinky/i,
      /rough/i, /hardcore/i, /anal/i, /oral/i, /blowjob/i, /handjob/i,
      /threesome/i, /orgy/i, /gangbang/i, /milf/i, /cougar/i, /teen/i, /young/i,
      /stepbrother/i, /stepsister/i, /incest/i, /rape/i, /forced/i,
      /violence/i, /violent/i, /brutal/i, /threat/i, /attack/i, /assault/i,
      /hate/i, /racist/i, /nazi/i, /hitler/i, /fascist/i, /gay/i, /lesbian/i,
      /transgender/i, /faggot/i, /dyke/i, /tranny/i, /retard/i, /stupid/i,
      /scam/i, /fraud/i, /illegal/i, /criminal/i, /cheat/i, /fake/i, /spam/i
    ];
    
    const hasInappropriatePattern = inappropriatePatterns.some(pattern => 
      pattern.test(imageUrl)
    );

    if (hasInappropriatePattern) {
      return {
        isAppropriate: false,
        confidence: 0.9,
        reasons: ['Inappropriate image filename detected'],
        flaggedWords: ['inappropriate_filename'],
        category: 'sexual'
      };
    }

    // For local files, we can't analyze content yet
    if (imageUrl.startsWith('file://') || imageUrl.startsWith('content://')) {
      return {
        isAppropriate: true,
        confidence: 0.3, // Low confidence for local files
        reasons: ['Local file - content analysis pending'],
        flaggedWords: [],
        category: 'clean'
      };
    }

    return {
      isAppropriate: true,
      confidence: 0.7,
      reasons: [],
      flaggedWords: [],
      category: 'clean'
    };
  }

  /**
   * Comprehensive post analysis
   */
  static analyzePost(content: string, images: string[] = [], videos: string[] = []): ModerationResult {
    // Analyze text content
    const textResult = this.analyzeText(content);
    
    // Analyze images
    const imageResults = images.map(image => this.analyzeImage(image));
    
    // Analyze videos (similar to images for now)
    const videoResults = videos.map(video => this.analyzeImage(video));

    // Check if any content is inappropriate
    const hasInappropriateText = !textResult.isAppropriate;
    const hasInappropriateImages = imageResults.some(result => !result.isAppropriate);
    const hasInappropriateVideos = videoResults.some(result => !result.isAppropriate);

    const isAppropriate = !hasInappropriateText && !hasInappropriateImages && !hasInappropriateVideos;

    // Collect all reasons and flagged words
    const reasons: string[] = [];
    const flaggedWords: string[] = [...textResult.flaggedWords];
    
    if (hasInappropriateText) {
      reasons.push(`Inappropriate text: ${textResult.flaggedWords.join(', ')}`);
    }
    if (hasInappropriateImages) {
      reasons.push('Inappropriate images detected');
    }
    if (hasInappropriateVideos) {
      reasons.push('Inappropriate videos detected');
    }

    // Determine category
    let category: 'sexual' | 'violence' | 'hate' | 'drugs' | 'spam' | 'clean' = 'clean';
    if (textResult.category !== 'clean') {
      category = textResult.category;
    } else if (imageResults.some(r => r.category !== 'clean')) {
      category = imageResults.find(r => r.category !== 'clean')?.category || 'clean';
    } else if (videoResults.some(r => r.category !== 'clean')) {
      category = videoResults.find(r => r.category !== 'clean')?.category || 'clean';
    }

    // Calculate overall confidence
    const allResults = [textResult, ...imageResults, ...videoResults];
    const confidence = allResults.reduce((sum, result) => sum + result.confidence, 0) / allResults.length;

    return {
      isAppropriate,
      confidence,
      reasons,
      flaggedWords,
      category
    };
  }

  /**
   * Generate human-readable reasons for blocking
   */
  private static generateReasons(
    flaggedWords: string[], 
    hasSexualContent: boolean, 
    hasViolence: boolean, 
    hasHateSpeech: boolean
  ): string[] {
    const reasons: string[] = [];
    
    if (hasSexualContent) {
      reasons.push('Sexual content detected');
    }
    if (hasViolence) {
      reasons.push('Violent content detected');
    }
    if (hasHateSpeech) {
      reasons.push('Hate speech detected');
    }
    if (flaggedWords.length > 0) {
      reasons.push(`Inappropriate language: ${flaggedWords.slice(0, 5).join(', ')}${flaggedWords.length > 5 ? '...' : ''}`);
    }
    
    return reasons;
  }
}
