// ads.js - Professional Ad System v5.0 (Dual Banners + Info Tooltip)
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

// 🇱 Sri Lanka timezone
function getTodaySL() {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Colombo' })).toISOString().split('T')[0];
}
const today = getTodaySL();

const viewedAds = new Set();
const clickedAds = new Set();
let bannerAdsQueue = [];

function fixUrl(url) {
  if (!url) return '#';
  url = url.trim();
  return url.startsWith('http://') || url.startsWith('https://') ? url : 'https://' + url;
}

// 🎠 Banner Carousel Class (Supports multiple locations)
class BannerCarousel {
  constructor(containerId, delay = 5000) {
    this.container = document.getElementById(containerId);
    this.delay = delay;
    this.currentIndex = 0;
    this.interval = null;
    if (!this.container) return;
    this.start();
  }

  start() {
    if (bannerAdsQueue.length === 0) {
      this.container.innerHTML = '';
      return;
    }
    this.showAd(bannerAdsQueue[0], bannerAdsQueue[0].id);
    if (bannerAdsQueue.length > 1) {
      this.interval = setInterval(() => {
        this.currentIndex = (this.currentIndex + 1) % bannerAdsQueue.length;
        this.showAd(bannerAdsQueue[this.currentIndex], bannerAdsQueue[this.currentIndex].id);
      }, this.delay);
    }
  }

  showAd(ad, id) {
    if (!this.container || this.container.querySelector(`[data-ad-id="${id}"]`)) return;

    const indicators = bannerAdsQueue.length > 1 ? `
      <div class="carousel-indicators" style="display:flex; justify-content:center; gap:6px; margin:10px 0 0; padding:0 16px;">
        ${bannerAdsQueue.map((_, i) => `<div class="indicator ${i === this.currentIndex ? 'active' : ''}" 
              onclick="window.carousels.forEach(c => c.jumpTo(${i}))"></div>`).join('')}
      </div>
    ` : '';

    this.container.innerHTML = `
      <style>
        .pro-banner {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        .pro-banner-logo {
          width: 64px; height: 64px; object-fit: contain; border-radius: 6px;
          background: #f9fafb; padding: 4px; flex-shrink: 0;
        }
        .pro-banner-content { flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .pro-banner-desc { font-size: 13px; color: #374151; line-height: 1.4; margin: 0; }
        .pro-banner-btn {
          display: inline-block; padding: 7px 16px; background: #3b82f6; color: #fff;
          text-decoration: none; border-radius: 5px; font-weight: 600; font-size: 13px;
          width: fit-content; transition: background 0.2s;
        }
        .pro-banner-btn:hover { background: #2563eb; }
        .indicator {
          width: 8px; height: 8px; border-radius: 50%; background: #d1d5db;
          cursor: pointer; transition: all 0.2s;
        }
        .indicator.active { background: #3b82f6; transform: scale(1.1); }
        @media (max-width: 768px) {
          .pro-banner { flex-direction: column; text-align: center; padding: 12px; }
          .pro-banner-logo { width: 48px; height: 48px; }
          .pro-banner-desc { font-size: 12px; }
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
      ${indicators}`;

    // Tracking
    document.querySelectorAll(`.ad-click-btn[data-id="${id}"]`).forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        if (clickedAds.has(id)) return;
        clickedAds.add(id);
        trackAdEvent(id, 'clicks');
        setTimeout(() => window.location.href = fixUrl(btn.getAttribute('data-url')), 300);
      });
    });
    trackViewOnce(id);
  }

  jumpTo(index) {
    if (this.interval) clearInterval(this.interval);
    this.currentIndex = index;
    this.showAd(bannerAdsQueue[index], bannerAdsQueue[index].id);
    if (bannerAdsQueue.length > 1) {
      this.interval = setInterval(() => {
        this.currentIndex = (this.currentIndex + 1) % bannerAdsQueue.length;
        this.showAd(bannerAdsQueue[this.currentIndex], bannerAdsQueue[this.currentIndex].id);
      }, this.delay);
    }
  }
}

// ℹ️ Info Icon & Tooltip
function initInfoIcon() {
  if (document.getElementById('ad-info-widget')) return;
  
  const widget = document.createElement('div');
  widget.id = 'ad-info-widget';
  widget.style.cssText = 'position:fixed; bottom:90px; right:16px; z-index:9998;';
  widget.innerHTML = `
    <button id="ad-info-btn" style="background:#fff; border:1px solid #e5e7eb; border-radius:50%; width:36px; height:36px; 
      display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,0.1);
      transition:all 0.2s; color:#6b7280; font-size:16px;">
      <i class="fas fa-info-circle"></i>
    </button>
    <div id="ad-info-tooltip" style="position:absolute; bottom:44px; right:0; background:#1f2937; color:#fff; 
      padding:10px 14px; border-radius:6px; font-size:13px; white-space:nowrap; opacity:0; transform:translateY(8px);
      transition:all 0.2s; pointer-events:none; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
      Get premium to hide ads
      <div style="position:absolute; bottom:-6px; right:12px; width:12px; height:12px; background:#1f2937; 
        transform:rotate(45deg);"></div>
    </div>
  `;
  document.body.appendChild(widget);

  let tooltipTimeout;
  const btn = document.getElementById('ad-info-btn');
  const tooltip = document.getElementById('ad-info-tooltip');
  
  btn.addEventListener('click', () => {
    const isVisible = tooltip.style.opacity === '1';
    tooltip.style.opacity = isVisible ? '0' : '1';
    tooltip.style.transform = isVisible ? 'translateY(8px)' : 'translateY(0)';
    
    if (!isVisible) {
      clearTimeout(tooltipTimeout);
      tooltipTimeout = setTimeout(() => {
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translateY(8px)';
      }, 4000);
    }
  });
}

