const mqtt = require('mqtt');

const userId = 5; // change this to test different users

const client = mqtt.connect('mqtt://broker.hivemq.com:1883');

client.on('connect', () => {
  console.log('Connected to broker');

  setInterval(() => {
    const statuses = ['OPEN', 'CLOSE', 'Alarm'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const topic = `Smart_Alert/user_${userId}/door`;
    client.publish(topic, status);
    console.log(` Published: ${topic} -> ${status}`);
  }, 3000);
});

client.on('error', (err) => {
  console.error('MQTT error:', err.message);
});