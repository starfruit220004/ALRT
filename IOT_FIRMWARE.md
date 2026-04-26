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
board_build.partitions = default.csv
lib_deps = 
	knolleary/PubSubClient@^2.8
	bblanchon/ArduinoJson@^7.2.2
	tzapu/WiFiManager @ ^2.0.17

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
#include <time.h>

// ─────────────────────────────────────────
// CONFIGURATION & GLOBAL VARIABLES
// ─────────────────────────────────────────
char user_id_buffer[10] = "1";
bool shouldSaveConfig = false;

const char* SERVER_URL  = "https://alrt.onrender.com";
const char* MQTT_BROKER = "broker.hivemq.com";
const int   MQTT_PORT   = 1883;

// Your specific GPIO Pins
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
  Serial.println("[Portal] User changed settings, saving to memory...");
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
        if (!error) strcpy(user_id_buffer, doc["user_id"] | "1");
        configFile.close();
      }
    }
  }

  WiFiManager wm;
  wm.setSaveConfigCallback(saveConfigCallback);
  WiFiManagerParameter custom_user_id("user", "Enter User ID", user_id_buffer, 10);
  wm.addParameter(&custom_user_id);

  Serial.println("[WiFi] Starting Portal: ALRT_Setup_Portal...");
  if (!wm.autoConnect("ALRT_Setup_Portal")) {
    Serial.println("[WiFi] Connection failed. Restarting...");
    delay(3000);
    ESP.restart();
  }

  strcpy(user_id_buffer, custom_user_id.getValue());
  if (shouldSaveConfig) {
    File configFile = SPIFFS.open("/config.json", "w");
    if (configFile) {
      JsonDocument doc;
      doc["user_id"] = user_id_buffer;
      serializeJson(doc, configFile);
      configFile.close();
    }
  }

  USER_ID = String(user_id_buffer);
  Serial.println("[WiFi] Connected! Assigned USER_ID: " + USER_ID);
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
    Serial.printf("[Settings] Updated: Alarm=%d, SMS=%d\n", alarmEnabled, smsEnabled);
  } else {
    Serial.printf("[Settings] HTTP %d - Using cached values\n", code);
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
      Serial.println("[Phone] Fetched and Formatted: " + phoneNumber);
    }
  } else {
    Serial.printf("[Phone] HTTP %d - Using cached number\n", code);
  }
  http.end();
}

// ─────────────────────────────────────────
// GSM & SIGNAL HELPERS
// ─────────────────────────────────────────
bool waitForSIM800() {
  Serial.println("[SIM800] Checking module...");
  for (int i = 0; i < 10; i++) {
    sim800.println("AT");
    delay(500);
    if (sim800.available()) {
      String resp = sim800.readString();
      if (resp.indexOf("OK") >= 0) return true;
    }
  }
  return false;
}

bool isSimRegistered() {
  sim800.println("AT+CREG?");
  delay(1000);
  String resp = "";
  unsigned long start = millis();
  while (millis() - start < 2000) {
    if (sim800.available()) resp += sim800.readString();
  }
  return (resp.indexOf(",1") >= 0 || resp.indexOf(",5") >= 0);
}

void checkSignalStrength() {
  if (!sim800Ready) return;
  sim800.println("AT+CSQ");
  delay(500);
  if (sim800.available()) {
    String resp = sim800.readString();
    Serial.println("[GSM Signal Status] " + resp);
  }
}

// ─────────────────────────────────────────
// SMS ACTION (ROBUST HANDSHAKING)
// ─────────────────────────────────────────
void sendSMS(String msg) {
  if (!sim800Ready || !smsEnabled || phoneNumber == "" || phoneNumber == "null") {
    Serial.println("[SMS] Skipping: Hardware not ready or disabled by user.");
    return;
  }
  if (!isSimRegistered()) {
    Serial.println("[SMS] ERROR: No cellular network registration.");
    return;
  }

  Serial.println("[SMS] Sending alert to: " + phoneNumber);
  sim800.println("AT+CMGF=1");
  delay(100);
  while (sim800.available()) sim800.read(); // Clear serial buffer

  sim800.print("AT+CMGS=\"" + phoneNumber + "\"\r");

  // Wait for the '>' prompt (Handshake)
  unsigned long promptStart = millis();
  bool gotPrompt = false;
  while (millis() - promptStart < 5000) {
    if (sim800.available()) {
      if (sim800.read() == '>') {
        gotPrompt = true;
        delay(50);
        break;
      }
    }
  }

  if (!gotPrompt) {
    Serial.println("[SMS] ERROR: Module timed out waiting for '>' prompt.");
    return;
  }

  sim800.print(msg);
  delay(100);
  sim800.write(26); // Send Ctrl+Z

  // Confirmation handling
  unsigned long start = millis();
  String resp = "";
  while (millis() - start < 10000) {
    if (sim800.available()) resp += (char)sim800.read();
    if (resp.indexOf("+CMGS:") >= 0) {
      Serial.println("[SMS] SUCCESS: Message sent to network.");
      return;
    }
  }
  Serial.println("[SMS] FAILED: No confirmation from network. Response: " + resp);
}

