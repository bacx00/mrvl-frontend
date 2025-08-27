// VLR.gg-inspired Mobile Features Implementation
// Comprehensive mobile optimization features based on VLR.gg's approach

class VLRMobileFeatures {
  constructor() {
    this.init();
  }

  init() {
    this.setupBottomNavigation();
    this.setupSwipeGestures();
    this.setupPullToRefresh();
    this.setupInfiniteScroll();
    this.setupMatchCardOptimizations();
    this.setupCompactLayouts();
    this.setupQuickActions();
    this.setupOfflineSupport();
  }

  // VLR.gg-style bottom navigation for mobile
  setupBottomNavigation() {
    const bottomNav = `
      <nav class="vlr-bottom-nav">
        <a href="/" class="nav-item" data-route="home">
          <svg class="nav-icon" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <span>Home</span>
        </a>
        <a href="/matches" class="nav-item" data-route="matches">
          <svg class="nav-icon" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span>Matches</span>
        </a>
        <a href="/rankings" class="nav-item" data-route="rankings">
          <svg class="nav-icon" viewBox="0 0 24 24">
            <path d="M7 14l5-5 5 5z"/>
          </svg>
          <span>Rankings</span>
        </a>
        <a href="/forums" class="nav-item" data-route="forums">
          <svg class="nav-icon" viewBox="0 0 24 24">
            <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
          </svg>
          <span>Forums</span>
        </a>
        <a href="/profile" class="nav-item" data-route="profile">
          <svg class="nav-icon" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          <span>Profile</span>
        </a>
      </nav>
    `;

    // Add styles
    const styles = `
      <style>
        .vlr-bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 56px;
          background: var(--bg-secondary);
          border-top: 1px solid var(--border-color);
          display: flex;
          justify-content: space-around;
          align-items: center;
          z-index: 1000;
          transform: translateY(0);
          transition: transform 0.3s ease;
        }

        .vlr-bottom-nav.hidden {
          transform: translateY(100%);
        }

        .vlr-bottom-nav .nav-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-secondary);
          text-decoration: none;
          transition: all 0.2s ease;
          position: relative;
        }

        .vlr-bottom-nav .nav-item.active {
          color: var(--primary-color);
        }

        .vlr-bottom-nav .nav-item.active::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--primary-color);
        }

        .vlr-bottom-nav .nav-icon {
          width: 24px;
          height: 24px;
          fill: currentColor;
          margin-bottom: 2px;
        }

        .vlr-bottom-nav span {
          font-size: 10px;
          font-weight: 500;
        }

        @media (min-width: 768px) {
          .vlr-bottom-nav {
            display: none;
          }
        }
      </style>
    `;

    // Add to document
    if (window.innerWidth < 768) {
      document.head.insertAdjacentHTML('beforeend', styles);
      document.body.insertAdjacentHTML('beforeend', bottomNav);
      
      // Auto-hide on scroll
      let lastScrollTop = 0;
      window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const nav = document.querySelector('.vlr-bottom-nav');
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
          nav?.classList.add('hidden');
        } else {
          nav?.classList.remove('hidden');
        }
        
        lastScrollTop = scrollTop;
      }, { passive: true });
    }
  }

  // Swipe gestures for navigation (VLR.gg-style)
  setupSwipeGestures() {
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;
    let touchEndY = 0;
    
    const handleSwipe = () => {
      const swipeThreshold = 50;
      const verticalThreshold = 100;
      
      const horizontalDiff = touchEndX - touchStartX;
      const verticalDiff = Math.abs(touchEndY - touchStartY);
      
      // Only handle horizontal swipes, ignore vertical scrolling
      if (Math.abs(horizontalDiff) > swipeThreshold && verticalDiff < verticalThreshold) {
        if (horizontalDiff > 0) {
          // Swipe right - go back
          if (window.history.length > 1) {
            window.history.back();
          }
        } else {
          // Swipe left - open menu or next page
          const nextButton = document.querySelector('[data-action="next"]');
          if (nextButton) {
            nextButton.click();
          }
        }
      }
    };
    
    document.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleSwipe();
    }, { passive: true });
  }

  // Pull to refresh functionality
  setupPullToRefresh() {
    let touchStartY = 0;
    let touchEndY = 0;
    let isPulling = false;
    
    const pullToRefreshEl = document.createElement('div');
    pullToRefreshEl.className = 'pull-to-refresh';
    pullToRefreshEl.innerHTML = `
      <div class="pull-to-refresh-icon">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
        </svg>
      </div>
      <div class="pull-to-refresh-text">Pull to refresh</div>
    `;
    
    const styles = `
      <style>
        .pull-to-refresh {
          position: fixed;
          top: -60px;
          left: 0;
          right: 0;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
          transition: transform 0.3s ease;
          z-index: 999;
        }

        .pull-to-refresh.visible {
          transform: translateY(60px);
        }

        .pull-to-refresh.refreshing {
          transform: translateY(60px);
        }

        .pull-to-refresh-icon {
          margin-right: 8px;
          animation: spin 1s linear infinite;
        }

        .pull-to-refresh.refreshing .pull-to-refresh-icon {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      </style>
    `;
    
    if (window.innerWidth < 768) {
      document.head.insertAdjacentHTML('beforeend', styles);
      document.body.insertAdjacentElement('afterbegin', pullToRefreshEl);
      
      document.addEventListener('touchstart', (e) => {
        if (window.scrollY === 0) {
          touchStartY = e.touches[0].clientY;
          isPulling = true;
        }
      }, { passive: true });
      
      document.addEventListener('touchmove', (e) => {
        if (!isPulling) return;
        
        touchEndY = e.touches[0].clientY;
        const pullDistance = touchEndY - touchStartY;
        
        if (pullDistance > 50) {
          pullToRefreshEl.classList.add('visible');
          pullToRefreshEl.querySelector('.pull-to-refresh-text').textContent = 
            pullDistance > 100 ? 'Release to refresh' : 'Pull to refresh';
        }
      }, { passive: true });
      
      document.addEventListener('touchend', () => {
        if (!isPulling) return;
        
        const pullDistance = touchEndY - touchStartY;
        if (pullDistance > 100) {
          pullToRefreshEl.classList.add('refreshing');
          pullToRefreshEl.querySelector('.pull-to-refresh-text').textContent = 'Refreshing...';
          
          // Reload the current view or fetch new data
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          pullToRefreshEl.classList.remove('visible');
        }
        
        isPulling = false;
        touchStartY = 0;
        touchEndY = 0;
      });
    }
  }

  // Infinite scroll for match lists
  setupInfiniteScroll() {
    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    };
    
    const loadMoreContent = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const loadMoreElement = entry.target;
          const currentPage = parseInt(loadMoreElement.dataset.page || '1');
          
          // Trigger load more event
          window.dispatchEvent(new CustomEvent('infiniteScroll', {
            detail: { page: currentPage + 1 }
          }));
          
          // Update page number
          loadMoreElement.dataset.page = currentPage + 1;
        }
      });
    };
    
    const observer = new IntersectionObserver(loadMoreContent, options);
    
    // Observe load more triggers
    document.querySelectorAll('[data-infinite-scroll]').forEach(element => {
      observer.observe(element);
    });
  }

  // Optimize match cards for mobile (VLR.gg compact style)
  setupMatchCardOptimizations() {
    const styles = `
      <style>
        @media (max-width: 767px) {
          .match-card {
            padding: 12px;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            background: var(--bg-secondary);
            border-radius: 8px;
            position: relative;
          }

          .match-card.live {
            border-left: 3px solid #ff4444;
          }

          .match-card .time {
            font-size: 11px;
            color: var(--text-secondary);
            min-width: 45px;
          }

          .match-card .teams {
            flex: 1;
            margin: 0 12px;
          }

          .match-card .team {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin: 4px 0;
          }

          .match-card .team-name {
            font-size: 14px;
            font-weight: 500;
          }

          .match-card .score {
            font-size: 14px;
            font-weight: 600;
            min-width: 20px;
            text-align: right;
          }

          .match-card .tournament {
            font-size: 10px;
            color: var(--text-secondary);
            position: absolute;
            top: 4px;
            right: 8px;
          }

          /* Compact bracket view for mobile */
          .bracket-mobile {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 16px;
          }

          .bracket-stage {
            min-width: 280px;
            margin-right: 16px;
          }

          .bracket-match {
            background: var(--bg-secondary);
            border-radius: 8px;
            padding: 8px;
            margin-bottom: 8px;
          }

          .bracket-team {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            font-size: 13px;
          }

          .bracket-team.winner {
            font-weight: 600;
          }
        }
      </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
  }

  // Compact layouts for better mobile viewing
  setupCompactLayouts() {
    if (window.innerWidth < 768) {
      document.body.classList.add('mobile-compact');
      
      // Add compact view toggle
      const toggleButton = document.createElement('button');
      toggleButton.className = 'compact-toggle';
      toggleButton.innerHTML = '☰';
      toggleButton.onclick = () => {
        document.body.classList.toggle('ultra-compact');
      };
      
      const styles = `
        <style>
          .compact-toggle {
            position: fixed;
            bottom: 70px;
            right: 16px;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: var(--primary-color);
            color: white;
            border: none;
            font-size: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 999;
          }

          .mobile-compact .content-padding {
            padding: 8px;
          }

          .mobile-compact .card {
            margin-bottom: 8px;
          }

          .mobile-compact h1 {
            font-size: 24px;
          }

          .mobile-compact h2 {
            font-size: 20px;
          }

          .ultra-compact * {
            font-size: 12px !important;
          }

          .ultra-compact .card {
            padding: 6px !important;
          }
        </style>
      `;
      
      document.head.insertAdjacentHTML('beforeend', styles);
      document.body.appendChild(toggleButton);
    }
  }

  // Quick actions for mobile (long press menus)
  setupQuickActions() {
    let pressTimer;
    const longPressDuration = 500;
    
    document.addEventListener('touchstart', (e) => {
      const target = e.target.closest('[data-quick-action]');
      if (!target) return;
      
      pressTimer = setTimeout(() => {
        e.preventDefault();
        this.showQuickActionMenu(target, e.touches[0]);
      }, longPressDuration);
    }, { passive: false });
    
    document.addEventListener('touchend', () => {
      clearTimeout(pressTimer);
    });
    
    document.addEventListener('touchmove', () => {
      clearTimeout(pressTimer);
    });
  }

  showQuickActionMenu(element, touch) {
    const menu = document.createElement('div');
    menu.className = 'quick-action-menu';
    menu.style.cssText = `
      position: fixed;
      top: ${touch.clientY}px;
      left: ${touch.clientX}px;
      transform: translate(-50%, -100%);
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 8px 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
    `;
    
    const actions = JSON.parse(element.dataset.quickAction || '[]');
    actions.forEach(action => {
      const item = document.createElement('button');
      item.className = 'quick-action-item';
      item.textContent = action.label;
      item.style.cssText = `
        display: block;
        width: 100%;
        padding: 8px 16px;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
      `;
      item.onclick = () => {
        window.dispatchEvent(new CustomEvent(action.event, {
          detail: { element, action }
        }));
        menu.remove();
      };
      menu.appendChild(item);
    });
    
    document.body.appendChild(menu);
    
    // Remove menu on outside click
    setTimeout(() => {
      document.addEventListener('click', () => menu.remove(), { once: true });
    }, 100);
  }

  // Basic offline support with service worker
  setupOfflineSupport() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('Service Worker registered:', registration);
        
        // Show offline indicator
        window.addEventListener('offline', () => {
          this.showOfflineIndicator();
        });
        
        window.addEventListener('online', () => {
          this.hideOfflineIndicator();
        });
      }).catch(err => {
        console.error('Service Worker registration failed:', err);
      });
    }
  }

  showOfflineIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'offline-indicator';
    indicator.textContent = 'You are offline';
    indicator.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #ff4444;
      color: white;
      text-align: center;
      padding: 8px;
      z-index: 10000;
    `;
    document.body.appendChild(indicator);
  }

  hideOfflineIndicator() {
    const indicator = document.querySelector('.offline-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
}

// Initialize on mobile devices
if (typeof window !== 'undefined' && window.innerWidth < 768) {
  new VLRMobileFeatures();
}

export default VLRMobileFeatures;