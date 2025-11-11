// Funktion zum Formatieren einer Zeile (16 Zeichen)
function formatLine(fixText, variable) {
    const maxLength = 16;
    const varStr = String(variable);
    const totalLength = fixText.length + varStr.length;
    
    if (totalLength <= maxLength) {
        const spaces = maxLength - totalLength;
        return fixText + " ".repeat(spaces) + varStr;
    } else {
        const availableForText = maxLength - varStr.length - 1;
        return fixText.substring(0, availableForText) + " " + varStr;
    }
}

// Funktion zum Formatieren von Watt-Werten
function formatWatt(value) {
    const numValue = Number(value);
    
    if (isNaN(numValue)) return "0";
    
    const absValue = Math.abs(numValue);
    
    if (absValue >= 1000) {
        const kw = (numValue / 1000).toFixed(1);
        return kw + "k";
    } else {
        return Math.round(numValue).toString();
    }
}

// Funktion zum Formatieren von Prozent-Werten
function formatPercent(value) {
    const numValue = Number(value);
    
    if (isNaN(numValue)) return "0%";
    
    const clampedValue = Math.max(0, Math.min(100, numValue));
    return Math.round(clampedValue) + "%";
}

// Funktion zum Formatieren von Euro zu Cent (ohne Nachkommastellen)
function formatCent(value) {
    const numValue = Number(value);
    
    if (isNaN(numValue)) return "0 cent";
    
    // Euro in Cent umrechnen (Euro * 100) und runden
    const centValue = Math.round(numValue * 100);
    
    return centValue + " cent";
}

// ============================================================================
// FLEXIBLE MODUS-STEUERUNG MIT PRIORITÄT
// ============================================================================
// Modi:
//   - 'm' oder 'manuell':  Keine Auto-Updates, DateTime AUS, manuelle MQTT/API
//   - 'n' oder 'normal':   Batterie 1 & 2, DateTime EIN
//   - 'a' oder 'alternativ': Auto & Batterie gesamt, DateTime EIN
//   - Zahl (Sekunden):     Zeitbasiertes Umschalten, DateTime EIN
//   - Standard:            60 Sekunden Wechsel, DateTime EIN
//
// global.get("displayMode") hat Vorrang vor msg.mode
// ============================================================================
const globalMode = global.get("displayMode");
const mode = (globalMode !== null && globalMode !== undefined) ? globalMode : msg.mode;

let showAlternative = false;
let manualMode = false;

if (mode === 'm' || mode === 'manuell') {
    // Manuell-Modus: Keine automatische Aktualisierung
    // Display wird über manuelle MQTT/API Nachrichten gesteuert
    manualMode = true;

    // DateTime-Modus deaktivieren im Manuell-Modus
    msg.payload = {};
    msg.datetime = false;

    return msg;

} else if (mode === 'n' || mode === 'normal') {
    // Normal-Modus: Batterie 1 & 2
    showAlternative = false;

} else if (mode === 'a' || mode === 'alternativ') {
    // Alternativ-Modus: Auto & Batterie gesamt
    showAlternative = true;

} else if (typeof mode === 'number' && mode > 0) {
    // Zeitbasiertes Umschalten (mode = Sekunden für einen Zyklus)
    const now = Date.now();
    const cycleTimeMs = mode * 1000; // Sekunden in Millisekunden
    const currentCycle = Math.floor(now / cycleTimeMs);
    showAlternative = (currentCycle % 2) === 1;

} else {
    // Kein oder ungültiger Wert: Standard-Umschaltung alle 60 Sekunden
    const now = Date.now();
    const cycleTimeMs = 60 * 1000; // 60 Sekunden
    const currentCycle = Math.floor(now / cycleTimeMs);
    showAlternative = (currentCycle % 2) === 1;
}

// Lese die globalen Variablen
const netz = global.get("splitNetz") || 0;
const solar = global.get("splitSolar") || 0;
const bat1 = global.get("splitBat1") || 0;
const bat2 = global.get("splitBat2") || 0;
const carSoc = global.get("splitCarSoc") || 0;
const bat1and2 = global.get("splitBat1and2") || 0;
const tarifGrid = global.get("splitTarifGrid") || 0;
const splitConnected = global.get("splitConnected") || false;
const splitCharging = global.get("splitCharging") || false;

// Formatiere die Werte
const netzFormatted = formatWatt(netz);
const solarFormatted = formatWatt(solar);
const bat1Formatted = formatPercent(bat1);
const bat2Formatted = formatPercent(bat2);
const carSocFormatted = formatPercent(carSoc);
const bat1and2Formatted = formatPercent(bat1and2);
const tarifGridFormatted = formatCent(tarifGrid);

// Bestimme den Status-Text für line2 (zentriert)
let statusText = "";
if (splitCharging) {
    const text = "Charging";
    const padding = Math.floor((16 - text.length) / 2);
    statusText = " ".repeat(padding) + text;
} else if (splitConnected) {
    const text = "Connected";
    const padding = Math.floor((16 - text.length) / 2);
    statusText = " ".repeat(padding) + text;
}

// Erstelle die JSON-Struktur
if (showAlternative) {
    msg.payload = {
        line2: statusText,
        line3: formatLine("Netz", netzFormatted),
        line4: formatLine("Solar", solarFormatted),
        line5: formatLine("Auto", carSocFormatted),
        line6: formatLine("Preis", tarifGridFormatted)
    };
} else {
    msg.payload = {
        line2: statusText,
        line3: formatLine("Netz", netzFormatted),
        line4: formatLine("Solar", solarFormatted),
        line5: formatLine("Batterie 1", bat1Formatted),
        line6: formatLine("Batterie NOT", bat2Formatted)
    };
}

// DateTime-Steuerung zum Payload hinzufügen
// In allen automatischen Modi ist DateTime aktiviert
msg.datetime = true;

return msg;
