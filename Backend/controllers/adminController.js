const prisma = require("../config/prisma");

// GET all users
exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        deactivatedAt: true,
      },
      orderBy: { id: "asc" },
    });
    res.json(users);
  } catch (err) {
    console.error("[Admin] Error fetching users:", err.message);
    res.status(500).json({ message: "Error fetching users" });
  }
};

// DELETE user (Permanent delete)
exports.deleteUser = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: "Invalid user ID" });

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Guard: Prevent deleting the last admin if necessary, or just proceed
    await prisma.user.delete({ where: { id } });
    
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("[Admin] Error deleting user:", err.message);
    res.status(500).json({ message: "Error deleting user" });
  }
};