// State
let appData = {
  stats: null,
  videos: [],
  activeVideoId: null,
  activeFilter: 'all',
  activeStudioTab: 'youtube',
  config: null
};

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const tabPanes = document.querySelectorAll('.tab-pane');
const pageTitle = document.getElementById('pageTitle');
const pageSub = document.getElementById('pageSub');

// Init
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupEventListeners();
  await refreshAll();
});

function setupNavigation() {
  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      navItems.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(`tab-${targetTab}`);
      if (targetPane) targetPane.classList.add('active');

      updatePageHeader(targetTab);
      if (targetTab === 'automation') loadLogs();
      if (targetTab === 'settings') loadSettings();
    });
  });
}

function updatePageHeader(tab) {
  const titles = {
    'overview': { title: 'Command Center Overview', sub: 'Real-time status of Meraki Musics YouTube catalog and organic reach.' },
    'catalog': { title: 'Catalog & SEO Studio', sub: 'Inspect, generate, and 1-click copy multi-platform SEO packages.' },
    'site-hub': { title: 'Static Hub & IndexNow', sub: 'High-speed static website pages with Schema.org JSON-LD and instant indexing.' },
    'automation': { title: 'Scheduler & Logs', sub: 'Audit history of background spotlight rotations and search indexing.' },
    'settings': { title: 'Settings & Free AI Setup', sub: 'Configure brand identity, scheduling cron, and Google Gemini free API key.' }
  };
  if (titles[tab]) {
    pageTitle.textContent = titles[tab].title;
    pageSub.textContent = titles[tab].sub;
  }
}

function setupEventListeners() {
  // Sync Feed
  document.getElementById('btnSyncRss').addEventListener('click', async () => {
    showToast('📡 Syncing with YouTube RSS...');
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      showToast(`✅ Synced! ${data.total} tracks total (${data.newCount} new)`);
      await refreshAll();
    } catch (e) {
      showToast('❌ Sync failed: ' + e.message);
    }
  });

  // Spotlight Run
  document.getElementById('btnTriggerSpotlight').addEventListener('click', async () => {
    showToast('🚀 Running Daily Spotlight Cycle...');
    try {
      const res = await fetch('/api/spotlight', { method: 'POST' });
      const data = await res.json();
      showToast(`⭐ Spotlight track: "${data.spotlightVideo.title.slice(0, 30)}..."`);
      await refreshAll();
    } catch (e) {
      showToast('❌ Spotlight failed: ' + e.message);
    }
  });

  // Re-Build Static Site
  document.getElementById('btnRebuildSite').addEventListener('click', async () => {
    showToast('🌐 Building static SEO hub in dist/...');
    try {
      const res = await fetch('/api/build-site', { method: 'POST' });
      const data = await res.json();
      showToast(`✅ Built ${data.pageCount} SEO pages with Schema.org!`);
      document.getElementById('statHubPages').textContent = data.pageCount;
    } catch (e) {
      showToast('❌ Site build error: ' + e.message);
    }
  });

  // Dispatch IndexNow
  document.getElementById('btnDispatchIndexNow').addEventListener('click', async () => {
    showToast('⚡ Dispatching IndexNow to Bing & Pinging Google...');
    try {
      const res = await fetch('/api/index', { method: 'POST' });
      const data = await res.json();
      showToast('✅ IndexNow protocol accepted payload!');
      loadLogs();
    } catch (e) {
      showToast('❌ IndexNow error: ' + e.message);
    }
  });

  // Optimize All
  document.getElementById('btnOptimizeAll').addEventListener('click', async () => {
    showToast('🧠 Optimizing entire catalog with SEO generator...');
    try {
      const res = await fetch('/api/optimize-all', { method: 'POST' });
      const data = await res.json();
      showToast(`🎉 Successfully optimized all ${data.count} tracks!`);
      await refreshAll();
    } catch (e) {
      showToast('❌ Optimize all error: ' + e.message);
    }
  });

  // Catalog Search
  document.getElementById('catalogSearch').addEventListener('input', (e) => {
    renderTrackList(e.target.value);
  });

  // Filter Pills
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      appData.activeFilter = pill.dataset.filter;
      renderTrackList(document.getElementById('catalogSearch').value);
    });
  });

  // Refresh Logs
  document.getElementById('btnRefreshLogs').addEventListener('click', loadLogs);

  // Settings Form
  document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newConfig = {
      ...appData.config,
      api: { geminiApiKey: document.getElementById('cfgGeminiKey').value.trim() },
      scheduler: {
        ...(appData.config?.scheduler || {}),
        cronExpression: document.getElementById('cfgCron').value.trim()
      },
      seo: {
        ...(appData.config?.seo || {}),
        siteBaseUrl: document.getElementById('cfgSiteUrl').value.trim()
      },
      brand: {
        ...(appData.config?.brand || {}),
        tagline: document.getElementById('cfgTagline').value.trim()
      }
    };

    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      appData.config = newConfig;
      showToast('✅ Settings saved successfully!');
    } catch (err) {
      showToast('❌ Failed to save settings: ' + err.message);
    }
  });
}

