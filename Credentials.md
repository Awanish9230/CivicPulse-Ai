# CivicPulse AI - Default Testing Credentials

These are the default credentials configured for accessing the different dashboard zones during local development and testing.

## Super Admin Portal (`/admin`)
The Super Admin is responsible for system-wide monitoring, managing authority accounts, and sending global broadcasts.
*   **Username:** `admin`
*   **Password:** `your_secure_admin_password`
*(Note: These match the exact values currently set in your `server/.env` file)*

## Authority Dashboard (`/authority`)
Authorities (Municipal Officers, Supervisors, Commissioners) use these credentials to access their role-specific dashboard to manage assigned complaints and view analytics.
*   **Email:** `officer@city.gov`
*   **Password:** `admin123`
*   **Role:** Officer
*   **Department:** General / Roads

---
> **Security Note:** Do not use these credentials in a production environment. Ensure you change the Super Admin password in your `.env` file before deploying.
