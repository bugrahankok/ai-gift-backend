(function() {
'use strict';

const BOOK_API_BASE_URL = '/api/book';
let currentBookId = null;
let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    // Navigation is handled by nav.js
    if (window.Navigation) {
        window.Navigation.update();
        window.Navigation.setupLogout();
    }
    
    // Get book ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id') || urlParams.get('book');
    
    if (bookId) {
        loadBookDetails(bookId);
    } else {
        showError('No book ID provided');
    }
});

function checkAuth() {
    const token = localStorage.getItem('authToken');
    return !!token;
}

function updateHeader() {
    // Navigation is now handled by nav.js
    if (window.Navigation) {
        window.Navigation.update();
    }
}

function setupLogout() {
    // Logout is now handled by nav.js
    if (window.Navigation) {
        window.Navigation.setupLogout();
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            localStorage.removeItem('userId');
            document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            window.location.href = '/';
        });
    }
}

function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

function isAuthenticated() {
    return !!localStorage.getItem('authToken');
}

async function loadBookDetails(bookId) {
    try {
        const headers = getAuthHeaders();
        const token = localStorage.getItem('authToken');
        
        // Debug: Log token status
        console.log('Loading book details for ID:', bookId);
        console.log('Token exists:', !!token);
        console.log('Headers:', headers);
        
        const response = await fetch(`${BOOK_API_BASE_URL}/${bookId}`, {
            headers: headers
        });
        
        if (!response.ok) {
            if (response.status === 403) {
                const errorReason = response.headers.get('X-Error-Reason') || 'Unknown';
                const isLoggedIn = isAuthenticated();
                
                console.error('403 Error - Reason:', errorReason);
                console.error('User is authenticated:', isLoggedIn);
                console.error('Token in localStorage:', !!localStorage.getItem('authToken'));
                
                let errorMessage = 'Access denied. This book may be private.';
                
                if (errorReason.includes('Authentication required')) {
                    // Check if user is actually logged in
                    if (isLoggedIn) {
                        errorMessage = 'Token expired or invalid. Please logout and login again.';
                        console.error('User appears to be logged in but authentication failed. Token may be invalid or expired.');
                        console.error('Please logout and login again to get a new token.');
                    } else {
                        errorMessage = 'Please login to view this private book.';
                    }
                } else if (errorReason.includes('does not match')) {
                    errorMessage = 'You do not have permission to view this private book.';
                } else if (errorReason.includes('authorId is null')) {
                    errorMessage = 'Book data error. Please contact support.';
                }
                
                showError(errorMessage);
                return;
            }
            if (response.status === 404) {
                showError('Book not found.');
                return;
            }
            throw new Error('Failed to load book details');
        }

        const book = await response.json();
        currentBookId = book.bookId;
        
        displayBook(book);
        
        // Increment view count
        try {
            await fetch(`${BOOK_API_BASE_URL}/${bookId}/view`, {
                method: 'POST',
                headers: headers
            });
        } catch (e) {
            console.error('Failed to increment view count:', e);
        }
        
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to load book details: ' + error.message);
    }
}

