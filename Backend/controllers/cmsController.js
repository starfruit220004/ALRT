const prisma = require("../config/prisma");

const getCms = async (req, res) => {
  try {
    const { section } = req.query;
    const rows = await prisma.cMS.findMany({
      where: section ? { section } : undefined,
    });

    const grouped = {};
    rows.forEach((row) => {
      if (!grouped[row.section]) grouped[row.section] = {};
      grouped[row.section][row.key] = row.value;
    });

    res.json(section ? (grouped[section] || {}) : grouped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateCms = async (req, res) => {
  const { section, updates } = req.body;
  try {
    // We use a transaction to ensure all fields update or none do
    await prisma.$transaction(
      Object.entries(updates).map(([key, value]) =>
        prisma.cMS.upsert({
          where: { section_key: { section, key } },
          update: { value: String(value) },
          create: { section, key, value: String(value) },
        })
      )
    );

    // Return the updated object so the frontend state stays perfectly in sync
    res.json({ message: "Updated successfully", data: updates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
};

module.exports = { getCms, updateCms };