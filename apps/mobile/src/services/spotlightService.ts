import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, limit, doc, updateDoc, increment, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { db, storage } from '../config/firebase';
import { SpotlightPost } from '../types';

export class SpotlightService {
  static subscribeToUserSpotlight(userId: string, callback: (posts: SpotlightPost[]) => void) {
    console.log('🔍 Querying spotlight posts for userId:', userId);
    
    // Use a simple query without orderBy to avoid index requirements
    const q = query(
      collection(db, 'spotlightPosts'),
      where('creatorId', '==', userId),
      limit(100)
    );

    return onSnapshot(q,
      (snap) => {
        console.log('📊 Spotlight query snapshot:', snap.docs.length, 'documents');
        const items: SpotlightPost[] = snap.docs.map((d) => {
          const data = d.data();
          console.log('📄 Spotlight doc:', d.id, 'creatorId:', data.creatorId, 'isPublic:', data.isPublic);
          return { id: d.id, ...data } as any;
        });
        
        // Filter for public posts and sort by creation date client-side
        const publicItems = items
          .filter(item => item.isPublic !== false)
          .sort((a, b) => {
            const timeA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const timeB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return timeB.getTime() - timeA.getTime();
          });
        
        console.log('✅ Filtered and sorted spotlight posts:', publicItems.length);
        callback(publicItems);
      },
      (error) => {
        console.error('❌ Error querying user spotlight posts:', error);
        callback([]);
      }
    );
  }

  static subscribeToSpotlight(callback: (posts: SpotlightPost[]) => void) {
    // For testing, return mock data if no real data exists
    const mockData: SpotlightPost[] = [
      {
        id: '1',
        creatorId: 'user1',
        creatorName: 'john_doe',
        creatorAvatar: 'https://via.placeholder.com/100x100/FF6B35/FFFFFF?text=J',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnailUrl: 'https://via.placeholder.com/300x400/FF6B35/FFFFFF?text=Video1',
        caption: 'Check out this amazing spotlight! 🔥 #spotlight #viral',
        likesCount: 1250,
        commentsCount: 89,
        viewsCount: 15600,
        isFeatured: true,
        isPublic: true,
        createdAt: new Date(),
        shareUrl: 'https://creatorcircle.app/spotlight/1',
        deepLinkUrl: 'creatorcircle://spotlight/1'
      },
      {
        id: '2',
        creatorId: 'user2',
        creatorName: 'jane_smith',
        creatorAvatar: 'https://via.placeholder.com/100x100/FF6B35/FFFFFF?text=J',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        thumbnailUrl: 'https://via.placeholder.com/300x400/FF6B35/FFFFFF?text=Video2',
        caption: 'Amazing content coming your way! 💪 #creator #spotlight',
        likesCount: 890,
        commentsCount: 45,
        viewsCount: 12300,
        isFeatured: false,
        isPublic: true,
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        shareUrl: 'https://creatorcircle.app/spotlight/2',
        deepLinkUrl: 'creatorcircle://spotlight/2'
      },
      {
        id: '3',
        creatorId: 'user3',
        creatorName: 'mike_wilson',
        creatorAvatar: 'https://via.placeholder.com/100x100/FF6B35/FFFFFF?text=M',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnailUrl: 'https://via.placeholder.com/300x400/FF6B35/FFFFFF?text=Video3',
        caption: 'Behind the scenes of my latest project! 🎬 #behindthescenes',
        likesCount: 2100,
        commentsCount: 156,
        viewsCount: 28900,
        isFeatured: false,
        isPublic: true,
        createdAt: new Date(Date.now() - 172800000), // 2 days ago
        shareUrl: 'https://creatorcircle.app/spotlight/3',
        deepLinkUrl: 'creatorcircle://spotlight/3'
      }
    ];

    // Try to get real data first, fallback to mock data
    const q = query(
      collection(db, 'spotlightPosts'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    return onSnapshot(q, 
      (snap) => {
        const items: SpotlightPost[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
        // Sort by featured first, then by creation date
        const sortedItems = items.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        callback(sortedItems);
      },
      (error) => {
        console.log('Using mock data due to error:', error);
        callback(mockData);
      }
    );
  }

  static async pickVideoFromLibrary(): Promise<ImagePicker.ImagePickerAsset | null> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
      videoMaxDuration: 60,
    });
    if (result.canceled) return null;
    return result.assets?.[0] || null;
  }

