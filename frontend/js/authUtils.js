const AUTH_TOKEN_KEY = 'token';
const AUTH_USER_KEY = 'user'; // Store { id, username, role }

export const saveAuthData = (token, user) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const getAuthToken = () => {
    return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const getAuthUser = () => {
    const userJson = localStorage.getItem(AUTH_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
};

export const clearAuthData = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
};

export const isLoggedIn = () => {
    return !!getAuthToken() && !!getAuthUser();
};

export const isAdmin = () => {
    const user = getAuthUser();
    return user && user.role === 'admin';
};

export const getAuthHeaders = () => {
    const token = getAuthHeaders();
    return token ? { 'Authorization': 'Bearer ${token}', 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

// Function to redirect if not authenticated (useful for protected pages)
export const redirectToLoginIfNotAuthenticated = () => {
    if (!isLoggedIn()) {
        alert('You need to be logged in to view this page.');
        window.location.href = 'login.html';
    }
};

// Function to redirect if not admin (userful for admin page)
export const redirectToHomeIfNotAdmin = () => {
    if (!isAdmin()) {
        alert('You do not have administrative access to view this page.');
        window.location.href = 'index.html'; // Or any non-admin page
    }
};