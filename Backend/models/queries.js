// ===============================
// DOOR LOG QUERIES
// ===============================

const INSERT_DOOR_LOG = `
  INSERT INTO door_logs (status)
  VALUES ($1)
  RETURNING *;
`;

const GET_ALL_LOGS = `
  SELECT * FROM door_logs
  ORDER BY created_at DESC;
`;

const GET_LATEST_STATUS = `
  SELECT * FROM door_logs
  ORDER BY created_at DESC
  LIMIT 1;
`;

const COUNT_TOTAL_OPEN = `
  SELECT COUNT(*) FROM door_logs
  WHERE status = 'open';
`;

const COUNT_TOTAL_CLOSE = `
  SELECT COUNT(*) FROM door_logs
  WHERE status = 'closed';
`;

const COUNT_TOTAL_ALARM = `
  SELECT COUNT(*) FROM door_logs
  WHERE status = 'alarm';
`;


// ===============================
// SETTINGS QUERIES
// ===============================

const GET_SETTINGS = `
  SELECT * FROM settings
  LIMIT 1;
`;

const UPDATE_ALARM = `
  UPDATE settings
  SET alarm_enabled = $1
  WHERE id = 1
  RETURNING *;
`;

const UPDATE_RESTRICTED_HOURS = `
  UPDATE settings
  SET start_time = $1,
      end_time = $2
  WHERE id = 1
  RETURNING *;
`;


// ===============================
// EXPORT ALL
// ===============================

module.exports = {
  INSERT_DOOR_LOG,
  GET_ALL_LOGS,
  GET_LATEST_STATUS,
  COUNT_TOTAL_OPEN,
  COUNT_TOTAL_CLOSE,
  COUNT_TOTAL_ALARM,
  GET_SETTINGS,
  UPDATE_ALARM,
  UPDATE_RESTRICTED_HOURS
};