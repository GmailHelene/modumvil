// Built-in word lists, typed in from the homework sheets.
// gloss = English word to learn (with accepted Norwegian meanings).
// word  = Norwegian spelling word ("ukas ord"). parts = compound word split [first, link, last].
// sentence: example with ___ where the word goes. misspell: hand-picked wrong spellings.

export const BUILTIN_WEEKS = [
  {
    id: 'uke48',
    title: 'Uke 48',
    sub: 'Leksehefte uke 48',
    gloss: [
      {
        en: 'swallowed', no: ['svelget', 'svelgte', 'slukte', 'svelga'],
        sentence: 'The snake ___ the egg in one bite.', misspell: ['swalowed', 'swallowd', 'swolloved'],
      },
      {
        en: 'catch', no: ['fange', 'ta imot', 'ta', 'gripe'],
        sentence: 'Can you ___ the ball?', misspell: ['cach', 'katch', 'catsh'],
      },
      {
        en: 'wiggled', no: ['sprellet', 'sprella', 'vrikket', 'vrikka', 'vred seg'],
        sentence: 'The worm ___ on the hook.', misspell: ['wigled', 'wiggeled', 'wiggld'],
      },
    ],
    words: [
      { word: 'hjemme', sentence: 'Jeg er ___ i dag fordi jeg er syk.', misspell: ['jemme', 'hjeme', 'hjæmme'] },
      { word: 'akkurat', sentence: 'Bussen kom ___ i tide.', misspell: ['akurat', 'akkuratt', 'akkorat'] },
      { word: 'alltid', sentence: 'Hun er ___ blid om morgenen.', misspell: ['altid', 'alltidd', 'aldtid'] },
      { word: 'aldri', sentence: 'Jeg har ___ sett en elg.', misspell: ['alldri', 'aldrig', 'aldre'] },
    ],
  },
  {
    id: 'explore68',
    title: 'Explore s. 68-69',
    sub: 'Gloser fra Explore og sammensatte ord',
    gloss: [
      {
        en: 'magic', no: ['magi', 'magisk', 'trolldom', 'trylling', 'trylle', 'magiske'],
        sentence: 'The wizard waved his ___ wand.', misspell: ['magik', 'majic', 'maggic'],
      },
      {
        en: 'wicked', no: ['ond', 'slem', 'vond', 'ondskapsfull', 'onde', 'slemme'],
        sentence: 'The ___ witch laughed at the children.', misspell: ['wiked', 'wikked', 'wickt'],
      },
      {
        en: 'curious', no: ['nysgjerrig', 'nysgjerrige'],
        sentence: 'The cat was ___ and looked inside the box.', misspell: ['curius', 'curous', 'kurious'],
      },
      {
        en: 'earth', no: ['jorda', 'jorden', 'jord', 'jordkloden'],
        sentence: 'We live on planet ___.', misspell: ['erth', 'earht', 'eart'],
      },
      {
        en: 'through', no: ['gjennom'],
        sentence: 'The dog ran ___ the forest.', misspell: ['throught', 'thorugh', 'throgh'],
      },
      {
        en: 'be careful', no: ['vær forsiktig', 'vaer forsiktig', 'pass på', 'forsiktig'],
        sentence: '___! The ice is very thin.', misspell: ['be carefull', 'bee careful', 'be carful'],
      },
      {
        en: 'ugly', no: ['stygg', 'stygt', 'stygge'],
        sentence: 'The troll had a big, ___ nose.', misspell: ['ugley', 'uggly', 'ugli'],
      },
    ],
    words: [
      { word: 'vindusrute', parts: ['vindu', 's', 'rute'], sentence: 'Ballen knuste en ___.', misspell: ['vindurute', 'vinduesrute', 'vindusrutte'] },
      { word: 'kattemat', parts: ['katt', 'e', 'mat'], sentence: 'Pusen spiste opp all ___.', misspell: ['katmat', 'kattmat', 'katemat'] },
      { word: 'skogskatt', parts: ['skog', 's', 'katt'], sentence: 'En ___ har lang og tykk pels.', misspell: ['skogkatt', 'skogskat', 'skoggskatt'] },
      { word: 'fuglebur', parts: ['fugl', 'e', 'bur'], sentence: 'Papegøyen bor i et ___.', misspell: ['fuglbur', 'fugelbur', 'fuglebuur'] },
      { word: 'hundehus', parts: ['hund', 'e', 'hus'], sentence: 'Hunden sover i et ___ ute i hagen.', misspell: ['hundhus', 'hunnehus', 'hundehuss'] },
      { word: 'lastebil', parts: ['last', 'e', 'bil'], sentence: 'En stor ___ kjørte forbi skolen.', misspell: ['lastbil', 'lastebill', 'lasstebil'] },
      { word: 'musefelle', parts: ['mus', 'e', 'felle'], sentence: 'Vi satte ut en ___ i kjelleren.', misspell: ['musfelle', 'musefele', 'mussefelle'] },
      { word: 'søndagstur', parts: ['søndag', 's', 'tur'], sentence: 'Vi gikk på ___ i skogen.', misspell: ['søndagtur', 'sønndagstur', 'søndagstuur'] },
    ],
  },
];

export const TIPS = [
  {
    title: 'Se, dekk, skriv, sjekk',
    text: 'Se på ordet og si det høyt. Dekk det til. Skriv det fra hukommelsen. Sjekk om det ble riktig. Det er akkurat det oppgaven <b>Se, dekk, skriv</b> gjør.',
  },
  {
    title: 'Sammensatte ord skrives i ett',
    text: 'To ord blir ett: <b>katt + mat = kattemat</b>. Noen ganger kommer det en liten bokstav i skjøten, en <b>e</b> eller en <b>s</b>: fugl<b>e</b>bur, vindu<b>s</b>rute. Si ordet høyt, da hører du den.',
  },
  {
    title: 'hj- og dobbelt konsonant',
    text: '<b>hj</b>emme har stum h. Etter kort vokal kommer ofte dobbel konsonant: a<b>kk</b>urat, a<b>ll</b>tid, hje<b>mm</b>e. Men <b>aldri</b> har bare én l.',
  },
  {
    title: 'Engelske gloser',
    text: 'Lær ordet begge veier: fra engelsk til norsk og fra norsk til engelsk. Det siste er vanskeligst, fordi du må kunne stave det. Trykk 🔊 for å høre uttalen.',
  },
];