  static async uploadVideoAsync(localUri: string, userId: string): Promise<string> {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const ts = Date.now();
    const ext = localUri.split('.').pop() || 'mp4';
    const fileRef = ref(storage, `spotlight/videos/${userId}_${ts}.${ext}`);
    await uploadBytes(fileRef, blob, { contentType: blob.type || 'video/mp4' });
    return await getDownloadURL(fileRef);
  }

  static async createSpotlightPost(params: {
    userId: string;
    videoUrl: string;
    caption?: string;
    thumbnailUrl?: string;
    isFeatured?: boolean;
    isPublic?: boolean;
  }): Promise<string> {
    console.log('🎬 Creating spotlight post for userId:', params.userId);
    console.log('📝 Post data:', { 
      creatorId: params.userId, 
      caption: params.caption, 
      isPublic: params.isPublic !== false 
    });
    
    const docRef = await addDoc(collection(db, 'spotlightPosts'), {
      creatorId: params.userId,
      videoUrl: params.videoUrl,
      caption: params.caption || '',
      thumbnailUrl: params.thumbnailUrl || '',
      shareUrl: '',
      deepLinkUrl: '',
      isFeatured: !!params.isFeatured,
      isPublic: params.isPublic !== false,
      likesCount: 0,
      commentsCount: 0,
      viewsCount: 0,
      createdAt: serverTimestamp(),
    });
    
    console.log('✅ Spotlight post created with ID:', docRef.id);
    return docRef.id;
  }

  static async deleteSpotlightPost(postId: string, videoUrl?: string, thumbnailUrl?: string): Promise<void> {
    try {
      // Delete the document from Firestore
      await deleteDoc(doc(db, 'spotlightPosts', postId));
      
      // Delete video from Storage if URL is provided
      if (videoUrl) {
        try {
          const videoRef = ref(storage, videoUrl);
          await deleteObject(videoRef);
        } catch (storageError) {
          console.log('Video file not found in storage or already deleted:', storageError);
        }
      }
      
      // Delete thumbnail from Storage if URL is provided
      if (thumbnailUrl) {
        try {
          const thumbnailRef = ref(storage, thumbnailUrl);
          await deleteObject(thumbnailRef);
        } catch (storageError) {
          console.log('Thumbnail file not found in storage or already deleted:', storageError);
        }
      }
      
      console.log('Spotlight post deleted successfully:', postId);
    } catch (error) {
      console.error('Error deleting spotlight post:', error);
      throw error;
    }
  }

  static async likeSpotlightPost(postId: string, userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'spotlightPosts', postId), {
        likesCount: increment(1),
        likedBy: arrayUnion(userId)
      });
    } catch (error) {
      console.error('Error liking spotlight post:', error);
      throw error;
    }
  }

  static async unlikeSpotlightPost(postId: string, userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'spotlightPosts', postId), {
        likesCount: increment(-1),
        likedBy: arrayRemove(userId)
      });
    } catch (error) {
      console.error('Error unliking spotlight post:', error);
      throw error;
    }
  }

  static async addComment(postId: string, userId: string, text: string, userProfile: any): Promise<void> {
    try {
      const now = new Date();
      const comment = {
        id: Date.now().toString(),
        userId,
        username: userProfile?.username || userProfile?.displayName || 'Unknown User',
        avatar: userProfile?.profilePhotoUrl || 'https://via.placeholder.com/40x40/FF6B35/FFFFFF?text=U',
        text: text.trim(),
        timestamp: now,
        timeAgo: 'now'
      };

      await updateDoc(doc(db, 'spotlightPosts', postId), {
        commentsCount: increment(1),
        comments: arrayUnion(comment)
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  static subscribeToSpotlightInteractions(postId: string, callback: (data: { likesCount: number, commentsCount: number, likedBy: string[], comments: any[] }) => void) {
    return onSnapshot(doc(db, 'spotlightPosts', postId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          likesCount: data.likesCount || 0,
          commentsCount: data.commentsCount || 0,
          likedBy: data.likedBy || [],
          comments: data.comments || []
        });
      }
    }, (error) => {
      console.error('Error subscribing to spotlight interactions:', error);
    });
  }

  static async incrementView(postId: string) {
    const refDoc = doc(db, 'spotlightPosts', postId);
    await updateDoc(refDoc, { viewsCount: increment(1) });
  }
}


