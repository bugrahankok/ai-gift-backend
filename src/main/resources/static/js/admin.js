/**
 * Admin Panel JavaScript
 * Handles admin panel functionality including statistics, charts, users, and books
 */

const API_BASE_URL = '/api/admin';

let themeChart, languageChart, toneChart, booksTimelineChart, usersTimelineChart;

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is admin
    if (!checkAdminAccess()) {
        return;
    }
    
    // Initialize tabs
    initializeTabs();
    
    // Load all data
    loadStatistics();
    loadUsers();
    loadBooks();
});

function checkAdminAccess() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    
    // Check if user is admin from localStorage
    const userInfo = localStorage.getItem('userInfo');
    let isAdmin = false;
    
    if (userInfo) {
        try {
            const user = JSON.parse(userInfo);
            isAdmin = user.isAdmin === true;
        } catch (e) {
            console.error('Error parsing user info:', e);
        }
    }
    
    if (!isAdmin) {
        // Try to fetch user info from API if not in localStorage
        console.log('User info not found or not admin, trying to fetch from API...');
        fetch('/api/user/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => res.json())
        .then(userProfile => {
            if (userProfile.isAdmin) {
                localStorage.setItem('userInfo', JSON.stringify({
                    email: userProfile.email,
                    name: userProfile.name,
                    userId: userProfile.userId,
                    isAdmin: true
                }));
                // Reload page to show admin panel
                window.location.reload();
            } else {
                if (window.Utils) {
                    window.Utils.showToast('Access denied. Admin privileges required.', 'error');
                } else {
                    alert('Access denied. Admin privileges required.');
                }
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            }
        })
        .catch(err => {
            console.error('Error fetching user profile:', err);
            if (window.Utils) {
                window.Utils.showToast('Access denied. Admin privileges required.', 'error');
            } else {
                alert('Access denied. Admin privileges required.');
            }
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        });
        return false;
    }
    
    return true;
}

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Update button states
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update content visibility
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${targetTab}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
}

