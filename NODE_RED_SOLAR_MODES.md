# Node-RED Solar Display Modi

Das `node-red-solar.js` Skript unterstützt verschiedene Anzeigemodi für die Splitflap-Anzeige.

## 🎛️ Verfügbare Modi

### 1. Normal-Modus (`'n'` oder `'normal'`)
Zeigt Batterie 1 & 2 an:
- **Line 1**: DateTime (automatisch)
- **Line 2**: Status (Charging/Connected)
- **Line 3**: Netz
- **Line 4**: Solar
- **Line 5**: Batterie 1
- **Line 6**: Batterie NOT

### 2. Alternativ-Modus (`'a'` oder `'alternativ'`)
Zeigt Auto & Batterie gesamt an:
- **Line 1**: DateTime (automatisch)
- **Line 2**: Status (Charging/Connected)
- **Line 3**: Netz
- **Line 4**: Solar
- **Line 5**: Auto (SoC)
- **Line 6**: Preis

### 3. Zeitbasiertes Umschalten (Zahl in Sekunden)
Wechselt automatisch zwischen Normal und Alternativ:
```javascript
msg.mode = 30;  // Wechselt alle 30 Sekunden
```
- **Line 1**: DateTime (automatisch)
- **Line 2-6**: Wechselt zwischen Normal und Alternativ

### 4. **NEU: Manuell-Modus (`'m'` oder `'manuell'`)** 🆕
Deaktiviert automatische Updates - Display wird nur über manuelle MQTT/API Nachrichten gesteuert:
- ⛔ **Keine automatischen Updates** basierend auf Variablen
- ⛔ **DateTime-Modus ist DEAKTIVIERT**
- ✅ Volle manuelle Kontrolle über MQTT oder HTTP API
- ✅ Ideal für benutzerdefinierte Nachrichten oder andere Use Cases

## 🔄 Modus-Steuerung

### Via Global Variable (höchste Priorität)
```javascript
global.set("displayMode", "manuell");  // Setzt Manuell-Modus
global.set("displayMode", "normal");   // Setzt Normal-Modus
global.set("displayMode", "alternativ"); // Setzt Alternativ-Modus
global.set("displayMode", 60);         // Wechselt alle 60 Sekunden
```

### Via Message Property
```javascript
msg.mode = "manuell";     // Manuell-Modus
msg.mode = "n";           // Normal-Modus
msg.mode = "a";           // Alternativ-Modus
msg.mode = 30;            // Zeitbasiert (30 Sek)
```

## 📡 DateTime-Verhalten

### Automatische Modi (Normal, Alternativ, Zeitbasiert)
- ✅ **DateTime ist AKTIVIERT**
- Line 1 zeigt automatisch Datum und Uhrzeit
- Format: `DD.MM.YYYY    HH:MM:SS`
- Aktualisiert sich jede Sekunde

### Manuell-Modus
- ⛔ **DateTime ist DEAKTIVIERT**
- Line 1 kann manuell gesetzt werden
- Keine automatischen Updates
- Volle Kontrolle über alle 6 Zeilen

## 🔌 Node-RED Integration

### Beispiel Flow-Konfiguration

#### 1. Modus über Inject-Node setzen
```javascript
// Inject Node 1 - Normal-Modus
msg.mode = "normal";
return msg;

// Inject Node 2 - Manuell-Modus
msg.mode = "manuell";
return msg;

// Inject Node 3 - Zeitbasiert (alle 45 Sekunden wechseln)
msg.mode = 45;
return msg;
```

#### 2. Function Node mit zwei Ausgängen
Das Skript gibt nun **zwei Nachrichten** zurück:
```javascript
return [datetimeMsg, displayMsg];
```

**Node-RED Flow Setup:**
```
[Inject/Sensor] → [Function: node-red-solar.js] → [Output 1] → [MQTT DateTime]
                                                  → [Output 2] → [MQTT Display]
```

**Verbindung:**
- **Output 1**: An MQTT-Node für DateTime-Steuerung (`splitflap/datetime`)
- **Output 2**: An MQTT-Node für Display-Content (`splitflap/display`)

#### 3. MQTT-Nachrichten

