# CivicPulse AI

**AI-Powered Civic Complaint Management & Transparent Municipal Response Platform**  
*Empowering citizens to report, track, and resolve community infrastructure issues in real time.*

---

## Project Demo
[Watch the CivicPulse AI Demo Video](https://youtu.be/q6MfrdSDaZY)

---

## The Problem & Our Solution

Traditional municipal complaint portals are often black holes: tickets get filed, but citizens rarely receive visibility into verification, department assignment, or resolution proof. Meanwhile, municipal authorities are flooded with duplicate reports and lack automated triaging.

CivicPulse AI turns civic complaints into a transparent, collaborative, and automated ecosystem:

```
[ Citizen Report ] ---> [ AI Triaging & Translation ] ---> [ Geo-Deduplication (50m) ]
                                                                     |
[ Citizen Tracking & Proof ] <--- [ Field Resolution ] <--- [ Department Assignment ]
```

---

## Core Engineering Highlights

### 1. Privacy-First Identity Rotation (Whistleblower Protection)
* Citizens submit complaints using a cryptographically generated pseudonym (`CP-XXXX`).
* The identity is encrypted at rest using AES-256-GCM with keys derived via scrypt.
* Citizens can rotate their identity at any time. The public and municipal officials only see decoupled pseudonyms, while the user preserves seamless continuity over past complaints.

### 2. AI-Assisted Triaging & Auto-Translation (Gemini + Groq)
* **Auto-Translation**: Multilingual complaints are automatically translated to standard English for city officials while retaining original text.
* **Smart Categorization & Severity Detection**: AI models classify category, emergency level, and suggest the responsible municipal department.
* **AI Content Moderation**: Automatically flags toxicity or spam before publishing to community feeds.

### 3. Geo-Spatial Deduplication (50-Meter Radius)
* Utilizes MongoDB `$near` geospatial queries (2dsphere index).
* If a similar issue is reported within 50 meters, the platform merges the report, upvotes the existing issue, and boosts its priority instead of creating redundant work orders.

### 4. Real-Time Lifecycle & SLA Escalation
* **Socket.IO Event Streams**: Push instant status updates, chats, and notification badges directly to citizen and authority dashboards.
* **Automated Escalation Cron**: Background workers monitor resolution SLAs. Overdue complaints automatically escalate up the authority chain (Junior -> Senior -> HOD).

### 5. Progressive Web App (PWA) & Offline-First Sync
* Full offline capability with service workers and local data synchronization when connectivity drops in the field.

---

## Three Dedicated Portals

| Portal | Key Capabilities |
| :--- | :--- |
| **Citizen Portal** | Geo-tagged issue reporting, camera capture, live complaint tracker, anonymous identity rotation, community upvoting, petitions, and appeals. |
| **Municipal Authority** | Department task queues, interactive geospatial maps, official resolution evidence uploads, citizen messaging, and workload analytics. |
| **Super Admin** | Centralized city analytics, department & officer management, API key rotation manager, audit logging, and system health monitors. |

---

## System Architecture

```
+---------------------------------------------------------+
|                 Client (React 19 + Vite)                |
|    Redux Toolkit * Tailwind CSS * Leaflet * Socket.io   |
+----------------------------+----------------------------+
                             | REST / WebSockets
+----------------------------v----------------------------+
|             Server (Node.js + Express.js)               |
|               Modular Monolith Architecture             |
|   |-- User & Auth (AES-256-GCM Identity Manager)        |
|   |-- Complaint & Geo-Deduplication ($near queries)     |
|   |-- Real-Time Gateway (Socket.IO)                     |
|   `-- Background SLA Escalation (Node-Cron)             |
+-------+--------------------+--------------------+-------+
        |                    |                    |
+-------v------+     +-------v------+     +-------v------+
|   MongoDB    |     |   Gemini /   |     |  Cloudinary  |
|  (Geospatial |     |   Groq AI    |     |   (Media     |
|   2dsphere)  |     |  (NLP & OCR) |     |  Storage)    |
+--------------+     +--------------+     +--------------+
```

---

## Tech Stack

* **Frontend:** React 19, Vite, Tailwind CSS, Redux Toolkit, Framer Motion, Leaflet, Lucide Icons.
* **Backend:** Node.js, Express.js (Modular Monolith), Socket.IO, Winston Logger.
* **Database:** MongoDB Atlas (Mongoose with 2dsphere Geospatial Indexing).
* **AI & Cloud Services:** Google Gemini API, Groq LLM, Cloudinary (Media Optimization), Brevo (Email Delivery), WebPush.

---

## Quick Start Guide

### Prerequisites
* Node.js (v18+)
* MongoDB Atlas or local MongoDB instance

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Awanish9230/CivicPulse-Ai.git
cd CivicPulse-Ai

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Configuration

Create `.env` files in both `server/` and `client/` directories based on the provided `.env.example` templates:

**`server/.env`**:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_jwt_access_secret
REFRESH_TOKEN_SECRET=your_jwt_refresh_secret
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

**`client/.env`**:
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Run Locally
```bash
# Start Backend (from server/ folder)
npm run dev

# Start Frontend (from client/ folder)
npm run dev
```

---

## License
This project is open-source and available under the [MIT License](LICENSE).
