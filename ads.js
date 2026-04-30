// ads.js - Ad Tracking & Display System (Fixed View Counting)
const firebaseConfig = {
  apiKey: "AIzaSyBuafsG2a7I5WRTcwvP2CgNv452L4BzHls",
  authDomain: "learny-ec06f.firebaseapp.com",
  projectId: "learny-ec06f",
  storageBucket: "learny-ec06f.firebasestorage.app",
  messagingSenderId: "65568577957",
  appId: "1:65568577957:web:ef9f6dae41aeec20d7b04c",
  measurementId: "G-MSYGVV8LBJ"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const today = new Date().toISOString().split('T')[0];

// Track which ads we've already counted on this page
const viewedAds = new Set();
const clickedAds = new Set();

document.addEventListener('DOMContentLoaded', () => {
  db.collection('ads').where('active', '==', true).onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added' || change.type === 'modified') {
        renderAd(change.doc.data(), change.doc.id);
      }
    });
  });
});

function renderAd(ad, id) {
  // Skip if already rendered on this page
  if (document.querySelector(`[data-ad-id="${id}"]`)) return;

  if (ad.type === 'banner') {
    const container = document.getElementById('banner-ad-container');
    if (!container) return;
    
    container.innerHTML = `
      <div class="ad-banner" data-ad-id="${id}" style="text-align:center; margin:20px 0; background:#f8f9fa; padding:15px; border:1px dashed #ccc;">
        <img src="${ad.imageUrl}" alt="Advertisement" style="max-width:100%; height:auto; border-radius:4px;">
        <p style="margin:10px 0; color:#333;">${ad.description}</p>
        <a href="#" class="ad-click-btn" data-id="${id}" data-url="${ad.buttonUrl}" 
           style="display:inline-block; padding:10px 20px; background:#007bff; color:#fff; 
                  text-decoration:none; border-radius:5px; font-weight:bold;">
          ${ad.buttonText || 'Learn More'}
        </a>
      </div>`;
      
  } else if (ad.type === 'anchor') {
    const container = document.getElementById('anchor-ad-container');
    if (!container) return;
    
    container.innerHTML = `
      <div class="ad-anchor" data-ad-id="${id}" style="position:fixed; bottom:0; left:0; width:100%; 
           background:#fff; padding:15px; box-shadow:0 -2px 10px rgba(0,0,0,0.1); 
           display:flex; align-items:center; justify-content:center; gap:20px; z-index:9999;">
        <img src="${ad.imageUrl}" alt="Ad" style="height:50px; width:auto;">
        <span style="font-size:14px; color:#333;">${ad.description}</span>
        <a href="#" class="ad-click-btn" data-id="${id}" data-url="${ad.buttonUrl}" 
           style="padding:10px 20px; background:#28a745; color:#fff; 
                  text-decoration:none; border-radius:5px; font-weight:bold;">
          ${ad.buttonText || 'Click Here'}
        </a>
      </div>
      <div style="height:80px;"></div>`;
  }

  // Add click tracking (count only once per ad per session)
  document.querySelectorAll(`.ad-click-btn[data-id="${id}"]`).forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Prevent double-clicking same ad
      if (clickedAds.has(id)) return;
      clickedAds.add(id);
      
      const url = btn.getAttribute('data-url');
      trackAdEvent(id, 'clicks');
      
      // Open link after tracking
      setTimeout(() => {
        window.open(url, '_blank');
      }, 300);
    });
  });

  // Track view ONLY ONCE when ad becomes visible (like AdSense)
  trackViewOnce(id);
}

// Track view only once per page load (when ad is visible)
function trackViewOnce(adId) {
  // Skip if already counted on this page
  if (viewedAds.has(adId)) return;
  
  // Mark as viewed
  viewedAds.add(adId);
  
  // Track the view
  trackAdEvent(adId, 'views');
}

// Send tracking data to Firestore
function trackAdEvent(adId, type) {
  db.collection('ads').doc(adId).set({
    [`total${type.charAt(0).toUpperCase() + type.slice(1)}`]: firebase.firestore.FieldValue.increment(1),
    [`dailyStats.${today}.${type}`]: firebase.firestore.FieldValue.increment(1)
  }, { merge: true }).catch(err => console.error('Tracking error:', err));
}