// 📍 Anchor Ad
function renderAnchorAd(ad, id) {
  const container = document.getElementById('anchor-ad-container');
  if (!container) return;
  
  container.innerHTML = `
    <style>
      .pro-anchor-wrapper {
        position:fixed; bottom:0; left:0; width:100%; z-index:9999;
        transition:transform 0.3s cubic-bezier(0.4,0,0.2,1);
        box-shadow:0 -4px 16px rgba(0,0,0,0.06);
      }
      .pro-anchor-wrapper.collapsed { transform:translateY(calc(100% - 32px)); }
      .pro-anchor-toggle {
        position:absolute; top:-26px; left:16px; background:#fff; color:#6b7280;
        border:1px solid #e5e7eb; border-bottom:none; border-radius:6px 6px 0 0;
        padding:3px 10px; cursor:pointer; font-size:13px; box-shadow:0 -2px 6px rgba(0,0,0,0.04);
        transition:all 0.2s; display:flex; align-items:center; gap:4px; font-weight:500;
      }
      .pro-anchor-toggle:hover { background:#f9fafb; color:#374151; }
      .pro-anchor {
        background:#fff; padding:10px 16px; display:flex; align-items:center;
        justify-content:center; gap:12px; border-top:1px solid #e5e7eb;
      }
      .pro-anchor-logo { height:36px; width:auto; border-radius:4px; flex-shrink:0; }
      .pro-anchor-text { font-size:13px; color:#4b5563; flex:1; text-align:center; }
      .pro-anchor-btn {
        padding:7px 16px; background:#3b82f6; color:#fff; text-decoration:none;
        border-radius:5px; font-weight:600; font-size:13px; white-space:nowrap; transition:background 0.2s;
      }
      .pro-anchor-btn:hover { background:#2563eb; }
      @media (max-width:768px) {
        .pro-anchor { flex-wrap:wrap; padding:8px 12px; gap:8px; }
        .pro-anchor-logo { height:28px; }
        .pro-anchor-text { font-size:12px; width:100%; }
        .pro-anchor-btn { padding:6px 12px; font-size:12px; }
        .pro-anchor-toggle .arrow-text { display:none; }
      }
    </style>
    <div class="pro-anchor-wrapper" id="anchor-${id}">
      <button class="pro-anchor-toggle" onclick="toggleAnchor('${id}')">
        <span class="arrow-text">▼ Ad</span> <span>▼</span>
      </button>
      <div class="pro-anchor">
        <img src="${ad.imageUrl}" alt="Ad" class="pro-anchor-logo">
        <span class="pro-anchor-text">${ad.description}</span>
        <a href="#" class="pro-anchor-btn ad-click-btn" data-id="${id}" data-url="${ad.buttonUrl}">
          ${ad.buttonText || 'Click Here'}
        </a>
      </div>
    </div>
    <div style="height:70px;"></div>`;

  window.anchorStates = window.anchorStates || {};
  window.anchorStates[id] = false;
  setupAdTracking(id, ad.buttonUrl);
  trackViewOnce(id);
}

window.toggleAnchor = function(id) {
  const wrapper = document.getElementById(`anchor-${id}`);
  const toggle = wrapper.querySelector('.pro-anchor-toggle');
  window.anchorStates[id] = !window.anchorStates[id];
  wrapper.classList.toggle('collapsed', window.anchorStates[id]);
  toggle.innerHTML = window.anchorStates[id] 
    ? '<span class="arrow-text">▲ Show</span> <span>▲</span>' 
    : '<span class="arrow-text">▼ Ad</span> <span>▼</span>';
};

function setupAdTracking(id, url) {
  document.querySelectorAll(`.ad-click-btn[data-id="${id}"]`).forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      if (clickedAds.has(id)) return;
      clickedAds.add(id);
      trackAdEvent(id, 'clicks');
      setTimeout(() => window.location.href = fixUrl(btn.getAttribute('data-url')), 300);
    });
  });
}

function trackViewOnce(adId) {
  if (viewedAds.has(adId)) return;
  viewedAds.add(adId);
  trackAdEvent(adId, 'views');
}

function trackAdEvent(adId, type) {
  db.collection('ads').doc(adId).set({
    [type === 'views' ? 'totalViews' : 'totalClicks']: firebase.firestore.FieldValue.increment(1),
    [`dailyStats.${today}.${type}`]: firebase.firestore.FieldValue.increment(1)
  }, { merge: true }).catch(console.error);
}

// 🚀 Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Load banner ads
  db.collection('ads').where('active', '==', true).where('type', '==', 'banner').onSnapshot(snapshot => {
    bannerAdsQueue = [];
    snapshot.forEach(doc => bannerAdsQueue.push({ ...doc.data(), id: doc.id }));
    // Initialize both banner locations if they exist
    window.carousels = [];
    if (document.getElementById('banner-ad-container-1')) window.carousels.push(new BannerCarousel('banner-ad-container-1'));
    if (document.getElementById('banner-ad-container-2')) window.carousels.push(new BannerCarousel('banner-ad-container-2'));
  });

  // Load anchor ads
  db.collection('ads').where('active', '==', true).where('type', '==', 'anchor').onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added' || change.type === 'modified') renderAnchorAd(change.doc.data(), change.doc.id);
    });
  });

  // Init info icon
  initInfoIcon();
});
