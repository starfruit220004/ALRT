# IoT Firmware Configuration

This file contains the hardware source code and configuration for the Smart Alert system.

## platformio.ini
PlatformIO Project Configuration File
;
;   Build options: build flags, source filter
;   Upload options: custom upload port, speed and extra flags
;   Library options: dependencies, extra library storages
;   Advanced options: extra scripting
;
; Please visit documentation for the other options and examples
; https://docs.platformio.org/page/projectconf.html

[env:esp32doit-devkit-v1]
platform = espressif32
board = esp32doit-devkit-v1
framework = arduino
monitor_speed = 115200
lib_deps = 
	knolleary/PubSubClient@^2.8
	bblanchon/ArduinoJson@^7.2.2
	tzapu/WiFiManager @ ^2.0.17
	board_build.partitions = default.csv

## main.cpp
#include <Arduino.h>
#include <HardwareSerial.h>
#include <WiFi.h>
#include <WiFiManager.h>
#include <FS.h>
#include <SPIFFS.h>
#include <PubSubClient.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiClientSecure.h>

// ─────────────────────────────────────────
// CONFIGURATION & GLOBAL VARIABLES
// ─────────────────────────────────────────
char user_id_buffer[10] = "1";
bool shouldSaveConfig = false;

const char* SERVER_URL  = "https://alrt.onrender.com";
const char* MQTT_BROKER = "broker.hivemq.com";
const int   MQTT_PORT   = 1883;

// Pins (Unchanged as requested)
#define REED_PIN   4
#define BUZZER_PIN 23
#define SIM_RX     16
#define SIM_TX     17

HardwareSerial  sim800(1); 
WiFiClient      espClient;
WiFiClientSecure secureClient;
PubSubClient    mqttClient(espClient);

String USER_ID;
String phoneNumber = "";
String mqttTopic;
String mqttSettingsTopic;

bool alarmEnabled = true;
bool smsEnabled   = true;
bool sim800Ready  = false;

int  lastDoorState       = HIGH;
bool smsSentForThisOpen  = false;
unsigned long lastPublishTime = 0;
unsigned long lastUpdate      = 0;

const long PUBLISH_INTERVAL = 500;

// ─────────────────────────────────────────
// PHONE NUMBER FORMAT HELPER
// ─────────────────────────────────────────
String formatPhoneNumber(String raw) {
  raw.trim();
  if (raw.length() < 7) return ""; 
  if (raw.startsWith("+")) return raw;
  if (raw.startsWith("09") && raw.length() == 11) {
    return "+63" + raw.substring(1);
  }
  if (raw.startsWith("9") && raw.length() == 10) {
    return "+63" + raw;
  }
  return raw; 
}

// ─────────────────────────────────────────
// WIFI MANAGER & STORAGE (SPIFFS)
// ─────────────────────────────────────────
void saveConfigCallback() {
  Serial.println("[Portal] Config changed, will save to SPIFFS.");
  shouldSaveConfig = true;
}

