// All words and sentences. Plain data: easy to edit or extend.
//
// Sets 1-4 are the curriculum for the test: Explore English, pages 48-49
// ("Compound verbs / Sammensatte verbuttrykk" and "Adjectives and prepositions").
// Sets 5-6 are bonus words for extra practice; the test mode never uses them.
//
// Compound verbs (phrasal verbs)
//   en, verb, part   the verb ("put off" = put + off)
//   def        the book's English explanation
//   no         Norwegian meaning
//   alt        other correct English answers for the Norwegian meaning
//   past       simple past; wrongPast = a typical wrong form, used as a distractor for irregular verbs
//   gaps       sentences with ___ where the particle goes (gapPart if not the whole particle)
//   pastQ      sentence with ___ for the whole verb in the past tense
//
// Adjectives + prepositions
//   adj, preps   preps[0] is the main answer, others are also accepted
//   no           Norwegian
//   trap         the preposition a Norwegian is tempted to use
//   notWrong     prepositions that also make a correct sentence, never offered as wrong answers
//   gaps         sentences with ___ where the preposition goes (the first is from the book)

export const PHRASAL = [
  // --- set 1: compound verbs, part 1 (book p. 48) ---
  { id: 'believe-in', set: 1, en: 'believe in', verb: 'believe', part: 'in', def: 'to think something is real or that someone is good and can achieve something',
    no: 'tro på', past: 'believed in',
    gaps: ['I believe ___ you. You can win this race!', 'Do you believe ___ ghosts?'],
    pastQ: 'When I was little, I ___ Santa Claus.' },
  { id: 'look-after', set: 1, en: 'look after', verb: 'look', part: 'after', def: 'take care of',
    no: 'passe på / ta vare på', alt: ['take care of'], past: 'looked after',
    gaps: ['Can you look ___ my cat this weekend?', 'Grandma looks ___ us when Mum and Dad are at work.'],
    pastQ: 'My big sister ___ me when I was ill.' },
  { id: 'try-on', set: 1, en: 'try on', verb: 'try', part: 'on', def: 'put clothes on to see if they fit',
    no: 'prøve (klær)', past: 'tried on', wrongPast: 'tryed on',
    gaps: ['Can I try ___ these jeans before I buy them?', 'Try ___ the blue jacket. I think it fits you.'],
    pastQ: 'She ___ three dresses in the shop.' },
  { id: 'hurry-up', set: 1, en: 'hurry up', verb: 'hurry', part: 'up', def: 'do something more quickly',
    no: 'skynde seg', past: 'hurried up', wrongPast: 'hurryed up',
    gaps: ['Hurry ___! The bus is leaving.', 'You have to hurry ___ or we will be late for the match.'],
    pastQ: 'We ___ because the film was starting.' },
  { id: 'break-up', set: 1, en: 'break up', verb: 'break', part: 'up', def: 'end a relationship',
    no: 'slå opp / gjøre det slutt', past: 'broke up', wrongPast: 'breaked up',
    gaps: ['Emma and Jonas broke ___. They are not together anymore.', 'Why did you break ___ with your girlfriend?'],
    pastQ: 'My cousin ___ with her boyfriend last week.' },
  { id: 'sleep-over', set: 1, en: 'sleep over', verb: 'sleep', part: 'over', def: 'stay somewhere for the night',
    no: 'overnatte (hos noen)', past: 'slept over', wrongPast: 'sleeped over',
    gaps: ['Can I sleep ___ at Ali\'s house on Saturday?', 'My best friend often sleeps ___ at my place.'],
    pastQ: 'Last weekend my cousin ___ at our house.' },
  { id: 'put-off', set: 1, en: 'put off', verb: 'put', part: 'off', def: 'postpone, delay',
    no: 'utsette', past: 'put off', wrongPast: 'putted off',
    gaps: ['Don\'t put ___ your homework until Sunday evening.', 'They had to put ___ the match because of the rain.'],
    pastQ: 'The teacher ___ the test until next week.' },

  // --- set 2: compound verbs, part 2 (book p. 48) ---
  { id: 'give-up', set: 2, en: 'give up', verb: 'give', part: 'up', def: 'stop trying, quit a habit',
    no: 'gi opp / slutte med', past: 'gave up', wrongPast: 'gived up',
    gaps: ['Don\'t give ___! I know you can do it.', 'My dad wants to give ___ smoking.'],
    pastQ: 'He ___ football last year because of his knee.' },
  { id: 'throw-away', set: 2, en: 'throw away', verb: 'throw', part: 'away', def: 'get rid of something',
    no: 'kaste (i søpla)', alt: ['throw out'], past: 'threw away', wrongPast: 'throwed away',
    gaps: ['Don\'t throw ___ that box. We can use it again.', 'Please throw ___ your banana peel in the bin.'],
    pastQ: 'I ___ all my old drawings.' },
  { id: 'calm-down', set: 2, en: 'calm down', verb: 'calm', part: 'down', def: 'relax after being angry or upset',
    no: 'roe seg ned', past: 'calmed down',
    gaps: ['Calm ___! It is only a game.', 'The coach told the angry players to calm ___.'],
    pastQ: 'After a while the scared dog ___.' },
  { id: 'cheer-up', set: 2, en: 'cheer up', verb: 'cheer', part: 'up', def: 'become happier',
    no: 'bli gladere / muntre opp', past: 'cheered up',
    gaps: ['Cheer ___! Tomorrow is Friday.', 'This funny film will cheer you ___.'],
    pastQ: 'She was sad, but she ___ when she saw the puppy.' },
  { id: 'keep-on', set: 2, en: 'keep on', verb: 'keep', part: 'on', def: 'continue',
    no: 'fortsette (med)', alt: ['carry on', 'go on'], past: 'kept on', wrongPast: 'keeped on',
    gaps: ['Keep ___ trying. You will get better!', 'Why do you keep ___ asking the same question?'],
    pastQ: 'He ___ talking during the whole film.' },
  { id: 'get-along', set: 2, en: 'get along', verb: 'get', part: 'along', def: 'like each other',
    no: 'komme godt overens', alt: ['get on', 'get along with', 'get on with'], past: 'got along', wrongPast: 'getted along',
    gaps: ['I get ___ well with my sister. We never fight.', 'Do you get ___ with your new teacher?'],
    pastQ: 'We ___ really well at summer camp.' },
  { id: 'get-on', set: 2, en: 'get on', verb: 'get', part: 'on', def: 'like each other (We get on really well)',
    no: 'komme godt overens', alt: ['get along', 'get on with', 'get along with'], past: 'got on', wrongPast: 'getted on',
    gaps: ['We get ___ really well.', 'My mum and my grandma get ___ very well.'],
    pastQ: 'The two new boys ___ well from the first day.' },
  { id: 'find-out', set: 2, en: 'find out', verb: 'find', part: 'out', def: 'find the answer, discover',
    no: 'finne ut', alt: ['figure out'], past: 'found out', wrongPast: 'finded out',
    gaps: ['Let\'s find ___ when the next train leaves.', 'I want to find ___ who ate my chocolate!'],
    pastQ: 'She ___ the truth about the missing cake.' },

  // --- set 5: bonus compound verbs ---
  { id: 'get-up', set: 5, en: 'get up', verb: 'get', part: 'up', no: 'stå opp', past: 'got up', wrongPast: 'getted up',
    gaps: ['I always get ___ at seven o\'clock on school days.'], pastQ: 'Yesterday I ___ late and missed the bus.' },
  { id: 'wake-up', set: 5, en: 'wake up', verb: 'wake', part: 'up', no: 'våkne', past: 'woke up', wrongPast: 'waked up',
    gaps: ['I usually wake ___ before my alarm clock rings.'], pastQ: 'This morning I ___ at six.' },
  { id: 'put-on', set: 5, en: 'put on', verb: 'put', part: 'on', no: 'ta på seg (klær)', past: 'put on', wrongPast: 'putted on',
    gaps: ['It is cold outside, so put ___ your jacket.'], pastQ: 'Last night she ___ her new shoes for the party.' },
  { id: 'take-off', set: 5, en: 'take off', verb: 'take', part: 'off', no: 'ta av seg (klær)', past: 'took off', wrongPast: 'taked off',
    gaps: ['Please take ___ your shoes when you come inside.'], pastQ: 'He ___ his cap when he came into the classroom.' },
  { id: 'turn-on', set: 5, en: 'turn on', verb: 'turn', part: 'on', no: 'slå på', alt: ['switch on'], past: 'turned on',
    gaps: ['It is very dark in here. Can you turn ___ the light?'], pastQ: 'Dad ___ the TV to watch the news.' },
  { id: 'turn-off', set: 5, en: 'turn off', verb: 'turn', part: 'off', no: 'slå av', alt: ['switch off'], past: 'turned off',
    gaps: ['Remember to turn ___ your phone before the lesson starts.'], pastQ: 'I ___ the computer and went to bed.' },
  { id: 'sit-down', set: 5, en: 'sit down', verb: 'sit', part: 'down', no: 'sette seg', past: 'sat down', wrongPast: 'sitted down',
    gaps: ['Please sit ___ and open your books.'], pastQ: 'We were tired, so we ___ on a bench.' },
  { id: 'stand-up', set: 5, en: 'stand up', verb: 'stand', part: 'up', no: 'reise seg', past: 'stood up', wrongPast: 'standed up',
    gaps: ['Everybody, please stand ___ for the national anthem.'], pastQ: 'The pupils ___ when the headteacher came in.' },
  { id: 'come-back', set: 5, en: 'come back', verb: 'come', part: 'back', no: 'komme tilbake', alt: ['get back'], past: 'came back', wrongPast: 'comed back',
    gaps: ['When will you come ___ from your holiday?'], pastQ: 'Mum ___ from work at five o\'clock.' },
  { id: 'grow-up', set: 5, en: 'grow up', verb: 'grow', part: 'up', no: 'vokse opp', past: 'grew up', wrongPast: 'growed up',
    gaps: ['I want to be a pilot when I grow ___.'], pastQ: 'My mum ___ in a small town in the north.' },
  { id: 'make-up', set: 5, en: 'make up', verb: 'make', part: 'up', no: 'finne på (dikte opp)', past: 'made up', wrongPast: 'maked up',
    gaps: ['That story is not true. You made it ___!'], pastQ: 'He ___ a funny story about a flying cat.' },
  { id: 'hang-out', set: 5, en: 'hang out', verb: 'hang', part: 'out', no: 'henge (sammen med venner)', past: 'hung out', wrongPast: 'hanged out',
    gaps: ['We often hang ___ at the shopping centre after school.'], pastQ: 'Yesterday we ___ at Ola\'s house.' },
  { id: 'look-up', set: 5, en: 'look up', verb: 'look', part: 'up', no: 'slå opp (et ord)', past: 'looked up',
    gaps: ['If you don\'t know a word, look it ___ in a dictionary.'], pastQ: 'I ___ the word online.' },
  { id: 'look-for', set: 5, en: 'look for', verb: 'look', part: 'for', no: 'lete etter', past: 'looked for',
    gaps: ['I\'m looking ___ my keys. Have you seen them?'], pastQ: 'We ___ the ball for an hour.' },
  { id: 'hand-in', set: 5, en: 'hand in', verb: 'hand', part: 'in', no: 'levere inn', alt: ['turn in'], past: 'handed in',
    gaps: ['Please hand ___ your homework on Friday.'], pastQ: 'I ___ my essay yesterday.' },
  { id: 'write-down', set: 5, en: 'write down', verb: 'write', part: 'down', no: 'skrive ned', past: 'wrote down', wrongPast: 'writed down',
    gaps: ['Write ___ the new words in your notebook.'], pastQ: 'I ___ her phone number on my hand.' },
  { id: 'pick-up', set: 5, en: 'pick up', verb: 'pick', part: 'up', no: 'hente (noen) / plukke opp', past: 'picked up',
    gaps: ['Can you pick me ___ after football practice?'], pastQ: 'Dad ___ us at the station.' },
  { id: 'run-out-of', set: 5, en: 'run out of', verb: 'run', part: 'out of', no: 'gå tom for', past: 'ran out of', wrongPast: 'runned out of',
    gaps: ['Hurry up! We are running ___ of time.'], gapPart: 'out', pastQ: 'The car ___ petrol on the motorway.' },
  { id: 'carry-on', set: 5, en: 'carry on', verb: 'carry', part: 'on', no: 'fortsette (med)', alt: ['keep on', 'go on'], past: 'carried on', wrongPast: 'carryed on',
    gaps: ['Carry ___ reading until the bell rings.'], pastQ: 'They ___ playing in the rain.' },
  { id: 'break-down', set: 5, en: 'break down', verb: 'break', part: 'down', no: 'gå i stykker (bil, maskin)', past: 'broke down', wrongPast: 'breaked down',
    gaps: ['Our old car often breaks ___ on long trips.'], pastQ: 'The bus ___ on the way to Oslo.' },
];

