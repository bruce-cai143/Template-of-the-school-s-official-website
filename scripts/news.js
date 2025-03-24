document.addEventListener('DOMContentLoaded', function() {
    // 获取URL参数中的新闻ID
    const urlParams = new URLSearchParams(window.location.search);
    const newsId = urlParams.get('id');
    
    if (!newsId) {
        showError('未找到新闻ID');
        return;
    }
    
    // 加载新闻详情
    loadNewsDetail(newsId);
    
    // 初始化移动端菜单
    initMobileMenu();
});

// 加载新闻详情
async function loadNewsDetail(id) {
    const loading = document.getElementById('newsLoading');
    const content = document.getElementById('newsContent');
    
    try {
        const response = await fetch(`/api/news/${id}`);
        if (!response.ok) {
            throw new Error('获取新闻详情失败');
        }
        
        const news = await response.json();
        
        // 设置页面标题
        document.title = `${news.title} - 未来科技中学`;
        
        // 填充新闻内容
        document.getElementById('newsTitle').textContent = news.title;
        document.getElementById('newsCategory').textContent = news.category || '校园新闻';
        document.getElementById('newsDate').textContent = new Date(news.created_at).toLocaleDateString();
        document.getElementById('newsAuthor').textContent = news.author ? `作者: ${news.author}` : '';
        
        // 设置新闻图片
        const imageContainer = document.getElementById('newsImageContainer');
        const newsImage = document.getElementById('newsImage');
        
        if (news.image) {
            newsImage.src = news.image;
            newsImage.alt = news.title;
        } else {
            imageContainer.style.display = 'none';
        }
        
        // 设置新闻正文
        document.getElementById('newsBody').innerHTML = formatNewsContent(news.content);
        
        // 显示内容，隐藏加载中
        loading.style.display = 'none';
        content.style.display = 'block';
    } catch (error) {
        console.error('加载新闻详情失败:', error);
        showError('加载新闻详情失败，请稍后再试');
    }
}

// 格式化新闻内容
function formatNewsContent(content) {
    if (!content) return '';
    
    // 将换行符转换为段落
    return content.split('\n')
        .filter(paragraph => paragraph.trim() !== '')
        .map(paragraph => `<p>${paragraph}</p>`)
        .join('');
}

// 显示错误信息
function showError(message) {
    const loading = document.getElementById('newsLoading');
    loading.innerHTML = `<p class="error-message">${message}</p>`;
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