void setupWiFiManager() {
  if (!SPIFFS.begin(true)) {
    Serial.println("[SPIFFS] Mount Failed");
  } else {
    if (SPIFFS.exists("/config.json")) {
      File configFile = SPIFFS.open("/config.json", "r");
      if (configFile) {
        JsonDocument doc;
        DeserializationError error = deserializeJson(doc, configFile);
        if (!error) {
          const char* savedId = doc["user_id"];
          if (savedId) strncpy(user_id_buffer, savedId, sizeof(user_id_buffer));
        }
        configFile.close();
      }
    }
  }

  WiFiManager wm;
  wm.setSaveConfigCallback(saveConfigCallback);
  
  // ── CUSTOM QR SCANNER HTML ──
  // This adds a "Scan QR" button directly into the WiFi setup page
  const char* qr_script = "<script>"
    "window.onload = function() {"
    "  var btn = document.createElement('button');"
    "  btn.innerHTML = '📷 Scan QR Code from Profile';"
    "  btn.style.width='100%'; btn.style.padding='15px'; btn.style.margin='10px 0'; btn.style.background='#1d4ed8'; btn.style.color='white'; btn.style.border='none'; btn.style.borderRadius='10px'; btn.style.fontWeight='bold';"
    "  btn.onclick = async function(e) {"
    "    e.preventDefault();"
    "    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });"
    "    const video = document.createElement('video');"
    "    video.srcObject = stream; video.setAttribute('playsinline', true); video.play();"
    "    document.body.appendChild(video);"
    "    const detector = new BarcodeDetector({ formats: ['qr_code'] });"
    "    const interval = setInterval(async () => {"
    "      const barcodes = await detector.detect(video);"
    "      if (barcodes.length > 0) {"
    "        const url = barcodes[0].rawValue;"
    "        const id = new URLSearchParams(url.split('?')[1]).get('user_id');"
    "        if (id) {"
    "          document.getElementById('user').value = id;"
    "          stream.getTracks().forEach(t => t.stop());"
    "          video.remove(); clearInterval(interval);"
    "          alert('User ID Linked: ' + id);"
    "        }"
    "      }"
    "    }, 500);"
    "  };"
    "  document.querySelector('form').prepend(btn);"
    "};</script>";
  
  wm.setCustomHeadElement(qr_script);

  WiFiManagerParameter custom_user_id("user", "User ID", user_id_buffer, 10);
  wm.addParameter(&custom_user_id);

  if (!wm.autoConnect("ALRT_Setup_Portal")) {
    Serial.println("[WiFi] Connection failed.");
    delay(3000);
    ESP.restart();
  }

  String rawInput = String(custom_user_id.getValue());
  rawInput.trim();
  strncpy(user_id_buffer, rawInput.c_str(), sizeof(user_id_buffer));

  if (shouldSaveConfig) {
    File configFile = SPIFFS.open("/config.json", "w");
    if (configFile) {
      JsonDocument doc;
      doc["user_id"] = user_id_buffer;
      serializeJson(doc, configFile);
      configFile.close();
      Serial.println("[SPIFFS] User ID saved successfully.");
    }
  }

  USER_ID = String(user_id_buffer);
  
  // Dynamic Topic Generation based on the ID we just got/cleaned
  mqttTopic         = "Smart_Alert/user_" + USER_ID + "/door";
  mqttSettingsTopic = "Smart_Alert/user_" + USER_ID + "/settings";

  Serial.println("[WiFi] Connected! Target Backend: " + String(SERVER_URL));
  Serial.println("[WiFi] Assigned USER_ID: " + USER_ID);
}

// ─────────────────────────────────────────
// HTTP DATA FETCHING (API)
// ─────────────────────────────────────────
void fetchSettings() {
  if (WiFi.status() != WL_CONNECTED) return;
  secureClient.setInsecure();
  HTTPClient http;
  String url = String(SERVER_URL) + "/api/settings/" + USER_ID;
  http.begin(secureClient, url);
  http.setTimeout(10000);

  int code = http.GET();
  if (code == 200) {
    JsonDocument doc;
    deserializeJson(doc, http.getString());
    alarmEnabled = doc["alarmEnabled"] | true;
    smsEnabled   = doc["smsEnabled"]   | true;
    Serial.printf("[Settings] Sync OK: Alarm=%s, SMS=%s\n", alarmEnabled?"ON":"OFF", smsEnabled?"ON":"OFF");
  } else {
    Serial.printf("[Settings] Error %d (Server might be sleeping)\n", code);
  }
  http.end();
}

void fetchPhoneNumber() {
  if (WiFi.status() != WL_CONNECTED) return;
  secureClient.setInsecure();
  HTTPClient http;
  String url = String(SERVER_URL) + "/api/auth/phone/" + USER_ID;
  http.begin(secureClient, url);
  http.setTimeout(10000);

  int code = http.GET();
  if (code == 200) {
    JsonDocument doc;
    deserializeJson(doc, http.getString());
    const char* phone = doc["phone"];
    if (phone && strlen(phone) > 0) {
      phoneNumber = formatPhoneNumber(String(phone));
      Serial.println("[Phone] Target Number: " + phoneNumber);
    } else {
      Serial.println("[Phone] WARNING: No phone number found for this User ID!");
    }
  }
  http.end();
}

// ─────────────────────────────────────────
// GSM HELPERS
// ─────────────────────────────────────────
bool waitForSIM800() {
  for (int i = 0; i < 10; i++) {
    sim800.println("AT");
    delay(500);
    if (sim800.available()) {
      if (sim800.readString().indexOf("OK") >= 0) return true;
    }
  }
  return false;
}

bool isSimRegistered() {
  sim800.println("AT+CREG?");
  delay(500);
  String resp = sim800.readString();
  return (resp.indexOf(",1") >= 0 || resp.indexOf(",5") >= 0);
}

