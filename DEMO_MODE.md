# 🎬 Demo-Modus mit Farben

Der Demo-Modus zeigt jetzt eine farbige Flughafen-Sequenz mit 5 verschiedenen Szenen.

## 🚀 MQTT-Befehle

### Einfachster Befehl
```bash
mosquitto_pub -t "splitflap/demo" -m ""
```

### Alternative über Command-Topic
```bash
mosquitto_pub -t "splitflap/command" -m '{"action":"demo"}'
```

### Mit Broker-Authentifizierung
```bash
mosquitto_pub -h mqtt.example.com -u username -P password \
  -t "splitflap/demo" -m ""
```

## 🎨 Demo-Sequenz

Die Demo zeigt eine 5-stufige Flughafen-Sequenz mit Farben:

### Szene 1: Flughafen Info (5 Sekunden)
```
FLUGHAFEN       (blau)
MUENCHEN        (hellblau)
TERMINAL 2      (gruen)
ABFLUG          (orange)
GATE A15        (gelb)
12:30           (gruen)
```

### Szene 2: Boarding (5 Sekunden)
```
LH 441          (blau)
NACH FRANKFURT  (hellblau)
BOARDING NOW    (orange)
GATE B7         (gelb)
PÜNKTLICH       (gruen)
                (weiß)
```

### Szene 3: Verspätung (5 Sekunden)
```
AIR FRANCE      (blau)
NACH PARIS      (hellblau)
VERSPAETUNG     (rot)
+25 MINUTEN     (rot)
GATE C3         (orange)
14:45           (gelb)
```

### Szene 4: Letzter Aufruf (5 Sekunden)
```
LUFTHANSA       (blau)
NACH BERLIN     (hellblau)
LETZTER AUFRUF  (orange)
GATE A2         (gelb)
SOFORT          (rot)
                (weiß)
```

### Szene 5: Abschied (5 Sekunden)
```
GUTEN FLUG      (gruen)
AUF WIEDERSEHEN (hellblau)
DANKE           (violett)
SCHÖNEN TAG     (rosa)
                (weiß)
                (weiß)
```

## 🔧 HTTP API

```bash
# Via REST API
curl -X POST http://localhost:8001/api/demo
```

## 💻 JavaScript API

```javascript
// Im Browser oder via iframe
window.splitflapAPI.demo();
```

## 📡 Node-RED

### Inject Node
```json
{
  "topic": "splitflap/demo",
  "payload": ""
}
```

### Function Node
```javascript
msg.topic = "splitflap/demo";
msg.payload = "";
return msg;
```

## ⏱️ Timing

- **Modus**: Endlosschleife (läuft dauerhaft)
- **Pro Szene**: 5 Sekunden
- **Szenen**: 5
- **Schleife**: Beginnt nach Szene 5 wieder bei Szene 1

## 🎯 Use Cases

- **Präsentationen**: Zeigen Sie die Farbfunktionen
- **Testing**: Testen Sie alle Farben gleichzeitig
- **Showroom**: Beeindrucken Sie Besucher
- **Debugging**: Überprüfen Sie die Funktionalität
- **Training**: Lernen Sie die Farbpalette kennen

## 🔄 Endlos-Modus

Die Demo läuft **automatisch endlos** in einer Schleife:
- Szene 1 → Szene 2 → Szene 3 → Szene 4 → Szene 5 → zurück zu Szene 1
- Läuft kontinuierlich bis sie gestoppt wird
- Kein erneutes Senden erforderlich

## 🎨 Farb-Bedeutungen in der Demo

- **Blau/Hellblau**: Airline/Fluginformationen
- **Grün**: Positive Status (pünktlich, OK)
- **Orange**: Aufmerksamkeit (Boarding, Letzter Aufruf)
- **Gelb**: Zeitangaben, Gates
- **Rot**: Warnung (Verspätung, Sofort)
- **Violett/Rosa**: Freundliche Verabschiedung

## 💡 Eigene Demo erstellen

Sie können die Demo-Sequenz auch manuell nachbauen:

```bash
# Szene 1
mosquitto_pub -t "splitflap/display" -m '{
  "lines": ["FLUGHAFEN","MUENCHEN","TERMINAL 2","ABFLUG","GATE A15","12:30"],
  "colors": ["blau","hellblau","gruen","orange","gelb","gruen"]
}'

# Warten Sie 5 Sekunden, dann Szene 2
sleep 5
mosquitto_pub -t "splitflap/display" -m '{
  "lines": ["LH 441","NACH FRANKFURT","BOARDING NOW","GATE B7","PÜNKTLICH",""],
  "colors": ["blau","hellblau","orange","gelb","gruen",null]
}'

# Etc...
```

## 🛑 Demo stoppen

Die Demo läuft **endlos** bis sie explizit gestoppt wird durch:

### 1. Clear-Befehl
```bash
mosquitto_pub -t "splitflap/clear" -m ""
```

### 2. Eigenen Content setzen
```bash
mosquitto_pub -t "splitflap/display" -m '{
  "line1": "DEMO GESTOPPT",
  "line2": "NORMAL BETRIEB"
}'
```

### 3. Andere API-Befehle
Jeder dieser Befehle stoppt automatisch die Demo:
- `/api/display` - Setzt eigenen Content
- `/api/clear` - Löscht Display
- `/api/datetime` - Aktiviert DateTime-Modus
- `window.splitflapAPI.setDisplay()` - JavaScript API
- `window.splitflapAPI.clear()` - JavaScript Clear

**Die Demo stoppt automatisch bei jedem neuen Befehl!**

## 📝 Hinweise

1. **Endlosschleife**: Demo läuft kontinuierlich bis gestoppt
2. **Automatisches Stoppen**: Jeder andere Befehl stoppt die Demo
3. **Animation**: Jede Szene animiert mit Flip-Effekten
4. **Sound**: Authentische Klick-Sounds bei jeder Änderung
5. **Farben**: Automatisch auf jede Zeile angewendet
6. **DateTime**: Wird während der Demo deaktiviert
7. **Neustart**: Einfach Demo-Befehl erneut senden

## 🔗 Siehe auch

- [COLOR_EXAMPLES.md](./COLOR_EXAMPLES.md) - Detaillierte Farb-Beispiele
- [MQTT.md](./MQTT.md) - MQTT Integration Guide
- [README.md](./README.md) - Vollständige Dokumentation