async function refreshAll() {
  await Promise.all([loadStats(), loadVideos(), loadConfig()]);
}

async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    appData.stats = data;

    document.getElementById('statTotalVideos').textContent = data.total;
    document.getElementById('statSongs').textContent = `${data.songs} songs`;
    document.getElementById('statShorts').textContent = `${data.shorts} shorts`;
    document.getElementById('statOptimized').textContent = data.optimized;
    document.getElementById('statPending').textContent = `${data.pending} pending`;
    document.getElementById('statViews').textContent = data.totalViews.toLocaleString();
  } catch (e) {
    console.error('Failed to load stats', e);
  }
}

async function loadVideos() {
  try {
    const res = await fetch('/api/videos');
    const videos = await res.json();
    appData.videos = videos;

    // Render Spotlight Card on Overview
    renderSpotlightCard();

    // Render Catalog
    renderTrackList();

    // Set first track active if none selected
    if (!appData.activeVideoId && videos.length > 0) {
      selectTrack(videos[0].id);
    }
  } catch (e) {
    console.error('Failed to load videos', e);
  }
}

function renderSpotlightCard() {
  const container = document.getElementById('spotlightContent');
  if (!appData.videos || appData.videos.length === 0) {
    container.innerHTML = '<div class="spotlight-skeleton">No tracks found. Sync your feed!</div>';
    return;
  }

  // Find least recently promoted or first
  const spotlight = appData.videos.find(v => v.id === appData.stats?.lastSpotlightId) || appData.videos[0];
  const seo = spotlight.seoPackage || {};
  const recTitle = seo.youtube?.recommendedTitle || spotlight.title;

  container.innerHTML = `
    <div class="spotlight-layout">
      <img src="${spotlight.thumbnailUrl}" alt="${escapeHtml(spotlight.title)}" class="spotlight-thumb">
      <div class="spotlight-details">
        <div class="spotlight-title">${escapeHtml(spotlight.title)}</div>
        <div class="spotlight-rec-title">🎯 Optimized SEO Title: "${escapeHtml(recTitle)}"</div>
        <div class="spotlight-actions">
          <button class="btn btn-secondary btn-sm" onclick="selectTrackAndOpenStudio('${spotlight.id}')">
            <span>✨</span> Open SEO Studio
          </button>
          <a href="${spotlight.url}" target="_blank" class="btn btn-accent btn-sm">
            <span>▶️</span> Watch on YouTube
          </a>
        </div>
      </div>
    </div>
  `;
}

window.selectTrackAndOpenStudio = function(id) {
  // Switch to catalog tab
  document.querySelector('.nav-item[data-tab="catalog"]').click();
  selectTrack(id);
};

