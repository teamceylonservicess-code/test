// ads.js - Professional Ad System v2.0
// =====================================

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

const viewedAds = new Set();
const clickedAds = new Set();

// Auto-fix URLs
function fixUrl(url) {
  if (!url) return '#';
  url = url.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
}

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
  if (document.querySelector(`[data-ad-id="${id}"]`)) return;

  if (ad.type === 'banner') {
    renderBannerAd(ad, id);
  } else if (ad.type === 'anchor') {
    renderAnchorAd(ad, id);
  }
}

// 🎨 Professional Banner Ad (Logo | Description | Button)
function renderBannerAd(ad, id) {
  const container = document.getElementById('banner-ad-container');
  if (!container) return;
  
  container.innerHTML = `
    <style>
      .pro-banner {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border: 2px solid #dee2e6;
        border-radius: 12px;
        padding: 20px;
        margin: 20px auto;
        max-width: 800px;
        display: flex;
        align-items: center;
        gap: 20px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        transition: transform 0.3s, box-shadow 0.3s;
      }
      .pro-banner:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.12);
      }
      .pro-banner-logo {
        flex-shrink: 0;
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: 10px;
        border: 3px solid #fff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .pro-banner-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .pro-banner-desc {
        font-size: 15px;
        color: #495057;
        line-height: 1.5;
        margin: 0;
      }
      .pro-banner-btn {
        display: inline-block;
        padding: 10px 24px;
        background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
        color: #fff;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
        text-align: center;
        width: fit-content;
        transition: all 0.3s;
        box-shadow: 0 2px 8px rgba(0,123,255,0.3);
      }
      .pro-banner-btn:hover {
        background: linear-gradient(135deg, #0056b3 0%, #004494 100%);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,123,255,0.4);
      }
      /* Mobile Responsive */
      @media (max-width: 768px) {
        .pro-banner {
          flex-direction: column;
          text-align: center;
          padding: 15px;
          margin: 15px 10px;
        }
        .pro-banner-logo {
          width: 60px;
          height: 60px;
        }
        .pro-banner-desc {
          font-size: 13px;
        }
        .pro-banner-btn {
          padding: 8px 20px;
          font-size: 14px;
        }
      }
      @media (max-width: 480px) {
        .pro-banner-logo {
          width: 50px;
          height: 50px;
        }
        .pro-banner-desc {
          font-size: 12px;
        }
        .pro-banner-btn {
          padding: 6px 16px;
          font-size: 13px;
        }
      }
    </style>
    <div class="pro-banner" data-ad-id="${id}">
      <img src="${ad.imageUrl}" alt="Ad" class="pro-banner-logo">
      <div class="pro-banner-content">
        <p class="pro-banner-desc">${ad.description}</p>
        <a href="#" class="pro-banner-btn ad-click-btn" data-id="${id}" data-url="${ad.buttonUrl}">
          ${ad.buttonText || 'Learn More'}
        </a>
      </div>
    </div>`;

  setupAdTracking(id, ad.buttonUrl);
  trackViewOnce(id);
}

