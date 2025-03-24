document.addEventListener('DOMContentLoaded', function() {
    // 加载文件列表
    loadDownloadList();
    
    // 分类筛选
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 移除所有按钮的active类
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // 添加active类到当前按钮
            this.classList.add('active');
            
            // 获取分类
            const category = this.dataset.category;
            
            // 筛选文件
            filterFiles(category);
        });
    });
});

// 加载文件列表
async function loadDownloadList() {
    const downloadList = document.getElementById('downloadList');
    
    try {
        const response = await fetch('/api/files');
        if (!response.ok) throw new Error('获取文件列表失败');
        
        const files = await response.json();
        
        if (files.length === 0) {
            downloadList.innerHTML = '<p class="no-data">暂无可下载的文件</p>';
            return;
        }
        
        // 存储文件数据到全局变量
        window.allFiles = files;
        
        // 渲染文件列表
        renderFiles(files);
    } catch (error) {
        console.error('加载文件列表失败:', error);
        downloadList.innerHTML = '<p class="error-message">加载文件列表失败，请稍后再试</p>';
    }
}

// 渲染文件列表
function renderFiles(files) {
    const downloadList = document.getElementById('downloadList');
    
    downloadList.innerHTML = files.map(file => `
        <div class="download-card card" data-category="${file.category || ''}">
            <div class="file-icon">${getFileIcon(file.file_type)}</div>
            <div class="file-info">
                <h3>${file.title}</h3>
                <p>${file.description || ''}</p>
                <div class="file-meta">
                    <span>文件大小: ${formatFileSize(file.file_size)}</span>
                    <span>下载次数: ${file.download_count}</span>
                    <span>上传时间: ${new Date(file.upload_date).toLocaleDateString()}</span>
                </div>
            </div>
            <button onclick="downloadFile(${file.id})" class="download-btn button">
                下载文件
            </button>
        </div>
    `).join('');
}

// 筛选文件
function filterFiles(category) {
    if (!window.allFiles) return;
    
    let filteredFiles;
    
    if (category === 'all') {
        filteredFiles = window.allFiles;
    } else {
        filteredFiles = window.allFiles.filter(file => file.category === category);
    }
    
    renderFiles(filteredFiles);
}

// 下载文件
async function downloadFile(fileId) {
    try {
        const response = await fetch(`/api/files/${fileId}`);
        if (!response.ok) throw new Error('下载文件失败');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // 获取文件名
        const contentDisposition = response.headers.get('content-disposition');
        let filename = 'download';
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
            if (filenameMatch && filenameMatch[1]) {
                filename = decodeURIComponent(filenameMatch[1]);
            }
        }
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('下载文件失败:', error);
        alert('下载文件失败，请稍后再试');
    }
}

// 获取文件图标
function getFileIcon(fileType) {
    if (!fileType) return '📄';
    
    if (fileType.includes('pdf')) {
        return '📕';
    } else if (fileType.includes('word') || fileType.includes('doc')) {
        return '📘';
    } else if (fileType.includes('excel') || fileType.includes('sheet') || fileType.includes('xls')) {
        return '📗';
    } else if (fileType.includes('powerpoint') || fileType.includes('presentation') || fileType.includes('ppt')) {
        return '📙';
    } else if (fileType.includes('image')) {
        return '🖼️';
    } else if (fileType.includes('video')) {
        return '🎬';
    } else if (fileType.includes('audio')) {
        return '🎵';
    } else if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar') || fileType.includes('7z')) {
        return '🗜️';
    } else {
        return '📄';
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}