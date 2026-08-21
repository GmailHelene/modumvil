/* Spansk, steg for steg - liten kursmotor.
   All framgang ligger i localStorage på denne enheten. Ingen server, ingen konto. */
(function () {
  'use strict';

  var KURS = window.SPANSK_KURS;
  var NOKKEL = 'spansk_kurs_v1';
  var MAKS_HJERTER = 5;
  var FYLL_MS = 25 * 60 * 1000;      // ett hjerte per 25. minutt
  var MAKS_KRONER = 5;

  /* ================= hjelpere ================= */
  function $(s) { return document.querySelector(s); }
  function lag(tag, klasse, tekst) {
    var e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (tekst != null) e.textContent = tekst;
    return e;
  }
  function bland(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function dagStreng(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function igaar() { var d = new Date(); d.setDate(d.getDate() - 1); return dagStreng(d); }
  function normaliser(s) {
    return String(s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[¿¡?!.,;:"'()]/g, '')
      .replace(/\s+/g, ' ').trim();
  }
  function avstand(a, b) {                     // enkel Levenshtein for skrivefeil
    if (a === b) return 0;
    var m = a.length, n = b.length, rad = [], i, j;
    for (j = 0; j <= n; j++) rad[j] = j;
    for (i = 1; i <= m; i++) {
      var forrige = rad[0]; rad[0] = i;
      for (j = 1; j <= n; j++) {
        var tmp = rad[j];
        rad[j] = Math.min(rad[j] + 1, rad[j - 1] + 1, forrige + (a[i - 1] === b[j - 1] ? 0 : 1));
        forrige = tmp;
      }
    }
    return rad[n];
  }

  /* ================= tilstand ================= */
  function friskState() {
    return {
      profil: { navn: '', maal: 'generelt', niva: 'ny', dagsmaal: 30, hjerter: true, lyd: true },
      xp: 0,
      dag: { dato: '', xp: 0 },
      strek: { antall: 0, sisteDag: '' },
      hjerter: { antall: MAKS_HJERTER, sisteFyll: Date.now() },
      leksjoner: {},
      ord: {},
      oppstartFerdig: false
    };
  }
  var state = friskState();

  function lastState() {
    try {
      var raa = localStorage.getItem(NOKKEL);
      if (!raa) return;
      var lagret = JSON.parse(raa);
      Object.keys(state).forEach(function (k) {
        if (lagret[k] === undefined) return;
        if (typeof state[k] === 'object' && state[k] && !Array.isArray(state[k])) {
          state[k] = Object.assign({}, state[k], lagret[k]);
        } else { state[k] = lagret[k]; }
      });
    } catch (e) { /* ødelagt lagring - start på nytt */ }
  }
  function lagre() {
    try { localStorage.setItem(NOKKEL, JSON.stringify(state)); } catch (e) {}
  }

  /* ================= kursstruktur ================= */
  function enheter() {
    var alle = KURS.units.slice();
    var maal = state.profil.maal;
    var loft = { reise: 'u5', jobb: 'u7', mat: 'u3', familie: 'u2' }[maal];
    if (!loft) return alle;
    var i = alle.findIndex(function (u) { return u.id === loft; });
    if (i <= 1) return alle;
    var u = alle.splice(i, 1)[0];
    alle.splice(1, 0, u);                       // rett etter første enhet
    return alle;
  }
  function alleLeksjoner() {
    var ut = [];
    enheter().forEach(function (u) { u.lessons.forEach(function (l) { ut.push({ enhet: u, leksjon: l }); }); });
    return ut;
  }
  function leksjonStatus(id) { return state.leksjoner[id] || { niva: 0 }; }
  function erLaast(idx) {
    if (idx === 0) return false;
    var rekke = alleLeksjoner();
    return leksjonStatus(rekke[idx - 1].leksjon.id).niva < 1;
  }
  function finnLeksjon(id) {
    var treff = null;
    alleLeksjoner().forEach(function (p) { if (p.leksjon.id === id) treff = p; });
    return treff;
  }
  function ordStat(n) {
    return state.ord[n] || { styrke: 0, riktig: 0, feil: 0, sist: 0 };
  }

  /* ================= lyd ================= */
  var stemme = null, harTale = ('speechSynthesis' in window);
  function velgStemme() {
    if (!harTale) return;
    var v = window.speechSynthesis.getVoices() || [];
    stemme = v.filter(function (x) { return /^es/i.test(x.lang); })[0] || null;
  }
  if (harTale) { velgStemme(); window.speechSynthesis.onvoiceschanged = velgStemme; }
  function si(tekst) {
    if (!harTale || !state.profil.lyd) return;
    try {
      window.speechSynthesis.cancel();
      var y = new SpeechSynthesisUtterance(tekst);
      y.lang = stemme ? stemme.lang : 'es-ES';
      if (stemme) y.voice = stemme;
      y.rate = 0.9;
      window.speechSynthesis.speak(y);
    } catch (e) {}
  }
  function kanLytte() { return harTale && state.profil.lyd && !!stemme; }
  function hoyttalerKn(tekst, stor) {
    var b = lag('button', 'hoyttaler' + (stor ? ' hoyttaler--stor' : ''));
    b.type = 'button';
    b.setAttribute('aria-label', 'Hør uttalen');
    b.innerHTML = '&#128266;';
    b.addEventListener('click', function () { si(tekst); });
    return b;
  }

  /* ================= poeng, hjerter, streak ================= */
  function fyllHjerter() {
    if (state.hjerter.antall >= MAKS_HJERTER) { state.hjerter.sisteFyll = Date.now(); return; }
    var gaatt = Date.now() - (state.hjerter.sisteFyll || Date.now());
    var nye = Math.floor(gaatt / FYLL_MS);
    if (nye > 0) {
      state.hjerter.antall = Math.min(MAKS_HJERTER, state.hjerter.antall + nye);
      state.hjerter.sisteFyll = Date.now() - (gaatt % FYLL_MS);
      lagre();
    }
  }
  function girXp(n) {
    var i_dag = dagStreng();
    if (state.dag.dato !== i_dag) state.dag = { dato: i_dag, xp: 0 };
    var forste = state.dag.xp === 0;
    state.dag.xp += n;
    state.xp += n;
    if (forste) {
      if (state.strek.sisteDag === igaar()) state.strek.antall += 1;
      else if (state.strek.sisteDag !== i_dag) state.strek.antall = 1;
      state.strek.sisteDag = i_dag;
    }
    lagre();
  }
  function dagsXp() { return state.dag.dato === dagStreng() ? state.dag.xp : 0; }

  /* ================= skjermbytte ================= */
  function vis(id) {
    ['skjermOppstart', 'skjermApp', 'skjermOving', 'skjermFerdig'].forEach(function (s) {
      $('#' + s).classList.toggle('skjult', s !== id);
    });
    window.scrollTo(0, 0);
  }
  function oppdaterTopp() {
    fyllHjerter();
    $('#strekTall').textContent = state.strek.antall;
    $('#xpTall').textContent = state.xp;
    var h = $('#tellerHjerte');
    if (state.profil.hjerter) {
      h.classList.remove('skjult');
      $('#hjerteTall').textContent = state.hjerter.antall;
      h.classList.toggle('teller--av', state.hjerter.antall === 0);
    } else { h.classList.add('skjult'); }
  }

  /* ================= oppstart (tilpasning) ================= */
  var oppstartSteg = 0;
  var oppstartSvar = { navn: '', maal: 'generelt', niva: 'ny', dagsmaal: 30 };

  function tegnOppstart() {
    var c = $('#oppstartInnhold');
    c.innerHTML = '';
    var steg = [
      {
        tittel: '¡Hola! Skal vi lage kurset ditt?',
        under: 'Fire raske spørsmål, så er vi i gang. Ingenting sendes noe sted - alt ligger på denne enheten.',
        felt: 'navn'
      },
      {
        tittel: 'Hva vil du bruke spansken til?',
        under: 'Vi legger temaet du velger tidlig i løypa.',
        valg: [
          { v: 'reise', t: '✈️  Reise og ferie' },
          { v: 'jobb', t: '💼  Jobb og hverdag' },
          { v: 'familie', t: '👪  Familie og venner' },
          { v: 'generelt', t: '🌍  Litt av alt' }
        ], nokkel: 'maal'
      },
      {
        tittel: 'Hvor mye spansk kan du fra før?',
        under: 'Kan du litt, hopper vi over det aller enkleste.',
        valg: [
          { v: 'ny', t: '🌱  Helt fersk' },
          { v: 'litt', t: '🌿  Kan noen ord' },
          { v: 'god', t: '🌳  Klarer meg litt' }
        ], nokkel: 'niva'
      },
      {
        tittel: 'Hvor mye vil du øve per dag?',
        under: 'Du kan endre dette når som helst.',
        valg: [
          { v: 15, t: '☕  Lite - 15 poeng' },
          { v: 30, t: '🙂  Passe - 30 poeng' },
          { v: 60, t: '🔥  Mye - 60 poeng' }
        ], nokkel: 'dagsmaal'
      }
    ][oppstartSteg];

    var h = lag('h1', null, steg.tittel);
    var p = lag('p', 'dempet', steg.under);
    p.style.margin = '.5rem 0 1.2rem';
    c.appendChild(h); c.appendChild(p);

    if (steg.felt === 'navn') {
      var inn = lag('input', 'sok');
      inn.placeholder = 'Fornavn (valgfritt)';
      inn.value = oppstartSvar.navn;
      inn.addEventListener('input', function () { oppstartSvar.navn = inn.value.trim(); });
      inn.addEventListener('keydown', function (e) { if (e.key === 'Enter') neste(); });
      c.appendChild(inn);
      var k = lag('button', 'kn kn--full', 'Fortsett');
      k.addEventListener('click', neste);
      c.appendChild(k);
    } else {
      var liste = lag('div', 'velg-liste');
      steg.valg.forEach(function (v) {
        var b = lag('button', 'valg__kn', v.t);
        b.addEventListener('click', function () {
          oppstartSvar[steg.nokkel] = v.v;
          neste();
        });
        liste.appendChild(b);
      });
      c.appendChild(liste);
    }

    var prikker = lag('p', 'dempet liten', 'Steg ' + (oppstartSteg + 1) + ' av 4');
    prikker.style.marginTop = '1.5rem';
    c.appendChild(prikker);

    function neste() {
      oppstartSteg++;
      if (oppstartSteg < 4) { tegnOppstart(); return; }
      state.profil.navn = oppstartSvar.navn;
      state.profil.maal = oppstartSvar.maal;
      state.profil.niva = oppstartSvar.niva;
      state.profil.dagsmaal = oppstartSvar.dagsmaal;
      state.oppstartFerdig = true;
      forhaandsapne();
      lagre();
      startApp();
    }
  }

  function forhaandsapne() {
    // Kan du litt fra før? Da låser vi opp (uten poeng) de enkleste leksjonene.
    var apne = { ny: 0, litt: 3, god: 6 }[state.profil.niva] || 0;
    var rekke = alleLeksjoner();
    for (var i = 0; i < apne && i < rekke.length; i++) {
      var id = rekke[i].leksjon.id;
      if (!state.leksjoner[id]) state.leksjoner[id] = { niva: 1, hoppet: true };
    }
  }

  /* ================= stien ================= */
  function tegnSti() {
    var c = $('#sideSti');
    c.innerHTML = '';

    var hei = lag('h1', null, state.profil.navn ? '¡Hola, ' + state.profil.navn + '!' : '¡Hola!');
    c.appendChild(hei);
    var und = lag('p', 'dempet', 'Kort økt nå? Én leksjon tar 3-4 minutter.');
    und.style.margin = '.3rem 0 1.2rem';
    c.appendChild(und);

    // dagsmål
    var maalBoks = lag('div', 'dagsmaal');
    var rad = lag('div', 'dagsmaal__rad');
    rad.appendChild(lag('strong', null, 'Dagens mål'));
    var naadd = dagsXp() >= state.profil.dagsmaal;
    rad.appendChild(lag('span', 'liten dempet', dagsXp() + ' / ' + state.profil.dagsmaal + ' poeng' + (naadd ? '  ✅' : '')));
    maalBoks.appendChild(rad);
    var stolpe = lag('div', 'stolpe');
    var fyll = lag('div', 'stolpe__fyll' + (naadd ? ' stolpe__fyll--gull' : ''));
    fyll.style.width = Math.min(100, Math.round(dagsXp() / state.profil.dagsmaal * 100)) + '%';
    stolpe.appendChild(fyll);
    maalBoks.appendChild(stolpe);
    c.appendChild(maalBoks);

    var rekke = alleLeksjoner();
    var globalIdx = 0;
    enheter().forEach(function (u) {
      var boks = lag('section', 'enhet');
      var forsteIdx = globalIdx;
      var enhetLaast = erLaast(forsteIdx);
      if (enhetLaast) boks.classList.add('enhet--laast');

      var hode = lag('div', 'enhet__hode');
      hode.appendChild(lag('span', 'enhet__merke', 'Nivå ' + u.niva + (enhetLaast ? ' · låst' : '')));
      var h2 = lag('h2');
      h2.appendChild(lag('span', null, u.ikon));
      h2.appendChild(lag('span', null, u.tittel));
      hode.appendChild(h2);
      hode.appendChild(lag('p', null, u.beskrivelse));
      boks.appendChild(hode);

      var liste = lag('div', 'leksjoner');
      u.lessons.forEach(function (l) {
        var idx = globalIdx++;
        var st = leksjonStatus(l.id);
        var laast = erLaast(idx);
        var kn = lag('button', 'leksjon' + (laast ? '' : (st.niva > 0 ? ' leksjon--ferdig' : ' leksjon--klar')));
        kn.disabled = laast;

        var sirkel = lag('div', 'leksjon__sirkel');
        sirkel.innerHTML = laast ? '&#128274;' : (st.niva >= MAKS_KRONER ? '&#127942;' : (st.niva > 0 ? '&#11088;' : '&#9654;&#65039;'));
        kn.appendChild(sirkel);

        var tekst = lag('div', 'leksjon__tekst');
        tekst.appendChild(lag('div', 'leksjon__tittel', l.tittel));
        var meta = l.items.length + ' ord og setninger';
        if (st.hoppet && st.niva === 1) meta = 'Åpnet fordi du kan litt fra før';
        tekst.appendChild(lag('div', 'leksjon__meta', laast ? 'Fullfør leksjonen over først' : meta));
        if (st.niva > 0) {
          tekst.appendChild(lag('div', 'kroner', '★'.repeat(Math.min(st.niva, MAKS_KRONER))));
        }
        kn.appendChild(tekst);
        kn.addEventListener('click', function () { startLeksjon(l.id); });
        liste.appendChild(kn);
      });
      boks.appendChild(liste);
      c.appendChild(boks);
    });
    void rekke;
  }

  /* ================= økt-bygging ================= */
  var okt = null;

  function distraktorer(item, pool, felt, antall) {
    var fasit = normaliser(item[felt]);
    var kand = pool.filter(function (i) { return normaliser(i[felt]) !== fasit; });
    return bland(kand).slice(0, antall);
  }

  function velgType(item, styrke, teller) {
    var flerord = item.es.trim().indexOf(' ') > -1;
    if (styrke <= 0) {
      // Nytt ord: veksle mellom gjenkjenning, produksjon og lytting så det ikke blir ensformig.
      if (teller % 3 === 0) return 'velg-no';
      if (teller % 3 === 2) return flerord ? 'ordbank' : (kanLytte() ? 'lytt' : 'velg-es');
      return 'velg-es';
    }
    if (styrke === 1) return flerord ? 'ordbank' : (kanLytte() && teller % 2 === 0 ? 'lytt' : 'velg-no');
    if (styrke === 2) return kanLytte() && teller % 3 === 0 ? 'lytt' : (flerord ? 'ordbank' : 'skriv');
    return flerord && teller % 2 === 0 ? 'ordbank' : 'skriv';
  }

  function lagOppgave(item, pool, type) {
    var o = { type: type, item: item, pool: pool };
    if (type === 'velg-es') {
      o.alternativer = bland([item].concat(distraktorer(item, pool, 'es', 3)));
    } else if (type === 'velg-no' || type === 'lytt') {
      o.alternativer = bland([item].concat(distraktorer(item, pool, type === 'lytt' ? 'es' : 'no', 3)));
    } else if (type === 'ordbank') {
      var ord = item.es.split(/\s+/);
      var ekstra = [];
      bland(pool).forEach(function (p) {
        if (ekstra.length >= 3) return;
        p.es.split(/\s+/).forEach(function (w) {
          if (ekstra.length < 3 && ord.indexOf(w) === -1 && ekstra.indexOf(w) === -1) ekstra.push(w);
        });
      });
      o.brikker = bland(ord.concat(ekstra));
    }
    return o;
  }

  function svakeOrd(antall, unntaLeksjon) {
    var kandidater = [];
    alleLeksjoner().forEach(function (p) {
      if (unntaLeksjon && p.leksjon.id === unntaLeksjon) return;
      if (leksjonStatus(p.leksjon.id).niva < 1) return;
      p.leksjon.items.forEach(function (it) {
        var s = state.ord[it.es];
        if (!s) return;
        kandidater.push({ item: it, pool: p.leksjon.items, poeng: s.styrke * 1000 + (s.sist || 0) / 1e10 });
      });
    });
    kandidater.sort(function (a, b) { return a.poeng - b.poeng; });
    return kandidater.slice(0, antall);
  }

  function byggLeksjonsOkt(leksjon) {
    var pool = leksjon.items;
    var ko = [];
    var korte = pool.filter(function (i) { return i.es.split(/\s+/).length <= 2; });
    if (korte.length >= 4) {
      ko.push({ type: 'par', par: bland(korte).slice(0, 4), pool: pool });
    }
    var teller = 0;
    var nye = [];
    bland(pool).forEach(function (it) {
      var s = ordStat(it.es);
      var type = velgType(it, s.styrke, teller++);
      ko.push(lagOppgave(it, pool, type));
      if (s.styrke === 0) nye.push(it);
    });
    // nye ord får en ekstra runde bakerst
    bland(nye).slice(0, 4).forEach(function (it) {
      ko.push(lagOppgave(it, pool, it.es.indexOf(' ') > -1 ? 'ordbank' : 'velg-no'));
    });
    // to repetisjoner fra tidligere leksjoner
    svakeOrd(2, leksjon.id).forEach(function (k) {
      ko.splice(Math.floor(ko.length / 2), 0, lagOppgave(k.item, k.pool, 'velg-no'));
    });
    return ko.slice(0, 20);
  }

  function byggRepetisjonsOkt() {
    var svake = svakeOrd(12);
    if (svake.length < 4) return null;
    var teller = 0;
    return bland(svake).map(function (k) {
      return lagOppgave(k.item, k.pool, velgType(k.item, ordStat(k.item.es).styrke, teller++));
    });
  }

  /* ================= leksjonsflyt ================= */
  function startLeksjon(id) {
    fyllHjerter();
    if (state.profil.hjerter && state.hjerter.antall <= 0) { visTomtForLiv(); return; }
    var p = finnLeksjon(id);
    if (!p) return;
    okt = {
      modus: 'leksjon', leksjon: p.leksjon, enhet: p.enhet,
      ko: byggLeksjonsOkt(p.leksjon), indeks: 0, feil: 0, riktige: 0, totalt: 0, tipsVist: false
    };
    okt.totalt = okt.ko.length;
    vis('skjermOving');
    if (p.leksjon.tips) visTips(p.leksjon.tips); else nesteOppgave();
  }

  function startRepetisjon() {
    fyllHjerter();
    var ko = byggRepetisjonsOkt();
    if (!ko) {
      alert('Gjør minst én leksjon først, så har vi noe å repetere.');
      return;
    }
    if (state.profil.hjerter && state.hjerter.antall <= 0) { visTomtForLiv(); return; }
    okt = { modus: 'repetisjon', leksjon: null, enhet: null, ko: ko, indeks: 0, feil: 0, riktige: 0, totalt: ko.length };
    vis('skjermOving');
    nesteOppgave();
  }

  function visTips(tips) {
    var c = $('#ovingInnhold');
    c.innerHTML = '';
    skjulFasit();
    $('#handlingsfelt').classList.remove('skjult');
    var boks = lag('div', 'tipsboks');
    boks.appendChild(lag('span', 'tipsboks__merke', 'Før vi starter'));
    var t = lag('div');
    t.innerHTML = tips;
    boks.appendChild(t);
    c.appendChild(boks);
    settHandling('Kom i gang', false);
    $('#knHopp').classList.add('skjult');
    $('#knSjekk').disabled = false;
    $('#knSjekk').onclick = function () {
      $('#knHopp').classList.remove('skjult');
      nesteOppgave();
    };
  }

  function settHandling(tekst, deaktiver) {
    var k = $('#knSjekk');
    k.textContent = tekst;
    k.disabled = !!deaktiver;
    k.onclick = null;
  }

  function oppdaterStolpe() {
    var gjort = okt.riktige;
    var prosent = okt.totalt ? Math.round(gjort / okt.totalt * 100) : 0;
    $('#ovingStolpe').style.width = Math.min(100, prosent) + '%';
    $('#ovingHjerteTall').textContent = state.hjerter.antall;
    $('#ovingHjerter').classList.toggle('skjult', !state.profil.hjerter);
  }

  var aktiv = null;   // { oppg, hentSvar(), riktigTekst() }

  function nesteOppgave() {
    skjulFasit();
    oppdaterStolpe();
    if (okt.indeks >= okt.ko.length) { fullfor(); return; }
    if (state.profil.hjerter && state.hjerter.antall <= 0) { visTomtForLiv(); return; }
    var oppg = okt.ko[okt.indeks];
    tegnOppgave(oppg);
  }

  function tegnOppgave(oppg) {
    var c = $('#ovingInnhold');
    c.innerHTML = '';
    $('#handlingsfelt').classList.remove('skjult');
    $('#knHopp').classList.remove('skjult');
    settHandling('Sjekk', true);
    $('#knSjekk').onclick = evaluer;
    aktiv = { oppg: oppg, svar: null };

    if (oppg.type === 'par') { tegnPar(oppg, c); return; }

    var sp = lag('div', 'oppgave__sporsmaal');
    if (oppg.type === 'velg-es') sp.textContent = 'Hva heter dette på spansk?';
    else if (oppg.type === 'velg-no') sp.textContent = 'Hva betyr dette?';
    else if (oppg.type === 'lytt') sp.textContent = 'Hva hører du?';
    else if (oppg.type === 'ordbank') sp.textContent = 'Sett sammen setningen på spansk';
    else sp.textContent = 'Skriv på spansk';
    c.appendChild(sp);

    if (oppg.type === 'velg-es' || oppg.type === 'ordbank' || oppg.type === 'skriv') {
      var mal = lag('div', 'mal', oppg.item.no);
      c.appendChild(mal);
    } else if (oppg.type === 'velg-no') {
      var m2 = lag('div', 'mal');
      var f = lag('span', 'frase');
      f.appendChild(lag('span', null, oppg.item.es));
      m2.appendChild(f);
      m2.appendChild(document.createElement('br'));
      var hk = hoyttalerKn(oppg.item.es);
      hk.style.marginTop = '.6rem';
      m2.appendChild(hk);
      c.appendChild(m2);
      si(oppg.item.es);
    } else if (oppg.type === 'lytt') {
      var boks = lag('div');
      boks.style.textAlign = 'center';
      boks.style.margin = '1.5rem 0';
      boks.appendChild(hoyttalerKn(oppg.item.es, true));
      c.appendChild(boks);
      si(oppg.item.es);
    }

    if (oppg.type === 'velg-es' || oppg.type === 'velg-no' || oppg.type === 'lytt') {
      var felt = (oppg.type === 'velg-no') ? 'no' : 'es';
      var valg = lag('div', 'valg');
      oppg.alternativer.forEach(function (alt, i) {
        var b = lag('button', 'valg__kn');
        b.setAttribute('aria-pressed', 'false');
        b.dataset.svar = alt[felt];
        b.appendChild(lag('span', 'valg__nr', String(i + 1)));
        b.appendChild(lag('span', null, alt[felt]));
        b.addEventListener('click', function () {
          valg.querySelectorAll('.valg__kn').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', 'true');
          aktiv.svar = alt;
          if (felt === 'es') si(alt.es);
          $('#knSjekk').disabled = false;
        });
        valg.appendChild(b);
      });
      c.appendChild(valg);
    } else if (oppg.type === 'ordbank') {
      var svarfelt = lag('div', 'svarfelt');
      var bank = lag('div', 'ordbank');
      var valgtOrd = [];
      c.appendChild(svarfelt); c.appendChild(bank);
      oppg.brikker.forEach(function (ord, i) {
        var b = lag('button', 'brikke', ord);
        b.dataset.i = String(i);
        b.addEventListener('click', function () {
          if (b.classList.contains('brikke--brukt')) return;
          b.classList.add('brikke--brukt');
          var s = lag('button', 'brikke', ord);
          s.addEventListener('click', function () {
            b.classList.remove('brikke--brukt');
            s.remove();
            valgtOrd = valgtOrd.filter(function (x) { return x !== s; });
            oppdater();
          });
          valgtOrd.push(s);
          svarfelt.appendChild(s);
          si(ord);
          oppdater();
        });
        bank.appendChild(b);
      });
      function oppdater() {
        aktiv.svar = valgtOrd.map(function (x) { return x.textContent; }).join(' ');
        $('#knSjekk').disabled = valgtOrd.length === 0;
      }
    } else if (oppg.type === 'skriv') {
      var inn = lag('textarea', 'skrivefelt');
      inn.setAttribute('lang', 'es');
      inn.setAttribute('autocapitalize', 'none');
      inn.setAttribute('autocomplete', 'off');
      inn.setAttribute('spellcheck', 'false');
      inn.placeholder = 'Skriv på spansk...';
      inn.addEventListener('input', function () {
        aktiv.svar = inn.value;
        $('#knSjekk').disabled = inn.value.trim() === '';
      });
      inn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); if (!$('#knSjekk').disabled) evaluer(); }
      });
      c.appendChild(inn);
      var hjelp = lag('p', 'dempet liten', 'Aksenter er valgfrie - «manana» godkjennes som «mañana».');
      hjelp.style.marginTop = '.6rem';
      c.appendChild(hjelp);
      setTimeout(function () { inn.focus(); }, 60);
    }
  }

  function tegnPar(oppg, c) {
    $('#handlingsfelt').classList.add('skjult');
    c.appendChild(lag('div', 'oppgave__sporsmaal', 'Finn parene'));
    var venstre = bland(oppg.par), hoyre = bland(oppg.par);
    var rutenett = lag('div', 'par');
    var valgtEs = null, valgtNo = null, igjen = oppg.par.length;

    function knapp(item, felt) {
      var b = lag('button', 'valg__kn par__kn', item[felt]);
      b.addEventListener('click', function () {
        if (b.classList.contains('par__kn--tatt')) return;
        var side = felt === 'es' ? 'valgtEs' : 'valgtNo';
        var forrige = side === 'valgtEs' ? valgtEs : valgtNo;
        if (forrige) forrige.el.setAttribute('aria-pressed', 'false');
        b.setAttribute('aria-pressed', 'true');
        if (felt === 'es') { valgtEs = { el: b, item: item }; si(item.es); }
        else { valgtNo = { el: b, item: item }; }
        if (valgtEs && valgtNo) {
          var rett = valgtEs.item.es === valgtNo.item.es;
          var a = valgtEs, d = valgtNo;
          valgtEs = null; valgtNo = null;
          if (rett) {
            a.el.classList.add('valg__kn--rett'); d.el.classList.add('valg__kn--rett');
            setTimeout(function () {
              a.el.classList.add('par__kn--tatt'); d.el.classList.add('par__kn--tatt');
              a.el.setAttribute('aria-pressed', 'false'); d.el.setAttribute('aria-pressed', 'false');
              igjen--;
              if (igjen === 0) {
                okt.riktige++; okt.indeks++;
                setTimeout(nesteOppgave, 250);
              }
            }, 220);
          } else {
            a.el.classList.add('valg__kn--feil'); d.el.classList.add('valg__kn--feil');
            setTimeout(function () {
              a.el.classList.remove('valg__kn--feil'); d.el.classList.remove('valg__kn--feil');
              a.el.setAttribute('aria-pressed', 'false'); d.el.setAttribute('aria-pressed', 'false');
            }, 500);
          }
        }
      });
      return b;
    }
    for (var i = 0; i < oppg.par.length; i++) {
      rutenett.appendChild(knapp(venstre[i], 'es'));
      rutenett.appendChild(knapp(hoyre[i], 'no'));
    }
    c.appendChild(rutenett);
  }

  /* ================= vurdering ================= */
  function riktigSvarTekst(oppg) {
    if (oppg.type === 'velg-no') return oppg.item.no;
    return oppg.item.es;
  }

  function erRiktig(oppg, svar) {
    if (svar == null) return false;
    if (oppg.type === 'velg-es' || oppg.type === 'lytt') return svar.es === oppg.item.es;
    if (oppg.type === 'velg-no') return svar.no === oppg.item.no;
    var gitt = normaliser(svar), fasit = normaliser(oppg.item.es);
    if (gitt === fasit) return true;
    if (oppg.type === 'skriv' && fasit.length > 6 && avstand(gitt, fasit) <= 1) return true;
    return false;
  }

  function oppdaterOrdstat(item, rett) {
    var s = state.ord[item.es] || { styrke: 0, riktig: 0, feil: 0, sist: 0 };
    if (rett) { s.riktig++; s.styrke = Math.min(3, s.styrke + 1); }
    else { s.feil++; s.styrke = Math.max(0, s.styrke - 1); }
    s.sist = Date.now();
    state.ord[item.es] = s;
  }

  function evaluer() {
    if (!aktiv || !okt) return;
    var oppg = aktiv.oppg;
    var rett = erRiktig(oppg, aktiv.svar);
    oppdaterOrdstat(oppg.item, rett);
    okt.indeks++;
    if (rett) {
      okt.riktige++;
      girXp(1);
      si(oppg.item.es);
    } else {
      okt.feil++;
      if (state.profil.hjerter) state.hjerter.antall = Math.max(0, state.hjerter.antall - 1);
      var kopi = lagOppgave(oppg.item, oppg.pool, oppg.type === 'skriv' ? 'ordbank' : oppg.type);
      if (kopi.type === 'ordbank' && oppg.item.es.indexOf(' ') === -1) kopi = lagOppgave(oppg.item, oppg.pool, 'velg-es');
      kopi.gjentakelse = true;
      okt.ko.push(kopi);
      okt.totalt = okt.ko.length;
    }
    lagre();
    markerValg(oppg, rett);
    oppdaterStolpe();
    visFasit(rett, oppg);
  }

  function markerValg(oppg, rett) {
    var valg = document.querySelector('#ovingInnhold .valg');
    if (!valg) return;
    var felt = oppg.type === 'velg-no' ? 'no' : 'es';
    var fasit = oppg.item[felt];
    valg.querySelectorAll('.valg__kn').forEach(function (b) {
      b.disabled = true;
      if (b.dataset.svar === fasit) b.classList.add('valg__kn--rett');
      else if (b.getAttribute('aria-pressed') === 'true' && !rett) b.classList.add('valg__kn--feil');
    });
  }

  function visFasit(rett, oppg) {
    var f = $('#fasit');
    f.classList.remove('fasit--rett', 'fasit--feil');
    f.classList.add('fasit--vis', rett ? 'fasit--rett' : 'fasit--feil');
    $('#fasitTittel').textContent = rett ? bra() : 'Riktig svar:';
    $('#fasitSvar').textContent = rett ? (oppg.type === 'velg-no' ? oppg.item.es : oppg.item.no) : riktigSvarTekst(oppg);
    $('#handlingsfelt').classList.add('skjult');
    var kn = $('#knFortsett');
    kn.className = 'kn' + (rett ? '' : ' kn--rod');
    kn.focus();
  }
  function skjulFasit() { $('#fasit').classList.remove('fasit--vis'); }
  function bra() {
    var ord = ['¡Muy bien!', '¡Perfecto!', 'Riktig!', '¡Excelente!', 'Sånn ja!', '¡Genial!'];
    return ord[Math.floor(Math.random() * ord.length)];
  }

  function hoppOver() {
    if (!aktiv || !okt) return;
    aktiv.svar = null;
    evaluer();
  }

  function visTomtForLiv() {
    vis('skjermFerdig');
    var c = $('#ferdigInnhold');
    c.innerHTML = '';
    c.appendChild(lag('div', 'feiring__ikon', '💔'));
    c.appendChild(lag('h1', null, 'Tom for liv'));
    var min = Math.max(1, Math.ceil((FYLL_MS - (Date.now() - state.hjerter.sisteFyll)) / 60000));
    c.appendChild(lag('p', 'dempet', 'Du får et nytt liv om ca. ' + min + ' minutter. Eller du kan slå av liv helt - mange voksne lærer bedre uten.'));
    var a = lag('button', 'kn kn--full', 'Øv videre uten liv');
    a.style.marginTop = '1.5rem';
    a.addEventListener('click', function () {
      state.profil.hjerter = false; lagre(); startApp();
    });
    var b = lag('button', 'kn kn--stille kn--full', 'Tilbake til stien');
    b.style.marginTop = '.7rem';
    b.addEventListener('click', startApp);
    c.appendChild(a); c.appendChild(b);
  }

  /* ================= fullført ================= */
  function fullfor() {
    var bonus = okt.feil === 0 ? 5 : 0;
    var grunn = okt.modus === 'leksjon' ? 10 : 8;
    girXp(grunn + bonus);
    if (okt.modus === 'leksjon') {
      var st = state.leksjoner[okt.leksjon.id] || { niva: 0 };
      st.niva = Math.min(MAKS_KRONER, (st.niva || 0) + 1);
      st.hoppet = false;
      state.leksjoner[okt.leksjon.id] = st;
    }
    lagre();

    vis('skjermFerdig');
    var c = $('#ferdigInnhold');
    c.innerHTML = '';
    c.appendChild(lag('div', 'feiring__ikon', okt.feil === 0 ? '🏆' : '🎉'));
    c.appendChild(lag('h1', null, okt.feil === 0 ? '¡Perfecto!' : 'Leksjon fullført!'));
    c.appendChild(lag('p', 'dempet', okt.modus === 'leksjon' ? okt.leksjon.tittel : 'Repetisjon'));

    var rut = lag('div', 'rutenett');
    [
      ['+' + (grunn + bonus), 'Poeng'],
      [Math.round(okt.riktige / Math.max(1, okt.riktige + okt.feil) * 100) + '%', 'Treffsikkerhet'],
      [state.strek.antall, 'Dager på rad']
    ].forEach(function (p) {
      var k = lag('div', 'stat');
      k.appendChild(lag('div', 'stat__tall', String(p[0])));
      k.appendChild(lag('div', 'stat__navn', p[1]));
      rut.appendChild(k);
    });
    c.appendChild(rut);

    if (dagsXp() >= state.profil.dagsmaal) {
      var m = lag('p', null, '🔥 Dagens mål er nådd. Bien hecho!');
      m.style.marginBottom = '1rem';
      c.appendChild(m);
    }

    var v = lag('button', 'kn kn--full', 'Fortsett');
    v.addEventListener('click', startApp);
    c.appendChild(v);
    if (okt.modus === 'leksjon') {
      var igjen = lag('button', 'kn kn--stille kn--full', 'Ta leksjonen en gang til');
      igjen.style.marginTop = '.7rem';
      var id = okt.leksjon.id;
      igjen.addEventListener('click', function () { startLeksjon(id); });
      c.appendChild(igjen);
    }
  }

  /* ================= ordliste ================= */
  function tegnOrdliste() {
    var c = $('#sideOrdliste');
    c.innerHTML = '';
    c.appendChild(lag('h1', null, 'Ordliste'));
    var und = lag('p', 'dempet', 'Alt kurset dekker. Fargestripa viser hvor godt du kan ordet: grå = ikke øvd, rød = fersk, gul = på vei, grønn = sitter.');
    und.style.margin = '.3rem 0 1rem';
    c.appendChild(und);

    var sok = lag('input', 'sok');
    sok.type = 'search';
    sok.placeholder = 'Søk på norsk eller spansk...';
    c.appendChild(sok);
    var holder = lag('div');
    c.appendChild(holder);

    function tegn(filter) {
      holder.innerHTML = '';
      var f = normaliser(filter);
      var treff = 0;
      enheter().forEach(function (u) {
        var rader = [];
        u.lessons.forEach(function (l) {
          l.items.forEach(function (it) {
            if (f && normaliser(it.es).indexOf(f) === -1 && normaliser(it.no).indexOf(f) === -1) return;
            var s = ordStat(it.es);
            var rad = lag('div', 'ord');
            rad.appendChild(lag('div', 'styrke styrke--' + s.styrke));
            var t = lag('div');
            t.style.flex = '1';
            t.appendChild(lag('div', 'ord__es', it.es));
            t.appendChild(lag('div', 'ord__no', it.no));
            rad.appendChild(t);
            rad.appendChild(hoyttalerKn(it.es));
            rader.push(rad);
          });
        });
        if (!rader.length) return;
        treff += rader.length;
        var h = lag('h2', null, u.ikon + ' ' + u.tittel);
        h.style.margin = '1.4rem 0 .4rem';
        holder.appendChild(h);
        rader.forEach(function (r) { holder.appendChild(r); });
      });
      if (!treff) holder.appendChild(lag('p', 'dempet', 'Ingen treff.'));
    }
    sok.addEventListener('input', function () { tegn(sok.value); });
    tegn('');
  }

  /* ================= meg ================= */
  function tegnMeg() {
    var c = $('#sideMeg');
    c.innerHTML = '';
    c.appendChild(lag('h1', null, state.profil.navn || 'Profilen din'));
    var und = lag('p', 'dempet', 'Framgangen ligger lagret i denne nettleseren.');
    und.style.margin = '.3rem 0 1.2rem';
    c.appendChild(und);

    var moett = Object.keys(state.ord).filter(function (k) { return state.ord[k].styrke >= 1; }).length;
    var laert = Object.keys(state.ord).filter(function (k) { return state.ord[k].styrke >= 3; }).length;
    var ferdige = Object.keys(state.leksjoner).filter(function (k) { return state.leksjoner[k].niva > 0 && !state.leksjoner[k].hoppet; }).length;
    var rut = lag('div', 'rutenett');
    [[state.xp, 'Poeng totalt'], [state.strek.antall, 'Dager på rad'], [moett, 'Ord i gang'], [laert, 'Ord godt inne'], [ferdige, 'Leksjoner']].forEach(function (p) {
      var k = lag('div', 'stat');
      k.appendChild(lag('div', 'stat__tall', String(p[0])));
      k.appendChild(lag('div', 'stat__navn', p[1]));
      rut.appendChild(k);
    });
    c.appendChild(rut);

    var kort = lag('div', 'kort');
    kort.style.marginTop = '1.2rem';
    kort.appendChild(lag('h2', null, 'Innstillinger'));

    function veksle(tekst, verdi, endre) {
      var r = lag('div', 'veksle');
      r.appendChild(lag('span', null, tekst));
      var b = lag('button', 'bryter');
      b.setAttribute('role', 'switch');
      b.setAttribute('aria-checked', String(verdi));
      b.setAttribute('aria-label', tekst);
      b.addEventListener('click', function () {
        var ny = b.getAttribute('aria-checked') !== 'true';
        b.setAttribute('aria-checked', String(ny));
        endre(ny); lagre(); oppdaterTopp();
      });
      r.appendChild(b);
      return r;
    }
    kort.appendChild(veksle('Lyd og uttale', state.profil.lyd, function (v) { state.profil.lyd = v; }));
    kort.appendChild(veksle('Liv (mister du alle, må du ta pause)', state.profil.hjerter, function (v) {
      state.profil.hjerter = v;
      if (v) state.hjerter.antall = MAKS_HJERTER;
    }));

    var maalRad = lag('div', 'veksle');
    maalRad.appendChild(lag('span', null, 'Dagsmål'));
    var sel = lag('select', 'kn kn--stille kn--liten');
    [15, 30, 60].forEach(function (v) {
      var o = lag('option', null, v + ' poeng');
      o.value = String(v);
      if (state.profil.dagsmaal === v) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', function () { state.profil.dagsmaal = Number(sel.value); lagre(); });
    maalRad.appendChild(sel);
    kort.appendChild(maalRad);

    var temaRad = lag('div', 'veksle');
    temaRad.appendChild(lag('span', null, 'Fokus'));
    var sel2 = lag('select', 'kn kn--stille kn--liten');
    [['generelt', 'Litt av alt'], ['reise', 'Reise'], ['jobb', 'Jobb'], ['familie', 'Familie'], ['mat', 'Mat']].forEach(function (v) {
      var o = lag('option', null, v[1]);
      o.value = v[0];
      if (state.profil.maal === v[0]) o.selected = true;
      sel2.appendChild(o);
    });
    sel2.addEventListener('change', function () { state.profil.maal = sel2.value; lagre(); tegnSti(); });
    temaRad.appendChild(sel2);
    kort.appendChild(temaRad);
    c.appendChild(kort);

    var fare = lag('div', 'kort');
    fare.appendChild(lag('h2', null, 'Nullstill'));
    fare.appendChild(lag('p', 'dempet liten', 'Sletter all framgang på denne enheten og starter tilpasningen på nytt.'));
    var nk = lag('button', 'kn kn--rod kn--liten', 'Nullstill alt');
    nk.style.marginTop = '.8rem';
    nk.addEventListener('click', function () {
      if (!confirm('Sikker? All framgang forsvinner.')) return;
      state = friskState();
      lagre();
      oppstartSteg = 0;
      oppstartSvar = { navn: '', maal: 'generelt', niva: 'ny', dagsmaal: 30 };
      vis('skjermOppstart');
      tegnOppstart();
    });
    fare.appendChild(nk);
    c.appendChild(fare);
  }

  /* ================= navigasjon ================= */
  function byttSide(side) {
    if (side === 'repeter') { startRepetisjon(); return; }
    $('#sideSti').classList.toggle('skjult', side !== 'sti');
    $('#sideOrdliste').classList.toggle('skjult', side !== 'ordliste');
    $('#sideMeg').classList.toggle('skjult', side !== 'meg');
    document.querySelectorAll('.bunn__kn').forEach(function (b) {
      if (b.dataset.side === side) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    if (side === 'sti') tegnSti();
    if (side === 'ordliste') tegnOrdliste();
    if (side === 'meg') tegnMeg();
    window.scrollTo(0, 0);
  }

  function startApp() {
    okt = null; aktiv = null;
    oppdaterTopp();
    vis('skjermApp');
    byttSide('sti');
  }

  /* ================= oppsett ================= */
  function koble() {
    document.querySelectorAll('.bunn__kn').forEach(function (b) {
      b.addEventListener('click', function () { byttSide(b.dataset.side); });
    });
    $('#knFortsett').addEventListener('click', nesteOppgave);
    $('#knHopp').addEventListener('click', hoppOver);
    $('#ovingLukk').addEventListener('click', function () {
      if (okt && okt.indeks > 0 && !confirm('Avslutte leksjonen? Framgangen i denne økta forsvinner.')) return;
      startApp();
    });
    document.addEventListener('keydown', function (e) {
      if ($('#skjermOving').classList.contains('skjult')) return;
      if (e.key === 'Enter') {
        if ($('#fasit').classList.contains('fasit--vis')) { e.preventDefault(); nesteOppgave(); }
        else if (!$('#knSjekk').disabled && document.activeElement.tagName !== 'TEXTAREA') { e.preventDefault(); $('#knSjekk').click(); }
        return;
      }
      if (/^[1-4]$/.test(e.key) && document.activeElement.tagName !== 'TEXTAREA') {
        var kn = document.querySelectorAll('#ovingInnhold .valg > .valg__kn')[Number(e.key) - 1];
        if (kn) { kn.click(); e.preventDefault(); }
      }
    });
  }

  function start() {
    if (!KURS || !KURS.units) { document.body.textContent = 'Kursinnholdet lastet ikke.'; return; }
    lastState();
    koble();
    if (!state.oppstartFerdig) { vis('skjermOppstart'); tegnOppstart(); }
    else { startApp(); }
    setInterval(function () { if (!$('#skjermApp').classList.contains('skjult')) oppdaterTopp(); }, 60000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
