const fs = require('fs');

const raw = fs.readFileSync('raw_events.txt', 'utf8').split('\n');

const events = [];
let currentDay = '';

for (const line of raw) {
  if (!line.trim()) continue;
  
  // Try to match "1 8th October 2026 1 HINDI RECITATION VII ROOM 101 (11 B) GEETAM"
  let match = line.match(/^(\d+)\s+(\d+(?:st|nd|rd|th)\s+[a-zA-Z]+\s+\d{4})\s+(\d+)\s+(.+?)\s+([IVX]+)\s+(.+?)\s+([A-Z]+)$/);
  
  if (match) {
    currentDay = match[2];
    events.push({
      id: parseInt(match[1]),
      day: match[2],
      cat: parseInt(match[3]),
      item: match[4].trim(),
      stageNo: match[5],
      venue: match[6].trim(),
      stageName: match[7].trim()
    });
  } else {
    // Match "2 1 ENGLISH RECITATION XIV ROOM 212 (7 B2) LAYAM"
    match = line.match(/^(\d+)\s+(\d+)\s+(.+?)\s+([IVX]+)\s+(.+?)\s+([A-Z]+)$/);
    if (match) {
      events.push({
        id: parseInt(match[1]),
        day: currentDay,
        cat: parseInt(match[2]),
        item: match[3].trim(),
        stageNo: match[4],
        venue: match[5].trim(),
        stageName: match[6].trim()
      });
    }
  }
}

fs.writeFileSync('src/data/events.json', JSON.stringify(events, null, 2));
console.log('Parsed', events.length, 'events');