// 📍 Professional Anchor Ad (Collapsible with Arrow)
function renderAnchorAd(ad, id) {
  const container = document.getElementById('anchor-ad-container');
  if (!container) return;
  
  container.innerHTML = `
    <style>
      .pro-anchor-wrapper {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        z-index: 9999;
        transition: transform 0.3s ease-in-out;
      }
      .pro-anchor-wrapper.collapsed {
        transform: translateY(calc(100% - 40px));
      }
      .pro-anchor-toggle {
        position: absolute;
        top: -35px;
        left: 10px;
        background: linear-gradient(135deg, #28a745 0%, #218838 100%);
        color: #fff;
        border: none;
        border-radius: 8px 8px 0 0;
        padding: 8px 12px;
        cursor: pointer;
        font-size: 18px;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.2);
        transition: all 0.3s;
        z-index: 10000;
      }
      .pro-anchor-toggle:hover {
        background: linear-gradient(135deg, #218838 0%, #1e7e34 100%);
        transform: translateY(-2px);
      }
      .pro-anchor {
        background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
        padding: 15px 20px;
        box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
        border-top: 3px solid #28a745;
      }
      .pro-anchor-logo {
        height: 45px;
        width: auto;
        border-radius: 6px;
        flex-shrink: 0;
      }
      .pro-anchor-text {
        font-size: 14px;
        color: #495057;
        flex: 1;
        text-align: center;
      }
      .pro-anchor-btn {
        padding: 10px 24px;
        background: linear-gradient(135deg, #28a745 0%, #218838 100%);
        color: #fff;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
        white-space: nowrap;
        transition: all 0.3s;
        box-shadow: 0 2px 8px rgba(40,167,69,0.3);
      }
      .pro-anchor-btn:hover {
        background: linear-gradient(135deg, #218838 0%, #1e7e34 100%);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(40,167,69,0.4);
      }
      @media (max-width: 768px) {
        .pro-anchor {
          flex-wrap: wrap;
          padding: 12px 15px;
          gap: 12px;
        }
        .pro-anchor-logo {
          height: 35px;
        }
        .pro-anchor-text {
          font-size: 12px;
          width: 100%;
        }
        .pro-anchor-btn {
          padding: 8px 20px;
          font-size: 13px;
        }
      }
    </style>
    <div class="pro-anchor-wrapper" id="anchor-${id}">
      <button class="pro-anchor-toggle" onclick="toggleAnchor('${id}')">▼</button>
      <div class="pro-anchor">
        <img src="${ad.imageUrl}" alt="Ad" class="pro-anchor-logo">
        <span class="pro-anchor-text">${ad.description}</span>
        <a href="#" class="pro-anchor-btn ad-click-btn" data-id="${id}" data-url="${ad.buttonUrl}">
          ${ad.buttonText || 'Click Here'}
        </a>
      </div>
    </div>
    <div style="height:90px;"></div>`;

  // Store anchor state
  window.anchorStates = window.anchorStates || {};
  window.anchorStates[id] = false; // false = expanded, true = collapsed

  setupAdTracking(id, ad.buttonUrl);
  trackViewOnce(id);
}

// Toggle anchor ad visibility
window.toggleAnchor = function(id) {
  const wrapper = document.getElementById(`anchor-${id}`);
  const toggle = wrapper.querySelector('.pro-anchor-toggle');
  window.anchorStates[id] = !window.anchorStates[id];
  
  if (window.anchorStates[id]) {
    wrapper.classList.add('collapsed');
    toggle.innerHTML = '▲';
    toggle.title = 'Show Ad';
  } else {
    wrapper.classList.remove('collapsed');
    toggle.innerHTML = '▼';
    toggle.title = 'Hide Ad';
  }
};

// Setup click tracking
function setupAdTracking(id, buttonUrl) {
  document.querySelectorAll(`.ad-click-btn[data-id="${id}"]`).forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (clickedAds.has(id)) return;
      clickedAds.add(id);
      
      let url = fixUrl(btn.getAttribute('data-url'));
      trackAdEvent(id, 'clicks');
      
      setTimeout(() => {
        window.location.href = url;
      }, 300);
    });
  });
}

function trackViewOnce(adId) {
  if (viewedAds.has(adId)) return;
  viewedAds.add(adId);
  trackAdEvent(adId, 'views');
}

function trackAdEvent(adId, type) {
  const fieldName = type === 'views' ? 'totalViews' : 'totalClicks';
  const dailyField = `dailyStats.${today}.${type}`;
  
  db.collection('ads').doc(adId).set({
    [fieldName]: firebase.firestore.FieldValue.increment(1),
    [dailyField]: firebase.firestore.FieldValue.increment(1)
  }, { merge: true }).catch(err => console.error('Tracking error:', err));
}