// ─────────────────────────────────────────
// SMS ACTION
// ─────────────────────────────────────────
void sendSMS(String msg) {
  if (!sim800Ready) {
    Serial.println("[SMS] FAILED: SIM800L hardware not found.");
    return;
  }
  if (!smsEnabled || phoneNumber == "" || phoneNumber == "null") {
    Serial.println("[SMS] SKIPPED: SMS is disabled in dashboard or no phone number.");
    return;
  }
  if (!isSimRegistered()) {
    Serial.println("[SMS] FAILED: No Network Signal.");
    return;
  }

  Serial.println("[SMS] Sending Alert to " + phoneNumber + "...");
  sim800.println("AT+CMGF=1");
  delay(200);
  sim800.print("AT+CMGS=\"" + phoneNumber + "\"\r");
  
  unsigned long start = millis();
  bool prompt = false;
  while(millis() - start < 3000) {
    if(sim800.available() && sim800.read() == '>') {
      prompt = true; 
      break;
    }
  }

  if(!prompt) {
    Serial.println("[SMS] FAILED: SIM800L did not respond to send command.");
    return;
  }

  sim800.print(msg);
  sim800.write(26); // Ctrl+Z
  Serial.println("[SMS] Sent to Network.");
}

// ─────────────────────────────────────────
// MQTT CALLBACK
// ─────────────────────────────────────────
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String payloadStr = "";
  for (unsigned int i = 0; i < length; i++) payloadStr += (char)payload[i];

  if (String(topic) == mqttSettingsTopic && payloadStr == "UPDATE") {
    Serial.println("[MQTT] Remote settings change detected! Syncing...");
    fetchSettings();
    fetchPhoneNumber();
  }
}

void connectMQTT() {
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);

  if (!mqttClient.connected()) {
    Serial.print("[MQTT] Connecting to Cloud Broker...");
    String clientId = "ESP32_ALRT_" + USER_ID + "_" + String(random(0xffff), HEX);
    if (mqttClient.connect(clientId.c_str())) {
      Serial.println(" Connected!");
      mqttClient.subscribe(mqttSettingsTopic.c_str());
    } else {
      Serial.printf(" Failed (rc=%d)\n", mqttClient.state());
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(REED_PIN,   INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // Initialize GSM
  sim800.begin(9600, SERIAL_8N1, SIM_RX, SIM_TX);
  
  // WiFi & User ID Setup
  setupWiFiManager();

  // Hardware Check
  sim800Ready = waitForSIM800();
  if (sim800Ready) Serial.println("[HW] SIM800L: Ready.");
  else             Serial.println("[HW] SIM800L: ERROR (Check Wiring).");

  // Initial Sync
  fetchPhoneNumber();
  fetchSettings();
  connectMQTT();

  lastDoorState = digitalRead(REED_PIN);
  Serial.println("[SYSTEM] Armed and Online.");
}

void loop() {
  // 1. Maintain WiFi Connection
  if (WiFi.status() != WL_CONNECTED) {
    static unsigned long lastRetry = 0;
    if (millis() - lastRetry > 15000) {
      WiFi.begin(); 
      lastRetry = millis();
    }
  }

  // 2. Maintain MQTT Connection
  if (WiFi.status() == WL_CONNECTED && !mqttClient.connected()) {
    static unsigned long lastMqttRetry = 0;
    if (millis() - lastMqttRetry > 10000) {
      connectMQTT();
      lastMqttRetry = millis();
    }
  }
  mqttClient.loop();

  // 3. Periodic Background Sync (Every 30 seconds)
  if (millis() - lastUpdate > 30000) {
    fetchSettings();
    fetchPhoneNumber();
    lastUpdate = millis();
  }

  // 4. Door Logic
  int doorState = digitalRead(REED_PIN);
  unsigned long now = millis();

  if (doorState != lastDoorState && (now - lastPublishTime > PUBLISH_INTERVAL)) {
    lastPublishTime = now;
    if (doorState == HIGH) { // OPENED
      Serial.println("[EVENT] Door Opened!");
      mqttClient.publish(mqttTopic.c_str(), "OPEN", true);
      if (!smsSentForThisOpen) {
        sendSMS("ALRT: Door opened at your premises!");
        smsSentForThisOpen = true;
      }
    } else { // CLOSED
      Serial.println("[EVENT] Door Closed.");
      mqttClient.publish(mqttTopic.c_str(), "CLOSE", true);
      smsSentForThisOpen = false;
      digitalWrite(BUZZER_PIN, LOW);
    }
    lastDoorState = doorState;
  }

  // 5. Siren Logic
  if (doorState == HIGH && alarmEnabled) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(100);
    digitalWrite(BUZZER_PIN, LOW);
    delay(100);
  } else {
    digitalWrite(BUZZER_PIN, LOW);
  }
  
  delay(10); 
}

