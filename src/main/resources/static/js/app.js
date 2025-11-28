const API_BASE_URL = '/api/book';
let currentBookId = null;
let pdfCheckInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    checkConsent();
    initializeTabs();
    initializeForm();
    loadHistory();
    loadDiscover();
    initializeModals();
    setupLogout();
    updateHeader();
    
    // Check if URL has book parameter for direct sharing
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('book');
    if (bookId) {
        // Load the book when page loads
        setTimeout(() => {
            viewBookDetails(bookId);
        }, 500);
    }
});

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');

            if (targetTab === 'history') {
                loadHistory();
            } else if (targetTab === 'discover') {
                loadDiscover();
            }
        });
    });
}

function initializeForm() {
    const form = document.getElementById('book-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    setupOptionCards('theme-options', 'theme');
    setupOptionCards('type-options', 'book-type');
    setupOptionCards('tone-options', 'tone');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!isAuthenticated()) {
            showToast('Please login to create books', 'error');
            document.getElementById('login-required-message').style.display = 'block';
            return;
        }
        
        const formData = new FormData(form);
        const visibility = formData.get('visibility');
        const bookData = {
            name: formData.get('name'),
            age: parseInt(formData.get('age')),
            theme: formData.get('theme'),
            tone: formData.get('tone'),
            giver: formData.get('giver'),
            appearance: formData.get('appearance') || '',
            isPublic: visibility === 'public'
        };
        
        const bookType = formData.get('book-type');
        if (bookType) {
            bookData.theme = bookData.theme + ' - ' + bookType;
        }

        if (!bookData.name || !bookData.age || !bookData.theme || !bookData.tone || !bookData.giver) {
            showToast('Please fill in all required fields and select theme, type, and tone', 'error');
            return;
        }

        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline';

        try {
            console.log('Sending request:', bookData);
            const response = await fetch(`${API_BASE_URL}/generate`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(bookData)
            });

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Failed to create book: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('Response received:', result);
            
            if (!result || !result.content) {
                throw new Error('Invalid response received');
            }
            
            currentBookId = result.bookId;
            displayResult(result);
            showToast('Book created successfully!', 'success');
            
            if (!result.pdfReady) {
                startPdfStatusCheck(result.bookId);
            } else {
                showPdfControls(result);
            }
            
            form.reset();
            
            setTimeout(() => {
                loadHistory();
                // Refresh discover page if book is public
                if (result.isPublic) {
                    loadDiscover();
                }
            }, 1000);
        } catch (error) {
            console.error('Error details:', error);
            showToast('An error occurred: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
        }
    });
}

