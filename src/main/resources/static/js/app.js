const API_BASE_URL = '/api/book';
let currentBookId = null;
let pdfCheckInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initializeForm();
    loadHistory();
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
            }
        });
    });
}

function initializeForm() {
    const form = document.getElementById('book-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const bookData = {
            name: formData.get('name'),
            age: parseInt(formData.get('age')),
            theme: formData.get('theme'),
            tone: formData.get('tone'),
            giver: formData.get('giver'),
            appearance: formData.get('appearance') || ''
        };

        if (!bookData.name || !bookData.age || !bookData.theme || !bookData.tone || !bookData.giver) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline';

        try {
            console.log('Sending request:', bookData);
            const response = await fetch(`${API_BASE_URL}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
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
    
    resultMeta.innerHTML = `
        <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap; font-size: 0.95rem; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid var(--border-color);">
            <span style="display: inline-flex; gap: 6px;">
                <strong>Category:</strong> 📚 Personalized Book
            </span>
            <span style="display: inline-flex; gap: 6px;">
                <strong>Type:</strong> E-Book
            </span>
            <span style="display: inline-flex; gap: 6px; color: var(--text-secondary);">
                <strong>Created:</strong> ${createdAt}
            </span>
        </div>
    `;
    
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
        window.open(`${API_BASE_URL}/${book.bookId}/pdf`, '_blank');
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
            const response = await fetch(`${API_BASE_URL}/${bookId}/status`);
            if (response.ok) {
                const status = await response.json();
                if (status.pdfReady) {
                    clearInterval(pdfCheckInterval);
                    pdfCheckInterval = null;
                    
                    const bookResponse = await fetch(`${API_BASE_URL}/${bookId}`);
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

    try {
        const response = await fetch(`${API_BASE_URL}/history`);
        if (!response.ok) {
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
                    <span class="gift-item-type">E-Book</span>
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
                ${book.pdfReady ? `<a href="${API_BASE_URL}/${book.bookId}/pdf" target="_blank" class="btn btn-primary" style="margin-top: 10px; width: 100%; text-decoration: none; display: inline-block; text-align: center;">📥 Download PDF</a>` : '<p style="margin-top: 10px; color: var(--text-secondary);">⏳ PDF is being generated...</p>'}
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

async function viewBookDetails(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        if (!response.ok) {
            throw new Error('Failed to load book details');
        }

        const book = await response.json();
        currentBookId = book.bookId;
        displayResult(book);
        
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

document.getElementById('refresh-btn')?.addEventListener('click', () => {
    loadHistory();
    showToast('History refreshed', 'success');
});
