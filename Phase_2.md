# Phase 2: Citizen Portal (Deferred)

This module handles the core anonymous reporting features and will be implemented later.

## Requirements

### Authentication
*   No Email Password
*   JWT, Refresh Token, Device Token
*   Anonymous Identity: This is the heart of the platform.
*   Never expose Name, Email, Profile Photo, Phone, UID, IP, Anything.
*   Generate randomly (e.g., Citizen-X9K8A, Citizen-MP71Q).
*   Every 30 minutes Generate New Anonymous ID.
*   Example: 9:00 AM (Citizen-KY81Q), 9:30 AM (Citizen-MT56L).
*   There must be Zero relationship between Previous ID & Next ID.
*   Cannot predict. Only backend stores encrypted mapping. Nobody can see it. Even moderators.

### Complaint Creation
*   User clicks Raise Complaint.
*   Camera opens directly. No Gallery Upload. Real-time capture only.
*   After click Automatically capture: GPS, Latitude, Longitude, Accuracy, Timestamp, Device Direction, Photo Metadata.
*   Reverse Geocoding: Ward, District, Pin Code.
*   Fraud Prevention: Reject Old Image, Edited Image, Screenshot, Gallery Image, Location Disabled, GPS Spoofing, Fake Metadata, VPN Abuse (optional).

### Complaint Form
*   Issue Type, Photo, Voice Note, Description, Location, Priority, Anonymous Submit.

### AI Complaint Categorization
*   Automatically classify: Road, Electricity, Garbage, Water, Drainage, Traffic, Illegal Dumping, Street Light, Construction, Animal, Others.

### Duplicate Detection
*   Before saving Search Nearby 50 meters, Same Category, Same Time.
*   If duplicate Merge Instead of creating New Complaint.
*   Display: "12 Citizens already reported this issue. Join Existing Complaint".
*   Complaint Count increases. Authority sees One Complaint (Support Count = 12).

### Complaint Status
*   Submitted -> Verified -> Assigned -> In Progress -> Resolved -> Closed.
*   Strict SLA: If 48 Hours No Action, Complaint Card turns Red (Displays Pending Since 2 Days).
*   72 Hours Escalation: Auto notify supervisor.

### Live Tracking
*   User can see Assigned Department, Officer, Expected Completion, Timeline, Updates, Images after repair, Completion Proof.

### Push Notifications
*   Complaint Received, Complaint Verified, Assigned, In Progress, Resolved, Rejected, Escalated.
