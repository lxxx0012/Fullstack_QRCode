import { saveAuthData  } from "./authUtils.js"; // ADD THIS IMPORT

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password')
    const loginMessage = document.getElementById('login-message');

    // IMPORTANT: ENSURE THIS MATCHES YOUR BACKEND URL
    const BACKEND_URL = 'http://localhost:5000';

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prvent default form submission

        const username = usernameInput.value;
        const password = passwordInput.value;

        loginMessage.textContent = ''; // Clear previous messages
        loginMessage.style.color = 'red'; // Default to red for error

        try {
            const response = await fetch('${BACKEND_URL}/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Login successful!
                loginMessage.style.color = 'green';
                loginMessage.textContent = data.message;
                // Store the JWT token and user info (e.g., in localStorage)
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user)); // Store user object (id, username, role)
                saveAuthData(data.token, data.user); // USE THE UTILITY FUNCTION
            
                // Redirect to the QR generator or a dashboard page
                // Adjust this based on where you want users to go after logim
                setTimeout(() => {
                    window.location.href = 'index.html'; // Or 'dashboard.html
                }, 1000);

            } else {
                // Login failed
                loginMessage.textContent = data.message || 'Login failed. Please try again.';
            } 

        } catch (error) {
                console.error('Network or server error during login:', error);
                loginMessage.textContent = 'An error occurred. Please try again later.';
        }
    });
});