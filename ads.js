// ads.js - Professional Ad System v4.0 (Refined UI)
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

// 🇱🇰 Sri Lanka timezone
function getTodaySL() {
  const now = new Date();
  const slTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Colombo' }));
  return slTime.toISOString().split('T')[0];
}
const today = getTodaySL();

const viewedAds = new Set();
const clickedAds = new Set();
let bannerAdsQueue = [];
let currentBannerIndex = 0;
let bannerSlideInterval = null;

function fixUrl(url) {
  if (!url) return '#';
  url = url.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
}

document.addEventListener('DOMContentLoaded', () => {
  db.collection('ads')
    .where('active', '==', true)
    .where('type', '==', 'banner')
    .onSnapshot(snapshot => {
      bannerAdsQueue = [];
      snapshot.forEach(doc => bannerAdsQueue.push({ ...doc.data(), id: doc.id }));
      startBannerCarousel();
    });

  db.collection('ads')
    .where('active', '==', true)
    .where('type', '==', 'anchor')
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added' || change.type === 'modified') {
          renderAnchorAd(change.doc.data(), change.doc.id);
        }
      });
    });
});

function startBannerCarousel() {
  const container = document.getElementById('banner-ad-container');
  if (!container) return;

  if (bannerSlideInterval) clearInterval(bannerSlideInterval);

  if (bannerAdsQueue.length === 0) {
    container.innerHTML = '';
    return;
  }

  currentBannerIndex = 0;
  showBannerAd(bannerAdsQueue[0], bannerAdsQueue[0].id);

  if (bannerAdsQueue.length > 1) {
    bannerSlideInterval = setInterval(() => {
      currentBannerIndex = (currentBannerIndex + 1) % bannerAdsQueue.length;
      showBannerAd(bannerAdsQueue[currentBannerIndex], bannerAdsQueue[currentBannerIndex].id);
    }, 5000);
  }
}

function showBannerAd(ad, id) {
  const container = document.getElementById('banner-ad-container');
  if (!container) return;

  if (container.querySelector(`[data-ad-id="${id}"]`)) return;

  const indicatorsHTML = bannerAdsQueue.length > 1 ? `
    <div class="banner-indicators" style="display:flex; justify-content:center; gap:8px; margin:12px auto 0; padding:0 20px;">
      ${bannerAdsQueue.map((_, idx) => 
        `<div class="indicator ${idx === currentBannerIndex ? 'active' : ''}" 
              onclick="jumpToBanner(${idx})" 
              style="width:10px; height:10px; border-radius:50%; background:${idx === currentBannerIndex ? '#667eea' : '#cbd5e0'}; cursor:pointer; transition:all 0.3s; box-shadow:${idx === currentBannerIndex ? '0 0 6px rgba(102,126,234,0.5)' : 'none'};"></div>`
      ).join('')}
    </div>
  ` : '';

  container.innerHTML = `
    <style>
      .pro-banner {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 20px;
        margin: 20px auto;
        max-width: 800px;
        display: flex;
        align-items: center;
        gap: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        transition: transform 0.3s, box-shadow 0.3s;
        animation: fadeIn 0.4s ease;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .pro-banner:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      .pro-banner-logo {
        flex-shrink: 0;
        width: 72px;
        height: 72px;
        object-fit: contain;
        border-radius: 8px;
        background: #f7fafc;
        padding: 4px;
      }
      .pro-banner-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .pro-banner-desc {
        font-size: 14px;
        color: #2d3748;
        line-height: 1.5;
        margin: 0;
      }
      .pro-banner-btn {
        display: inline-block;
        padding: 8px 20px;
        background: #667eea;
        color: #fff;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
        font-size: 14px;
        text-align: center;
        width: fit-content;
        transition: all 0.2s;
      }
      .pro-banner-btn:hover {
        background: #5a67d8;
      }
      .indicator {
        transition: all 0.3s;
      }
      .indicator:hover {
        transform: scale(1.2);
      }
      @media (max-width: 768px) {
        .pro-banner {
          flex-direction: column;
          text-align: center;
          padding: 16px;
          margin: 16px 12px;
        }
        .pro-banner-logo {
          width: 56px;
          height: 56px;
        }
        .pro-banner-desc {
          font-size: 13px;
        }
        .pro-banner-btn {
          padding: 7px 16px;
          font-size: 13px;
        }
      }
      @media (max-width: 480px) {
        .pro-banner-logo {
          width: 48px;
          height: 48px;
        }
        .pro-banner-desc {
          font-size: 12px;
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
    </div>
    ${indicatorsHTML}`;

  setupAdTracking(id, ad.buttonUrl);
  trackViewOnce(id);
}

