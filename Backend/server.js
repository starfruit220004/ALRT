// require('dotenv').config(); 
// const express = require('express');
// const cors = require('cors');
// const http = require('http');
// const { Server } = require('socket.io');

// // Import your routes
// const authRoutes = require('./routes/authRoutes');
// const dashboardRoutes = require('./routes/dashboardRoutes'); // Added this line
// const settingsRoutes = require('./routes/settingsRoutes');   // Added this line

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:5173",
//     methods: ["GET", "POST"]
//   }
// });

// app.use(cors());
// app.use(express.json());

// // Socket.io Logic
// io.on('connection', (socket) => {
//   console.log('A user connected:', socket.id);
//   socket.on('disconnect', () => console.log('User disconnected'));
// });

// // Link your routes to the app
// app.use('/api/auth', authRoutes);
// app.use('/api/dashboard', dashboardRoutes); // Added this line to stop 404 for /logs
// app.use('/api/settings', settingsRoutes);   // Added this line to stop 404 for /settings

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Import your routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes'); 
const settingsRoutes = require('./routes/settingsRoutes');   

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Socket.io Logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('disconnect', () => console.log('User disconnected'));
});

// Link your routes to the app
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes); 
app.use('/api/settings', settingsRoutes);   

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});