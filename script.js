(function() {
    'use strict';

    // ===== STATE =====
    let data = { cartoons: [] };
    let isDarkMode = false;

    // ===== DOM ELEMENTS =====
    const grid = document.getElementById('cartoonGrid');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    const videoPlayer = document.getElementById('videoPlayer');
    const playerFrame = document.getElementById('playerFrame');
    const closePlayer = document.getElementById('closePlayer');
    const playerTitle = document.getElementById('playerTitle');

    const themeToggle = document.getElementById('themeToggle');
    const toastContainer = document.getElementById('toastContainer');

    // ===== TOAST SYSTEM =====
    function showToast(type, message, duration = 3500) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.4s ease forwards';
            setTimeout(() => {
                toast.remove();
            }, 400);
        }, duration);
    }

    // ===== YOUTUBE HELPERS =====
    function extractYouTubeId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=)([^&]+)/,
            /(?:youtu\.be\/)([^?]+)/,
            /(?:youtube\.com\/embed\/)([^?]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    }

    function getYouTubeEmbedUrl(videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
    }

    // ===== LOAD DATA =====
    async function loadData() {
        try {
            showToast('info', '📥 جاري تحميل البيانات...');
            
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error('data.json غير موجود');
            }
            
            const jsonData = await response.json();
            
            if (jsonData && jsonData.cartoons && Array.isArray(jsonData.cartoons)) {
                data = jsonData;
                console.log('✅ تم تحميل البيانات:', data);
                showToast('success', '✅ تم تحميل البيانات بنجاح');
                return;
            }
            
            throw new Error('تنسيق البيانات غير صحيح');
            
        } catch (error) {
            console.warn('⚠️ استخدام البيانات الافتراضية:', error.message);
            
            // ===== بيانات افتراضية (في حال عدم وجود data.json) =====
            data = {
                cartoons: [
                    {
                        name: "ون بيس",
                        emoji: "🏴‍☠️",
                        description: "مغامرات قراصنة قبعة القش في البحث عن الكنز الأسطوري",
                        seasons: [
                            {
                                number: 1,
                                description: "موسم الشرق الأزرق",
                                episodes: [
                                    {
                                        number: 1,
                                        title: "أنا لوفي، سأصبح ملك القراصنة!",
                                        youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                                    },
                                    {
                                        number: 2,
                                        title: "ظهور زورو، صياد القراصنة",
                                        youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                                    }
                                ]
                            },
                            {
                                number: 2,
                                description: "موسم الأراباستا",
                                episodes: []
                            }
                        ]
                    },
                    {
                        name: "ناروتو",
                        emoji: "🍥",
                        description: "قصة نينجا شاب يسعى ليصبح هوكاجي القرية المخفية",
                        seasons: [
                            {
                                number: 1,
                                description: "موسم القرية المخفية",
                                episodes: [
                                    {
                                        number: 1,
                                        title: "أنا ناروتو أوزوماكي!",
                                        youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };
            
            showToast('info', '📝 يتم عرض بيانات افتراضية');
        }
    }

    // ===== RENDER CARTOONS =====
    function renderCartoons(cartoons) {
        console.log('🔄 جاري عرض الكرتونات:', cartoons);
        
        if (!cartoons || cartoons.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <h2>لا توجد كرتونات</h2>
                    <p>يرجى إضافة بيانات في ملف data.json</p>
                </div>
            `;
            return;
        }

        let html = '';
        cartoons.forEach(cartoon => {
            const totalEpisodes = cartoon.seasons.reduce((acc, s) => acc + s.episodes.length, 0);
            const totalSeasons = cartoon.seasons.length;

            html += `
                <div class="cartoon-card" data-id="${cartoon.id || Math.random()}">
                    <div class="cartoon-header">
                        <div class="emoji">${cartoon.emoji || '🎬'}</div>
                        <h3>${cartoon.name}</h3>
                        <div class="cartoon-stats">📀 ${totalSeasons} موسم | 🎞️ ${totalEpisodes} حلقة</div>
                        ${cartoon.description ? `<p style="font-size:0.85rem;color:#5a6b7a;margin-top:0.3rem;">${cartoon.description}</p>` : ''}
                    </div>
                    <div class="cartoon-body">
                        <div class="season-list">
                            ${cartoon.seasons && cartoon.seasons.length > 0 ? 
                                cartoon.seasons.sort((a,b) => a.number - b.number).map(season => `
                                    <div class="season-item" data-id="${season.id || Math.random()}">
                                        <div class="season-title">
                                            <span>📀 الموسم ${season.number} ${season.description ? `- ${season.description}` : ''}</span>
                                        </div>
                                        <div class="episode-list">
                                            ${season.episodes && season.episodes.length > 0 ?
                                                season.episodes.sort((a,b) => a.number - b.number).map(episode => `
                                                    <div class="episode-item" data-url="${episode.youtubeUrl}" data-title="${episode.title || `الحلقة ${episode.number}`}">
                                                        <div class="episode-info">
                                                            <span>🎞️ الحلقة ${episode.number}${episode.title ? `: ${episode.title}` : ''}</span>
                                                        </div>
                                                    </div>
                                                `).join('') :
                                                `<div style="color:#999;font-size:0.85rem;padding:0.4rem 0;">لا توجد حلقات</div>`
                                            }
                                        </div>
                                    </div>
                                `).join('') :
                                `<div style="color:#999;font-size:0.95rem;padding:0.5rem 0;">لا توجد مواسم</div>`
                            }
                        </div>
                    </div>
                </div>
            `;
        });

        grid.innerHTML = html;

        // ربط أحداث النقر على الحلقات لتشغيل الفيديو
        document.querySelectorAll('.episode-item').forEach(item => {
            item.addEventListener('click', function(e) {
                const url = this.dataset.url;
                const title = this.dataset.title || 'حلقة';
                if (url) {
                    openVideoPlayer(url, title);
                } else {
                    showToast('warning', '⚠️ رابط الفيديو غير متوفر');
                }
            });
        });
    }

    // ===== VIDEO PLAYER =====
    function openVideoPlayer(url, title) {
        const videoId = extractYouTubeId(url);
        if (videoId) {
            const embedUrl = getYouTubeEmbedUrl(videoId);
            playerFrame.src = embedUrl;
            playerTitle.textContent = `🎬 ${title || 'تشغيل الفيديو'}`;
            videoPlayer.classList.add('active');
            document.body.style.overflow = 'hidden';
            showToast('info', `🎬 تشغيل: ${title || 'فيديو'}`);
        } else {
            showToast('error', '❌ رابط YouTube غير صحيح');
        }
    }

    function closeVideoPlayer() {
        playerFrame.src = '';
        videoPlayer.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    // ===== THEME TOGGLE =====
    function toggleTheme() {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('dark-mode', isDarkMode);
        themeToggle.textContent = isDarkMode ? '☀️' : '🌙';
        localStorage.setItem('cartoonTheme', isDarkMode ? 'dark' : 'light');
        showToast('info', isDarkMode ? '🌙 تم تفعيل الوضع المظلم' : '☀️ تم تفعيل الوضع الفاتح');
    }

    // ===== SEARCH =====
    function applyFilters() {
        const term = searchInput.value.trim().toLowerCase();
        if (term === '') {
            renderCartoons(data.cartoons);
            return;
        }
        const filtered = data.cartoons.filter(c =>
            c.name.toLowerCase().includes(term) ||
            (c.description && c.description.toLowerCase().includes(term)) ||
            c.seasons.some(s => s.description && s.description.toLowerCase().includes(term)) ||
            c.seasons.some(s => s.episodes.some(e => e.title && e.title.toLowerCase().includes(term)))
        );
        renderCartoons(filtered);
    }

    // ===== EVENT LISTENERS =====

    // --- Search ---
    searchBtn.addEventListener('click', applyFilters);
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });

    // --- Video Player ---
    closePlayer.addEventListener('click', closeVideoPlayer);
    videoPlayer.addEventListener('click', function(e) {
        if (e.target === this) {
            closeVideoPlayer();
        }
    });

    // --- Theme ---
    themeToggle.addEventListener('click', toggleTheme);

    // --- Keyboard shortcuts ---
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (videoPlayer.classList.contains('active')) {
                closeVideoPlayer();
            }
        }
    });

    // ===== LOAD THEME FROM STORAGE =====
    const savedTheme = localStorage.getItem('cartoonTheme');
    if (savedTheme === 'dark') {
        isDarkMode = true;
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    }

    // ===== INIT =====
    loadData().then(() => {
        applyFilters();
        console.log('🎬 ديف كرتون - النظام جاهز!');
        console.log('📊 عدد الكرتونات:', data.cartoons.length);
    });

})();