function renderTrackList(searchQuery = '') {
  const container = document.getElementById('trackListContainer');
  const query = searchQuery.toLowerCase().trim();

  const filtered = appData.videos.filter(v => {
    const matchesQuery = v.title.toLowerCase().includes(query) || (v.seoPackage?.youtube?.recommendedTitle || '').toLowerCase().includes(query);
    const matchesFilter = appData.activeFilter === 'all' || v.type === appData.activeFilter;
    return matchesQuery && matchesFilter;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state">No matching tracks found.</div>';
    return;
  }

  container.innerHTML = filtered.map(v => {
    const isActive = v.id === appData.activeVideoId ? 'active' : '';
    const hasSeo = !!v.seoPackage;
    return `
      <div class="track-item ${isActive}" onclick="selectTrack('${v.id}')">
        <img src="${v.thumbnailUrl}" alt="${escapeHtml(v.title)}" class="track-item-thumb">
        <div class="track-item-info">
          <div class="track-item-title">${escapeHtml(v.title)}</div>
          <div class="track-item-meta">
            <span class="badge-tag ${v.type}">${v.type === 'short' ? 'Short' : 'Song'}</span>
            <span>${v.views ? `${v.views} views` : ''}</span>
            <span class="badge-optimized">${hasSeo ? '✨ SEO Ready' : '⚪ Unoptimized'}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.selectTrack = function(id) {
  appData.activeVideoId = id;
  const video = appData.videos.find(v => v.id === id);
  if (!video) return;

  // Highlight list item
  document.querySelectorAll('.track-item').forEach(el => el.classList.remove('active'));
  const found = Array.from(document.querySelectorAll('.track-item')).find(el => el.getAttribute('onclick')?.includes(id));
  if (found) found.classList.add('active');

  renderStudioPanel(video);
  renderSchemaPreview(video);
};

function renderStudioPanel(video) {
  const panel = document.getElementById('studioPanel');
  const seo = video.seoPackage;

  if (!seo) {
    panel.innerHTML = `
      <div class="studio-header">
        <div>
          <div class="studio-track-title">${escapeHtml(video.title)}</div>
          <p style="color: var(--text-muted); font-size: 0.85rem;">This track does not have an SEO package yet.</p>
        </div>
        <button class="btn btn-primary" onclick="optimizeTrackSingle('${video.id}')">
          <span>🧠</span> Generate SEO Pack
        </button>
      </div>
    `;
    return;
  }

  panel.innerHTML = `
    <div class="studio-header">
      <div>
        <div class="studio-track-title">${escapeHtml(video.title)}</div>
        <p style="color: var(--text-muted); font-size: 0.85rem;">
          Published: ${new Date(video.publishedAt).toLocaleDateString()} • Views: ${video.views || 0}
        </p>
      </div>
      <div style="display: flex; gap: 0.8rem; align-items: center;">
        <div class="studio-seo-score">
          <span>Score</span>
          <strong>${seo.scores?.overallSeoScore || 90}/100</strong>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="optimizeTrackSingle('${video.id}')">
          <span>🔄</span> Refresh SEO
        </button>
      </div>
    </div>

    <!-- Sub-tabs -->
    <div class="studio-tabs">
      <button class="studio-tab-btn ${appData.activeStudioTab === 'youtube' ? 'active' : ''}" onclick="setStudioTab('youtube')">YouTube SEO</button>
      <button class="studio-tab-btn ${appData.activeStudioTab === 'shortForm' ? 'active' : ''}" onclick="setStudioTab('shortForm')">TikTok & Reels</button>
      <button class="studio-tab-btn ${appData.activeStudioTab === 'reddit' ? 'active' : ''}" onclick="setStudioTab('reddit')">Reddit Syndication</button>
      <button class="studio-tab-btn ${appData.activeStudioTab === 'pinterest' ? 'active' : ''}" onclick="setStudioTab('pinterest')">Pinterest & Tumblr</button>
    </div>

    <div class="studio-body">
      ${renderStudioTabContent(video, seo)}
    </div>
  `;
}

window.setStudioTab = function(tabName) {
  appData.activeStudioTab = tabName;
  const video = appData.videos.find(v => v.id === appData.activeVideoId);
  if (video) renderStudioPanel(video);
};

function renderStudioTabContent(video, seo) {
  switch (appData.activeStudioTab) {
    case 'youtube': {
      const yt = seo.youtube || {};
      return `
        <div class="studio-content-block">
          <div class="field-group">
            <div class="field-header">
              <span class="field-label">Recommended High-CTR Title</span>
              <button class="btn-copy" onclick="copyText(this, \`${escapeJs(yt.recommendedTitle)}\`)">Copy Title</button>
            </div>
            <div class="field-value-box">${escapeHtml(yt.recommendedTitle)}</div>
          </div>

          <div class="field-group">
            <div class="field-header">
              <span class="field-label">Alternative A/B Titles</span>
            </div>
            ${(yt.titleOptions || []).map(t => `
              <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); padding: 0.5rem 0.8rem; border-radius: 6px; margin-bottom: 0.3rem;">
                <span style="font-size: 0.85rem; color: #cbd5e1;">${escapeHtml(t)}</span>
                <button class="btn-copy" onclick="copyText(this, \`${escapeJs(t)}\`)">Copy</button>
              </div>
            `).join('')}
          </div>

          <div class="field-group">
            <div class="field-header">
              <span class="field-label">500-Character Search Tags</span>
              <button class="btn-copy" onclick="copyText(this, \`${escapeJs(yt.tags)}\`)">Copy Tags</button>
            </div>
            <div class="field-value-box" style="font-size: 0.8rem;">${escapeHtml(yt.tags)}</div>
          </div>

          <div class="field-group">
            <div class="field-header">
              <span class="field-label">Pinned Comment Hook (Engagement Driver)</span>
              <button class="btn-copy" onclick="copyText(this, \`${escapeJs(yt.pinnedComment)}\`)">Copy Comment</button>
            </div>
            <div class="field-value-box">${escapeHtml(yt.pinnedComment)}</div>
          </div>

          <div class="field-group">
            <div class="field-header">
              <span class="field-label">SEO Description & Lyrics Structure</span>
              <button class="btn-copy" onclick="copyText(this, \`${escapeJs(yt.description)}\`)">Copy Full Description</button>
            </div>
            <div class="field-value-box" style="max-height: 250px; overflow-y: auto;">${escapeHtml(yt.description)}</div>
          </div>
        </div>
      `;
    }

    case 'shortForm': {
      const sf = seo.shortForm || {};
      return `
        <div class="studio-content-block">
          <div class="field-group">
            <div class="field-header">
              <span class="field-label">3-Second On-Screen Pattern Interrupt Hooks</span>
            </div>
            ${(sf.tiktokHooks || []).map((h, i) => `
              <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.25); padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 0.5rem; border: 1px solid rgba(0,240,255,0.15);">
                <span style="font-size: 0.9rem; color: var(--neon-cyan); font-weight: 500;">Hook ${i + 1}: ${escapeHtml(h)}</span>
                <button class="btn-copy" onclick="copyText(this, \`${escapeJs(h)}\`)">Copy</button>
              </div>
            `).join('')}
          </div>

          <div class="field-group">
            <div class="field-header">
              <span class="field-label">TikTok Search-Optimized Caption</span>
              <button class="btn-copy" onclick="copyText(this, \`${escapeJs(sf.tiktokCaption)}\`)">Copy Caption</button>
            </div>
            <div class="field-value-box">${escapeHtml(sf.tiktokCaption)}</div>
          </div>

          <div class="field-group">
            <div class="field-header">
              <span class="field-label">Instagram Reels Caption</span>
              <button class="btn-copy" onclick="copyText(this, \`${escapeJs(sf.reelsCaption)}\`)">Copy Caption</button>
            </div>
            <div class="field-value-box">${escapeHtml(sf.reelsCaption)}</div>
          </div>
        </div>
      `;
    }

    case 'reddit': {
      const syn = seo.syndication || {};
      const posts = syn.reddit || [];
      return `
        <div class="studio-content-block">
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">
            Reddit copy formatted according to subreddit rules (flairs, title brackets, value-first storytelling to avoid self-promo bans).
          </p>
          ${posts.map(p => `
            <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 1.2rem; margin-bottom: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
                <strong style="color: #ff4500; font-size: 1rem;">${escapeHtml(p.subreddit)}</strong>
                <button class="btn-copy" onclick="copyText(this, \`${escapeJs(`${p.title}\n\n${p.body}`)}\`)">Copy Post</button>
              </div>
              <div style="font-weight: 600; font-size: 0.9rem; color: #fff; margin-bottom: 0.5rem;">Title: ${escapeHtml(p.title)}</div>
              <div class="field-value-box" style="font-size: 0.85rem;">${escapeHtml(p.body)}</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    case 'pinterest': {
      const syn = seo.syndication || {};
      const pin = syn.pinterest || {};
      const blog = syn.blog || {};
      return `
        <div class="studio-content-block">
          <!-- Pinterest -->
          <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 1.2rem; margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
              <strong style="color: #e60023; font-size: 1rem;">📌 Pinterest Rich Pin Blueprint</strong>
              <button class="btn-copy" onclick="copyText(this, \`${escapeJs(`${pin.title}\n\n${pin.description}`)}\`)">Copy Pin Details</button>
            </div>
            <div style="font-size: 0.9rem; color: #fff; margin-bottom: 0.4rem;"><strong>Pin Title:</strong> ${escapeHtml(pin.title)}</div>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.6rem;"><strong>Suggested Board:</strong> ${escapeHtml(pin.boardSuggestion)}</div>
            <div class="field-value-box" style="font-size: 0.85rem;">${escapeHtml(pin.description)}</div>
          </div>

          <!-- Micro Blog -->
          <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 1.2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
              <strong style="color: var(--neon-cyan); font-size: 1rem;">✍️ Tumblr / Medium Micro-Article</strong>
              <button class="btn-copy" onclick="copyText(this, \`${escapeJs(blog.markdown || '')}\`)">Copy Article Markdown</button>
            </div>
            <div style="font-size: 0.9rem; color: #fff; margin-bottom: 0.5rem;"><strong>Article Title:</strong> ${escapeHtml(blog.title)}</div>
            <div class="field-value-box" style="font-size: 0.85rem; max-height: 200px; overflow-y: auto;">${escapeHtml(blog.markdown || '')}</div>
          </div>
        </div>
      `;
    }
  }
}

function renderSchemaPreview(video) {
  const schemaEl = document.getElementById('schemaCodePreview');
  const seo = video.seoPackage || {};
  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MusicRecording",
        "name": video.title,
        "byArtist": {
          "@type": "MusicGroup",
          "name": "Meraki Musics"
        },
        "genre": ["80s Synth-pop", "Retrowave", "Synthwave"]
      },
      {
        "@type": "VideoObject",
        "name": seo.youtube?.recommendedTitle || video.title,
        "thumbnailUrl": [video.thumbnailUrl],
        "uploadDate": video.publishedAt,
        "embedUrl": `https://www.youtube.com/embed/${video.id}`
      }
    ]
  };
  schemaEl.textContent = JSON.stringify(schemaData, null, 2);
}

window.optimizeTrackSingle = async function(id) {
  showToast(`🧠 Optimizing track (${id})...`);
  try {
    const res = await fetch(`/api/optimize/${id}`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('✅ Track optimized with high-ranking metadata!');
      await refreshAll();
      selectTrack(id);
    }
  } catch (e) {
    showToast('❌ Optimization failed: ' + e.message);
  }
};

async function loadLogs() {
  try {
    const res = await fetch('/api/logs');
    const logs = await res.json();

    const schedEl = document.getElementById('schedulerLogsList');
    const indexEl = document.getElementById('indexingLogsList');

    if (!logs.scheduler || logs.scheduler.length === 0) {
      schedEl.innerHTML = '<div style="color: var(--text-dim); font-size: 0.85rem;">No background events yet.</div>';
    } else {
      schedEl.innerHTML = logs.scheduler.map(l => `
        <div class="log-item">
          <div class="log-item-header">
            <span class="log-item-title">${escapeHtml(l.event)}</span>
            <span class="log-item-time">${new Date(l.timestamp).toLocaleTimeString()}</span>
          </div>
          <div class="log-item-details">${escapeHtml(JSON.stringify(l.details, null, 2))}</div>
        </div>
      `).join('');
    }

    if (!logs.indexing || logs.indexing.length === 0) {
      indexEl.innerHTML = '<div style="color: var(--text-dim); font-size: 0.85rem;">No search index dispatches yet.</div>';
    } else {
      indexEl.innerHTML = logs.indexing.map(l => `
        <div class="log-item">
          <div class="log-item-header">
            <span class="log-item-title">${escapeHtml(l.action)}</span>
            <span class="log-item-time">${new Date(l.timestamp).toLocaleTimeString()}</span>
          </div>
          <div class="log-item-details">${escapeHtml(JSON.stringify(l.data, null, 2))}</div>
        </div>
      `).join('');
    }
  } catch (e) {
    console.error('Failed to load logs', e);
  }
}

async function loadSettings() {
  try {
    const res = await fetch('/api/config');
    const cfg = await res.json();
    appData.config = cfg;

    document.getElementById('cfgGeminiKey').value = cfg.api?.geminiApiKey || '';
    document.getElementById('cfgCron').value = cfg.scheduler?.cronExpression || '0 9 * * *';
    document.getElementById('cfgSiteUrl').value = cfg.seo?.siteBaseUrl || 'https://merakimusics.github.io';
    document.getElementById('cfgTagline').value = cfg.brand?.tagline || '';
  } catch (e) {
    console.error('Failed to load settings', e);
  }
}

async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    appData.config = await res.json();
  } catch (e) {}
}

window.copyText = function(btn, text) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✓ Copied!';
    btn.style.background = 'var(--success-green)';
    btn.style.color = '#fff';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = '';
      btn.style.color = '';
    }, 1800);
  });
};

function showToast(msg) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeJs(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');
}