function displayBook(book) {
    const loading = document.getElementById('book-loading');
    const content = document.getElementById('book-content');
    const title = document.getElementById('book-title');
    const meta = document.getElementById('book-meta');
    const bookContent = document.getElementById('book-content-text');
    
    if (loading) loading.style.display = 'none';
    if (content) content.style.display = 'block';
    
    if (title) {
        title.textContent = book.name || 'Book Details';
    }
    
    const createdAt = book.createdAt ? new Date(book.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : 'Unknown';
    
    const visibilityBadge = book.isPublic ? '🌍 Public' : '🔒 Private';
    const authorInfo = book.authorName ? `<span style="display: inline-flex; gap: 6px;">
                <strong>Author:</strong> ${book.authorName}
            </span>` : '';
    
    if (meta) {
        meta.innerHTML = `
            <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap; font-size: 0.95rem; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid var(--border-color);">
                <span style="display: inline-flex; gap: 6px;">
                    <strong>Category:</strong> 📚 Personalized Book
                </span>
                <span style="display: inline-flex; gap: 6px;">
                    <strong>Type:</strong> E-Book
                </span>
                <span style="display: inline-flex; gap: 6px;">
                    <strong>Visibility:</strong> ${visibilityBadge}
                </span>
                ${authorInfo}
                <span style="display: inline-flex; gap: 6px; color: var(--text-secondary);">
                    <strong>Created:</strong> ${createdAt}
                </span>
            </div>
        `;
    }
    
    // Update share bar with stats
    if (book.viewCount !== undefined) {
        const viewCountEl = document.getElementById('view-count');
        if (viewCountEl) viewCountEl.textContent = book.viewCount || 0;
    }
    if (book.downloadCount !== undefined) {
        const downloadCountEl = document.getElementById('download-count');
        if (downloadCountEl) downloadCountEl.textContent = book.downloadCount || 0;
    }
    
    // Store current book ID for sharing
    window.currentBookId = book.bookId;
    window.currentBookName = book.name;
    
    // Show share bar
    const shareBar = document.getElementById('share-bar');
    if (shareBar) shareBar.style.display = 'block';
    
    // Format content with beautiful book-like styling
    const formattedContent = formatBookContent(book.content);
    if (bookContent) {
        bookContent.innerHTML = formattedContent;
    }
    
    // Always start PDF status check - it will automatically load when ready
    if (book.pdfReady && book.pdfPath) {
        showPdfControls(book);
        // Auto-load PDF if ready
        setTimeout(() => {
            const viewBtn = document.getElementById('view-pdf-btn');
            if (viewBtn) {
                viewBtn.click();
            }
        }, 500);
    } else {
        showPdfLoading();
        startPdfStatusCheck(book.bookId);
    }
}

function formatBookContent(content) {
    if (!content) return '';
    
    // Split content into paragraphs
    const paragraphs = content.split(/\n\n+/);
    let formatted = '';
    
    paragraphs.forEach((para, index) => {
        para = para.trim();
        if (para.length === 0) return;
        
        // Check if it's a chapter heading
        const chapterPattern = /^(Chapter|Bölüm|Kapitel|Chapitre|Capítulo|Capitolo|Глава|章|章|الفصل|Kapitel|Kapitulo)\s+\d+/i;
        if (chapterPattern.test(para)) {
            formatted += `<h2 class="chapter-heading">${escapeHtml(para)}</h2>`;
        } else if (para.length < 100 && para.match(/^[A-Z][^.!?]*[.!?]?$/)) {
            // Might be a section title
            formatted += `<h3 class="section-heading">${escapeHtml(para)}</h3>`;
        } else {
            // Regular paragraph - replace single newlines with spaces
            const cleanPara = para.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
            formatted += `<p class="story-paragraph">${escapeHtml(cleanPara)}</p>`;
        }
    });
    
    return formatted;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showPdfLoading() {
    const pdfSection = document.getElementById('pdf-section');
    const pdfLoading = document.getElementById('pdf-loading');
    if (pdfSection) pdfSection.style.display = 'none';
    if (pdfLoading) pdfLoading.style.display = 'block';
}

function showPdfControls(book) {
    const pdfLoading = document.getElementById('pdf-loading');
    const pdfSection = document.getElementById('pdf-section');
    if (pdfLoading) pdfLoading.style.display = 'none';
    if (pdfSection) pdfSection.style.display = 'block';
    
    const downloadBtn = document.getElementById('download-pdf-btn');
    const viewBtn = document.getElementById('view-pdf-btn');
    
    if (downloadBtn) {
        downloadBtn.onclick = () => {
            const url = `${BOOK_API_BASE_URL}/${book.bookId}/pdf`;
            window.open(url, '_blank');
        };
    }
    
    if (viewBtn) {
        viewBtn.onclick = () => {
            const viewerContainer = document.getElementById('pdf-viewer-container');
            
            if (viewerContainer.style.display === 'none') {
                loadPdf(`${BOOK_API_BASE_URL}/${book.bookId}/pdf`);
                viewerContainer.style.display = 'block';
                viewBtn.textContent = '👁️ Hide PDF';
            } else {
                viewerContainer.style.display = 'none';
                pdfDoc = null;
                currentPage = 1;
                viewBtn.textContent = '👁️ View PDF';
            }
        };
    }
    
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    const goBtn = document.getElementById('go-page-btn');
    const pageInput = document.getElementById('page-input');
    
    if (prevBtn) {
        prevBtn.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                renderPage(currentPage);
            }
        };
    }
    
    if (nextBtn) {
        nextBtn.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderPage(currentPage);
            }
        };
    }
    
    if (goBtn && pageInput) {
        goBtn.onclick = () => {
            const page = parseInt(pageInput.value);
            if (page >= 1 && page <= totalPages) {
                currentPage = page;
                renderPage(currentPage);
            }
        };
    }
}

async function loadPdf(url) {
    try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        // Get authentication headers
        const headers = getAuthHeaders();
        
        // Convert headers object to format expected by PDF.js
        const httpHeaders = {};
        if (headers['Authorization']) {
            httpHeaders['Authorization'] = headers['Authorization'];
        }
        
        const loadingTask = pdfjsLib.getDocument({
            url: url,
            httpHeaders: httpHeaders,
            withCredentials: false
        });
        
        pdfDoc = await loadingTask.promise;
        totalPages = pdfDoc.numPages;
        
        currentPage = 1;
        const pageInput = document.getElementById('page-input');
        if (pageInput) pageInput.max = totalPages;
        renderPage(currentPage);
    } catch (error) {
        console.error('Error loading PDF:', error);
        showError('Failed to load PDF. Please try downloading it instead.');
    }
}

