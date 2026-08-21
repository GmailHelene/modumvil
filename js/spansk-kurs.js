/* Kursinnhold for Spansk for nordmenn.
   Ligger som JS (ikke JSON) slik at kurset også virker når filen apnes lokalt.
   Hvert element: { es, no, alt: [godkjente alternative norske svar], tips }        */
window.SPANSK_KURS = {
  meta: {
    tittel: "Spansk, steg for steg",
    fra: "norsk",
    til: "spansk",
    versjon: 1
  },
  units: [
    {
      id: "u1", tittel: "Hei og hallo", ikon: "\u{1F44B}", niva: "A1", spor: "kjerne",
      beskrivelse: "De første ordene: hilsener, høflighet og å presentere seg.",
      lessons: [
        {
          id: "u1l1", tittel: "Hilsener",
          tips: "På spansk hilser man med tid på døgnet: <b>buenos días</b> (morgen), <b>buenas tardes</b> (etter lunsj) og <b>buenas noches</b> (kveld/natt).",
          items: [
            { es: "hola", no: "hei", alt: ["hallo"] },
            { es: "buenos días", no: "god morgen", alt: ["god dag"] },
            { es: "buenas tardes", no: "god ettermiddag" },
            { es: "buenas noches", no: "god kveld", alt: ["god natt"] },
            { es: "adiós", no: "ha det" },
            { es: "hasta luego", no: "vi ses senere", alt: ["på gjensyn"] },
            { es: "gracias", no: "takk" },
            { es: "por favor", no: "vær så snill", alt: ["takk"] },
            { es: "sí", no: "ja" },
            { es: "no", no: "nei" },
            { es: "Hola, ¿qué tal?", no: "Hei, hvordan går det?" },
            { es: "Muchas gracias.", no: "Tusen takk." }
          ]
        },
        {
          id: "u1l2", tittel: "Hvordan går det?",
          tips: "<b>¿Cómo estás?</b> bruker verbet <i>estar</i>, som handler om tilstand her og nå. Legg merke til det opp-ned spørsmålstegnet <b>¿</b> først i setningen.",
          items: [
            { es: "¿Cómo estás?", no: "Hvordan har du det?", alt: ["hvordan går det"] },
            { es: "Estoy bien.", no: "Jeg har det bra." },
            { es: "Estoy muy bien, gracias.", no: "Jeg har det veldig bra, takk." },
            { es: "¿Y tú?", no: "Og du?" },
            { es: "más o menos", no: "sånn passe", alt: ["så som så"] },
            { es: "Estoy cansada.", no: "Jeg er sliten." },
            { es: "Lo siento.", no: "Jeg beklager.", alt: ["beklager"] },
            { es: "De nada.", no: "Ingen årsak.", alt: ["bare hyggelig"] },
            { es: "perdón", no: "unnskyld" },
            { es: "hasta mañana", no: "vi ses i morgen" }
          ]
        },
        {
          id: "u1l3", tittel: "Presentere seg",
          tips: "<b>Me llamo</b> betyr ordrett «jeg kaller meg». Landet skrives med stor bokstav (<i>Noruega</i>), men nasjonaliteten med liten (<i>noruega</i>).",
          items: [
            { es: "¿Cómo te llamas?", no: "Hva heter du?" },
            { es: "Me llamo Helene.", no: "Jeg heter Helene." },
            { es: "Mucho gusto.", no: "Hyggelig å møte deg." },
            { es: "¿De dónde eres?", no: "Hvor er du fra?" },
            { es: "Soy de Noruega.", no: "Jeg er fra Norge." },
            { es: "Soy noruega.", no: "Jeg er norsk." },
            { es: "Hablo un poco de español.", no: "Jeg snakker litt spansk." },
            { es: "No entiendo.", no: "Jeg forstår ikke." },
            { es: "¿Hablas inglés?", no: "Snakker du engelsk?" },
            { es: "¿Puedes repetir, por favor?", no: "Kan du gjenta, vær så snill?" }
          ]
        }
      ]
    },
    {
      id: "u2", tittel: "Folk og familie", ikon: "\u{1F46A}", niva: "A1", spor: "kjerne",
      beskrivelse: "Pronomen, familieord og de to «er»-verbene ser og estar.",
      lessons: [
        {
          id: "u2l1", tittel: "Personer",
          tips: "Spansk dropper ofte pronomenet: <b>Soy noruega</b> holder, du trenger ikke si <i>yo</i>. Alle substantiv har kjønn: <b>el</b> (hankjønn) eller <b>la</b> (hunkjønn).",
          items: [
            { es: "yo", no: "jeg" },
            { es: "tú", no: "du" },
            { es: "él", no: "han" },
            { es: "ella", no: "hun" },
            { es: "nosotros", no: "vi" },
            { es: "ellos", no: "de" },
            { es: "el hombre", no: "mannen" },
            { es: "la mujer", no: "kvinnen" },
            { es: "el niño", no: "gutten", alt: ["barnet"] },
            { es: "la niña", no: "jenta" },
            { es: "el amigo", no: "vennen" },
            { es: "Ella es mi amiga.", no: "Hun er venninnen min." }
          ]
        },
        {
          id: "u2l2", tittel: "Familien",
          tips: "<b>Mi</b> = min/mitt, <b>mis</b> = mine. Flertall lages stort sett med <b>-s</b>: <i>hijo</i> → <i>hijos</i>.",
          items: [
            { es: "la familia", no: "familien" },
            { es: "la madre", no: "moren" },
            { es: "el padre", no: "faren" },
            { es: "la hermana", no: "søsteren" },
            { es: "el hermano", no: "broren" },
            { es: "la hija", no: "datteren" },
            { es: "el hijo", no: "sønnen" },
            { es: "los abuelos", no: "besteforeldrene" },
            { es: "la esposa", no: "kona" },
            { es: "Tengo dos hijos.", no: "Jeg har to barn." },
            { es: "Mi madre vive en Noruega.", no: "Moren min bor i Norge." },
            { es: "¿Tienes hermanos?", no: "Har du søsken?" }
          ]
        },
        {
          id: "u2l3", tittel: "Ser eller estar",
          tips: "<b>Ser</b> brukes om det varige (yrke, opphav, hvem du er). <b>Estar</b> brukes om tilstand og sted (hvor noe er, hvordan du har det akkurat nå).",
          items: [
            { es: "soy", no: "jeg er" },
            { es: "eres", no: "du er" },
            { es: "es", no: "han er", alt: ["hun er", "det er"] },
            { es: "somos", no: "vi er" },
            { es: "son", no: "de er" },
            { es: "estoy", no: "jeg er (nå)", alt: ["jeg er", "jeg befinner meg"] },
            { es: "Soy profesora.", no: "Jeg er lærer." },
            { es: "¿Dónde está el baño?", no: "Hvor er toalettet?" },
            { es: "Estoy en casa.", no: "Jeg er hjemme." },
            { es: "La casa es grande.", no: "Huset er stort." }
          ]
        }
      ]
    },
    {
      id: "u3", tittel: "Mat og drikke", ikon: "\u{1F35E}", niva: "A1", spor: "kjerne",
      beskrivelse: "Handle, bestille og si hva du liker å spise.",
      lessons: [
        {
          id: "u3l1", tittel: "Mat",
          tips: "Verbet <b>comer</b> (å spise): <i>como, comes, come, comemos, comen</i>.",
          items: [
            { es: "el pan", no: "brødet" },
            { es: "el queso", no: "osten" },
            { es: "la carne", no: "kjøttet" },
            { es: "el pescado", no: "fisken" },
            { es: "la fruta", no: "frukten" },
            { es: "la manzana", no: "eplet" },
            { es: "el huevo", no: "egget" },
            { es: "el arroz", no: "risen" },
            { es: "la ensalada", no: "salaten" },
            { es: "la sopa", no: "suppen" },
            { es: "Como pan con queso.", no: "Jeg spiser brød med ost." },
            { es: "Tengo hambre.", no: "Jeg er sulten." }
          ]
        },
        {
          id: "u3l2", tittel: "Drikke",
          tips: "<b>Quiero</b> (jeg vil ha) er den mest nyttige formen du lærer i dag: <i>Quiero un café, por favor.</i>",
          items: [
            { es: "el agua", no: "vannet" },
            { es: "el café", no: "kaffen" },
            { es: "el té", no: "teen" },
            { es: "la leche", no: "melken" },
            { es: "el vino", no: "vinen" },
            { es: "la cerveza", no: "ølen" },
            { es: "el zumo", no: "juicen" },
            { es: "Quiero un café, por favor.", no: "Jeg vil ha en kaffe, takk." },
            { es: "Bebo agua.", no: "Jeg drikker vann." },
            { es: "sin azúcar", no: "uten sukker" },
            { es: "Tengo sed.", no: "Jeg er tørst." }
          ]
        },
        {
          id: "u3l3", tittel: "På restaurant",
          tips: "«Regningen, takk» heter <b>La cuenta, por favor</b> — og den kommer sjelden før du ber om den.",
          items: [
            { es: "la carta", no: "menyen" },
            { es: "la cuenta", no: "regningen" },
            { es: "el camarero", no: "servitøren" },
            { es: "La cuenta, por favor.", no: "Regningen, takk." },
            { es: "¿Qué quieres comer?", no: "Hva vil du spise?" },
            { es: "¿Tienen mesa para dos?", no: "Har dere bord for to?" },
            { es: "Está muy rico.", no: "Det smaker veldig godt." },
            { es: "Soy vegetariana.", no: "Jeg er vegetarianer." },
            { es: "¿Cuánto cuesta?", no: "Hvor mye koster det?" },
            { es: "¿Puedo pagar con tarjeta?", no: "Kan jeg betale med kort?" }
          ]
        }
      ]
    },
    {
      id: "u4", tittel: "Tall og tid", ikon: "\u{1F551}", niva: "A1", spor: "kjerne",
      beskrivelse: "Tall, klokkeslett, ukedager og priser.",
      lessons: [
        {
          id: "u4l1", tittel: "Tall 1–20",
          tips: "16–19 skrives i ett ord: <i>dieciséis, diecisiete, dieciocho, diecinueve</i>.",
          items: [
            { es: "uno", no: "én" },
            { es: "dos", no: "to" },
            { es: "tres", no: "tre" },
            { es: "cuatro", no: "fire" },
            { es: "cinco", no: "fem" },
            { es: "seis", no: "seks" },
            { es: "siete", no: "sju", alt: ["syv"] },
            { es: "ocho", no: "åtte" },
            { es: "nueve", no: "ni" },
            { es: "diez", no: "ti" },
            { es: "once", no: "elleve" },
            { es: "doce", no: "tolv" },
            { es: "quince", no: "femten" },
            { es: "veinte", no: "tjue" }
          ]
        },
        {
          id: "u4l2", tittel: "Klokka og dagene",
          tips: "Klokka: <b>Es la una</b> (kl. 1), men <b>Son las dos/tres...</b> for alle andre. Ukedagene skrives med liten bokstav.",
          items: [
            { es: "¿Qué hora es?", no: "Hva er klokka?" },
            { es: "Son las tres.", no: "Klokka er tre." },
            { es: "lunes", no: "mandag" },
            { es: "martes", no: "tirsdag" },
            { es: "miércoles", no: "onsdag" },
            { es: "jueves", no: "torsdag" },
            { es: "viernes", no: "fredag" },
            { es: "sábado", no: "lørdag" },
            { es: "domingo", no: "søndag" },
            { es: "hoy", no: "i dag" },
            { es: "mañana", no: "i morgen" },
            { es: "ayer", no: "i går" },
            { es: "el fin de semana", no: "helgen" }
          ]
        },
        {
          id: "u4l3", tittel: "Priser og mengder",
          tips: "<b>Cuesta</b> = det koster. <b>¿Cuánto es todo?</b> = hvor mye blir det til sammen?",
          items: [
            { es: "cien", no: "hundre" },
            { es: "doscientos", no: "to hundre" },
            { es: "mil", no: "tusen" },
            { es: "el euro", no: "euroen" },
            { es: "barato", no: "billig" },
            { es: "caro", no: "dyr" },
            { es: "mucho", no: "mye" },
            { es: "poco", no: "lite" },
            { es: "medio kilo", no: "en halv kilo" },
            { es: "¿Cuánto es todo?", no: "Hvor mye blir det til sammen?" },
            { es: "Es demasiado caro.", no: "Det er for dyrt." }
          ]
        }
      ]
    },
    {
      id: "u5", tittel: "På reise", ikon: "✈️", niva: "A1", spor: "reise",
      beskrivelse: "Transport, hotell, veibeskrivelse og nødfraser.",
      lessons: [
        {
          id: "u5l1", tittel: "Komme seg fram",
          tips: "For veibeskrivelse trenger du bare tre ord: <b>izquierda</b> (venstre), <b>derecha</b> (høyre), <b>recto</b> (rett fram).",
          items: [
            { es: "el tren", no: "toget" },
            { es: "el autobús", no: "bussen" },
            { es: "el avión", no: "flyet" },
            { es: "el billete", no: "billetten" },
            { es: "la estación", no: "stasjonen" },
            { es: "el aeropuerto", no: "flyplassen" },
            { es: "¿Dónde está la estación?", no: "Hvor er stasjonen?" },
            { es: "a la izquierda", no: "til venstre" },
            { es: "a la derecha", no: "til høyre" },
            { es: "todo recto", no: "rett fram" },
            { es: "Un billete a Madrid, por favor.", no: "En billett til Madrid, takk." }
          ]
        },
        {
          id: "u5l2", tittel: "På hotellet",
          tips: "<b>Hay</b> betyr «det finnes / det er»: <i>¿Hay wifi?</i>",
          items: [
            { es: "el hotel", no: "hotellet" },
            { es: "la habitación", no: "rommet" },
            { es: "la llave", no: "nøkkelen" },
            { es: "una noche", no: "én natt" },
            { es: "la reserva", no: "reservasjonen" },
            { es: "Tengo una reserva.", no: "Jeg har en reservasjon." },
            { es: "¿Hay wifi?", no: "Finnes det wifi?" },
            { es: "el desayuno", no: "frokosten" },
            { es: "la maleta", no: "kofferten" },
            { es: "la playa", no: "stranden" }
          ]
        },
        {
          id: "u5l3", tittel: "Når noe skjer",
          tips: "<b>Me duele...</b> = jeg har vondt i ... <i>Me duele la cabeza</i> = jeg har hodepine.",
          items: [
            { es: "¡Ayuda!", no: "Hjelp!" },
            { es: "Estoy perdida.", no: "Jeg har gått meg bort." },
            { es: "¿Puede ayudarme?", no: "Kan du hjelpe meg?" },
            { es: "No hablo español muy bien.", no: "Jeg snakker ikke så godt spansk." },
            { es: "la farmacia", no: "apoteket" },
            { es: "el médico", no: "legen" },
            { es: "Me duele la cabeza.", no: "Jeg har hodepine." },
            { es: "la policía", no: "politiet" },
            { es: "¿Dónde puedo comprar agua?", no: "Hvor kan jeg kjøpe vann?" },
            { es: "He perdido mi teléfono.", no: "Jeg har mistet telefonen min." }
          ]
        }
      ]
    },
    {
      id: "u6", tittel: "Hverdagen", ikon: "☀️", niva: "A1", spor: "kjerne",
      beskrivelse: "Vanlige verb, presens og å fortelle om dagen din.",
      lessons: [
        {
          id: "u6l1", tittel: "Vanlige verb",
          tips: "Alle spanske verb i infinitiv ender på <b>-ar</b>, <b>-er</b> eller <b>-ir</b>. Endelsen bestemmer hvordan verbet bøyes.",
          items: [
            { es: "hablar", no: "å snakke" },
            { es: "comer", no: "å spise" },
            { es: "beber", no: "å drikke" },
            { es: "vivir", no: "å bo", alt: ["å leve"] },
            { es: "trabajar", no: "å jobbe" },
            { es: "estudiar", no: "å studere" },
            { es: "querer", no: "å ville ha" },
            { es: "tener", no: "å ha" },
            { es: "ir", no: "å dra", alt: ["å gå"] },
            { es: "hacer", no: "å gjøre" }
          ]
        },
        {
          id: "u6l2", tittel: "Presens",
          tips: "<b>hablar</b>: hablo, hablas, habla, hablamos, habláis, hablan. Samme mønster for alle vanlige -ar-verb.",
          items: [
            { es: "hablo", no: "jeg snakker" },
            { es: "hablas", no: "du snakker" },
            { es: "habla", no: "han snakker", alt: ["hun snakker"] },
            { es: "hablamos", no: "vi snakker" },
            { es: "hablan", no: "de snakker" },
            { es: "Estudio español.", no: "Jeg studerer spansk." },
            { es: "¿Dónde trabajas?", no: "Hvor jobber du?" },
            { es: "Vivo en Noruega.", no: "Jeg bor i Norge." },
            { es: "No trabajo hoy.", no: "Jeg jobber ikke i dag." }
          ]
        },
        {
          id: "u6l3", tittel: "Dagen min",
          tips: "Tid på dagen: <b>por la mañana</b> (om morgenen), <b>por la tarde</b> (på ettermiddagen), <b>por la noche</b> (om kvelden).",
          items: [
            { es: "Me levanto a las siete.", no: "Jeg står opp klokka sju." },
            { es: "por la mañana", no: "om morgenen" },
            { es: "por la tarde", no: "på ettermiddagen" },
            { es: "por la noche", no: "om kvelden" },
            { es: "todos los días", no: "hver dag" },
            { es: "a veces", no: "av og til" },
            { es: "siempre", no: "alltid" },
            { es: "nunca", no: "aldri" },
            { es: "Voy al trabajo en coche.", no: "Jeg drar på jobb med bil." },
            { es: "Estoy muy ocupada.", no: "Jeg er veldig opptatt." }
          ]
        }
      ]
    },
    {
      id: "u7", tittel: "Jobb og hjem", ikon: "\u{1F3E0}", niva: "A2", spor: "jobb",
      beskrivelse: "Arbeidsliv, boligen din og å beskrive ting.",
      lessons: [
        {
          id: "u7l1", tittel: "På jobb",
          tips: "<b>¿A qué te dedicas?</b> er den vanlige måten å spørre «hva jobber du med?».",
          items: [
            { es: "el trabajo", no: "jobben" },
            { es: "la oficina", no: "kontoret" },
            { es: "el jefe", no: "sjefen" },
            { es: "la reunión", no: "møtet" },
            { es: "el correo electrónico", no: "e-posten" },
            { es: "el ordenador", no: "datamaskinen" },
            { es: "Trabajo desde casa.", no: "Jeg jobber hjemmefra." },
            { es: "¿A qué te dedicas?", no: "Hva jobber du med?" },
            { es: "Soy enfermera.", no: "Jeg er sykepleier." },
            { es: "Tengo una reunión a las diez.", no: "Jeg har et møte klokka ti." }
          ]
        },
        {
          id: "u7l2", tittel: "Hjemme",
          tips: "<b>Casa</b> er hus, <b>piso</b> er leilighet (i Spania). I Latin-Amerika sier man ofte <i>departamento</i>.",
          items: [
            { es: "la casa", no: "huset" },
            { es: "el piso", no: "leiligheten" },
            { es: "la cocina", no: "kjøkkenet" },
            { es: "el dormitorio", no: "soverommet" },
            { es: "el baño", no: "badet" },
            { es: "la mesa", no: "bordet" },
            { es: "la silla", no: "stolen" },
            { es: "la ventana", no: "vinduet" },
            { es: "la puerta", no: "døren" },
            { es: "Vivo en un piso pequeño.", no: "Jeg bor i en liten leilighet." }
          ]
        },
        {
          id: "u7l3", tittel: "Beskrive ting",
          tips: "Adjektivet kommer som regel <b>etter</b> substantivet og retter seg etter kjønn: <i>una casa bonita</i>, <i>un piso bonito</i>.",
          items: [
            { es: "grande", no: "stor" },
            { es: "pequeño", no: "liten" },
            { es: "bonito", no: "pen", alt: ["fin"] },
            { es: "nuevo", no: "ny" },
            { es: "viejo", no: "gammel" },
            { es: "fácil", no: "lett", alt: ["enkel"] },
            { es: "difícil", no: "vanskelig" },
            { es: "La casa es muy bonita.", no: "Huset er veldig pent." },
            { es: "Es un poco caro.", no: "Det er litt dyrt." },
            { es: "El español no es difícil.", no: "Spansk er ikke vanskelig." }
          ]
        }
      ]
    },
    {
      id: "u8", tittel: "Før og etter", ikon: "\u{1F5FA}️", niva: "A2", spor: "kjerne",
      beskrivelse: "Fortelle om det som har skjedd, planer framover og småprat.",
      lessons: [
        {
          id: "u8l1", tittel: "Fortid",
          tips: "Enkel fortid (pretérito) for -ar-verb: <i>hablé, hablaste, habló</i>. <b>Ir</b> og <b>ser</b> deler samme uregelrette form: <i>fui</i>.",
          items: [
            { es: "Ayer fui a la playa.", no: "I går dro jeg til stranden." },
            { es: "¿Qué hiciste ayer?", no: "Hva gjorde du i går?" },
            { es: "Comí en un restaurante.", no: "Jeg spiste på en restaurant." },
            { es: "Trabajé mucho.", no: "Jeg jobbet mye." },
            { es: "No hice nada.", no: "Jeg gjorde ingenting." },
            { es: "la semana pasada", no: "forrige uke" },
            { es: "Fue muy divertido.", no: "Det var veldig gøy." },
            { es: "Hablé con mi madre.", no: "Jeg snakket med moren min." }
          ]
        },
        {
          id: "u8l2", tittel: "Planer",
          tips: "Framtid på den enkle måten: <b>voy a</b> + infinitiv = «jeg skal». <i>Voy a viajar.</i>",
          items: [
            { es: "Mañana voy a trabajar.", no: "I morgen skal jeg jobbe." },
            { es: "Quiero viajar a España.", no: "Jeg vil reise til Spania." },
            { es: "el año que viene", no: "neste år" },
            { es: "Tengo ganas de ir.", no: "Jeg har lyst til å dra." },
            { es: "Me gustaría aprender más.", no: "Jeg vil gjerne lære mer." },
            { es: "¿Qué vas a hacer?", no: "Hva skal du gjøre?" },
            { es: "quizás", no: "kanskje" },
            { es: "Vamos a ver.", no: "Vi får se." }
          ]
        },
        {
          id: "u8l3", tittel: "Småprat",
          tips: "<b>Me gusta</b> + entall, <b>me gustan</b> + flertall. <i>Me gusta el café</i>, men <i>me gustan los perros</i>.",
          items: [
            { es: "¿Qué te gusta hacer?", no: "Hva liker du å gjøre?" },
            { es: "Me gusta leer.", no: "Jeg liker å lese." },
            { es: "Me encanta el sol.", no: "Jeg elsker sola." },
            { es: "No me gusta el frío.", no: "Jeg liker ikke kulda." },
            { es: "Hace buen tiempo.", no: "Det er fint vær." },
            { es: "Hace frío.", no: "Det er kaldt." },
            { es: "¿Qué tal el fin de semana?", no: "Hvordan var helgen?" },
            { es: "Nos vemos.", no: "Vi ses." },
            { es: "¡Que tengas un buen día!", no: "Ha en fin dag!" }
          ]
        }
      ]
    }
  ]
};