export const ADJ = [
  // --- set 3: adjectives + prepositions, part 1 (book p. 49) ---
  { id: 'famous-for', set: 3, adj: 'famous', preps: ['for'], no: 'kjent for', trap: 'of',
    gaps: ['Manchester is famous ___ its football teams.', 'Norway is famous ___ its fjords.'] },
  { id: 'interested-in', set: 3, adj: 'interested', preps: ['in'], no: 'interessert i', trap: 'of',
    gaps: ['She is interested ___ computer games.', 'Are you interested ___ football?'] },
  { id: 'afraid-of', set: 3, adj: 'afraid', preps: ['of'], no: 'redd for', trap: 'for',
    gaps: ['Peter is afraid ___ the dark.', 'My little sister is afraid ___ big dogs.'] },
  { id: 'keen-on', set: 3, adj: 'keen', preps: ['on'], no: 'glad i / interessert i', trap: 'of',
    gaps: ['I am not very keen ___ football.', 'She is really keen ___ horses.'] },
  { id: 'bad-at', set: 3, adj: 'bad', preps: ['at'], no: 'dårlig i / dårlig til', trap: 'in', notWrong: ['with', 'for'],
    gaps: ['He is bad ___ repairing cars.', 'I\'m bad ___ singing, but I love it.'] },
  { id: 'pleased-with', set: 3, adj: 'pleased', preps: ['with'], no: 'fornøyd med', trap: 'over', notWrong: ['about', 'by'],
    gaps: ['He is pleased ___ his progress.', 'The teacher was pleased ___ our work.'] },
  { id: 'excited-about', set: 3, adj: 'excited', preps: ['about'], no: 'spent på / gira på', trap: 'on', notWrong: ['by'],
    gaps: ['They are excited ___ going to London.', 'We are excited ___ the school trip.'] },

  // --- set 4: adjectives + prepositions, part 2 (book p. 49) ---
  { id: 'angry-with', set: 4, adj: 'angry', preps: ['with', 'at'], no: 'sint på (en person)', trap: 'on', notWrong: ['about'],
    gaps: ['He is angry ___ his mother.', 'Mum was angry ___ me because I came home late.'] },
  { id: 'good-at', set: 4, adj: 'good', preps: ['at'], no: 'flink i / god i', trap: 'in', notWrong: ['with', 'for'],
    gaps: ['What are you good ___?', 'She is really good ___ maths.'] },
  { id: 'worried-about', set: 4, adj: 'worried', preps: ['about'], no: 'bekymret for', trap: 'for', notWrong: ['by'],
    gaps: ['What stories in the news are you worried ___?', 'I\'m a bit worried ___ the test on Friday.'] },
  { id: 'proud-of', set: 4, adj: 'proud', preps: ['of'], no: 'stolt av', trap: 'over',
    gaps: ['Who are you proud ___?', 'Your parents are very proud ___ you.'] },
  { id: 'good-for', set: 4, adj: 'good', preps: ['for'], no: 'bra for / sunt for', notWrong: ['to'],
    gaps: ['Vegetables are good ___ your health.', 'Sleep is good ___ you.'] },
  { id: 'bad-for', set: 4, adj: 'bad', preps: ['for'], no: 'dårlig for / usunt for', notWrong: ['to'],
    gaps: ['Too much sugar is bad ___ your teeth.', 'Smoking is bad ___ your health.'] },

  // --- set 6: bonus adjectives ---
  { id: 'scared-of', set: 6, adj: 'scared', preps: ['of'], no: 'redd for', trap: 'for', notWrong: ['by'], gaps: ['Are you scared ___ spiders?'] },
  { id: 'tired-of', set: 6, adj: 'tired', preps: ['of'], no: 'lei av', trap: 'on', notWrong: ['from', 'with'], gaps: ['I\'m tired ___ eating fish every Friday.'] },
  { id: 'jealous-of', set: 6, adj: 'jealous', preps: ['of'], no: 'sjalu på', trap: 'on', gaps: ['He is jealous ___ his brother\'s new bike.'] },
  { id: 'fond-of', set: 6, adj: 'fond', preps: ['of'], no: 'glad i', trap: 'in', gaps: ['I\'m very fond ___ my grandmother.'] },
  { id: 'full-of', set: 6, adj: 'full', preps: ['of'], no: 'full av', trap: 'with', gaps: ['The box was full ___ old toys.'] },
  { id: 'surprised-at', set: 6, adj: 'surprised', preps: ['at', 'by'], no: 'overrasket over', trap: 'over', notWrong: ['with'], gaps: ['We were surprised ___ the news.'] },
  { id: 'crazy-about', set: 6, adj: 'crazy', preps: ['about'], no: 'gal etter', trap: 'after', gaps: ['My brother is crazy ___ computer games.'] },
  { id: 'kind-to', set: 6, adj: 'kind', preps: ['to'], no: 'snill mot', trap: 'against', notWrong: ['with'], gaps: ['You must always be kind ___ animals.'] },
  { id: 'married-to', set: 6, adj: 'married', preps: ['to'], no: 'gift med', trap: 'with', gaps: ['My aunt is married ___ a farmer.'] },
  { id: 'sorry-for', set: 6, adj: 'sorry', preps: ['for', 'about'], no: 'lei seg for', trap: 'of', gaps: ['I\'m sorry ___ being late.'] },
  { id: 'ready-for', set: 6, adj: 'ready', preps: ['for'], no: 'klar for', trap: 'to', gaps: ['Are you ready ___ the test on Friday?'] },
  { id: 'different-from', set: 6, adj: 'different', preps: ['from', 'to'], no: 'forskjellig fra', trap: 'than', gaps: ['Cats are very different ___ dogs.'] },
];

