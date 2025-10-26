// dynamic-qr-frontend/admin.js
import { isLoggedIn, isAdmin, getAuthHeaders, clearAuthData, redirectToLoginIfNotAuthenticated, redirectToHomeIfNotAdmin } from './authUtils.js';

document.addEventListener('DOMContentLoaded', async () => {
    redirectToLoginIfNotAuthenticated(); // Protect this page
    redirectToHomeIfNotAdmin(); // Ensure only admins can access

    const BACKEND_URL = 'http://localhost:5000'; // Match backend URL

    // --- Navigation Bar Logic ---
    const adminLinkLi = document.getElementById('admin-link-li');
    const loginLinkLi = document.getElementById('login-link-li');
    const logoutLinkLi = document.getElementById('logout-link-li');
    const logoutBtn = document.getElementById('logout-btn');

    if (isLoggedIn()) {
        loginLinkLi.style.display = 'none';
        logoutLinkLi.style.display = 'block';
        if (isAdmin()) { // Should always be true here due to redirectToHomeIfNotAdmin
            adminLinkLi.style.display = 'block';
        }
    }

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        clearAuthData();
        window.location.href = 'login.html';
    });

    // --- Create Event Form Logic ---
    const createEventForm = document.getElementById('create-event-form');
    const eventTitleInput = document.getElementById('event-title');
    const eventDescriptionInput = document.getElementById('event-description');
    const eventDateInput = document.getElementById('event-date');
    const eventLocationInput = document.getElementById('event-location');
    const createEventMessage = document.getElementById('create-event-message');

    createEventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        createEventMessage.textContent = '';
        createEventMessage.style.color = 'red';

        const newEvent = {
            title: eventTitleInput.value,
            description: eventDescriptionInput.value,
            date: eventDateInput.value, // ISO string for datetime-local
            location: eventLocationInput.value
        };

        try {
            const response = await fetch(`${BACKEND_URL}/api/events`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(newEvent)
            });
            const data = await response.json();

            if (response.ok) {
                createEventMessage.style.color = 'green';
                createEventMessage.textContent = data.message;
                createEventForm.reset(); // Clear form
                loadManageEvents(); // Reload event list
                loadUserRegistrations(); // Reload registrations (if new event affects them)
            } else {
                createEventMessage.textContent = data.message || 'Failed to create event.';
            }
        } catch (error) {
            console.error('Error creating event:', error);
            createEventMessage.textContent = 'An error occurred. Check console.';
        }
    });

    // --- Manage Events Table Logic (Read, Update, Delete) ---
    const manageEventsTableBody = document.getElementById('manage-events-table').querySelector('tbody');
    const loadingManageEventsMessage = document.getElementById('loading-manage-events-message');

    async function loadManageEvents() {
        loadingManageEventsMessage.textContent = 'Loading events for management...';
        try {
            const response = await fetch(`${BACKEND_URL}/api/events`, {
                headers: getAuthHeaders() // Admins can get all events
            });
            const events = await response.json();

            if (response.status === 401 || response.status === 403) { clearAuthData(); redirectToLoginIfNotAuthenticated(); return; }


            manageEventsTableBody.innerHTML = ''; // Clear previous entries
            loadingManageEventsMessage.textContent = ''; // Clear loading message

            if (events.length === 0) {
                manageEventsTableBody.innerHTML = '<tr><td colspan="5">No events to manage yet. Create one above!</td></tr>';
                return;
            }

            for (const event of events) {
                const row = manageEventsTableBody.insertRow();
                row.dataset.eventId = event._id;

                // Fetch associated QR code
                let shortUrl = '';
                try {
                    const qrResponse = await fetch(`${BACKEND_URL}/api/qr-links/event/${event._id}`);
                    const qrData = await qrResponse.json();
                    if (qrResponse.ok && qrData.shortUrl) {
                        shortUrl = qrData.shortUrl;
                    } else {
                        shortUrl = `${BACKEND_URL}/events/${event._id}`; // Fallback
                    }
                } catch (qrError) {
                    console.warn(`Could not fetch QR for event ${event._id}:`, qrError);
                    shortUrl = `${BACKEND_URL}/events/${event._id}`; // Fallback
                }

                row.innerHTML = `
                    <td><input type="text" value="${event.title}" class="edit-title"></td>
                    <td><input type="datetime-local" value="${new Date(event.date).toISOString().slice(0, 16)}" class="edit-date"></td>
                    <td><input type="text" value="${event.location}" class="edit-location"></td>
                    <td>
                        <div class="qr-code-small" id="qr-admin-${event._id}"></div>
                        <small><a href="${shortUrl}" target="_blank">${shortUrl.substring(0,25)}...</a></small>
                    </td>
                    <td>
                        <button class="edit-btn" data-id="${event._id}">Edit</button>
                        <button class="save-btn" data-id="${event._id}" style="display:none;">Save</button>
                        <button class="delete-btn" data-id="${event._id}">Delete</button>
                    </td>
                `;

                // Generate small QR code
                new QRCode(document.getElementById(`qr-admin-${event._id}`), {
                    text: shortUrl,
                    width: 60,
                    height: 60,
                    colorDark : "#000000",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.L // Low correction for small QR
                });
            }

            attachManageEventButtonListeners(); // Attach listeners after loading
        } catch (error) {
            console.error('Error loading events for management:', error);
            loadingManageEventsMessage.textContent = 'Failed to load events for management.';
        }
    }

    function attachManageEventButtonListeners() {
        manageEventsTableBody.querySelectorAll('.edit-btn').forEach(button => {
            button.onclick = (e) => toggleEditRow(e.target.closest('tr'), true);
        });
        manageEventsTableBody.querySelectorAll('.save-btn').forEach(button => {
            button.onclick = (e) => saveEvent(e.target.dataset.id, e.target.closest('tr'));
        });
        manageEventsTableBody.querySelectorAll('.delete-btn').forEach(button => {
            button.onclick = (e) => deleteEvent(e.target.dataset.id);
        });
    }

    function toggleEditRow(row, isEditMode) {
        row.querySelectorAll('input').forEach(input => {
            input.readOnly = !isEditMode;
            input.style.border = isEditMode ? '1px solid #007bff' : '1px solid transparent';
        });
        row.querySelector('.edit-btn').style.display = isEditMode ? 'none' : 'inline-block';
        row.querySelector('.save-btn').style.display = isEditMode ? 'inline-block' : 'none';
    }

    async function saveEvent(eventId, row) {
        const title = row.querySelector('.edit-title').value;
        const date = row.querySelector('.edit-date').value;
        const location = row.querySelector('.edit-location').value;
        // For simplicity, description is not editable directly in table, would need a modal.
        // Fetch current description or make it editable. For now, we'll send current.
        // Let's assume description remains same or is fetched if needed.

        // To send description for update, you'd need to retrieve it.
        // For this example, let's just make it required for update but assume it's pre-filled or handled via full form
        // Or add a hidden input if it's not visible for direct edit.
        // For now, let's get the original description by re-fetching the event, or simplifying.
        // A better way would be to have a "view/edit full details" button.
        // For this simple inline edit, we'll assume description is not edited here.
        // If you want to edit description, you'd need to add it to the table row as an input/textarea.

        alert("Full event edit will need a dedicated modal/form. This inline edit only handles title, date, location. Description won't be updated from here.");

        try {
            const response = await fetch(`${BACKEND_URL}/api/events/${eventId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ title, date, location }) // Assuming description is not changed here
            });
            const data = await response.json();
            if (response.ok) {
                alert('Event updated successfully!');
                toggleEditRow(row, false); // Switch back to view mode
                loadManageEvents(); // Reload to refresh data
            } else {
                alert(data.message || 'Failed to update event.');
            }
        } catch (error) {
            console.error('Error saving event:', error);
            alert('An error occurred while saving event.');
        }
    }

    async function deleteEvent(eventId) {
        if (!confirm('Are you sure you want to delete this event and its associated QR codes?')) {
            return;
        }
        try {
            const response = await fetch(`${BACKEND_URL}/api/events/${eventId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                loadManageEvents(); // Reload the list
                loadUserRegistrations(); // Update registrations list
            } else {
                alert(data.message || 'Failed to delete event.');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('An error occurred while deleting event.');
        }
    }

    // --- NEW: Custom QR Code Generator Logic (Moved from script.js) ---
    const qrInput = document.getElementById('qr-input');
    const generateBtn = document.getElementById('generate-btn');
    const qrCodeContainer = document.getElementById('qr-code-container');
    const shortUrlDisplay = document.getElementById('short-url-display');
    const shortUrlLink = document.getElementById('short-url-link');
    const updateShortcodeInput = document.getElementById('update-shortcode-input');
    const newContentInput = document.getElementById('new-content-input');
    const updateBtn = document.getElementById('update-btn');
    const updateMessage = document.getElementById('update-message');

    let qrcodeInstance = null; // To store the QR code instance for clearing

    generateBtn.addEventListener('click', async () => {
        const originalContent = qrInput.value.trim();

        if (!originalContent) {
            alert('Please enter some content to generate a dynamic QR code.');
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/generate-dynamic-qr`, {
                method: 'POST',
                headers: getAuthHeaders(), // Use auth headers as this is an admin function now
                body: JSON.stringify({ originalContent })
            });

            const data = await response.json();

            if (response.ok) {
                const shortUrl = data.shortUrl;
                const shortCode = data.shortCode;

                qrCodeContainer.innerHTML = '';
                shortUrlDisplay.style.display = 'none';
                shortUrlLink.href = '#';
                shortUrlLink.textContent = '';

                if (qrcodeInstance) { qrcodeInstance.clear(); qrcodeInstance = null; }
                qrcodeInstance = new QRCode(qrCodeContainer, {
                    text: shortUrl,
                    width: 200,
                    height: 200,
                    colorDark : "#000000",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.H
                });

                shortUrlLink.href = shortUrl;
                shortUrlLink.textContent = shortUrl;
                shortUrlDisplay.style.display = 'block';

                updateShortcodeInput.value = shortCode;
                newContentInput.value = originalContent;
                updateMessage.textContent = '';

            } else {
                alert(data.error || 'Failed to generate dynamic QR code.');
            }

        } catch (error) {
            console.error('Error generating dynamic QR:', error);
            alert('An error occurred while connecting to the server.');
        }
    });

    updateBtn.addEventListener('click', async () => {
        const shortCode = updateShortcodeInput.value.trim();
        const newContent = newContentInput.value.trim();

        if (!shortCode || !newContent) {
            alert('Both Short Code and New Content are required to update.');
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/update-dynamic-qr/${shortCode}`, {
                method: 'PUT',
                headers: getAuthHeaders(), // Use auth headers as this is an admin function now
                body: JSON.stringify({ newContent })
            });

            const data = await response.json();

            if (response.ok) {
                updateMessage.style.color = 'green';
                updateMessage.textContent = data.message;
            } else {
                updateMessage.style.color = 'red';
                updateMessage.textContent = data.error || 'Failed to update content.';
            }
        } catch (error) {
            console.error('Error updating QR content:', error);
            updateMessage.style.color = 'red';
            updateMessage.textContent = 'An error occurred while connecting to the server.';
        }
    });

    qrInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            generateBtn.click();
        }
    });
    // --- END NEW: Custom QR Code Generator Logic ---


    // --- User Registrations Overview Logic ---
    const userRegistrationsList = document.getElementById('user-registrations-list');
    const loadingRegistrationsMessage = document.getElementById('loading-registrations-message');

    async function loadUserRegistrations() {
        loadingRegistrationsMessage.textContent = 'Loading user registrations...';
        try {
            const response = await fetch(`${BACKEND_URL}/api/users/admin/registered-events`, {
                headers: getAuthHeaders() // Admin only route
            });
            const eventsWithRegistrations = await response.json();

            if (response.status === 401 || response.status === 403) { clearAuthData(); redirectToLoginIfNotAuthenticated(); return; }

            userRegistrationsList.innerHTML = ''; // Clear previous
            loadingRegistrationsMessage.textContent = ''; // Clear loading message

            if (eventsWithRegistrations.length === 0) {
                userRegistrationsList.innerHTML = '<p>No events with registered users found yet.</p>';
                return;
            }

            eventsWithRegistrations.forEach(event => {
                const eventDiv = document.createElement('div');
                eventDiv.className = 'admin-event-registration-item';
                eventDiv.innerHTML = `
                    <h3>${event.title} (${new Date(event.date).toLocaleDateString()})</h3>
                    <p><strong>Registered Users:</strong></p>
                    <ul>
                        ${event.registeredUsers && event.registeredUsers.length > 0
                            ? event.registeredUsers.map(user => `<li>${user.username}</li>`).join('')
                            : '<li>No users registered yet.</li>'
                        }
                    </ul>
                `;
                userRegistrationsList.appendChild(eventDiv);
            });

        } catch (error) {
            console.error('Error loading user registrations:', error);
            loadingRegistrationsMessage.textContent = 'Failed to load user registrations.';
        }
    }

    // Load data on page load
    loadManageEvents();
    loadUserRegistrations();
});