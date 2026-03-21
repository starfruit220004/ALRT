// Backend/controllers/cmsController.js
const pool = require('../config/db');

const getCms = async (req, res) => {
  try {
    const { section } = req.query;

    const query = section
      ? 'SELECT section, key, value FROM cms WHERE section = $1 ORDER BY key'
      : 'SELECT section, key, value FROM cms ORDER BY section, key';
    const params = section ? [section] : [];

    const result = await pool.query(query, params);

    const grouped = {};
    result.rows.forEach(({ section, key, value }) => {
      if (!grouped[section]) grouped[section] = {};
      grouped[section][key] = value;
    });

    res.json(section ? (grouped[section] || {}) : grouped);
  } catch (err) {
    console.error('getCms error:', err.message);
    res.status(500).json({ message: 'Failed to fetch CMS content' });
  }
};

const updateCms = async (req, res) => {
  const { section, updates } = req.body;

  if (!section || !updates || typeof updates !== 'object') {
    return res.status(400).json({ message: 'section and updates are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const [key, value] of Object.entries(updates)) {
      await client.query(
        // ✅ no quotes, all lowercase — matches exact DB column name
        `INSERT INTO cms (section, key, value, updatedat)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (section, key) DO UPDATE SET value = $3, updatedat = NOW()`,
        [section, key, value]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'CMS updated successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('updateCms error:', err.message);
    res.status(500).json({ message: 'Failed to update CMS content' });
  } finally {
    client.release();
  }
};

module.exports = { getCms, updateCms };