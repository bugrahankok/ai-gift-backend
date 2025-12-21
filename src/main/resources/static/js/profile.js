const API_BASE_URL = '/api/book';
const USER_API_URL = '/api/user';

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    // Navigation is handled by nav.js
    if (window.Navigation) {
        window.Navigation.update();
        window.Navigation.setupLogout();
    }
    loadProfile();
});

function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
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

function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

async function loadProfile() {
    try {
        const response = await fetch(`${USER_API_URL}/profile`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            if (response.status === 401) {
                handleAuthError();
                return;
            }
            throw new Error('Failed to load profile');
        }

        const profile = await response.json();
        displayProfile(profile);
        displayBooks(profile.books);
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to load profile', 'error');
    }
}

function displayProfile(profile) {
    document.getElementById('user-name').textContent = profile.name;
    document.getElementById('user-email').textContent = profile.email;
    document.getElementById('user-created').textContent = `Member since: ${new Date(profile.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    })}`;
    document.getElementById('total-books').textContent = profile.totalBooks;
}

function displayBooks(books) {
    const booksContent = document.getElementById('books-content');

    if (books.length === 0) {
        booksContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-text">No books created yet</div>
                <a href="/" class="btn btn-primary" style="margin-top: 20px; display: inline-block;">Create Your First Book</a>
            </div>
        `;
        return;
    }

    booksContent.innerHTML = books.map(book => {
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
                    ${book.pdfReady ? `<a href="${API_BASE_URL}/${book.bookId}/pdf" target="_blank" class="btn btn-primary" style="flex: 1; text-decoration: none; display: inline-block; text-align: center;">📥 Download PDF</a>` : '<p style="flex: 1; color: var(--text-secondary); text-align: center; padding: 10px;">⏳ PDF is being generated...</p>'}
                    <button onclick="deleteBook(${book.bookId}, event)" class="btn btn-danger" style="flex: 0 0 auto; min-width: 100px;">🗑️ Delete</button>
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.gift-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
                const id = item.getAttribute('data-id');
                window.location.href = `/?book=${id}`;
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

document.getElementById('refresh-btn')?.addEventListener('click', () => {
    loadProfile();
    showToast('Profile refreshed', 'success');
});

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function downloadBookPdf(bookId) {
    const url = `${API_BASE_URL}/${bookId}/pdf`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.download = `book-${bookId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function deleteBook(bookId, event) {
    event.stopPropagation();
    
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
            throw new Error(error.message || 'Failed to delete book');
        }
        
        showToast('Book deleted successfully', 'success');
        loadProfile(); // Reload the profile to refresh the book list
    } catch (error) {
        console.error('Error:', error);
        showToast(error.message || 'Failed to delete book', 'error');
    }
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
        
        // Reload profile to refresh the book list
        loadProfile();
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to update book visibility', 'error');
        // Reload profile to revert the toggle
        loadProfile();
    }
}

function isAuthenticated() {
    return !!localStorage.getItem('authToken');
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