window.jumpToBanner = function(index) {
  if (bannerSlideInterval) clearInterval(bannerSlideInterval);
  currentBannerIndex = index;
  showBannerAd(bannerAdsQueue[index], bannerAdsQueue[index].id);
  
  if (bannerAdsQueue.length > 1) {
    bannerSlideInterval = setInterval(() => {
      currentBannerIndex = (currentBannerIndex + 1) % bannerAdsQueue.length;
      showBannerAd(bannerAdsQueue[currentBannerIndex], bannerAdsQueue[currentBannerIndex].id);
    }, 5000);
  }
};

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
        transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
      }
      .pro-anchor-wrapper.collapsed {
        transform: translateY(calc(100% - 36px));
      }
      .pro-anchor-toggle {
        position: absolute;
        top: -28px;
        left: 16px;
        background: #ffffff;
        color: #4a5568;
        border: 1px solid #e2e8f0;
        border-bottom: none;
        border-radius: 6px 6px 0 0;
        padding: 4px 10px;
        cursor: pointer;
        font-size: 14px;
        box-shadow: 0 -2px 8px rgba(0,0,0,0.05);
        transition: all 0.2s;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 4px;
        font-weight: 500;
      }
      .pro-anchor-toggle:hover {
        background: #f7fafc;
        color: #2d3748;
      }
      .pro-anchor {
        background: #ffffff;
        padding: 12px 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        border-top: 1px solid #e2e8f0;
      }
      .pro-anchor-logo {
        height: 40px;
        width: auto;
        border-radius: 4px;
        flex-shrink: 0;
      }
      .pro-anchor-text {
        font-size: 14px;
        color: #4a5568;
        flex: 1;
        text-align: center;
      }
      .pro-anchor-btn {
        padding: 8px 20px;
        background: #667eea;
        color: #fff;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
        font-size: 14px;
        white-space: nowrap;
        transition: all 0.2s;
      }
      .pro-anchor-btn:hover {
        background: #5a67d8;
      }
      @media (max-width: 768px) {
        .pro-anchor {
          flex-wrap: wrap;
          padding: 10px 16px;
          gap: 10px;
        }
        .pro-anchor-logo {
          height: 32px;
        }
        .pro-anchor-text {
          font-size: 12px;
          width: 100%;
        }
        .pro-anchor-btn {
          padding: 7px 16px;
          font-size: 13px;
        }
        .pro-anchor-toggle .arrow-text {
          display: none;
        }
      }
    </style>
    <div class="pro-anchor-wrapper" id="anchor-${id}">
      <button class="pro-anchor-toggle" onclick="toggleAnchor('${id}')">
        <span class="arrow-text">▼ Ad</span>
        <span>▼</span>
      </button>
      <div class="pro-anchor">
        <img src="${ad.imageUrl}" alt="Ad" class="pro-anchor-logo">
        <span class="pro-anchor-text">${ad.description}</span>
        <a href="#" class="pro-anchor-btn ad-click-btn" data-id="${id}" data-url="${ad.buttonUrl}">
          ${ad.buttonText || 'Click Here'}
        </a>
      </div>
    </div>
    <div style="height:80px;"></div>`;

  window.anchorStates = window.anchorStates || {};
  window.anchorStates[id] = false;

  setupAdTracking(id, ad.buttonUrl);
  trackViewOnce(id);
}

window.toggleAnchor = function(id) {
  const wrapper = document.getElementById(`anchor-${id}`);
  const toggle = wrapper.querySelector('.pro-anchor-toggle');
  window.anchorStates[id] = !window.anchorStates[id];
  
  if (window.anchorStates[id]) {
    wrapper.classList.add('collapsed');
    toggle.innerHTML = '<span class="arrow-text">▲ Show</span><span>▲</span>';
  } else {
    wrapper.classList.remove('collapsed');
    toggle.innerHTML = '<span class="arrow-text">▼ Ad</span><span>▼</span>';
  }
};

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
