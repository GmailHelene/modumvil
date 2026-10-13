// Norwegian time phrasing for analog clocks.
// Pure functions, no DOM - covered by tests/time-no.test.mjs.
//
// Convention taught in Norwegian schools:
//   1-19 min   -> "over" the full hour        (fem over to)
//   20-29 min  -> "på halv" the next hour     (ti på halv tre)
//   30 min     -> "halv" the next hour        (halv tre = 2:30)
//   31-40 min  -> "over halv" the next hour   (fem over halv tre)
//   41-59 min  -> "på" the next hour          (kvart på tre)

export const HOUR_WORDS = ['tolv', 'ett', 'to', 'tre', 'fire', 'fem', 'seks', 'sju', 'åtte', 'ni', 'ti', 'elleve'];

const NUMBER_WORDS = [
  'null', 'ett', 'to', 'tre', 'fire', 'fem', 'seks', 'sju', 'åtte', 'ni', 'ti',
  'elleve', 'tolv', 'tretten', 'fjorten', 'femten', 'seksten', 'sytten', 'atten', 'nitten', 'tjue',
];

export function mod(n, m) {
  return ((n % m) + m) % m;
}

export function hourWord(h) {
  return HOUR_WORDS[mod(h, 12)];
}

// "fem", "ti" stand alone; everything else gets "minutt(er)".
function minuteWords(n) {
  if (n === 5 || n === 10) return NUMBER_WORDS[n];
  return `${NUMBER_WORDS[n]} ${n === 1 ? 'minutt' : 'minutter'}`;
}

// Which "zone" of the clock face the minute hand is in. Used for hints,
// colour sectors and adaptive practice.
export function zoneOf(m) {
  if (m === 0) return 'hel';
  if (m === 30) return 'halv';
  if (m === 15 || m === 45) return 'kvart';
  if (m < 20) return 'over';
  if (m < 30) return 'paHalv';
  if (m <= 40) return 'overHalv';
  return 'pa';
}

export const ZONE_LABELS = {
  hel: 'hel time',
  halv: 'halv',
  kvart: 'kvart',
  over: 'over',
  paHalv: 'på halv',
  overHalv: 'over halv',
  pa: 'på',
};

// Phrase without "klokka er", e.g. "kvart over to", "halv tre", "tre".
export function phrase(h, m) {
  const cur = hourWord(h);
  const next = hourWord(h + 1);
  if (m === 0) return cur;
  if (m === 15) return `kvart over ${cur}`;
  if (m === 30) return `halv ${next}`;
  if (m === 45) return `kvart på ${next}`;
  if (m < 20) return `${minuteWords(m)} over ${cur}`;
  if (m < 30) return `${minuteWords(30 - m)} på halv ${next}`;
  if (m <= 40) return `${minuteWords(m - 30)} over halv ${next}`;
  return `${minuteWords(60 - m)} på ${next}`;
}

export function sentence(h, m) {
  const p = phrase(h, m);
  return `Klokka er ${p}`;
}

export function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function pad(n) {
  return String(n).padStart(2, '0');
}

// h is 0-23 here. 12-hour display shows 1-12.
export function digital(h, m, use24 = true) {
  if (use24) return `${pad(mod(h, 24))}:${pad(m)}`;
  const h12 = mod(h, 12) === 0 ? 12 : mod(h, 12);
  return `${h12}:${pad(m)}`;
}

export function partOfDay(h24) {
  const h = mod(h24, 24);
  if (h < 6) return 'om natta';
  if (h < 10) return 'om morgenen';
  if (h < 12) return 'på formiddagen';
  if (h < 18) return 'om ettermiddagen';
  return 'om kvelden';
}

// Total minutes on a 12-hour dial (0-719) <-> hour/minute.
export function fromDial(total) {
  const t = mod(Math.round(total), 720);
  return { h: Math.floor(t / 60), m: t % 60 };
}

export function toDial(h, m) {
  return mod(h, 12) * 60 + m;
}

export function addMinutes(h24, m, delta) {
  const t = mod(h24 * 60 + m + delta, 1440);
  return { h: Math.floor(t / 60), m: t % 60 };
}

// "1 time og 15 minutter", "45 minutter", "2 timer".
export function durationText(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const parts = [];
  if (h) parts.push(`${h} ${h === 1 ? 'time' : 'timer'}`);
  if (m) parts.push(`${m} ${m === 1 ? 'minutt' : 'minutter'}`);
  return parts.length ? parts.join(' og ') : '0 minutter';
}

// Step-by-step explanation shown after a wrong answer (and in practice mode).
export function explain(h, m) {
  const lines = [];
  const hourOnDial = mod(h, 12) === 0 ? 12 : mod(h, 12);
  const minuteNumber = m === 0 ? 12 : m / 5;
  const minuteOnDial = Number.isInteger(minuteNumber)
    ? `peker på ${minuteNumber}`
    : `står mellom ${Math.floor(m / 5) || 12} og ${Math.floor(m / 5) + 1}`;

  lines.push(`Den lange viseren (minuttviseren) ${minuteOnDial}. Det betyr ${m} minutter.`);

  if (m === 0) {
    lines.push(`Den korte viseren (timeviseren) peker rett på ${hourOnDial}. Da er klokka ${hourWord(h)}.`);
    return lines;
  }

  const nextOnDial = hourOnDial === 12 ? 1 : hourOnDial + 1;
  lines.push(`Den korte viseren har gått forbi ${hourOnDial}, på vei mot ${nextOnDial}.`);

  const zone = zoneOf(m);
  const cur = hourWord(h);
  const next = hourWord(h + 1);
  switch (zone) {
    case 'halv':
      lines.push(`Halve timen er gått på vei mot ${next}. Derfor sier vi «halv ${next}», ikke «halv ${cur}».`);
      break;
    case 'kvart':
      lines.push(m === 15
        ? `15 minutter er en kvart time. Den har gått forbi ${cur}: «kvart over ${cur}».`
        : `Det er 15 minutter igjen til ${next}: «kvart på ${next}».`);
      break;
    case 'over':
      lines.push(`Under 20 minutter: vi teller minutter over ${cur}.`);
      break;
    case 'paHalv':
      lines.push(`Fra 20 til 30 minutter teller vi hvor mye som mangler til halv ${next}: ${30 - m} minutter på halv.`);
      break;
    case 'overHalv':
      lines.push(`Fra 31 til 40 minutter teller vi fra halv ${next}: ${m - 30} minutter over halv.`);
      break;
    case 'pa':
      lines.push(`Over 40 minutter teller vi hvor mye som mangler til ${next}: ${60 - m} minutter på.`);
      break;
    default:
  }
  lines.push(`Svar: ${phrase(h, m)} (${digital(h, m, false)}).`);
  return lines;
}