**Für DateTime (Output 1):**
```
Topic: splitflap/datetime
Payload: {"action":"datetime","enable":true}  // Automatische Modi
Payload: {"action":"datetime","enable":false} // Manuell-Modus
```

**Für Display (Output 2):**
```
Topic: splitflap/display
Payload: {
  "line2": "  Connected  ",
  "line3": "Netz        1.2k",
  "line4": "Solar       3.5k",
  "line5": "Batterie 1   85%",
  "line6": "Batterie NOT 90%"
}
```

## 🎨 Manuelle Steuerung im Manuell-Modus

### Via MQTT
```bash
# Modus auf Manuell setzen (über Node-RED oder direkt)
mosquitto_pub -t "splitflap/mode" -m "manuell"

# Dann manuell Content senden
mosquitto_pub -t "splitflap/display" \
  -m '{
    "line1": "CUSTOM MESSAGE",
    "line2": "LINE 2",
    "line3": "LINE 3",
    "line4": "LINE 4",
    "line5": "LINE 5",
    "line6": "LINE 6"
  }'

# Mit Farben
mosquitto_pub -t "splitflap/display" \
  -m '{
    "line1": "WARNUNG",
    "line2": "SYSTEM FEHLER",
    "line3": "BITTE PRUEFEN",
    "color1": "rot",
    "color2": "orange",
    "color3": "gelb"
  }'
```

### Via HTTP API
```bash
# Beliebigen Content setzen (im Manuell-Modus)
curl -X POST http://localhost:8001/api/display \
  -H "Content-Type: application/json" \
  -d '{
    "line1": "BENUTZERDEFINIERT",
    "line2": "NACHRICHT",
    "line3": "TEST 123",
    "line4": "",
    "line5": "",
    "line6": ""
  }'
```

## 💡 Use Cases

### Automatische Modi (Normal/Alternativ/Zeitbasiert)
- ✅ Permanente Solar-/Batterie-Überwachung
- ✅ Automatische Datenaktualisierung
- ✅ DateTime immer sichtbar
- ✅ Hands-free Betrieb

### Manuell-Modus
- ✅ Wartungsnachrichten anzeigen
- ✅ Alarme und Warnungen
- ✅ Benutzerdefinierte Ankündigungen
- ✅ Event-basierte Nachrichten
- ✅ Integration mit anderen Systemen
- ✅ Testing und Debugging
- ✅ Vollständige Kontrolle über alle Zeilen

## 🔧 Beispiel: Wechsel zwischen Modi

### Node-RED Flow
```
[Timer: 5min] → [Set Normal Mode] → [Function Node]
                                           ↓
[Button Press] → [Set Manual Mode] ←───────┘
                                           ↓
[MQTT Alert] → [Set Manual + Message] ←───┘
```

### Function Code für Modus-Wechsel
```javascript
// Automatisch zurück zu Normal nach Alert
global.set("displayMode", "manuell");

// Alert senden
msg.payload = {
    line1: "!!! ALARM !!!",
    line2: "BATTERIE FEHLER",
    line3: "SYSTEM GESTOPPT",
    color1: "rot",
    color2: "rot",
    color3: "orange"
};

// Nach 30 Sekunden zurück zu Normal
setTimeout(() => {
    global.set("displayMode", "normal");
}, 30000);

return msg;
```

## 📝 Hinweise

1. **Global Variable hat Vorrang**: `global.get("displayMode")` überschreibt `msg.mode`
2. **Standard ohne Modus**: Zeitbasiertes Umschalten alle 60 Sekunden
3. **DateTime in Line 1**: Wird automatisch in allen Modi außer Manuell angezeigt
4. **Zwei Outputs**: Das Skript gibt zwei Nachrichten zurück für DateTime und Display
5. **Manuell-Modus persistent**: Bleibt aktiv bis ein anderer Modus gesetzt wird

## 🔄 Migration von alter Version

Wenn Sie bereits einen Flow haben, müssen Sie:

1. **Zweiten Output hinzufügen**: Function Node hat jetzt 2 Ausgänge
2. **Output 1 verbinden**: Mit MQTT DateTime Topic (`splitflap/datetime`)
3. **Output 2 verbinden**: Mit MQTT Display Topic (`splitflap/display`)
4. **Optional**: Manuell-Modus für spezielle Nachrichten nutzen
