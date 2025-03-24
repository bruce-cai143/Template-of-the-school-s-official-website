document.addEventListener('DOMContentLoaded', function() {
    // 初始化轮播图
    initCarousel();
    
    // 初始化统计数字动画
    initStatsCounter();
    
    // 初始化课程详情切换
    initCourseDetails();
    
    // 初始化视频播放
    initVideoPlayer();
    
    // 加载新闻
    loadNews();
    
    // 移动端菜单
    initMobileMenu();
});

// 初始化轮播图
function initCarousel() {
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');
    const pagination = document.querySelector('.pagination');
    let currentSlide = 0;
    
    // 创建分页指示器
    slides.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => {
            goToSlide(index);
        });
        pagination.appendChild(dot);
    });
    
    // 前一张
    prevBtn.addEventListener('click', () => {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        goToSlide(currentSlide);
    });
    
    // 后一张
    nextBtn.addEventListener('click', () => {
        currentSlide = (currentSlide + 1) % slides.length;
        goToSlide(currentSlide);
    });
    
    // 自动轮播
    let interval = setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        goToSlide(currentSlide);
    }, 5000);
    
    // 鼠标悬停时暂停轮播
    const carouselContainer = document.querySelector('.carousel-container');
    carouselContainer.addEventListener('mouseenter', () => {
        clearInterval(interval);
    });
    
    carouselContainer.addEventListener('mouseleave', () => {
        interval = setInterval(() => {
            currentSlide = (currentSlide + 1) % slides.length;
            goToSlide(currentSlide);
        }, 5000);
    });
    
    // 切换到指定幻灯片
    function goToSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        slides[index].classList.add('active');
        
        const dots = document.querySelectorAll('.dot');
        dots.forEach(dot => dot.classList.remove('active'));
        dots[index].classList.add('active');
    }
    
    // 从数据库加载轮播图
    loadSlides();
}

// 从数据库加载轮播图
async function loadSlides() {
    try {
        const response = await fetch('/api/slides');
        if (!response.ok) return;
        
        const slides = await response.json();
        if (slides.length === 0) return;
        
        const slideContainer = document.querySelector('.carousel-slide');
        slideContainer.innerHTML = '';
        
        slides.forEach((slide, index) => {
            const slideElement = document.createElement('div');
            slideElement.className = 'slide' + (index === 0 ? ' active' : '');
            slideElement.style.backgroundImage = `url('${slide.image}')`;
            
            slideElement.innerHTML = `
                <div class="slide-content">
                    <h2>${slide.title}</h2>
                    <p>${slide.description}</p>
                    <a href="about.html" class="button">了解更多</a>
                </div>
            `;
            
            slideContainer.appendChild(slideElement);
        });
        
        // 重新初始化分页指示器
        const pagination = document.querySelector('.pagination');
        pagination.innerHTML = '';
        
        slides.forEach((_, index) => {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => {
                const allSlides = document.querySelectorAll('.slide');
                allSlides.forEach(s => s.classList.remove('active'));
                allSlides[index].classList.add('active');
                
                const dots = document.querySelectorAll('.dot');
                dots.forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
            });
            pagination.appendChild(dot);
        });
    } catch (error) {
        console.error('加载轮播图失败:', error);
    }
}

// 初始化统计数字动画
function initStatsCounter() {
    const stats = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                const duration = 2000; // 动画持续时间（毫秒）
                const frameDuration = 1000 / 60; // 每帧持续时间（60fps）
                const totalFrames = Math.round(duration / frameDuration);
                let frame = 0;
                let currentNumber = 0;
                
                const counter = setInterval(() => {
                    frame++;
                    const progress = frame / totalFrames;
                    currentNumber = Math.round(progress * target);
                    
                    if (frame === totalFrames) {
                        clearInterval(counter);
                        currentNumber = target;
                    }
                    
                    entry.target.textContent = currentNumber;
                }, frameDuration);
                
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    stats.forEach(stat => {
        observer.observe(stat);
    });
}

// 初始化课程详情切换
function initCourseDetails() {
    const detailButtons = document.querySelectorAll('.course-detail-btn');
    
    detailButtons.forEach(button => {
        button.addEventListener('click', function() {
            const card = this.closest('.course-card');
            const detail = card.querySelector('.course-detail');
            
            if (detail.style.maxHeight) {
                detail.style.maxHeight = null;
                this.textContent = '查看详情 →';
            } else {
                detail.style.maxHeight = detail.scrollHeight + 'px';
                this.textContent = '收起详情 ↑';
            }
        });
    });
}

// 初始化视频播放
function initVideoPlayer() {
    const video = document.querySelector('.campus-video');
    const playBtn = document.querySelector('.play-btn');
    
    if (!video || !playBtn) return;
    
    playBtn.addEventListener('click', function() {
        if (video.paused) {
            video.play();
            this.textContent = '❚❚';
        } else {
            video.pause();
            this.textContent = '▶';
        }
    });
    
    video.addEventListener('ended', function() {
        playBtn.textContent = '▶';
    });
}

// 加载新闻
async function loadNews() {
    try {
        const response = await fetch('/api/news?limit=2');
        if (!response.ok) return;
        
        const news = await response.json();
        if (news.length === 0) return;
        
        const newsGrid = document.querySelector('.news-grid');
        newsGrid.innerHTML = '';
        
        news.forEach(item => {
            const newsCard = document.createElement('div');
            newsCard.className = 'news-card card';
            
            newsCard.innerHTML = `
                <div class="news-image">
                    <img src="${item.image || 'assets/images/news-placeholder.jpg'}" alt="${item.title}">
                </div>
                <div class="news-content">
                    <div class="news-meta">
                        <span class="news-category">${item.category || '校园新闻'}</span>
                        <span class="news-date">${new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 class="news-title">${item.title}</h3>
                    <p class="news-excerpt">${item.content.substring(0, 100)}...</p>
                    <a href="news.html?id=${item.id}" class="news-link button ghost">阅读全文 →</a>
                </div>
            `;
            
            newsGrid.appendChild(newsCard);
        });
    } catch (error) {
        console.error('加载新闻失败:', error);
    }
}

// 初始化移动端菜单
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    menuBtn.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        this.classList.toggle('active');
    });
}