// Particles and prepositions used as wrong options.
export const PARTICLES = ['up', 'down', 'on', 'off', 'out', 'in', 'after', 'for', 'away', 'back', 'along', 'over'];
export const PREPOSITIONS = ['of', 'at', 'in', 'on', 'about', 'with', 'to', 'for', 'from', 'by', 'over'];

export const CORE_SETS = [1, 2, 3, 4];

export const SET_NAMES = {
  1: 'Compound verbs del 1 (believe in ... put off)',
  2: 'Compound verbs del 2 (give up ... find out)',
  3: 'Adjektiv + preposisjon del 1 (famous for ... excited about)',
  4: 'Adjektiv + preposisjon del 2 (angry with ... bad for)',
  5: 'Bonus: flere compound verbs',
  6: 'Bonus: flere adjektiv + preposisjon',
};

export const TIPS = [
  {
    title: 'Hva er et sammensatt verbuttrykk?',
    text: 'Et <b>compound verb</b> (phrasal verb) er et verb + en preposisjon eller et adverb. Sammen får de ofte en <b>helt annen betydning</b> enn verbet alene: <b>give</b> = gi, men <b>give up</b> = gi opp / slutte med.',
  },
  {
    title: 'Lær dem som ett ord',
    text: 'Ikke oversett ord for ord. <b>Put off</b> betyr ikke «putte av», det betyr <b>utsette</b>. <b>Break up</b> betyr <b>slå opp</b>. Lær hele uttrykket, akkurat som en glose.',
  },
  {
    title: 'Fortid: bare verbet bøyes',
    text: 'I fortid bøyer du bare verbet. Det lille ordet står stille: give up → <b>gave up</b>, break up → <b>broke up</b>, sleep over → <b>slept over</b>, keep on → <b>kept on</b>, put off → <b>put off</b>.',
  },
  {
    title: 'Adjektiv + preposisjon',
    text: 'Noen adjektiv har en fast preposisjon etter seg. Det er <b>faste uttrykk</b> du må pugge: famous <b>for</b>, interested <b>in</b>, afraid <b>of</b>, keen <b>on</b>, bad <b>at</b>, pleased <b>with</b>, excited <b>about</b>.',
  },
  {
    title: 'Den norske fella',
    text: 'Oversetter du rett fra norsk, blir det ofte feil: redd <i>for</i> → afraid <b>of</b>, flink <i>i</i> → good <b>at</b>, sint <i>på</i> → angry <b>with</b>, stolt <i>over</i> → proud <b>of</b>, bekymret <i>for</i> → worried <b>about</b>. Spillet bruker disse fellene som feilsvar.',
  },
  {
    title: 'good at eller good for?',
    text: '<b>good at</b> = flink til noe (I am good at football). <b>good for</b> = bra for noe (Fruit is good for your health). Det samme med <b>bad at</b> og <b>bad for</b>.',
  },
  {
    title: 'angry vs. angry with',
    text: '«He is angry» sier bare at han er sint. «He is angry <b>with</b> his mother» forteller <b>hvem</b> han er sint på. Preposisjonen gir mer informasjon, akkurat som boka spør om.',
  },
];