async function renderPage(pageNum) {
    try {
        const page = await pdfDoc.getPage(pageNum);
        const canvas = document.getElementById('pdf-canvas');
        const context = canvas.getContext('2d');
        
        const viewport = page.getViewport({ scale: 1.5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        currentPage = pageNum;
        const pageInfo = document.getElementById('page-info');
        if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        const pageInput = document.getElementById('page-input');
        if (pageInput) pageInput.value = currentPage;
        
        const prevBtn = document.getElementById('prev-page-btn');
        const nextBtn = document.getElementById('next-page-btn');
        if (prevBtn) prevBtn.disabled = currentPage <= 1;
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
        
        const viewerWrapper = document.querySelector('.pdf-viewer-wrapper');
        if (viewerWrapper) viewerWrapper.scrollTop = 0;
    } catch (error) {
        console.error('Error rendering page:', error);
        showError('Failed to render PDF page');
    }
}

let pdfCheckInterval = null;

function startPdfStatusCheck(bookId) {
    if (pdfCheckInterval) {
        clearInterval(pdfCheckInterval);
    }
    
    let checkCount = 0;
    const maxChecks = 120; // Check for up to 2 minutes (120 * 1 second)
    
    pdfCheckInterval = setInterval(async () => {
        checkCount++;
        try {
            const headers = getAuthHeaders();
            const response = await fetch(`${BOOK_API_BASE_URL}/${bookId}/status`, {
                headers: headers
            });
            
            if (response.ok) {
                const status = await response.json();
                if (status.pdfReady) {
                    clearInterval(pdfCheckInterval);
                    pdfCheckInterval = null;
                    
                    // Reload book details to get PDF path
                    const bookResponse = await fetch(`${BOOK_API_BASE_URL}/${bookId}`, {
                        headers: headers
                    });
                    if (bookResponse.ok) {
                        const book = await bookResponse.json();
                        showPdfControls(book);
                        showToast('PDF is ready!', 'success');
                        
                        // Auto-load PDF when ready
                        setTimeout(() => {
                            const viewBtn = document.getElementById('view-pdf-btn');
                            if (viewBtn) {
                                viewBtn.click();
                            }
                        }, 500);
                    }
                }
            }
        } catch (error) {
            console.error('Error checking PDF status:', error);
        }
        
        if (checkCount >= maxChecks) {
            clearInterval(pdfCheckInterval);
            pdfCheckInterval = null;
            showToast('PDF generation is taking longer than expected. Please refresh the page later.', 'warning');
        }
    }, 1000); // Check every 1 second for faster response
}

// Social sharing functions - expose to window for onclick handlers
window.shareToFacebook = function() {
    const url = getBookShareUrl();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
};

window.shareToTwitter = function() {
    const url = getBookShareUrl();
    const text = `Check out this personalized book: ${window.currentBookName || 'Book'}`;
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
};

window.shareToLinkedIn = function() {
    const url = getBookShareUrl();
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
};

window.shareToWhatsApp = function() {
    const url = getBookShareUrl();
    const text = `Check out this personalized book: ${window.currentBookName || 'Book'}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
};

window.shareViaEmail = function() {
    const url = getBookShareUrl();
    const subject = `Check out this personalized book: ${window.currentBookName || 'Book'}`;
    const body = `I wanted to share this personalized book with you:\n\n${url}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

window.copyBookLink = function() {
    const url = getBookShareUrl();
    navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard!', 'success');
        const copyText = document.querySelector('.copy-text');
        if (copyText) {
            const originalText = copyText.textContent;
            copyText.textContent = 'Copied!';
            setTimeout(() => {
                copyText.textContent = originalText;
            }, 2000);
        }
    }).catch(() => {
        showError('Failed to copy link');
    });
};

function getBookShareUrl() {
    return `${window.location.origin}/book-details.html?id=${window.currentBookId || currentBookId}`;
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = `toast ${type} show`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

function showError(message) {
    const loading = document.getElementById('book-loading');
    const content = document.getElementById('book-content');
    
    if (loading) {
        loading.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">❌</div>
                <p style="color: var(--error-color); font-size: 1.1rem;">${message}</p>
                <a href="/" class="btn btn-primary" style="margin-top: 20px;">← Back to Home</a>
            </div>
        `;
    }
    if (content) content.style.display = 'none';
}

})();

