# Smart Alert System: Technical Analysis & Audit

This document provides a detailed summary of the "Smart Alert" IoT ecosystem, its architecture, and a breakdown of identified structural disconnections and bugs.

---

## 1. System Overview
The **Smart Alert** system is a real-time IoT monitoring platform designed to bridge physical hardware (door sensors) with a web-based management dashboard. It enables users to monitor security events, manage alarm schedules, and receive instant notifications.

### Core Architecture
- **Backend:** Node.js / Express.js
- **Real-time Engine:** Socket.io (WebSockets) & MQTT (HiveMQ Broker)
- **Database:** PostgreSQL with Prisma ORM
- **Frontend:** React 19 (Vite, Tailwind CSS, Lucide Icons)

---

## 2. Component Breakdown

### A. The Backend (The Hub)
The server acts as the central logic processor. It performs three primary roles:
1.  **MQTT Subscriber:** Listens for `Smart_Alert/user_X/door` messages from physical sensors.
2.  **State Manager:** Processes incoming IoT data, checks if the user's alarm schedule is active (using a Philippine Time offset), and saves logs to the database.
3.  **WebSocket Provider:** Pushes live updates to the frontend dashboard so users don't have to refresh the page.

### B. The Frontend (The Dashboard)
A modern SPA (Single Page Application) that provides:
1.  **Door Context:** A centralized state provider that manages real-time socket listeners and global sensor states.
2.  **Role-Based Access:** Separate dashboards for standard Users (viewing logs/settings) and Admins (CMS management and user auditing).
3.  **CMS (Content Management System):** Dynamic sections for the landing page (About, Services, Contact) managed via the Admin panel.

---

## 3. Disconnections & Critical Bugs

### 🛑 Path Corruption (Phantom Folder)
- **Issue:** A folder exists named `ersadminSmart_AlertFrontendsrcadmin_pages`.
- **Why it happened:** This is a **path concatenation error**. It likely occurred during a shell command (e.g., `cp` or `mv`) where variables were missing slashes, resulting in a single string being used as a directory name.
- **Impact:** This folder is a "ghost" copy of your admin pages. It creates confusion and risks "Code Drift" if developers edit the wrong files.

### 🛑 Entry Point Mismatch
- **Issue:** `Backend/package.json` lists `"main": "index.js"`, but the file is actually named `server.js`.
- **Impact:** Automated deployment tools (Render, Heroku, PM2) will fail to start the application because they cannot find the primary entry point.

### 🛑 Socket.io "Ghost" Subscriptions
- **Issue:** The Frontend sends a `leave_user_room` event when a user logs out, but the Backend has **no listener** for this event in `server.js`.
- **Why it happened:** The frontend logic was updated to improve security, but the backend was never synchronized.
- **Impact:** If a user logs out and another logs in on the same browser, the socket connection may still be receiving data from the previous user's room.

### 🛑 Hardcoded Timezone Logic
- **Issue:** The alarm schedule uses a hardcoded `+ 8 * 60 * 60 * 1000` offset for Philippine Time (PHT).
- **Impact:** This makes the system fragile. If the hosting server is moved to a region already set to PHT, or if daylight savings ever impacts the underlying UTC conversion, the alarm schedules will be incorrect by 8 hours.

### 🛑 MQTT Client ID Conflict
- **Issue:** `simulator.js` does not use a unique client ID, whereas `config/mqtt.js` does.
- **Impact:** Running the simulator and the backend simultaneously can cause the MQTT broker to repeatedly disconnect one of them, leading to intermittent "Offline" states and lost data.

### 🛑 Migration Disconnect
- **Issue:** The presence of multiple raw SQL files (`backup.sql`, `backup2.sql`, `missing_data.sql`) suggests a bypass of the Prisma Migration system.
- **Impact:** The `schema.prisma` file may not accurately represent the live database state, leading to "runtime schema mismatches" during complex queries.

---

## 4. Recommendations

1.  **Cleanup:** Delete the corrupted folder `ersadminSmart_AlertFrontendsrcadmin_pages`.
2.  **Standardize Entry:** Change `"main": "index.js"` to `"main": "server.js"` in `Backend/package.json`.
3.  **Sync WebSockets:** Add a `.on('leave_user_room', ...)` listener in `Backend/server.js` to handle clean disconnections.
4.  **Unique Simulation:** Update `simulator.js` to generate a unique `clientId` just like the main backend config.
5.  **Timezone Library:** Replace manual PHT math with a library like `luxon` or `date-fns-tz` for more robust scheduling.
