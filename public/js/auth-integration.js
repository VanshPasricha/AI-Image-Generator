// Authentication integration for standalone image generator
(function() {
    // Load auth module and check authentication
    let authModule = null;
    
    async function loadAuth() {
        try {
            const module = await import('/js/auth.js');
            authModule = module;
            return module;
        } catch (error) {
            console.error('Failed to load auth module:', error);
            window.location.href = '/login';
            return null;
        }
    }
    
    async function initAuth() {
        const { ensureAuthed, onAuth, logout } = await loadAuth();
        if (!authModule) return;
        
        try {
            await ensureAuthed();
            
            // Show user info
            const userDisplay = document.getElementById('user-display');
            const logoutBtn = document.getElementById('logout-btn');
            
            onAuth((user) => {
                if (user && userDisplay) {
                    userDisplay.textContent = user.displayName || user.email || 'User';
                    if (logoutBtn) logoutBtn.style.display = 'inline-block';
                }
            });
            
            // Handle logout
            if (logoutBtn) {
                logoutBtn.addEventListener('click', logout);
            }
            
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = '/login';
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        initAuth();
    }
})();
