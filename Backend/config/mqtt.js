// config/mqtt.js
const mqtt = require("mqtt");

const brokerUrl = process.env.MQTT_BROKER || "mqtt://broker.hivemq.com:1883";
// FIX: Ensure clientId is truly unique to prevent the broker from kicking the backend off
const clientId = `SmartAlert_Backend_${Date.now()}_${Math.random().toString(16).slice(2, 5)}`;

const mqttClient = mqtt.connect(brokerUrl, {
  clientId,
  clean: true,
  reconnectPeriod: 5000,
  connectTimeout: 30000, // Increased timeout for stability
});

mqttClient.on("connect", () => {
  console.log(`🚀 Shared MQTT client connected: ${clientId}`);
});

mqttClient.on("error", (err) => {
  console.error("❌ MQTT Connection Error:", err.message);
});

// FIX: Added 'offline' listener to track network issues
mqttClient.on("offline", () => {
  console.warn("⚠️ MQTT Client is offline. Check your internet or broker status.");
});

module.exports = mqttClient;