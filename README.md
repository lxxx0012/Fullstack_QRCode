# Fullstack_QRCode

# QR Code Redirector

A full-stack web application that generates QR codes linked to dynamic URLs. When scanned, 
each QR code redirects users to the most recent URL associated with it. Built with Node.js, 
Express, MongoDB, and React.

## 🔗 Features

- Generate QR codes for unique IDs
- Store and manage multiple URLs per QR code
- Redirect users to the latest URL in the list
- Mobile-friendly QR code scanning and redirection
- Frontend preview with embedded QR image

## 🧰 Tech Stack

| Layer     | Technology                          |
|-----------|--------------------------------------|
| Frontend  | React.js, HTML/CSS                  |
| Backend   | Node.js, Express.js                 |
| Database  | MongoDB with Mongoose ODM           |
| QR Code   | [api.qrserver.com](https://goqr.me/api/) |
| Hosting   | Localhost (e.g., `192.168.11.34`)   |

## 🚀 Getting Started

### Prerequisites

- Node.js and npm
- MongoDB running locally or via Atlas
- React development environment

### Backend Setup

```bash
cd backend
npm install
npm start

cd backend
npm install
npm start
