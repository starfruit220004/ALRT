const prisma = require('../config/prisma');

exports.receiveDoorData = async (req, res) => {
    try {
        const { status, userId } = req.body;
        // Grab the socket.io instance attached in server.js
        const io = req.app.get("socketio");

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const id = parseInt(userId, 10);

        // 1. Log the door activity
        const savedLog = await prisma.doorLog.create({
            data: {
                status: status,
                userId: id
            }
        });

        // 2. Immediate Real-time UI update
        if (io) {
            io.to(`user_${id}`).emit("door_update", savedLog);
        }

        // 3. Fetch user settings
        const settings = await prisma.settings.findUnique({
            where: { userId: id }
        });

        if (!settings) {
            return res.status(404).json({ error: 'Settings not found' });
        }

        // 4. Alarm & SMS Logic (Matches your server.js MQTT logic)
        if (status === 'OPEN' || status === 'Opened') {
            // Create SMS Log
            const smsLog = await prisma.smsLog.create({ 
                data: { status, userId: id } 
            });
            if (io) io.to(`user_${id}`).emit("sms_update", smsLog);

            if (settings.alarmEnabled) {
                console.log(`[ALARM] Triggered for User ${id}`);
                
                // Optional: Log the alarm event as a separate door log entry
                await prisma.doorLog.create({
                    data: { status: "Alarm", userId: id }
                });

                if (io) {
                    io.to(`user_${id}`).emit("trigger_alarm", { status, user_id: id });
                }
            }
        }

        res.json({ message: 'Door data processed and broadcasted' });

    } catch (err) {
        console.error("IoT Data Error:", err);
        res.status(500).json({ error: 'Server error processing IoT data' });
    }
};