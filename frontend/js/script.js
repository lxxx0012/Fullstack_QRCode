// dynamic-qr-frontend/script.js
import { isLoggedIn, isAdmin, getAuthHeaders, clearAuthData } from './authUtils.js';

document.addEventListener('DOMContentLoaded', async () => {
    const BACKEND_URL = 'http://localhost:5000'; // Make sure this matches your backend PORT

    // --- Navigation Bar Logic ---
    const adminLinkLi = document.getElementById('admin-link-li');
    const loginLinkLi = document.getElementById('login-link-li');
    const logoutLinkLi = document.getElementById('logout-link-li');
    const logoutBtn = document.getElementById('logout-btn');
    const userLinkLi = document.getElementById('user-link-li'); // Corrected: Get the user link element

    if (isLoggedIn()) {
        loginLinkLi.style.display = 'none';
        logoutLinkLi.style.display = 'block';
        userLinkLi.style.display = 'block'; // Corrected: Show user link if logged in
        if (isAdmin()) {
            adminLinkLi.style.display = 'block';
        }
    }

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        clearAuthData();
        window.location.href = 'login.html'; // Redirect to login after logout
    });

    // --- All Events Display Logic (on Index Page) ---
    // Ensure the div ID in index.html is 'featured-events-list' as per previous instructions.
    const eventsListDiv = document.getElementById('featured-events-list');

    async function loadAllEventsForIndexPage() {
        eventsListDiv.innerHTML = '<p id="loading-events-message">Loading all events...</p>'; // Initial loading message

        try {
            const response = await fetch(`${BACKEND_URL}/api/events`);
            const events = await response.json();

            eventsListDiv.innerHTML = ''; // Clear loading message

            if (events.length === 0) {
                eventsListDiv.innerHTML = '<p>No events to display yet. Check back soon!</p>';
                return;
            }

            // Display ALL events fetched (removed .slice(0,3))
            for (const event of events) {
                let shortUrl = `${BACKEND_URL}/events/${event._id}`; // Default fallback URL

                // Fetch the associated QR code for this event
                try {
                    const qrResponse = await fetch(`${BACKEND_URL}/api/qr-links/event/${event._id}`);
                    const qrData = await qrResponse.json();
                    if (qrResponse.ok && qrData.shortUrl) {
                        shortUrl = qrData.shortUrl;
                    }
                } catch (qrError) {
                    console.warn(`Could not fetch QR for event ${event._id}:`, qrError);
                }

                const eventDiv = document.createElement('div');
                eventDiv.className = 'event-item event-with-qr';
                // Corrected template literals and <a> tag href
                eventDiv.innerHTML = `
                    <h3>${event.title}</h3>
                    <p><strong>Description:</strong> ${event.description}</p>
                    <p><strong>When:</strong> ${new Date(event.date).toLocaleDateString()} at ${new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p><strong>Where:</strong> ${event.location}</p>
                    <div class="qr-code-display" id="qr-event-${event._id}"></div>
                    <p class="qr-link-text">Scan for details or visit: <a href="${shortUrl}" target="_blank">${shortUrl}</a></p>
                `;
                eventsListDiv.appendChild(eventDiv);

                // Generate QrCode inside the dedicated div
                // Corrected getElementById typo and template literal for ID
                new QRCode(document.getElementById(`qr-event-${event._id}`), {
                    text: shortUrl,
                    width: 120,
                    height: 120,
                    colorDark : "#000000",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.H
                });
            }

        } catch (error) {
            console.error('Error loading all events for index page:', error);
            eventsListDiv.innerHTML = '<p class="error-message">Failed to load events. Please try again later.</p>';
        }
    }

    loadAllEventsForIndexPage(); // Call this function on page load
});