// ─────────────────────────────────────────
// MQTT CALLBACK (INSTANT DASHBOARD UPDATES)
// ─────────────────────────────────────────
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String topicStr = String(topic);
  String payloadStr = "";
  for (unsigned int i = 0; i < length; i++) payloadStr += (char)payload[i];

  Serial.println("[MQTT] Received: " + topicStr + " -> " + payloadStr);

  if (topicStr == mqttSettingsTopic && payloadStr == "UPDATE") {
    Serial.println("[MQTT] Remote update triggered! Fetching new settings...");
    fetchSettings();
  }
}

void connectMQTT() {
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);

  int attempts = 0;
  while (!mqttClient.connected() && attempts < 5) {
    Serial.print("[MQTT] Connecting...");
    String clientId = "ESP32_ALRT_" + USER_ID + "_" + String(random(0xffff), HEX);
    if (mqttClient.connect(clientId.c_str())) {
      Serial.println(" connected!");
      mqttClient.subscribe(mqttSettingsTopic.c_str());
    } else {
      Serial.printf(" failed, rc=%d\n", mqttClient.state());
      attempts++;
      delay(2000);
    }
  }
}

// ─────────────────────────────────────────
// BUZZER & MAIN LOGIC
// ─────────────────────────────────────────
void playLoudSiren() {
  if (!alarmEnabled) {
    digitalWrite(BUZZER_PIN, LOW);
    return;
  }
  digitalWrite(BUZZER_PIN, HIGH);
  delay(100);
  digitalWrite(BUZZER_PIN, LOW);
  delay(50);
}

void setup() {
  Serial.begin(115200);
  pinMode(REED_PIN,   INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  sim800.begin(9600, SERIAL_8N1, SIM_RX, SIM_TX);
  delay(500); // Wait for SIM800L boot

  setupWiFiManager();

  mqttTopic         = "Smart_Alert/user_" + USER_ID + "/door";
  mqttSettingsTopic = "Smart_Alert/user_" + USER_ID + "/settings";

  sim800Ready = waitForSIM800();
  if (sim800Ready) {
    Serial.println("[HARDWARE] SIM800L Initialized Successfully.");
  } else {
    Serial.println("[HARDWARE] SIM800L Failed to respond. Check wiring/power.");
  }

  connectMQTT();
  fetchPhoneNumber();
  fetchSettings();

  lastDoorState = digitalRead(REED_PIN);
  Serial.println("[ALRT] SYSTEM ARMED AND READY");
}

void loop() {
  // Reconnect WiFi if lost
  if (WiFi.status() != WL_CONNECTED) {
    static unsigned long lastWiFiRetry = 0;
    if (millis() - lastWiFiRetry > 10000) {
      WiFi.begin();
      lastWiFiRetry = millis();
    }
  }

  if (!mqttClient.connected()) connectMQTT();
  mqttClient.loop();

  // Periodic System Refresh (15 Seconds)
  if (millis() - lastUpdate > 15000) {
    checkSignalStrength();
    fetchSettings();
    fetchPhoneNumber();
    lastUpdate = millis();
  }

  int doorState = digitalRead(REED_PIN);
  unsigned long now = millis();

  // Door State Change Detection
  if (doorState != lastDoorState && (now - lastPublishTime > PUBLISH_INTERVAL)) {
    lastPublishTime = now;
    if (doorState == HIGH) {
      Serial.println("[DOOR] STATUS: OPENED");
      mqttClient.publish(mqttTopic.c_str(), "OPEN", true);
      if (!smsSentForThisOpen) {
        sendSMS("ALRT: Door opened! Check your premises.");
        smsSentForThisOpen = true;
      }
    } else {
      Serial.println("[DOOR] STATUS: CLOSED");
      smsSentForThisOpen = false;
      digitalWrite(BUZZER_PIN, LOW);
      mqttClient.publish(mqttTopic.c_str(), "CLOSE", true);
    }
    lastDoorState = doorState;
  }

  // Active Alert Trigger
  if (doorState == HIGH) playLoudSiren();
  
  delay(5); 
}