function displayResult(book) {
    console.log('Displaying result:', book);
    
    const resultCard = document.getElementById('result-card');
    const resultMeta = document.getElementById('result-meta');
    const resultContent = document.getElementById('result-content');
    
    if (!book || !book.content) {
        console.error('Invalid book data:', book);
        showToast('Invalid book data', 'error');
        return;
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
    
    resultMeta.innerHTML = `
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
    
    // Update share bar with stats
    if (book.viewCount !== undefined) {
        document.getElementById('view-count').textContent = book.viewCount || 0;
    }
    if (book.downloadCount !== undefined) {
        document.getElementById('download-count').textContent = book.downloadCount || 0;
    }
    
    // Store current book ID for sharing
    window.currentBookId = book.bookId;
    window.currentBookName = book.name;
    
    // Show share bar
    document.getElementById('share-bar').style.display = 'block';
    
    resultContent.innerHTML = `
        <div style="word-wrap: break-word; line-height: 1.8; white-space: pre-wrap;">
            ${escapeHtml(book.content).replace(/\n/g, '<br>')}
        </div>
    `;
    
    resultCard.style.display = 'block';
    setTimeout(() => {
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
    
    if (book.pdfReady && book.pdfPath) {
        showPdfControls(book);
    } else {
        showPdfLoading();
    }
}

function showPdfLoading() {
    document.getElementById('pdf-section').style.display = 'none';
    document.getElementById('pdf-loading').style.display = 'block';
}

let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;

function showPdfControls(book) {
    document.getElementById('pdf-loading').style.display = 'none';
    const pdfSection = document.getElementById('pdf-section');
    pdfSection.style.display = 'block';
    
    const downloadBtn = document.getElementById('download-pdf-btn');
    const viewBtn = document.getElementById('view-pdf-btn');
    
    downloadBtn.onclick = () => {
        const url = `${API_BASE_URL}/${book.bookId}/pdf`;
        window.open(url, '_blank');
    };
    
    viewBtn.onclick = () => {
        const viewerContainer = document.getElementById('pdf-viewer-container');
        
        if (viewerContainer.style.display === 'none') {
            loadPdf(`${API_BASE_URL}/${book.bookId}/pdf`);
            viewerContainer.style.display = 'block';
            viewBtn.textContent = '👁️ Hide PDF';
        } else {
            viewerContainer.style.display = 'none';
            pdfDoc = null;
            currentPage = 1;
            viewBtn.textContent = '👁️ View PDF';
        }
    };
    
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    const goBtn = document.getElementById('go-page-btn');
    const pageInput = document.getElementById('page-input');
    
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            renderPage(currentPage);
        }
    };
    
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderPage(currentPage);
        }
    };
    
    goBtn.onclick = () => {
        const page = parseInt(pageInput.value);
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            renderPage(currentPage);
        }
    };
    
    pageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            goBtn.click();
        }
    });
}

async function loadPdf(url) {
    try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        const loadingTask = pdfjsLib.getDocument(url);
        pdfDoc = await loadingTask.promise;
        totalPages = pdfDoc.numPages;
        
        currentPage = 1;
        document.getElementById('page-input').max = totalPages;
        renderPage(currentPage);
    } catch (error) {
        console.error('Error loading PDF:', error);
        showToast('Failed to load PDF. Please try downloading it instead.', 'error');
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
        document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
        document.getElementById('page-input').value = currentPage;
        
        document.getElementById('prev-page-btn').disabled = currentPage <= 1;
        document.getElementById('next-page-btn').disabled = currentPage >= totalPages;
        
        const viewerWrapper = document.querySelector('.pdf-viewer-wrapper');
        viewerWrapper.scrollTop = 0;
    } catch (error) {
        console.error('Error rendering page:', error);
        showToast('Failed to render PDF page', 'error');
    }
}

function startPdfStatusCheck(bookId) {
    if (pdfCheckInterval) {
        clearInterval(pdfCheckInterval);
    }
    
    pdfCheckInterval = setInterval(async () => {
        try {
            const headers = isAuthenticated() ? getAuthHeaders() : { 'Content-Type': 'application/json' };
            const response = await fetch(`${API_BASE_URL}/${bookId}/status`, {
                headers: headers
            });
            if (response.ok) {
                const status = await response.json();
                if (status.pdfReady) {
                    clearInterval(pdfCheckInterval);
                    pdfCheckInterval = null;
                    
                    const bookResponse = await fetch(`${API_BASE_URL}/${bookId}`, {
                        headers: headers
                    });
                    const book = await bookResponse.json();
                    showPdfControls(book);
                    showToast('PDF is ready for download!', 'success');
                }
            }
        } catch (error) {
            console.error('Error checking PDF status:', error);
        }
    }, 2000);
}

async function loadHistory() {
    const historyContent = document.getElementById('history-content');
    historyContent.innerHTML = '<div class="loading">Loading...</div>';

    if (!isAuthenticated()) {
        historyContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔒</div>
                <div class="empty-state-text">Please <a href="/login.html" class="auth-link">login</a> to view your book history</div>
            </div>
        `;
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/history`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            if (response.status === 401) {
                handleAuthError();
                return;
            }
            throw new Error('Failed to load history');
        }

        const books = await response.json();
        displayHistory(books);
    } catch (error) {
        console.error('Error:', error);
        historyContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-text">An error occurred while loading history</div>
            </div>
        `;
    }
}

