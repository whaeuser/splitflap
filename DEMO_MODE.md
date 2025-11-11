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

- **Gesamtdauer**: ~27 Sekunden
- **Pro Szene**: 5 Sekunden
- **Szenen**: 5
- **Abschluss-Pause**: 2 Sekunden

## 🎯 Use Cases

- **Präsentationen**: Zeigen Sie die Farbfunktionen
- **Testing**: Testen Sie alle Farben gleichzeitig
- **Showroom**: Beeindrucken Sie Besucher
- **Debugging**: Überprüfen Sie die Funktionalität
- **Training**: Lernen Sie die Farbpalette kennen

## 🔄 Wiederholen

Um die Demo zu wiederholen, senden Sie einfach den gleichen Befehl erneut:

```bash
# Endlosschleife (alle 30 Sekunden)
while true; do
  mosquitto_pub -t "splitflap/demo" -m ""
  sleep 30
done
```

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

Die Demo läuft automatisch durch und stoppt nach ~27 Sekunden. Um sie vorzeitig zu stoppen:

```bash
# Display löschen
mosquitto_pub -t "splitflap/clear" -m ""

# Oder eigenen Content setzen
mosquitto_pub -t "splitflap/display" -m '{
  "line1": "DEMO GESTOPPT"
}'
```

## 📝 Hinweise

1. **Während der Demo**: Keine anderen Befehle senden, da die Demo läuft
2. **Animation**: Jede Szene animiert mit Flip-Effekten
3. **Sound**: Authentische Klick-Sounds bei jeder Änderung
4. **Farben**: Automatisch auf jede Zeile angewendet
5. **DateTime**: Wird während der Demo deaktiviert

## 🔗 Siehe auch

- [COLOR_EXAMPLES.md](./COLOR_EXAMPLES.md) - Detaillierte Farb-Beispiele
- [MQTT.md](./MQTT.md) - MQTT Integration Guide
- [README.md](./README.md) - Vollständige Dokumentation
