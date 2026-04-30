// ads.js - Ad Tracking & Display System (Production Ready)
// =====================================================

// 🔥 Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBuafsG2a7I5WRTcwvP2CgNv452L4BzHls",
  authDomain: "learny-ec06f.firebaseapp.com",
  projectId: "learny-ec06f",
  storageBucket: "learny-ec06f.firebasestorage.app",
  messagingSenderId: "65568577957",
  appId: "1:65568577957:web:ef9f6dae41aeec20d7b04c",
  measurementId: "G-MSYGVV8LBJ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

// 🎯 Track which ads we've already counted on this page (prevents double-counting)
const viewedAds = new Set();
const clickedAds = new Set();

// 🔧 Helper: Auto-fix URLs to ensure external links open correctly
function fixUrl(url) {
  if (!url) return '#';
  url = url.trim();
  
  // If URL doesn't start with http/https, add https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // If it starts with www., add https://
    if (url.startsWith('www.')) {
      return 'https://' + url;
    }
    // If it's a domain or path, assume https
    return 'https://' + url;
  }
  return url;
}

// 🚀 Load and display ads when page is ready
document.addEventListener('DOMContentLoaded', () => {
  db.collection('ads')
    .where('active', '==', true)
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added' || change.type === 'modified') {
          renderAd(change.doc.data(), change.doc.id);
        }
      });
    });
});

// 🎨 Render ad in the correct container
function renderAd(ad, id) {
  // Skip if already rendered on this page
  if (document.querySelector(`[data-ad-id="${id}"]`)) return;

  if (ad.type === 'banner') {
    const container = document.getElementById('banner-ad-container');
    if (!container) return;
    
    container.innerHTML = `
      <div class="ad-banner" data-ad-id="${id}" style="text-align:center; margin:20px 0; background:#f8f9fa; padding:15px; border:1px dashed #ccc; border-radius:8px;">
        <img src="${ad.imageUrl}" alt="Advertisement" style="max-width:100%; height:auto; border-radius:4px;">
        <p style="margin:10px 0; color:#333; font-size:14px;">${ad.description}</p>
        <a href="#" class="ad-click-btn" data-id="${id}" data-url="${ad.buttonUrl}" 
           style="display:inline-block; padding:10px 20px; background:#007bff; color:#fff; 
                  text-decoration:none; border-radius:5px; font-weight:bold; transition:background 0.3s;">
          ${ad.buttonText || 'Learn More'}
        </a>
      </div>`;
      
  } else if (ad.type === 'anchor') {
    const container = document.getElementById('anchor-ad-container');
    if (!container) return;
    
    container.innerHTML = `
      <div class="ad-anchor" data-ad-id="${id}" style="position:fixed; bottom:0; left:0; width:100%; 
           background:#fff; padding:15px; box-shadow:0 -2px 10px rgba(0,0,0,0.15); 
           display:flex; align-items:center; justify-content:center; gap:20px; z-index:9999; flex-wrap:wrap;">
        <img src="${ad.imageUrl}" alt="Ad" style="height:50px; width:auto; border-radius:4px;">
        <span style="font-size:14px; color:#333; flex:1; min-width:200px;">${ad.description}</span>
        <a href="#" class="ad-click-btn" data-id="${id}" data-url="${ad.buttonUrl}" 
           style="padding:10px 20px; background:#28a745; color:#fff; 
                  text-decoration:none; border-radius:5px; font-weight:bold; white-space:nowrap;">
          ${ad.buttonText || 'Click Here'}
        </a>
      </div>
      <div style="height:80px;"></div>`; // Spacer so ad doesn't cover content
  }

  // 🔗 Add click tracking to buttons (count only once per session)
  document.querySelectorAll(`.ad-click-btn[data-id="${id}"]`).forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Prevent double-clicking same ad
      if (clickedAds.has(id)) return;
      clickedAds.add(id);
      
      // Get and fix the URL
      let url = btn.getAttribute('data-url');
      url = fixUrl(url);
      
      // Track the click
      trackAdEvent(id, 'clicks');
      
      // Open link after short delay (ensures tracking completes)
      setTimeout(() => {
        // 🎯 SAME TAB: Use window.location.href
        // 🎯 NEW TAB: Use window.open(url, '_blank')
        window.location.href = url;
      }, 300);
    });
  });

  // 👁️ Track view ONLY ONCE when ad renders (AdSense-style)
  trackViewOnce(id);
}

// Track view only once per page load
function trackViewOnce(adId) {
  // Skip if already counted on this page
  if (viewedAds.has(adId)) return;
  
  // Mark as viewed
  viewedAds.add(adId);
  
  // Send view to Firebase
  trackAdEvent(adId, 'views');
}

// Send tracking data to Firestore
function trackAdEvent(adId, type) {
  const fieldName = type === 'views' ? 'totalViews' : 'totalClicks';
  const dailyField = `dailyStats.${today}.${type}`;
  
  db.collection('ads').doc(adId).set({
    [fieldName]: firebase.firestore.FieldValue.increment(1),
    [dailyField]: firebase.firestore.FieldValue.increment(1)
  }, { merge: true })
  .catch(err => console.error(`Error tracking ${type}:`, err));
}
