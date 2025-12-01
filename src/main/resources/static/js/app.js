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
    // Navigation is handled by nav.js
    if (window.Navigation) {
        window.Navigation.update();
        window.Navigation.setupLogout();
    }
    
    // Check if URL has book parameter for direct sharing - redirect to book details page
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('book');
    if (bookId) {
        window.location.href = `/book-details.html?id=${bookId}`;
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

    setupOptionCards('age-options', 'age');
    setupOptionCards('theme-options', 'theme');
    setupOptionCards('type-options', 'book-type');
    setupOptionCards('tone-options', 'tone');
    setupLanguageOptions();
    
    // Initialize character management
    initializeCharacters();
    
    // Initialize character management
    initializeCharacters();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!isAuthenticated()) {
            showToast('Please login to create books', 'error');
            document.getElementById('login-required-message').style.display = 'block';
            return;
        }
        
        const formData = new FormData(form);
        const visibility = formData.get('visibility');
        const ageValue = formData.get('age');
        // Age value is already the starting age of the range (e.g., 3 for 3-5 years)
        const age = ageValue ? parseInt(ageValue) : null;
        
        // Collect characters
        const characters = collectCharacters();
        
        // Get language
        let language = formData.get('language');
        if (language === 'OTHER') {
            const customLanguage = document.getElementById('language-custom')?.value?.trim();
            if (!customLanguage) {
                showToast('Please enter a language name', 'error');
                return;
            }
            language = customLanguage;
        }
        
        const bookData = {
            name: formData.get('name'),
            age: age,
            gender: formData.get('gender') || null,
            language: language || 'English',
            theme: formData.get('theme'),
            mainTopic: formData.get('main-topic') || null,
            tone: formData.get('tone'),
            giver: formData.get('giver'),
            appearance: formData.get('appearance') || '',
            characters: characters.length > 0 ? characters : null,
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

        // Show generating animation
        showGeneratingAnimation();

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
                hideGeneratingAnimation();
                throw new Error(`Failed to create book: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('Response received:', result);
            
            if (!result || !result.content) {
                hideGeneratingAnimation();
                throw new Error('Invalid response received');
            }
            
            currentBookId = result.bookId;
            
            // Hide animation and show success message
            updateGeneratingMessage('🎉 Kitabınız hazır!', 'Kitabınıza yönlendiriliyorsunuz...');
            
            // Wait a moment then redirect to book details page
            setTimeout(() => {
                hideGeneratingAnimation();
                form.reset();
                
                // Redirect to book details page (same window)
                const bookUrl = `/book-details.html?id=${result.bookId}`;
                window.location.href = bookUrl;
            }, 2000);
        } catch (error) {
            console.error('Error details:', error);
            hideGeneratingAnimation();
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
    
    // Format content with beautiful book-like styling
    const formattedContent = formatBookContent(book.content);
    resultContent.innerHTML = formattedContent;
    
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
        document.getElementById('page-input').max = totalPages;
        renderPage(currentPage);
    } catch (error) {
        console.error('Error loading PDF:', error);
        console.error('PDF URL:', url);
        showToast('Failed to load PDF: ' + (error.message || 'Unknown error') + '. Please try downloading it instead.', 'error');
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
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    ${book.pdfReady ? `<button onclick="downloadBookPdf(${book.bookId})" class="btn btn-primary" style="flex: 1;">📥 Download PDF</button>` : '<p style="flex: 1; color: var(--text-secondary); text-align: center; padding: 10px;">⏳ PDF is being generated...</p>'}
                    <button onclick="deleteBookFromHistory(${book.bookId}, event)" class="btn btn-danger" style="flex: 0 0 auto; min-width: 100px;">🗑️ Delete</button>
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('#history-content .gift-item').forEach(item => {
        item.addEventListener('click', (e) => {
            // Don't trigger if clicking on buttons, inputs, labels, or links
            if (e.target.tagName !== 'BUTTON' && 
                e.target.tagName !== 'A' && 
                e.target.tagName !== 'INPUT' &&
                e.target.tagName !== 'LABEL' &&
                !e.target.closest('button') &&
                !e.target.closest('a') &&
                !e.target.closest('label')) {
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
            // Don't trigger if clicking on buttons or links
            if (e.target.tagName !== 'BUTTON' && 
                e.target.tagName !== 'A' &&
                !e.target.closest('button') &&
                !e.target.closest('a')) {
                const id = item.getAttribute('data-id');
                viewPublicBook(id);
            }
        });
    });
}

async function viewPublicBook(id) {
    // Redirect to book details page
    window.location.href = `/book-details.html?id=${id}`;
}

async function viewBookDetails(id) {
    // Redirect to book details page
    window.location.href = `/book-details.html?id=${id}`;
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

async function deleteBookFromHistory(bookId, event) {
    if (event) {
        event.stopPropagation();
    }
    
    if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/${bookId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || error.error || 'Failed to delete book');
        }
        
        showToast('Book deleted successfully', 'success');
        
        // Reload history and discover to refresh the lists
        loadHistory();
        loadDiscover();
    } catch (error) {
        console.error('Error:', error);
        const errorMessage = error.message || 'Failed to delete book';
        showToast(errorMessage, 'error');
    }
}

// Character Management Functions
let characterCount = 0;

function initializeCharacters() {
    const addBtn = document.getElementById('add-character-btn');
    if (addBtn) {
        addBtn.addEventListener('click', addCharacter);
    }
}

function addCharacter() {
    if (characterCount >= 3) {
        showToast('Maximum 3 characters allowed', 'error');
        return;
    }
    
    characterCount++;
    const container = document.getElementById('characters-container');
    const characterIndex = characterCount;
    
    const characterCard = document.createElement('div');
    characterCard.className = 'character-card';
    characterCard.id = `character-${characterIndex}`;
    characterCard.innerHTML = `
        <div class="character-header">
            <div class="character-title">Character ${characterIndex}</div>
            <button type="button" class="character-remove-btn" onclick="removeCharacter(${characterIndex})">Remove</button>
        </div>
        
        <div class="form-group" style="margin-bottom: 15px;">
            <label class="form-label">Character Type</label>
            <div class="character-type-options">
                <label class="character-type-option">
                    <input type="radio" name="character-type-${characterIndex}" value="Human" checked>
                    <div class="character-type-card">
                        <div class="character-type-icon">👤</div>
                        <div class="character-type-label">Human</div>
                    </div>
                </label>
                <label class="character-type-option">
                    <input type="radio" name="character-type-${characterIndex}" value="Animal">
                    <div class="character-type-card">
                        <div class="character-type-icon">🐾</div>
                        <div class="character-type-label">Animal</div>
                    </div>
                </label>
                <label class="character-type-option">
                    <input type="radio" name="character-type-${characterIndex}" value="Object">
                    <div class="character-type-card">
                        <div class="character-type-icon">📦</div>
                        <div class="character-type-label">Object</div>
                    </div>
                </label>
            </div>
        </div>
        
        <div class="form-group" style="margin-bottom: 15px;">
            <label class="form-label">Character Name</label>
            <input type="text" class="form-input character-name" 
                   placeholder="Enter character name" required>
        </div>
        
        <div class="form-group" style="margin-bottom: 15px;">
            <label class="form-label">Appearance</label>
            <textarea class="form-textarea character-appearance" rows="2" 
                      placeholder="e.g., Brown hair, blue eyes, tall, friendly smile..."></textarea>
        </div>
        
        <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-textarea character-description" rows="2" 
                      placeholder="e.g., A brave and kind friend who loves adventures..."></textarea>
        </div>
    `;
    
    container.appendChild(characterCard);
    updateAddButtonState();
}

function removeCharacter(index) {
    const characterCard = document.getElementById(`character-${index}`);
    if (characterCard) {
        characterCard.remove();
        characterCount--;
        updateAddButtonState();
    }
}

function updateAddButtonState() {
    const addBtn = document.getElementById('add-character-btn');
    if (addBtn) {
        if (characterCount >= 3) {
            addBtn.disabled = true;
            addBtn.style.opacity = '0.5';
            addBtn.style.cursor = 'not-allowed';
        } else {
            addBtn.disabled = false;
            addBtn.style.opacity = '1';
            addBtn.style.cursor = 'pointer';
        }
    }
}

function collectCharacters() {
    const characters = [];
    const characterCards = document.querySelectorAll('.character-card');
    
    characterCards.forEach((card) => {
        const name = card.querySelector('.character-name')?.value?.trim();
        const appearance = card.querySelector('.character-appearance')?.value?.trim();
        const description = card.querySelector('.character-description')?.value?.trim();
        const typeInput = card.querySelector('input[type="radio"]:checked');
        const type = typeInput ? typeInput.value : 'Human';
        
        if (name) {
            characters.push({
                name: name,
                appearance: appearance || '',
                description: description || '',
                type: type
            });
        }
    });
    
    return characters;
}

// Global functions for loading popup
function showLoading() {
    const popup = document.getElementById('book-generating-modal');
    
    if (!popup) {
        console.error('Loading popup element not found!');
        return;
    }
    
    // Show popup with flex display
    popup.style.display = 'flex';
    popup.classList.add('show');
    
    // Scroll to popup smoothly
    popup.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}

function hideLoading() {
    const popup = document.getElementById('book-generating-modal');
    
    if (popup) {
        popup.classList.remove('show');
        setTimeout(() => {
            popup.style.display = 'none';
        }, 300);
    }
}

function showGeneratingAnimation() {
    showLoading();
    
    const message = document.getElementById('generating-message');
    const submessage = document.getElementById('generating-submessage');
    const animation = document.getElementById('generating-animation');
    
    // Sweet and sympathetic messages to cycle through (English)
    const messages = [
        { main: '✨ Creating your book...', sub: 'Your story is being crafted with care', icon: '✍️' },
        { main: '🎨 Adding beautiful pages...', sub: 'Every detail is carefully crafted', icon: '🎨' },
        { main: '📖 Organizing chapters...', sub: 'Your story is taking shape', icon: '📖' },
        { main: '💫 Adding special touches...', sub: 'Making every page unique', icon: '💫' },
        { main: '🌟 Finalizing your book...', sub: 'Your book is almost ready!', icon: '🌟' },
        { main: '📚 Combining pages...', sub: 'Everything is coming together', icon: '📚' },
        { main: '🎁 Adding special surprises...', sub: 'Adding details that make it special', icon: '🎁' },
        { main: '✨ Final checks...', sub: 'Everything must be perfect!', icon: '✨' },
        { main: '💝 Adding personal messages...', sub: 'Making your book even more special', icon: '💝' },
        { main: '🎀 Designing the cover...', sub: 'Making your book beautiful', icon: '🎀' }
    ];
    
    let messageIndex = 0;
    
    // Animate dots in "Lütfen bekleyin"
    const dotsElement = document.getElementById('dots');
    let dotCount = 0;
    const dotsInterval = setInterval(() => {
        if (dotsElement) {
            dotCount = (dotCount % 3) + 1;
            dotsElement.textContent = '.'.repeat(dotCount);
        }
    }, 500);
    window.generatingDotsInterval = dotsInterval;
    
    const messageInterval = setInterval(() => {
        if (messageIndex < messages.length) {
            const msg = messages[messageIndex];
            if (message) {
                message.style.opacity = '0';
                message.style.transform = 'translateY(10px)';
                setTimeout(() => {
                    message.textContent = msg.main;
                    message.style.opacity = '1';
                    message.style.transform = 'translateY(0)';
                }, 200);
            }
            if (submessage) {
                submessage.style.opacity = '0';
                submessage.style.transform = 'translateY(10px)';
                setTimeout(() => {
                    submessage.textContent = msg.sub;
                    submessage.style.opacity = '1';
                    submessage.style.transform = 'translateY(0)';
                }, 250);
            }
            if (animation) {
                animation.style.transform = 'scale(0.7) rotate(-10deg)';
                animation.style.opacity = '0.5';
                setTimeout(() => {
                    animation.textContent = msg.icon;
                    animation.style.transform = 'scale(1) rotate(0deg)';
                    animation.style.opacity = '1';
                }, 150);
            }
            messageIndex++;
        } else {
            // Loop back to start for longer generation times
            messageIndex = 0;
        }
    }, 2800); // Slightly longer for better readability
    
    // Store interval to clear it later
    window.generatingMessageInterval = messageInterval;
}

function updateGeneratingMessage(main, sub) {
    const message = document.getElementById('generating-message');
    const submessage = document.getElementById('generating-submessage');
    const animation = document.getElementById('generating-animation');
    
    if (message) message.textContent = main;
    if (submessage) submessage.textContent = sub;
    if (animation) animation.textContent = '🎉';
}

function hideGeneratingAnimation() {
    hideLoading();
    
    // Clear message interval if exists
    if (window.generatingMessageInterval) {
        clearInterval(window.generatingMessageInterval);
        window.generatingMessageInterval = null;
    }
    
    // Clear dots interval if exists
    if (window.generatingDotsInterval) {
        clearInterval(window.generatingDotsInterval);
        window.generatingDotsInterval = null;
    }
}

function setupLanguageOptions() {
    const container = document.getElementById('language-options');
    const hiddenInput = document.getElementById('language');
    const customContainer = document.getElementById('language-custom-container');
    const customInput = document.getElementById('language-custom');
    const cards = container.querySelectorAll('.option-card');

    cards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove selected class from all cards
            cards.forEach(c => c.classList.remove('selected'));
            // Add selected class to clicked card
            card.classList.add('selected');
            
            const value = card.getAttribute('data-value');
            hiddenInput.value = value;
            
            // Show/hide custom input
            if (value === 'OTHER') {
                customContainer.style.display = 'block';
                customInput.required = true;
            } else {
                customContainer.style.display = 'none';
                customInput.required = false;
                customInput.value = '';
            }
        });
    });
    
    // Set default to English
    const englishCard = Array.from(cards).find(c => c.getAttribute('data-value') === 'English');
    if (englishCard) {
        englishCard.click();
    }
}