function displayHistory(books) {
    const historyContent = document.getElementById('history-content');

    if (books.length === 0) {
        historyContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-text">No books created yet</div>
            </div>
        `;
        return;
    }

    historyContent.innerHTML = books.map(book => {
        const contentPreview = book.content.substring(0, 200);
        const hasMore = book.content.length > 200;
        
        return `
            <div class="gift-item" data-id="${book.bookId}">
                <div class="gift-item-header">
                    <div class="gift-item-title">
                        📚 ${book.name} - ${book.theme}
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="gift-item-type">${book.isPublic ? '🌍 Public' : '🔒 Private'}</span>
                        <label class="visibility-toggle">
                            <input type="checkbox" ${book.isPublic ? 'checked' : ''} 
                                   onchange="toggleBookVisibility(${book.bookId}, this.checked)"
                                   class="toggle-switch">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
                <div class="gift-item-meta">
                    <span>🆔 ID: #${book.bookId}</span>
                    <span>👤 For: ${book.name} (Age ${book.age})</span>
                    <span>🎁 From: ${book.giver}</span>
                    <span>📅 ${new Date(book.createdAt).toLocaleDateString('en-US')}</span>
                </div>
                <div class="gift-item-content" id="content-${book.bookId}">
                    ${escapeHtml(contentPreview)}${hasMore ? '...' : ''}
                </div>
                ${hasMore ? `<button class="btn btn-secondary" style="margin-top: 10px; width: 100%;" onclick="toggleContent(${book.bookId}, ${JSON.stringify(book.content)})">Show More</button>` : ''}
                ${book.pdfReady ? `<button onclick="downloadBookPdf(${book.bookId})" class="btn btn-primary" style="margin-top: 10px; width: 100%;">📥 Download PDF</button>` : '<p style="margin-top: 10px; color: var(--text-secondary);">⏳ PDF is being generated...</p>'}
            </div>
        `;
    }).join('');

    document.querySelectorAll('.gift-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
                const id = item.getAttribute('data-id');
                viewBookDetails(id);
            }
        });
    });
}

function toggleContent(id, fullContent) {
    const contentDiv = document.getElementById(`content-${id}`);
    const button = contentDiv.nextElementSibling;
    const isExpanded = contentDiv.classList.contains('gift-item-full');
    
    if (isExpanded) {
        contentDiv.classList.remove('gift-item-full');
        contentDiv.innerHTML = escapeHtml(fullContent.substring(0, 200)) + '...';
        button.textContent = 'Show More';
    } else {
        contentDiv.classList.add('gift-item-full');
        contentDiv.innerHTML = escapeHtml(fullContent);
        button.textContent = 'Show Less';
    }
}

async function loadDiscover() {
    const discoverContent = document.getElementById('discover-content');
    if (!discoverContent) return;
    
    discoverContent.innerHTML = '<div class="loading">Loading...</div>';

    try {
        const response = await fetch(`${API_BASE_URL}/discover`);
        if (!response.ok) {
            throw new Error('Failed to load public books');
        }

        const books = await response.json();
        displayDiscoverBooks(books);
    } catch (error) {
        console.error('Error:', error);
        discoverContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-text">An error occurred while loading public books</div>
            </div>
        `;
    }
}

