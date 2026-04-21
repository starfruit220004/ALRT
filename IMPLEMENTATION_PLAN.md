# Implementation Plan: Smart Alert System Fixes

This guide provides a step-by-step roadmap to resolve the technical disconnections identified in the [SYSTEM_ANALYSIS.md](./SYSTEM_ANALYSIS.md).

---

## Phase 1: Cleanup & Metadata (Immediate)
*Goal: Remove corrupted files and fix deployment metadata.*

### Step 1: Remove the Phantom Directory
The folder `ersadminSmart_AlertFrontendsrcadmin_pages` is a corrupted path string.
- **Action:** Delete this folder and its contents.
- **Why:** Prevents accidental editing of out-of-sync code.

### Step 2: Fix Backend Entry Point
- **Action:** Open `Backend/package.json`.
- **Change:** Update `"main": "index.js"` to `"main": "server.js"`.
- **Why:** Ensures that deployment platforms (Render, Vercel, PM2) can successfully start the service.

---

## Phase 2: Communication Synchronization (Critical)
*Goal: Ensure the Backend and Frontend are speaking the same "language."*

### Step 3: Implement Socket "Leave Room" Logic
The Frontend already attempts to leave rooms to prevent data leakage, but the Backend doesn't listen.
- **Action:** Open `Backend/server.js`.
- **Change:** Inside the `io.on('connection', ...)` block, add:
  ```javascript
  socket.on('leave_user_room', (userId) => {
    if (userId) {
      socket.leave(`user_${userId}`);
      console.log(`[Socket] User ${userId} left room`);
    }
  });
  ```
- **Why:** Prevents a user from receiving notifications intended for a previous session or a different account.

### Step 4: Fix MQTT Simulator Collisions
- **Action:** Open `Backend/simulator.js`.
- **Change:** Generate a unique `clientId` just like in `config/mqtt.js`:
  ```javascript
  const clientId = `Simulator_${Math.random().toString(16).slice(2, 8)}`;
  const client = mqtt.connect('mqtt://broker.hivemq.com:1883', { clientId });
  ```
- **Why:** Stops the HiveMQ broker from disconnecting the Backend every time the Simulator starts.

---

## Phase 3: Logic Hardening (Stability)
*Goal: Make the system more robust against environmental changes.*

### Step 5: Modernize Timezone Calculations
The current PHT calculation is "brittle" because it assumes the host is in UTC.
- **Action:** Refactor `isWithinSchedule` in `server.js` to use `toLocaleString`:
  ```javascript
  const phTimeStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" });
  const phDate = new Date(phTimeStr);
  const cur = phDate.getHours() * 60 + phDate.getMinutes();
  ```
- **Why:** This works correctly regardless of whether the server is hosted on Render (UTC), a local machine (PHT), or any other global region.

### Step 6: Verify Database & Prisma Sync
- **Action:** Run `npx prisma generate` in the `Backend` folder.
- **Action:** Review the `.sql` backup files. If they contain data missing from the live DB, use `npx prisma db push` to ensure the schema is in sync, then manually import missing records.
- **Why:** Ensures the data model in code matches the physical database structure.

---

## Phase 4: Verification & Testing
*Goal: Confirm all fixes are working as intended.*

1.  **Socket Test:** Log in as User A, open the dashboard. Log out and log in as User B. Verify that User B does **not** receive User A's door updates.
2.  **MQTT Test:** Run `node server.js` and `node simulator.js` simultaneously. Verify that both remain connected without "Connection Error" logs.
3.  **Schedule Test:** Set an alarm schedule for 5 minutes from "now" (PHT). Verify the alarm triggers only when the clock crosses that threshold.