async function loadStatistics() {
    try {
        console.log('Loading statistics...');
        const response = await fetch(`${API_BASE_URL}/stats`, {
            headers: window.Utils ? window.Utils.getAuthHeaders() : {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        console.log('Statistics response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Statistics error:', errorData);
            
            if (response.status === 403) {
                window.Utils?.showToast('Admin access required', 'error');
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
                return;
            }
            if (response.status === 401) {
                window.Utils?.showToast('Please login again', 'error');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
                return;
            }
            throw new Error(errorData.error || 'Failed to load statistics');
        }
        
        const stats = await response.json();
        console.log('Statistics loaded:', stats);
        
        displayStatistics(stats);
        createCharts(stats);
        
        // Hide loading, show content
        const loadingEl = document.getElementById('admin-loading');
        const contentEl = document.getElementById('admin-content');
        if (loadingEl) loadingEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'block';
    } catch (error) {
        console.error('Error loading statistics:', error);
        if (window.Utils) {
            window.Utils.logError('Error loading statistics:', error);
        } else {
            alert('Failed to load statistics: ' + error.message);
        }
        // Hide loading even on error
        const loadingEl = document.getElementById('admin-loading');
        if (loadingEl) {
            loadingEl.innerHTML = '<div style="color: var(--error-color);">Failed to load data. Please refresh the page.</div>';
        }
    }
}

function displayStatistics(stats) {
    const statsGrid = document.getElementById('stats-grid');
    
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-value">${stats.totalUsers}</div>
            <div class="stat-label">Total Users</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div class="stat-value">${stats.totalBooks}</div>
            <div class="stat-label">Total Books</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">🌍</div>
            <div class="stat-value">${stats.publicBooks}</div>
            <div class="stat-label">Public Books</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">🔒</div>
            <div class="stat-value">${stats.privateBooks}</div>
            <div class="stat-label">Private Books</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">👁️</div>
            <div class="stat-value">${stats.totalViews}</div>
            <div class="stat-label">Total Views</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📥</div>
            <div class="stat-value">${stats.totalDownloads}</div>
            <div class="stat-label">Total Downloads</div>
        </div>
    `;
}

function createCharts(stats) {
    // Theme Chart
    const themeCtx = document.getElementById('theme-chart');
    if (themeCtx && stats.booksByTheme) {
        const themeData = Object.entries(stats.booksByTheme)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        themeChart = new Chart(themeCtx, {
            type: 'doughnut',
            data: {
                labels: themeData.map(d => d[0]),
                datasets: [{
                    data: themeData.map(d => d[1]),
                    backgroundColor: [
                        '#6366f1', '#8b5cf6', '#ec4899', '#f472b6', '#fb7185',
                        '#10b981', '#34d399', '#f59e0b', '#fbbf24', '#3b82f6'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Language Chart
    const languageCtx = document.getElementById('language-chart');
    if (languageCtx && stats.booksByLanguage) {
        const languageData = Object.entries(stats.booksByLanguage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        languageChart = new Chart(languageCtx, {
            type: 'bar',
            data: {
                labels: languageData.map(d => d[0]),
                datasets: [{
                    label: 'Books',
                    data: languageData.map(d => d[1]),
                    backgroundColor: '#6366f1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // Tone Chart
    const toneCtx = document.getElementById('tone-chart');
    if (toneCtx && stats.booksByTone) {
        const toneData = Object.entries(stats.booksByTone)
            .sort((a, b) => b[1] - a[1]);
        
        toneChart = new Chart(toneCtx, {
            type: 'pie',
            data: {
                labels: toneData.map(d => d[0]),
                datasets: [{
                    data: toneData.map(d => d[1]),
                    backgroundColor: [
                        '#6366f1', '#8b5cf6', '#ec4899', '#f472b6', '#fb7185',
                        '#10b981', '#34d399', '#f59e0b', '#fbbf24', '#3b82f6'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Books Timeline Chart
    const booksTimelineCtx = document.getElementById('books-timeline-chart');
    if (booksTimelineCtx && stats.booksCreatedByDay) {
        const timelineData = Object.entries(stats.booksCreatedByDay)
            .sort((a, b) => a[0].localeCompare(b[0]));
        
        booksTimelineChart = new Chart(booksTimelineCtx, {
            type: 'line',
            data: {
                labels: timelineData.map(d => d[0]),
                datasets: [{
                    label: 'Books Created',
                    data: timelineData.map(d => d[1]),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // Users Timeline Chart
    const usersTimelineCtx = document.getElementById('users-timeline-chart');
    if (usersTimelineCtx && stats.usersCreatedByDay) {
        const timelineData = Object.entries(stats.usersCreatedByDay)
            .sort((a, b) => a[0].localeCompare(b[0]));
        
        usersTimelineChart = new Chart(usersTimelineCtx, {
            type: 'line',
            data: {
                labels: timelineData.map(d => d[0]),
                datasets: [{
                    label: 'Users Created',
                    data: timelineData.map(d => d[1]),
                    borderColor: '#ec4899',
                    backgroundColor: 'rgba(236, 72, 153, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

async function loadUsers() {
    const usersContent = document.getElementById('users-content');
    if (!usersContent) return;
    
    usersContent.innerHTML = '<div class="loading">Loading users...</div>';
    
    try {
        console.log('Loading users...');
        const response = await fetch(`${API_BASE_URL}/users`, {
            headers: window.Utils ? window.Utils.getAuthHeaders() : {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        console.log('Users response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Users error:', errorData);
            
            if (response.status === 403) {
                window.Utils?.showToast('Admin access required', 'error');
                return;
            }
            throw new Error(errorData.error || 'Failed to load users');
        }
        
        const users = await response.json();
        console.log('Users loaded:', users.length);
        displayUsers(users);
    } catch (error) {
        console.error('Error loading users:', error);
        if (window.Utils) {
            window.Utils.logError('Error loading users:', error);
        }
        usersContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-text">Failed to load users: ${error.message || 'Unknown error'}</div>
            </div>
        `;
    }
}

function displayUsers(users) {
    const usersContent = document.getElementById('users-content');
    
    if (users.length === 0) {
        usersContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <div class="empty-state-text">No users found</div>
            </div>
        `;
        return;
    }
    
    usersContent.innerHTML = `
        <div class="admin-table">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Total Books</th>
                        <th>Admin</th>
                        <th>Created At</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.userId}</td>
                            <td>${escapeHtml(user.name || 'N/A')}</td>
                            <td>${escapeHtml(user.email)}</td>
                            <td>${user.totalBooks || 0}</td>
                            <td>${user.isAdmin ? '✅ Yes' : '❌ No'}</td>
                            <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                            <td>
                                <button class="btn btn-secondary" onclick="editUser(${user.userId}, '${escapeHtml(user.name || '')}', '${escapeHtml(user.email)}', ${user.isAdmin || false})" style="padding: 6px 12px; font-size: 0.85rem; margin-right: 5px;">✏️ Edit</button>
                                <button class="btn btn-danger" onclick="deleteUser(${user.userId}, '${escapeHtml(user.email)}')" style="padding: 6px 12px; font-size: 0.85rem;">🗑️ Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function loadBooks() {
    const booksContent = document.getElementById('books-content');
    if (!booksContent) return;
    
    booksContent.innerHTML = '<div class="loading">Loading books...</div>';
    
    try {
        console.log('Loading books...');
        const response = await fetch(`${API_BASE_URL}/books`, {
            headers: window.Utils ? window.Utils.getAuthHeaders() : {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        console.log('Books response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Books error:', errorData);
            
            if (response.status === 403) {
                window.Utils?.showToast('Admin access required', 'error');
                return;
            }
            throw new Error(errorData.error || 'Failed to load books');
        }
        
        const books = await response.json();
        console.log('Books loaded:', books.length);
        displayBooks(books);
    } catch (error) {
        console.error('Error loading books:', error);
        if (window.Utils) {
            window.Utils.logError('Error loading books:', error);
        }
        booksContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-text">Failed to load books: ${error.message || 'Unknown error'}</div>
            </div>
        `;
    }
}

function displayBooks(books) {
    const booksContent = document.getElementById('books-content');
    
    if (books.length === 0) {
        booksContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📚</div>
                <div class="empty-state-text">No books found</div>
            </div>
        `;
        return;
    }
    
    booksContent.innerHTML = `
        <div class="admin-table">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Theme</th>
                        <th>Author</th>
                        <th>Visibility</th>
                        <th>Views</th>
                        <th>Downloads</th>
                        <th>Created At</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${books.map(book => `
                        <tr>
                            <td>${book.bookId}</td>
                            <td>${escapeHtml(book.name || 'N/A')}</td>
                            <td>${escapeHtml(book.theme || 'N/A')}</td>
                            <td>${escapeHtml(book.authorName || 'N/A')}</td>
                            <td>${book.isPublic ? '🌍 Public' : '🔒 Private'}</td>
                            <td>${book.viewCount || 0}</td>
                            <td>${book.downloadCount || 0}</td>
                            <td>${book.createdAt ? new Date(book.createdAt).toLocaleDateString() : 'N/A'}</td>
                            <td>
                                <a href="/book-details.html?id=${book.bookId}" class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.85rem; margin-right: 5px;">👁️ View</a>
                                <button class="btn btn-secondary" onclick="editBook(${book.bookId})" style="padding: 6px 12px; font-size: 0.85rem; margin-right: 5px;">✏️ Edit</button>
                                <button class="btn btn-danger" onclick="deleteBook(${book.bookId}, '${escapeHtml(book.name || '')}')" style="padding: 6px 12px; font-size: 0.85rem;">🗑️ Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// User management functions
async function deleteUser(userId, userEmail) {
    if (!confirm(`Are you sure you want to delete user "${userEmail}"?\n\nThis action cannot be undone and will delete all books created by this user.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: window.Utils ? window.Utils.getAuthHeaders() : {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || 'Failed to delete user');
        }
        
        if (window.Utils) {
            window.Utils.showToast('User deleted successfully', 'success');
        }
        loadUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        if (window.Utils) {
            window.Utils.logError('Error deleting user:', error);
        } else {
            alert('Failed to delete user: ' + error.message);
        }
    }
}

function editUser(userId, name, email, isAdmin) {
    document.getElementById('edit-user-id').value = userId;
    document.getElementById('edit-user-name').value = name || '';
    document.getElementById('edit-user-email').value = email || '';
    document.getElementById('edit-user-password').value = '';
    document.getElementById('edit-user-is-admin').checked = isAdmin || false;
    document.getElementById('edit-user-modal').style.display = 'flex';
}

async function saveUser() {
    const userId = document.getElementById('edit-user-id').value;
    const name = document.getElementById('edit-user-name').value.trim();
    const email = document.getElementById('edit-user-email').value.trim();
    const password = document.getElementById('edit-user-password').value.trim();
    const isAdmin = document.getElementById('edit-user-is-admin').checked;
    
    if (!name || !email) {
        if (window.Utils) {
            window.Utils.showToast('Name and email are required', 'error');
        } else {
            alert('Name and email are required');
        }
        return;
    }
    
    if (password && password.length < 6) {
        if (window.Utils) {
            window.Utils.showToast('Password must be at least 6 characters', 'error');
        } else {
            alert('Password must be at least 6 characters');
        }
        return;
    }
    
    const updateData = { name, email, isAdmin };
    if (password) {
        updateData.password = password;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'PUT',
            headers: window.Utils ? window.Utils.getAuthHeaders() : {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || 'Failed to update user');
        }
        
        if (window.Utils) {
            window.Utils.showToast('User updated successfully', 'success');
        }
        document.getElementById('edit-user-modal').style.display = 'none';
        loadUsers();
    } catch (error) {
        console.error('Error updating user:', error);
        if (window.Utils) {
            window.Utils.logError('Error updating user:', error);
        } else {
            alert('Failed to update user: ' + error.message);
        }
    }
}

// Book management functions
async function deleteBook(bookId, bookName) {
    if (!confirm(`Are you sure you want to delete book "${bookName}"?\n\nThis action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
            method: 'DELETE',
            headers: window.Utils ? window.Utils.getAuthHeaders() : {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || 'Failed to delete book');
        }
        
        if (window.Utils) {
            window.Utils.showToast('Book deleted successfully', 'success');
        }
        loadBooks();
    } catch (error) {
        console.error('Error deleting book:', error);
        if (window.Utils) {
            window.Utils.logError('Error deleting book:', error);
        } else {
            alert('Failed to delete book: ' + error.message);
        }
    }
}

async function editBook(bookId) {
    try {
        // Load book details
        const response = await fetch(`${API_BASE_URL}/books`, {
            headers: window.Utils ? window.Utils.getAuthHeaders() : {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load book details');
        }
        
        const books = await response.json();
        const book = books.find(b => b.bookId === bookId);
        
        if (!book) {
            throw new Error('Book not found');
        }
        
        // Populate form
        document.getElementById('edit-book-id').value = bookId;
        document.getElementById('edit-book-name').value = book.name || '';
        document.getElementById('edit-book-age').value = book.age || '';
        document.getElementById('edit-book-gender').value = book.gender || '';
        document.getElementById('edit-book-language').value = book.language || '';
        document.getElementById('edit-book-theme').value = book.theme || '';
        document.getElementById('edit-book-main-topic').value = book.mainTopic || '';
        document.getElementById('edit-book-tone').value = book.tone || '';
        document.getElementById('edit-book-giver').value = book.giver || '';
        document.getElementById('edit-book-appearance').value = book.appearance || '';
        document.getElementById('edit-book-is-public').checked = book.isPublic || false;
        
        document.getElementById('edit-book-modal').style.display = 'flex';
    } catch (error) {
        console.error('Error loading book:', error);
        if (window.Utils) {
            window.Utils.logError('Error loading book:', error);
        } else {
            alert('Failed to load book: ' + error.message);
        }
    }
}

async function saveBook() {
    const bookId = document.getElementById('edit-book-id').value;
    const name = document.getElementById('edit-book-name').value.trim();
    const age = parseInt(document.getElementById('edit-book-age').value);
    const gender = document.getElementById('edit-book-gender').value.trim();
    const language = document.getElementById('edit-book-language').value.trim();
    const theme = document.getElementById('edit-book-theme').value.trim();
    const mainTopic = document.getElementById('edit-book-main-topic').value.trim();
    const tone = document.getElementById('edit-book-tone').value.trim();
    const giver = document.getElementById('edit-book-giver').value.trim();
    const appearance = document.getElementById('edit-book-appearance').value.trim();
    const isPublic = document.getElementById('edit-book-is-public').checked;
    
    if (!name || !theme || !tone || !giver) {
        if (window.Utils) {
            window.Utils.showToast('Name, theme, tone, and giver are required', 'error');
        } else {
            alert('Name, theme, tone, and giver are required');
        }
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
            method: 'PUT',
            headers: window.Utils ? window.Utils.getAuthHeaders() : {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                name,
                age: age || null,
                gender: gender || null,
                language: language || null,
                theme,
                mainTopic: mainTopic || null,
                tone,
                giver,
                appearance: appearance || null,
                isPublic
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || 'Failed to update book');
        }
        
        if (window.Utils) {
            window.Utils.showToast('Book updated successfully', 'success');
        }
        document.getElementById('edit-book-modal').style.display = 'none';
        loadBooks();
    } catch (error) {
        console.error('Error updating book:', error);
        if (window.Utils) {
            window.Utils.logError('Error updating book:', error);
        } else {
            alert('Failed to update book: ' + error.message);
        }
    }
}

// Close modals
function closeEditUserModal() {
    document.getElementById('edit-user-modal').style.display = 'none';
}

function closeEditBookModal() {
    document.getElementById('edit-book-modal').style.display = 'none';
}