function displayDiscoverBooks(books) {
    const discoverContent = document.getElementById('discover-content');
    if (!discoverContent) return;

    if (books.length === 0) {
        discoverContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <div class="empty-state-text">No public books available yet</div>
                <p style="margin-top: 10px; color: var(--text-secondary);">Be the first to share a public book!</p>
            </div>
        `;
        return;
    }

    discoverContent.innerHTML = books.map(book => {
        const contentPreview = book.content.substring(0, 200);
        const hasMore = book.content.length > 200;
        
        return `
            <div class="gift-item" data-id="${book.bookId}">
                <div class="gift-item-header">
                    <div class="gift-item-title">
                        📚 ${book.name} - ${book.theme}
                    </div>
                    <span class="gift-item-type">🌍 Public</span>
                </div>
                <div class="gift-item-meta">
                    <span>🆔 ID: #${book.bookId}</span>
                    <span>👤 For: ${book.name} (Age ${book.age})</span>
                    <span>✍️ By: ${book.authorName || 'Unknown'}</span>
                    <span>📅 ${new Date(book.createdAt).toLocaleDateString('en-US')}</span>
                </div>
                <div class="gift-item-content" id="content-${book.bookId}">
                    ${escapeHtml(contentPreview)}${hasMore ? '...' : ''}
                </div>
                ${hasMore ? `<button class="btn btn-secondary" style="margin-top: 10px; width: 100%;" onclick="toggleContent(${book.bookId}, ${JSON.stringify(book.content)})">Show More</button>` : ''}
                ${book.pdfReady ? `<button onclick="viewPublicBook(${book.bookId})" class="btn btn-primary" style="margin-top: 10px; width: 100%;">📖 Read Book</button>` : '<p style="margin-top: 10px; color: var(--text-secondary);">⏳ PDF is being generated...</p>'}
            </div>
        `;
    }).join('');

    document.querySelectorAll('#discover-content .gift-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') {
                const id = item.getAttribute('data-id');
                viewPublicBook(id);
            }
        });
    });
}

async function viewPublicBook(id) {
    try {
        const headers = isAuthenticated() ? getAuthHeaders() : { 'Content-Type': 'application/json' };
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            headers: headers
        });
        
        if (!response.ok) {
            if (response.status === 403) {
                showToast('This book is private', 'error');
                return;
            }
            throw new Error('Failed to load book details');
        }

        const book = await response.json();
        
        if (!book.isPublic) {
            showToast('This book is private', 'error');
            return;
        }
        
        currentBookId = book.bookId;
        displayResult(book);
        
        // Update share bar with stats (displayResult already does this, but ensure it's visible)
        const shareBar = document.getElementById('share-bar');
        if (shareBar) shareBar.style.display = 'block';
        
        if (book.pdfReady) {
            showPdfControls(book);
        } else {
            showPdfLoading();
            startPdfStatusCheck(book.bookId);
        }
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.getAttribute('data-tab') === 'create') {
                btn.click();
            }
        });
        
        showToast('Book displayed', 'success');
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to load book details', 'error');
    }
}

async function viewBookDetails(id) {
    try {
        const headers = isAuthenticated() ? getAuthHeaders() : { 'Content-Type': 'application/json' };
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            headers: headers
        });
        if (!response.ok) {
            if (response.status === 403) {
                showToast('Access denied', 'error');
                return;
            }
            throw new Error('Failed to load book details');
        }

        const book = await response.json();
        currentBookId = book.bookId;
        displayResult(book);
        
        // Update share bar with stats
        if (book.viewCount !== undefined) {
            const viewCountEl = document.getElementById('view-count');
            if (viewCountEl) viewCountEl.textContent = book.viewCount || 0;
        }
        if (book.downloadCount !== undefined) {
            const downloadCountEl = document.getElementById('download-count');
            if (downloadCountEl) downloadCountEl.textContent = book.downloadCount || 0;
        }
        
        // Store for sharing
        window.currentBookId = book.bookId;
        window.currentBookName = book.name;
        const shareBar = document.getElementById('share-bar');
        if (shareBar) shareBar.style.display = 'block';
        
        if (book.pdfReady) {
            showPdfControls(book);
        } else {
            showPdfLoading();
            startPdfStatusCheck(book.bookId);
        }
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.getAttribute('data-tab') === 'create') {
                btn.click();
            }
        });
        
        showToast('Book details displayed', 'success');
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to load book details', 'error');
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function setupOptionCards(containerId, hiddenInputId) {
    const container = document.getElementById(containerId);
    const hiddenInput = document.getElementById(hiddenInputId);
    const cards = container.querySelectorAll('.option-card');

    cards.forEach(card => {
        card.addEventListener('click', () => {
            cards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            hiddenInput.value = card.getAttribute('data-value');
        });
    });
}

document.getElementById('refresh-btn')?.addEventListener('click', () => {
    loadHistory();
    showToast('History refreshed', 'success');
});

document.getElementById('refresh-discover-btn')?.addEventListener('click', () => {
    loadDiscover();
    showToast('Discover page refreshed', 'success');
});

function checkConsent() {
    const consentAccepted = localStorage.getItem('bookifyai-consent-accepted');
    
    if (!consentAccepted) {
        showConsentModal();
    }
}

function showConsentModal() {
    const consentModal = document.getElementById('consent-modal');
    const consentCheckbox = document.getElementById('consent-checkbox');
    const acceptBtn = document.getElementById('accept-consent-btn');
    const consentPrivacyLink = document.getElementById('consent-privacy-link');
    const consentTermsLink = document.getElementById('consent-terms-link');
    const consentPrivacyCheckboxLink = document.getElementById('consent-privacy-checkbox-link');
    const consentTermsCheckboxLink = document.getElementById('consent-terms-checkbox-link');
    const privacyModal = document.getElementById('privacy-modal');
    const termsModal = document.getElementById('terms-modal');

    // Block page interaction
    document.body.classList.add('consent-blocked');
    consentModal.classList.add('active');

    // Enable/disable accept button based on checkbox
    consentCheckbox.addEventListener('change', () => {
        acceptBtn.disabled = !consentCheckbox.checked;
    });

    // Open Privacy Policy from consent modal
    consentPrivacyLink?.addEventListener('click', (e) => {
        e.preventDefault();
        consentModal.classList.remove('active');
        privacyModal.classList.add('active');
    });

    consentPrivacyCheckboxLink?.addEventListener('click', (e) => {
        e.preventDefault();
        consentModal.classList.remove('active');
        privacyModal.classList.add('active');
    });

    // Open Terms of Service from consent modal
    consentTermsLink?.addEventListener('click', (e) => {
        e.preventDefault();
        consentModal.classList.remove('active');
        termsModal.classList.add('active');
    });

    consentTermsCheckboxLink?.addEventListener('click', (e) => {
        e.preventDefault();
        consentModal.classList.remove('active');
        termsModal.classList.add('active');
    });

    // Handle accept button
    acceptBtn.addEventListener('click', () => {
        if (consentCheckbox.checked) {
            localStorage.setItem('bookifyai-consent-accepted', 'true');
            localStorage.setItem('bookifyai-consent-date', new Date().toISOString());
            consentModal.classList.remove('active');
            document.body.classList.remove('consent-blocked');
            showToast('Welcome to BookifyAI!', 'success');
        }
    });

    // Prevent closing consent modal by clicking outside or ESC
    consentModal.addEventListener('click', (e) => {
        if (e.target === consentModal) {
            e.stopPropagation();
        }
    });
}

function initializeModals() {
    const privacyLink = document.getElementById('privacy-link');
    const termsLink = document.getElementById('terms-link');
    const privacyModal = document.getElementById('privacy-modal');
    const termsModal = document.getElementById('terms-modal');
    const privacyClose = document.getElementById('privacy-close');
    const termsClose = document.getElementById('terms-close');

    if (privacyLink) {
        privacyLink.addEventListener('click', (e) => {
            e.preventDefault();
            privacyModal.classList.add('active');
        });
    }

    if (termsLink) {
        termsLink.addEventListener('click', (e) => {
            e.preventDefault();
            termsModal.classList.add('active');
        });
    }

    if (privacyClose) {
        privacyClose.addEventListener('click', () => {
            privacyModal.classList.remove('active');
            // If consent modal was open, show it again
            const consentAccepted = localStorage.getItem('bookifyai-consent-accepted');
            if (!consentAccepted) {
                showConsentModal();
            }
        });
    }

    if (termsClose) {
        termsClose.addEventListener('click', () => {
            termsModal.classList.remove('active');
            // If consent modal was open, show it again
            const consentAccepted = localStorage.getItem('bookifyai-consent-accepted');
            if (!consentAccepted) {
                showConsentModal();
            }
        });
    }

    // Close modal when clicking outside
    if (privacyModal) {
        privacyModal.addEventListener('click', (e) => {
            if (e.target === privacyModal) {
                privacyModal.classList.remove('active');
                // If consent modal was open, show it again
                const consentAccepted = localStorage.getItem('bookifyai-consent-accepted');
                if (!consentAccepted) {
                    showConsentModal();
                }
            }
        });
    }

    if (termsModal) {
        termsModal.addEventListener('click', (e) => {
            if (e.target === termsModal) {
                termsModal.classList.remove('active');
                // If consent modal was open, show it again
                const consentAccepted = localStorage.getItem('bookifyai-consent-accepted');
                if (!consentAccepted) {
                    showConsentModal();
                }
            }
        });
    }

    // Close modal with Escape key (but not consent modal)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const consentAccepted = localStorage.getItem('bookifyai-consent-accepted');
            if (consentAccepted) {
                privacyModal?.classList.remove('active');
                termsModal?.classList.remove('active');
            }
        }
    });
}

function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        return;
    }
}

function isAuthenticated() {
    return !!localStorage.getItem('authToken');
}

function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

function handleAuthError() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    showToast('Session expired. Please login again.', 'error');
    setTimeout(() => {
        window.location.href = '/login.html';
    }, 2000);
}

function updateHeader() {
    const headerActions = document.getElementById('header-actions');
    const headerLogin = document.getElementById('header-login');
    
    if (isAuthenticated()) {
        if (headerActions) headerActions.style.display = 'flex';
        if (headerLogin) headerLogin.style.display = 'none';
    } else {
        if (headerActions) headerActions.style.display = 'none';
        if (headerLogin) headerLogin.style.display = 'flex';
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
            showToast('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        });
    }
}

function downloadBookPdf(bookId) {
    const url = `${API_BASE_URL}/${bookId}/pdf`;
    window.open(url, '_blank');
    
    // Update download count in UI
    const downloadCountEl = document.getElementById('download-count');
    if (downloadCountEl) {
        const current = parseInt(downloadCountEl.textContent) || 0;
        downloadCountEl.textContent = current + 1;
    }
}

// Share functions
function getBookShareUrl() {
    const bookId = window.currentBookId;
    if (!bookId) return window.location.origin;
    return `${window.location.origin}/?book=${bookId}`;
}

function getBookShareText() {
    const bookName = window.currentBookName || 'this amazing personalized book';
    return `Check out "${bookName}" - a personalized e-book created with BookifyAI! 📚✨`;
}

function shareToFacebook() {
    const url = encodeURIComponent(getBookShareUrl());
    const text = encodeURIComponent(getBookShareText());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank', 'width=600,height=400');
}

function shareToTwitter() {
    const url = encodeURIComponent(getBookShareUrl());
    const text = encodeURIComponent(getBookShareText());
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400');
}

function shareToLinkedIn() {
    const url = encodeURIComponent(getBookShareUrl());
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=400');
}

function shareToWhatsApp() {
    const url = encodeURIComponent(getBookShareUrl());
    const text = encodeURIComponent(getBookShareText());
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
}

function shareViaEmail() {
    const url = getBookShareUrl();
    const text = getBookShareText();
    const subject = encodeURIComponent('Check out this personalized e-book!');
    const body = encodeURIComponent(`${text}\n\nRead it here: ${url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

function copyBookLink() {
    const url = getBookShareUrl();
    navigator.clipboard.writeText(url).then(() => {
        const copyBtn = document.querySelector('.copy-link');
        const originalText = copyBtn.querySelector('.copy-text').textContent;
        copyBtn.querySelector('.copy-text').textContent = 'Copied!';
        copyBtn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
        showToast('Link copied to clipboard!', 'success');
        
        setTimeout(() => {
            copyBtn.querySelector('.copy-text').textContent = originalText;
            copyBtn.style.background = '';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('Failed to copy link', 'error');
    });
}

async function toggleBookVisibility(bookId, isPublic) {
    if (!isAuthenticated()) {
        showToast('Please login to change book visibility', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/${bookId}/visibility`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ isPublic: isPublic })
        });

        if (!response.ok) {
            throw new Error('Failed to update book visibility');
        }

        const updatedBook = await response.json();
        showToast(`Book is now ${isPublic ? 'public' : 'private'}`, 'success');
        
        // Refresh history and discover pages
        loadHistory();
        if (isPublic) {
            loadDiscover();
        } else {
            // If book became private, refresh discover to remove it
            loadDiscover();
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to update book visibility', 'error');
        // Reload history to revert the toggle
        loadHistory();
    }
}
