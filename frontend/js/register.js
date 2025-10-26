const { saveAuthData } = require("./authUtils");

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const registerMessage = document.getElementById('register-message');

    // IMPORTANT: Ensure this matches your backend URL
    const BACKEND_URL = 'http://localhost:5000';

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission

        const username = usernameInput.value;
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        registerMessage.textContent = ''; // Clear previous Message
        registerMessage.style.color = 'red'; // Default to red for errors

        if (password !== confirmPassword) {
            registerMessage.textContent = 'Passwords do not match.';
            return;
        }
        
        try {
            const response = await fetch('${BACKEND_URL}/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Registration successful!
                registerMessage.style.color = 'green';
                registerMessage.textContent = data.message;
                // Optional, log the user in immediately after registration
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                saveAuthData(data.token, data.user); // USER THE UTILITY FUNCTION
                
                // Redirect to login or generator page
                setTimeout(() => {
                    window.location.href = 'index.html'; // or 'login.html'
                }, 1000);

            } else {
                // Registration failed
                registerMessage.textContent = data.message || 'Registration failed. Please try again.';
            }

        } catch (error) {
            console.error('Network or server error during registration:', error);
            registerMessage.textContent = 'An error occurred. Please try again.';
        }
    });
});