# CivicPulse AI

CivicPulse AI is a comprehensive, AI-powered municipal administration and citizen engagement platform. It bridges the gap between citizens reporting local issues and the authorities responsible for resolving them, while providing a powerful Super Admin dashboard for overarching system management and predictive analysis.

## 🚀 Features

*   **Anonymous Citizen Reporting:** Citizens can submit complaints about local infrastructure without needing to reveal their identity.
*   **Role-Based Access Control:** Distinct portals for **Citizens**, **Authorities** (Municipal Officers), and **Super Admins**.
*   **AI Insights Dashboard:** Integrated with Google Gemini 2.5 Flash for anomaly detection, fraud/spam filtering, and predictive analysis of infrastructure failure hotspots.
*   **Real-Time Updates:** Uses Socket.io to provide live updates across the platform (e.g., instant notifications when a complaint status changes).
*   **Interactive Maps:** Visual representation of complaints using geographical data.
*   **Vibrant, Themed UI:** Distinct visual themes for different panels (e.g., a dark orange aesthetic for the Super Admin zone) built with Tailwind CSS.

## 🛠️ Tech Stack

**Frontend:**
*   React.js
*   Vite
*   Tailwind CSS (Vanilla CSS for base styling)
*   Lucide React (Icons)
*   React Router DOM

**Backend:**
*   Node.js & Express.js
*   MongoDB & Mongoose
*   Socket.io
*   Google Generative AI SDK (Gemini 2.5 Flash)
*   JSON Web Tokens (JWT) for authentication

## 📂 Project Structure

```text
CivicPulseAi/
├── client/          # React Frontend application
│   ├── src/         # Source code (Components, Pages, Context, etc.)
│   └── package.json
├── server/          # Node.js/Express Backend application
│   ├── src/         # Controllers, Models, Routes, Middlewares
│   ├── .env         # Environment variables (API keys, DB URIs)
│   └── package.json
├── Credentials.md   # Login credentials for testing
└── README.md        # Project documentation
```

## ⚙️ Setup and Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd CivicPulseAi
   ```

2. **Backend Setup:**
   Navigate to the server directory and install dependencies:
   ```bash
   cd server
   npm install
   ```
   Ensure you have a `.env` file configured in the `server` directory with your MongoDB URI, JWT Secrets, Cloudinary keys, and your **Google Gemini API Key**.

3. **Frontend Setup:**
   Navigate to the client directory and install dependencies:
   ```bash
   cd ../client
   npm install
   ```

4. **Running the Application Locally:**
   Open two terminal windows.
   
   In Terminal 1 (Backend):
   ```bash
   cd server
   npm run dev
   ```
   
   In Terminal 2 (Frontend):
   ```bash
   cd client
   npm run dev
   ```

## 🔐 Default Testing Credentials

Please refer to `Credentials.md` in the root directory for the default login credentials for the Super Admin and Authority accounts.

## 🤖 AI Configuration

This project uses Google's **Gemini 2.5 Flash** for its AI Insights Dashboard. Ensure your `GEMINI_API_KEY` in the server's `.env` file is valid and has access to the generative language API.

---
*Built for smarter, more responsive local governance.*
