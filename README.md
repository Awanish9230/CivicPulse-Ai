# 🏙️ CivicPulse AI

### AI-Powered Civic Complaint Management & Intelligent Municipal Response Platform

<p align="center">
  <strong>Report. Resolve. Rebuild Together.</strong>
</p>

<p align="center">
  CivicPulse AI empowers citizens to report local civic issues, track resolutions in real time, and connect with authorities through a transparent digital civic ecosystem.
</p>

<p align="center">
  <a href="https://github.com/Awanish9230/CivicPulse-Ai">
    <img src="https://img.shields.io/badge/GitHub-CivicPulse%20AI-181717?style=for-the-badge&logo=github" alt="GitHub">
  </a>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/AI-Gemini%20%2B%20Groq-8B5CF6?style=for-the-badge" alt="AI">
  <img src="https://img.shields.io/badge/Socket.IO-Real--Time-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.IO">
</p>

---

## 🎬 Project Demo

[![CivicPulse AI Demo](https://youtu.be/q6MfrdSDaZY)

**▶️ Watch the CivicPulse AI Demo**

## 📌 Overview

**CivicPulse AI** is a full-stack civic technology platform designed to bridge the gap between citizens and municipal authorities.

Instead of treating civic complaints as simple tickets, CivicPulse AI provides an end-to-end workflow for reporting, verification, assignment, resolution, and tracking.

```text
Citizen Report
      ↓
Evidence & Location
      ↓
Verification
      ↓
AI-Assisted Analysis
      ↓
Duplicate Detection
      ↓
Authority Review
      ↓
Department Assignment
      ↓
Field Resolution
      ↓
Resolution Verification
      ↓
Citizen Updates

The platform provides dedicated experiences for:

👤 Citizens
🏛️ Municipal Authorities
🛡️ Administrators
🚨 Problem Statement

Citizens regularly encounter civic problems such as:

🛣️ Potholes and damaged roads
💧 Water leakage
💡 Broken streetlights
🗑️ Garbage accumulation
🚰 Drainage issues
⚡ Electricity-related infrastructure problems
🏗️ Damaged public infrastructure

Traditional complaint systems often create a ticket without providing enough transparency around what happens afterward.

Citizens may not know:

Whether their complaint was verified
Who is responsible for solving it
Whether someone has been assigned
What stage the complaint is currently in
Whether similar complaints already exist
Whether the reported resolution was actually completed
What happens if the authority does not act
💡 Our Solution

CivicPulse AI creates a transparent digital bridge between citizens and authorities.

The platform allows citizens to:

Report civic issues
Upload supporting evidence
Provide location information
Track complaint progress
Receive real-time updates
Participate in community interactions

Authorities can:

Review complaints
Verify submitted evidence
Assign departments
Track progress
Review resolution evidence
Communicate with citizens

Administrators can:

Manage users
Manage authorities
Manage departments
Monitor complaints
Analyze civic activity
Manage the overall platform
✨ Key Features
👤 Citizen Portal

Citizens can:

Register and securely log in
Report civic issues
Upload supporting evidence
Select complaint categories
Provide location information
Track complaint status
View complaint history
Receive notifications
Participate in community discussions
View civic issues geographically
Monitor resolution progress
📝 Civic Complaint Management

Each complaint follows a structured lifecycle:

Submitted
    ↓
Verified
    ↓
Assigned
    ↓
In Progress
    ↓
Resolved
    ↓
Closed

Invalid complaints can follow a rejection workflow.

This gives citizens visibility into the complete journey of their complaint.

🤖 AI-Powered Civic Intelligence

CivicPulse AI integrates artificial intelligence into multiple parts of the platform.

🧠 Google Gemini

Gemini is used for AI-assisted functionality such as:

Complaint and image analysis
Translation-related functionality
Administrative insights
Resolution image verification
Civic data analysis
⚡ Groq

Groq-powered language model processing is used for toxicity and moderation-related analysis.

This helps maintain healthier community interactions.

📍 Intelligent Duplicate Detection

CivicPulse AI uses geographical information to identify potentially duplicate civic complaints.

When multiple citizens report problems in the same geographical area, the system can identify reports that may refer to the same underlying issue.

Example:

Citizen A ───────┐
                 │
Citizen B ───────┼────► Same Civic Issue
                 │
Citizen C ───────┤
                 │
Citizen D ───────┘

Instead of treating every report as an unrelated problem, the system can recognize geographical relationships between reports.

This can help authorities understand the actual scale of a civic issue.

⏱️ Automatic Complaint Escalation

CivicPulse AI includes automated escalation logic.

If a complaint remains inactive for a defined period, it can move through higher levels of authority.

Example:

Junior Authority
       │
       │ 48h inactivity
       ▼
Senior Authority
       │
       │ Continued unresolved issue
       ▼
Department / HOD

This reduces the possibility of complaints remaining unattended indefinitely.

🏛️ Authority Portal

Authorities have a dedicated operational dashboard.

Authorities can:

View incoming complaints
Review submitted evidence
Verify complaints
Reject invalid complaints
Assign complaints
Manage complaint progress
Track assigned work
Review resolution evidence
Verify completed work
Communicate with citizens
View analytics
Monitor civic performance
Authority Workflow
New Complaint
      ↓
Review Evidence
      ↓
Approve / Reject
      ↓
Assign Department
      ↓
Assign Field Worker
      ↓
Track Progress
      ↓
Review Resolution
      ↓
Verify Resolution
🛡️ Admin Portal

Administrators have system-level control over the platform.

Admin capabilities include:

User management
Authority management
Department management
Complaint management
Category management
Location management
Notifications
Broadcasts
Reports
Analytics
System monitoring
Security settings
Integrations
Administrative tools
🗺️ Geospatial Civic Intelligence

CivicPulse AI integrates interactive maps using Leaflet.

Geographical information allows the platform to:

Display civic issues on maps
Associate complaints with locations
Identify geographically related complaints
Provide authorities with location-aware information

Conceptually:

                    CITY MAP

        🔴 Road Issue

                       🟡 Garbage

    🟢 Streetlight

                  🔵 Water Issue

                            🔴 Drainage

This provides a geographical view of civic problems rather than only a list-based view.

⚡ Real-Time Communication

CivicPulse AI uses Socket.IO for real-time communication.

This supports functionality such as:

Real-time notifications
Messaging
Complaint updates
Citizen-authority communication
Live activity updates

The basic communication flow is:

Backend Event
      ↓
Socket.IO
      ↓
Connected Client
      ↓
UI Update
🔔 Notifications

Citizens and authorities can receive updates related to complaint activity.

Examples include:

Complaint verification
Complaint assignment
Status changes
Resolution updates
System notifications
Communication updates
👥 Role-Based Architecture

CivicPulse AI is organized around three primary roles.

Citizen
Register
   ↓
Login
   ↓
Report Issue
   ↓
Track Complaint
   ↓
Receive Updates
   ↓
Resolution
Authority
Login
   ↓
Review
   ↓
Verify
   ↓
Assign
   ↓
Resolve
   ↓
Verify Resolution
Admin
Login
   ↓
Manage Platform
   ↓
Manage Users
   ↓
Manage Authorities
   ↓
Manage Departments
   ↓
Analytics
   ↓
Monitoring
🌙 Dark Mode

CivicPulse AI supports a persistent light/dark theme system.

Features include:

🌙 Dark mode
☀️ Light mode
💾 Persistent theme preference
🖥️ System theme detection
🎨 Separate light and dark color palettes
👤 Citizen portal support
🏛️ Authority portal support
🛡️ Admin portal support
📝 Dark form controls
🔔 Dark notification surfaces
🗺️ Dark map controls

The selected theme is stored locally so that the preference remains after refreshing the application.

🧠 Theme Architecture
                 ThemeToggle
                      │
                      ▼
                 applyTheme()
                      │
             ┌────────┴────────┐
             ▼                 ▼
       LIGHT_COLORS        DARK_COLORS
             │                 │
             └────────┬────────┘
                      ▼
               CSS Variables
                      │
                      ▼
                Application UI
🏗️ System Architecture
                         ┌─────────────────────┐
                         │       CITIZEN       │
                         │                     │
                         │ Report / Track /    │
                         │ Community / Map     │
                         └──────────┬──────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────┐
│                    REACT + VITE                         │
│                                                         │
│ Citizen Portal │ Authority Portal │ Admin Portal       │
└───────────────────────────┬─────────────────────────────┘
                            │
                      REST / Socket.IO
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                 NODE.JS + EXPRESS                       │
│                                                         │
│ Authentication │ Complaints │ Authority │ Admin         │
│ Notifications  │ Messages   │ Petitions │ Appeals       │
└───────────────┬─────────────────────┬───────────────────┘
                │                     │
                ▼                     ▼
        ┌───────────────┐      ┌─────────────────┐
        │    MongoDB    │      │   AI SERVICES   │
        │               │      │                 │
        │ Users         │      │ Gemini          │
        │ Complaints    │      │ Groq            │
        │ Authorities   │      │ AI Analysis     │
        │ Notifications │      │ Moderation      │
        └───────────────┘      └─────────────────┘
🔄 End-to-End Data Flow
Citizen
   │
   │ Submit Complaint
   ▼
React Frontend
   │
   │ REST API
   ▼
Express Backend
   │
   ├──────────────► MongoDB
   │
   ├──────────────► AI Services
   │
   ├──────────────► Notification System
   │
   └──────────────► Socket.IO
                         │
                         ▼
                  Authority Dashboard
                         │
                         ▼
                    Field Worker
                         │
                         ▼
                  Resolution Evidence
                         │
                         ▼
                 Authority Verification
                         │
                         ▼
                     Citizen
🧰 Technology Stack
Frontend
Technology	Purpose
React 19	User interface
Vite	Development and build tooling
React Router	Application routing
Redux Toolkit	State management
Tailwind CSS 4	Styling
Leaflet	Interactive maps
Recharts	Data visualization
Framer Motion	UI animations
Socket.IO Client	Real-time communication
Axios	API communication
Backend
Technology	Purpose
Node.js	JavaScript runtime
Express.js	REST API
MongoDB	Database
Mongoose	MongoDB ODM
JWT	Authentication
bcrypt	Password hashing
Socket.IO	Real-time communication
Multer	File uploads
Cloudinary	Media storage
AI
Technology	Purpose
Google Gemini	AI-assisted civic analysis
Groq	AI moderation
AI workflows	Intelligent civic processing
📁 Project Structure
CivicPulse-Ai/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   ├── notifications/
│   │   │   └── ...
│   │   │
│   │   ├── context/
│   │   ├── pages/
│   │   ├── theme/
│   │   │   ├── applyTheme.js
│   │   │   └── colors.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── public/
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── app.js
│   └── package.json
│
├── .gitignore
└── README.md
🔐 Security

CivicPulse AI incorporates several security mechanisms:

JWT-based authentication
Password hashing using bcrypt
Role-based authorization
Protected backend routes
Authentication middleware
Environment-based secrets
User-scoped resources
Server-side authorization
Environment Variables

Sensitive values should always be stored in environment variables.

Never commit:

.env
API keys
JWT secrets
Database credentials
Cloudinary credentials
SMTP credentials
🚀 Getting Started
Prerequisites

Make sure the following are installed:

Node.js
npm
MongoDB
Git
1. Clone the Repository
git clone https://github.com/Awanish9230/CivicPulse-Ai.git
cd CivicPulse-Ai
2. Install Backend Dependencies
cd server
npm install
3. Configure Backend Environment

Create:

server/.env

Configure the required backend environment variables.

For local development, MongoDB can run locally.

Example:

PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/civicpulse
JWT_SECRET=your_local_secret

Add the remaining AI, media, email, notification, and integration credentials required by the features you enable.

4. Start Backend
cd server
npm run dev

Backend:

http://localhost:5000

Health endpoint:

http://localhost:5000/api/health
5. Install Frontend Dependencies

Open another terminal:

cd CivicPulse-Ai/client
npm install
6. Configure Frontend Environment

Create:

client/.env

Example:

VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_VAPID_PUBLIC_KEY=
7. Start Frontend
cd client
npm run dev -- --host

Open:

http://localhost:5173
🧪 Production Build

To create a production build:

cd client
npm run build

The generated production files will be available inside:

client/dist/
🧪 Development Workflow

A typical local development environment uses two terminals.

Terminal 1 — Backend
cd server
npm run dev
Terminal 2 — Frontend
cd client
npm run dev -- --host

Then open:

http://localhost:5173
📊 Complaint Lifecycle

The core civic workflow can be represented as:

┌──────────────┐
│   Submitted  │
└──────┬───────┘
       ▼
┌──────────────┐
│   Verified   │
└──────┬───────┘
       ▼
┌──────────────┐
│   Assigned   │
└──────┬───────┘
       ▼
┌──────────────┐
│ In Progress  │
└──────┬───────┘
       ▼
┌──────────────┐
│   Resolved   │
└──────┬───────┘
       ▼
┌──────────────┐
│    Closed    │
└──────────────┘

This lifecycle provides a structured path from citizen reporting to final resolution.

🏆 Hackathon Highlights

CivicPulse AI combines several technologies into one civic workflow:

🤖 Artificial Intelligence

AI-assisted analysis, moderation, and civic intelligence.

📍 Geospatial Intelligence

Location-aware complaint management and duplicate detection.

⚡ Real-Time Communication

Socket.IO-powered notifications and communication.

📊 Analytics

Dashboards for understanding complaint and civic activity.

🏛️ Governance Workflow

Citizen → Authority → Field Worker → Citizen.

🔐 Secure Authentication

JWT authentication, bcrypt password hashing, and role-based authorization.

🌙 Modern User Experience

Responsive interfaces with persistent light/dark themes.

💡 Core Value Proposition

CivicPulse AI is designed to answer more than:

"Did someone report a problem?"

It creates a workflow around:

What is the problem?
        ↓
Where is it?
        ↓
Is it potentially duplicated?
        ↓
Who should handle it?
        ↓
What is its current status?
        ↓
Has someone been assigned?
        ↓
Has the work been completed?
        ↓
Can the resolution be verified?
        ↓
Can the citizen see the progress?

This transforms civic reporting into a more complete issue-to-resolution workflow.

🔮 Future Roadmap

Potential future improvements include:

📱 Native mobile application
🧠 Advanced civic prediction models
🗺️ City-wide civic heatmaps
📊 Advanced SLA analytics
🔔 Intelligent notification prioritization
🌐 Multi-city deployment
🗣️ Expanded Indian language support
🔎 Advanced complaint clustering
📷 Improved computer-vision-based verification
☁️ Large-scale cloud deployment
📜 Extended audit and compliance capabilities
👥 Team
CivicPulse AI

A hackathon-focused civic technology project built to improve transparency, communication, and accountability between citizens and municipal authorities.

🔗 Repository

GitHub:
https://github.com/Awanish9230/CivicPulse-Ai

📄 License

Add the project's selected license here.

<p align="center">
🏙️ CivicPulse AI
Your City. Your Voice. Your Action.
</p> ```
