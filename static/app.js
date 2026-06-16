document.addEventListener('DOMContentLoaded', () => {
    // State Variables
    let allReleases = [];
    let activeFilter = 'all';
    let searchQuery = '';
    
    // UI Elements
    const releasesContainer = document.getElementById('releases-container');
    const feedLoading = document.getElementById('feed-loading');
    const feedError = document.getElementById('feed-error');
    const feedEmpty = document.getElementById('feed-empty');
    const errorMessage = document.getElementById('error-message');
    const refreshBtn = document.getElementById('refresh-btn');
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search');
    const filterChips = document.querySelectorAll('.chip');
    const statCards = document.querySelectorAll('.stat-card');
    const retryBtn = document.getElementById('retry-btn');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    
    // Stats Elements
    const statTotal = document.getElementById('stat-total');
    const statFeatures = document.getElementById('stat-features');
    const statIssues = document.getElementById('stat-issues');
    const statDeprecations = document.getElementById('stat-deprecations');
    
    // Modal Elements
    const tweetModal = document.getElementById('tweet-modal');
    const modalClose = document.getElementById('modal-close');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCountEl = document.getElementById('char-count');
    const charProgressBar = document.getElementById('char-progress-bar');
    const previewCardTitle = document.getElementById('preview-card-title');
    const previewCardSnippet = document.getElementById('preview-card-snippet');
    const copyTweetBtn = document.getElementById('copy-tweet-btn');
    const postTweetBtn = document.getElementById('post-tweet-btn');
    const toast = document.getElementById('toast');
    
    let activeShareLink = '';

    // Initialize
    fetchReleases();

    // Event Listeners
    refreshBtn.addEventListener('click', () => fetchReleases(true));
    retryBtn.addEventListener('click', () => fetchReleases(true));
    resetFiltersBtn.addEventListener('click', resetFilters);
    
    // Search input handler
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        clearSearchBtn.style.display = searchQuery.length > 0 ? 'block' : 'none';
        applyFiltersAndSearch();
    });
    
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        applyFiltersAndSearch();
    });
    
    // Filter chip handlers
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeFilter = chip.dataset.type;
            applyFiltersAndSearch();
        });
    });
    
    // Stats card quick filters
    statCards.forEach(card => {
        card.addEventListener('click', () => {
            const filterType = card.dataset.filter;
            // Find corresponding chip and click it
            const targetChip = Array.from(filterChips).find(c => c.dataset.type === filterType);
            if (targetChip) {
                targetChip.click();
            } else if (filterType === 'all') {
                filterChips[0].click();
            }
        });
    });
    
    // Modal Event Handlers
    modalClose.addEventListener('click', closeModal);
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) closeModal();
    });
    
    tweetTextarea.addEventListener('input', updateTweetComposer);
    
    copyTweetBtn.addEventListener('click', copyTweetText);
    postTweetBtn.addEventListener('click', postTweet);

    // Fetch releases data
    function fetchReleases(forceRefresh = false) {
        setLoadingState(true);
        const url = `/api/releases${forceRefresh ? '?refresh=true' : ''}`;
        
        fetch(url)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Server returned status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                allReleases = data;
                setLoadingState(false);
                calculateStats(data);
                applyFiltersAndSearch();
            })
            .catch(err => {
                console.error(err);
                setErrorState(err.message);
            });
    }

    // Toggle states
    function setLoadingState(isLoading) {
        if (isLoading) {
            feedLoading.style.display = 'flex';
            feedError.style.display = 'none';
            feedEmpty.style.display = 'none';
            releasesContainer.style.display = 'none';
            refreshBtn.disabled = true;
            refreshBtn.querySelector('.spinner-icon').classList.add('spinning');
        } else {
            feedLoading.style.display = 'none';
            refreshBtn.disabled = false;
            refreshBtn.querySelector('.spinner-icon').classList.remove('spinning');
        }
    }
    
    function setErrorState(msg) {
        feedLoading.style.display = 'none';
        releasesContainer.style.display = 'none';
        feedEmpty.style.display = 'none';
        feedError.style.display = 'flex';
        errorMessage.textContent = msg;
        refreshBtn.disabled = false;
        refreshBtn.querySelector('.spinner-icon').classList.remove('spinning');
    }

    // Calculate Stats counters
    function calculateStats(releases) {
        const total = releases.length;
        const features = releases.filter(r => r.type.toLowerCase().includes('feature')).length;
        const issues = releases.filter(r => r.type.toLowerCase().includes('issue')).length;
        const deprecations = total - features - issues;
        
        statTotal.textContent = total;
        statFeatures.textContent = features;
        statIssues.textContent = issues;
        statDeprecations.textContent = deprecations;
    }

    // Reset all filters to default
    function resetFilters() {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        filterChips.forEach(c => c.classList.remove('active'));
        filterChips[0].classList.add('active');
        activeFilter = 'all';
        applyFiltersAndSearch();
    }

    // Filter and search execution
    function applyFiltersAndSearch() {
        if (allReleases.length === 0) return;
        
        let filtered = allReleases;
        
        // Apply category filter chip
        if (activeFilter !== 'all') {
            filtered = filtered.filter(item => {
                const typeLower = item.type.toLowerCase();
                const activeLower = activeFilter.toLowerCase();
                
                if (activeLower === 'feature') return typeLower.includes('feature');
                if (activeLower === 'issue') return typeLower.includes('issue');
                if (activeLower === 'deprecation') {
                    return !typeLower.includes('feature') && !typeLower.includes('issue');
                }
                return typeLower === activeLower;
            });
        }
        
        // Apply text search keywords
        if (searchQuery) {
            filtered = filtered.filter(item => {
                return item.type.toLowerCase().includes(searchQuery) ||
                       item.date.toLowerCase().includes(searchQuery) ||
                       item.content_text.toLowerCase().includes(searchQuery);
            });
        }
        
        renderReleases(filtered);
    }

    // Render HTML release cards
    function renderReleases(releases) {
        releasesContainer.innerHTML = '';
        
        if (releases.length === 0) {
            releasesContainer.style.display = 'none';
            feedEmpty.style.display = 'flex';
            return;
        }
        
        feedEmpty.style.display = 'none';
        releasesContainer.style.display = 'flex';
        
        releases.forEach((release, index) => {
            const card = document.createElement('div');
            card.className = `release-card glass-panel type-${getNormalizedType(release.type)}`;
            card.style.animationDelay = `${Math.min(index * 0.05, 0.5)}s`;
            
            // Format Type Badge Color Classes
            const badgeClass = getBadgeClass(release.type);
            
            card.innerHTML = `
                <div class="card-header">
                    <div class="badge-wrapper">
                        <span class="type-badge ${badgeClass}">${release.type}</span>
                        <span class="card-date">${release.date}</span>
                    </div>
                    ${release.link ? `
                        <a href="${release.link}" target="_blank" rel="noopener noreferrer" class="card-link" title="Open official docs">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                        </a>
                    ` : ''}
                </div>
                <div class="card-body">
                    ${release.content_html}
                </div>
                <div class="card-actions">
                    <button class="btn-tweet-select" data-index="${index}">
                        <svg viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        <span>Tweet Update</span>
                    </button>
                </div>
            `;
            
            // Modal opening action handler
            card.querySelector('.btn-tweet-select').addEventListener('click', () => {
                openTweetModal(release);
            });
            
            releasesContainer.appendChild(card);
        });
    }

    // Helper functions for types
    function getNormalizedType(type) {
        const t = type.toLowerCase();
        if (t.includes('feature')) return 'feature';
        if (t.includes('issue')) return 'issue';
        if (t.includes('deprecation') || t.includes('security') || t.includes('announcement')) return 'deprecation';
        return 'default';
    }

    function getBadgeClass(type) {
        const norm = getNormalizedType(type);
        if (norm === 'feature') return 'badge-feature';
        if (norm === 'issue') return 'badge-issue';
        if (norm === 'deprecation') return 'badge-deprecation';
        return 'badge-default';
    }

    // Open Custom Tweet composer modal
    function openTweetModal(release) {
        activeShareLink = release.link || 'https://cloud.google.com/bigquery/docs/release-notes';
        
        // Draft default tweet text
        const categorySymbol = getNormalizedType(release.type) === 'feature' ? '🚀' : '📢';
        const typeTag = release.type.toUpperCase();
        
        // Clean text content for tweet (truncate nicely)
        let snippet = release.content_text;
        const maxSnippetLen = 130;
        if (snippet.length > maxSnippetLen) {
            snippet = snippet.substring(0, maxSnippetLen - 3) + '...';
        }
        
        const defaultTweet = `${categorySymbol} #BigQuery Release Update [${release.date}]:\n\n"${snippet}"\n\nRead more details here:\n${activeShareLink}`;
        
        // Pre-fill modal
        tweetTextarea.value = defaultTweet;
        previewCardTitle.textContent = `BigQuery Release notes - ${release.date}`;
        previewCardSnippet.textContent = release.content_text;
        
        // Update character counter and view
        updateTweetComposer();
        
        tweetModal.classList.add('open');
        tweetTextarea.focus();
    }

    function closeModal() {
        tweetModal.classList.remove('open');
    }

    // Character counter circular progress animation
    function updateTweetComposer() {
        const text = tweetTextarea.value;
        const len = text.length;
        const limit = 280;
        const remaining = limit - len;
        
        charCountEl.textContent = remaining;
        
        // Calculate progress percentage
        const pct = Math.min((len / limit) * 100, 100);
        
        // Update circular dasharray
        charProgressBar.setAttribute('stroke-dasharray', `${pct}, 100`);
        
        // Color coding based on length
        if (remaining < 0) {
            charProgressBar.style.stroke = '#ef4444'; // Red
            charCountEl.style.color = '#ef4444';
            postTweetBtn.disabled = true;
            postTweetBtn.style.opacity = 0.5;
        } else if (remaining <= 20) {
            charProgressBar.style.stroke = '#f97316'; // Yellow/Orange
            charCountEl.style.color = '#f97316';
            postTweetBtn.disabled = false;
            postTweetBtn.style.opacity = 1;
        } else {
            charProgressBar.style.stroke = '#1d9bf0'; // X/Twitter Blue
            charCountEl.style.color = '#71767b';
            postTweetBtn.disabled = false;
            postTweetBtn.style.opacity = 1;
        }
    }

    // Copy draft tweet to clipboard
    function copyTweetText() {
        navigator.clipboard.writeText(tweetTextarea.value)
            .then(() => {
                showToast('Draft copied to clipboard!');
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                showToast('Failed to copy to clipboard.');
            });
    }

    // Post to X / Twitter using Web Intent
    function postTweet() {
        const text = encodeURIComponent(tweetTextarea.value);
        const url = `https://twitter.com/intent/tweet?text=${text}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        closeModal();
    }

    // Toast alert message helper
    function showToast(msg) {
        toast.textContent = msg;
        toast.style.display = 'block';
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.style.display = 'none';
            }, 300);
        }, 2500);
    }
});
