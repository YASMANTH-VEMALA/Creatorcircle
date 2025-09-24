#!/usr/bin/env node

/**
 * Complete Spotlight Removal Script
 * This will remove ALL spotlight functionality from the app and database
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  writeBatch
} = require('firebase/firestore');
const { 
  getStorage, 
  ref, 
  deleteObject, 
  listAll 
} = require('firebase/storage');

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

async function removeAllSpotlightData() {
  try {
    console.log('🔥 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const storage = getStorage(app);

    console.log('🗑️ Starting complete spotlight removal...');

    // 1. Delete all spotlight posts from Firestore
    console.log('📋 Deleting spotlight posts from Firestore...');
    const spotlightRef = collection(db, 'spotlightPosts');
    const spotlightSnapshot = await getDocs(spotlightRef);
    
    console.log(`📊 Found ${spotlightSnapshot.size} spotlight posts`);
    
    if (spotlightSnapshot.size > 0) {
      const batch = writeBatch(db);
      spotlightSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`✅ Deleted ${spotlightSnapshot.size} spotlight posts`);
    }

    // 2. Delete all spotlight likes
    console.log('❤️ Deleting spotlight likes...');
    const likesRef = collection(db, 'spotlightLikes');
    const likesSnapshot = await getDocs(likesRef);
    
    if (likesSnapshot.size > 0) {
      const batch = writeBatch(db);
      likesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`✅ Deleted ${likesSnapshot.size} spotlight likes`);
    }

    // 3. Delete all spotlight comments
    console.log('💬 Deleting spotlight comments...');
    const commentsRef = collection(db, 'spotlightComments');
    const commentsSnapshot = await getDocs(commentsRef);
    
    if (commentsSnapshot.size > 0) {
      const batch = writeBatch(db);
      commentsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`✅ Deleted ${commentsSnapshot.size} spotlight comments`);
    }

    // 4. Delete all spotlight shares
    console.log('📤 Deleting spotlight shares...');
    const sharesRef = collection(db, 'spotlightShares');
    const sharesSnapshot = await getDocs(sharesRef);
    
    if (sharesSnapshot.size > 0) {
      const batch = writeBatch(db);
      sharesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`✅ Deleted ${sharesSnapshot.size} spotlight shares`);
    }

    // 5. Delete all spotlight videos from Storage
    console.log('🎬 Deleting spotlight videos from Storage...');
    let deletedVideos = 0;
    
    try {
      // Delete from spotlight/videos folder
      const videosRef = ref(storage, 'spotlight');
      const videosList = await listAll(videosRef);
      
      for (const itemRef of videosList.items) {
        try {
          await deleteObject(itemRef);
          deletedVideos++;
          console.log(`✅ Deleted video: ${itemRef.name}`);
        } catch (error) {
          console.error(`❌ Failed to delete video ${itemRef.name}:`, error.message);
        }
      }
      
      // Delete from posts folder (spotlight videos)
      const postsRef = ref(storage, 'posts');
      const postsList = await listAll(postsRef);
      
      for (const fileRef of postsList.items) {
        if (fileRef.name.includes('spotlight') || fileRef.name.includes('video')) {
          try {
            await deleteObject(fileRef);
            deletedVideos++;
            console.log(`✅ Deleted file: ${fileRef.name}`);
          } catch (error) {
            console.error(`❌ Failed to delete file ${fileRef.name}:`, error.message);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error deleting videos:', error.message);
    }

    // 6. Clean up any remaining spotlight-related data
    console.log('🧹 Cleaning up remaining spotlight data...');
    
    // Delete spotlight collections if they exist
    const collectionsToDelete = [
      'spotlightPosts',
      'spotlightLikes', 
      'spotlightComments',
      'spotlightShares',
      'spotlightViews'
    ];
    
    for (const collectionName of collectionsToDelete) {
      try {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        
        if (snapshot.size > 0) {
          const batch = writeBatch(db);
          snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          console.log(`✅ Cleaned up ${collectionName}: ${snapshot.size} items`);
        }
      } catch (error) {
        console.log(`⚠️ Collection ${collectionName} may not exist or already empty`);
      }
    }

    console.log('\n🎉 Complete Spotlight Removal Successful!');
    console.log(`✅ Deleted ${spotlightSnapshot.size} spotlight posts`);
    console.log(`✅ Deleted ${likesSnapshot.size} spotlight likes`);
    console.log(`✅ Deleted ${commentsSnapshot.size} spotlight comments`);
    console.log(`✅ Deleted ${sharesSnapshot.size} spotlight shares`);
    console.log(`✅ Deleted ${deletedVideos} videos from storage`);
    console.log('✨ All spotlight functionality has been completely removed!');

  } catch (error) {
    console.error('❌ Error during spotlight removal:', error.message);
    process.exit(1);
  }
}

// Run the removal
console.log('🗑️ Starting Complete Spotlight Removal...');
console.log('⚠️  This will delete ALL spotlight data permanently!');
console.log('');

removeAllSpotlightData()
  .then(() => {
    console.log('\n✅ Spotlight removal completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Spotlight removal failed:', error.message);
    process.exit(1);
  });
