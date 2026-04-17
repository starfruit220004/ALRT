const prisma = require('../config/prisma');

// Activity Logs 
exports.getLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const logs = await prisma.doorLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(logs);
  } catch (err) {
    console.error('Error fetching activity logs:', err.message);
    res.status(500).json({ message: 'Server error fetching logs' });
  }
};

// SMS Logs
exports.getSmsLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const logs = await prisma.smsLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(logs);
  } catch (err) {
    console.error('Error fetching SMS logs:', err.message);
    res.status(500).json({ message: 'Server error fetching SMS logs' });
  }
};

// ADD THIS FUNCTION: Save SMS Log from ESP32
exports.saveSmsLog = async (req, res) => {
  try {
    const { user_id, status, message } = req.body;

    // 1. Insert into database
    const newLog = await prisma.smsLog.create({
      data: {
        userId: user_id,
        status,
        message,
      },
    });

    // 2. Emit via Socket.io so React updates the table immediately
    const io = req.app.get('socketio');
    if (io) {
      io.to(`user_${user_id}`).emit('sms_update', newLog);
    }

    res.json({ message: 'SMS log saved and broadcasted', log: newLog });
  } catch (err) {
    console.error('Error saving SMS log:', err.message);
    res.status(500).json({ error: 'Server error saving SMS log' });
  }
};

// Delete single Activity Log
exports.deleteLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await prisma.doorLog.deleteMany({
      where: {
        id: parseInt(id),
        userId,
      },
    });
    res.json({ message: 'Activity log deleted' });
  } catch (err) {
    console.error('Error deleting activity log:', err.message);
    res.status(500).json({ message: 'Server error deleting log' });
  }
};

//  Delete single SMS Log
exports.deleteSmsLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await prisma.smsLog.deleteMany({
      where: {
        id: parseInt(id),
        userId,
      },
    });
    res.json({ message: 'SMS log deleted' });
  } catch (err) {
    console.error('Error deleting SMS log:', err.message);
    res.status(500).json({ message: 'Server error deleting SMS log' });
  }
};