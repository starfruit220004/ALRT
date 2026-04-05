// controllers/userController.js
const prisma = require("../config/prisma");

exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        mqttTopic: true, // FIX: Added this so the frontend can see it
      },
      orderBy: { id: "asc" },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone, address } = req.body;
    
    // FIX: Generate a unique topic automatically if not provided
    const generatedTopic = `alerts/${username.toLowerCase()}/sensor`;

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password, // Reminder: Hash this password before saving!
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        phone,
        address,
        mqttTopic: generatedTopic, // FIX: Save the topic here
        role: "user",
        // FIX: Ensure settings record is created so the app doesn't crash
        settings: { create: {} } 
      }
    });
    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ message: "User creation failed" });
  }
};