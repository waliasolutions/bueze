import { TreePine, Layers, Zap, Paintbrush, Truck, Grid3x3, Package, Sprout, Lightbulb, Palette, Box, Home, ChefHat, Wrench } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface ServiceType {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface CategoryContent {
  formCategory: string;
  title: string;
  description: string;
  services: ServiceType[];
  faq: FAQItem[];
  metaTitle: string;
  metaDescription: string;
}

export const categoryContent: Record<string, CategoryContent> = {
  flooring: {
    formCategory: 'bodenleger',
    title: 'Parkett & Boden – Ihr Fussboden in Expertenhand',
    description: 'Von der Verlegung über die Reparatur bis zur Pflege: Finden Sie qualifizierte Bodenleger aus Ihrer Region. Erhalten Sie kostenlos mehrere Offerten und vergleichen Sie in Ruhe.',
    services: [
      {
        icon: Layers,
        title: 'Parkett & Laminat verlegen',
        description: 'Ob klassisches Eichenparkett oder pflegeleichtes Laminat – ein professionell verlegter Holzboden wertet jeden Raum auf. Unsere Bodenleger beraten Sie zu Material, Verlegemuster und Pflege, damit Ihr Fussboden lange schön bleibt.',
      },
      {
        icon: Grid3x3,
        title: 'Bodenfliesen & Platten',
        description: 'Fliesen in Steinoptik, Betonoptik oder klassischem Design – moderne Bodenfliesen sind vielseitig und langlebig. Lassen Sie sich von erfahrenen Fliesenlegern beraten und profitieren Sie von sauberer, fachgerechter Verlegung.',
      },
      {
        icon: Package,
        title: 'Flexible Bodenbeläge',
        description: 'Teppich sorgt für Wärme und Behaglichkeit, PVC und Linoleum überzeugen durch Pflegeleichtigkeit. Egal welcher Belag zu Ihrem Zuhause passt – finden Sie den richtigen Fachmann für eine reibungslose Umsetzung.',
      },
    ],
    faq: [
      {
        question: 'Wie lange dauert die Verlegung eines neuen Bodens?',
        answer: 'Das hängt von der Raumgrösse und dem Material ab. Parkett oder Laminat sind oft in 1-2 Tagen verlegt, während Fliesen mehr Zeit benötigen. Die Handwerker geben Ihnen in der Offerte eine genaue Zeitplanung.',
      },
      {
        question: 'Kann ich meinen alten Boden selbst entfernen?',
        answer: 'Grundsätzlich ja, aber viele Bodenleger bieten die Entfernung des alten Belags als Teil ihrer Leistung an. Das spart Zeit und sorgt für einen sauberen Untergrund.',
      },
      {
        question: 'Wie teuer ist ein neuer Fussboden?',
        answer: 'Die Kosten variieren je nach Material und Fläche. Laminat ist günstiger als Echtholzparkett, Fliesen liegen preislich dazwischen. Mit Büeze.ch erhalten Sie mehrere Offerten zum Vergleich – völlig kostenlos.',
      },
    ],
    metaTitle: 'Parkett & Boden verlegen',
    metaDescription: 'Finden Sie qualifizierte Bodenleger für Parkett, Laminat, Fliesen und mehr. Kostenlose Offerten aus Ihrer Region.',
  },
  
  garden: {
    formCategory: 'gartenbau',
    title: 'Gartenbau – Ihr Aussenbereich in besten Händen',
    description: 'Ob Neuanlage, Pflege oder Umgestaltung: Professionelle Gartenbauer verwandeln Ihren Aussenbereich in eine grüne Oase. Holen Sie kostenlos Offerten ein und finden Sie den passenden Fachmann.',
    services: [
      {
        icon: Sprout,
        title: 'Gartengestaltung & Bepflanzung',
        description: 'Von der Planung bis zur Umsetzung: Lassen Sie sich Ihren Traumgarten anlegen. Professionelle Gartenbauer beraten Sie bei der Pflanzenauswahl und setzen kreative Konzepte für Ihr Grün um.',
      },
      {
        icon: TreePine,
        title: 'Gartenpflege & Unterhalt',
        description: 'Regelmässiger Schnitt, Rasenpflege und Unkrautbekämpfung – für einen gepflegten Garten das ganze Jahr. Unsere Fachleute kümmern sich um alles, damit Sie Ihren Garten einfach geniessen können.',
      },
      {
        icon: Home,
        title: 'Terrassenbau & Wege',
        description: 'Schaffen Sie neue Lebensräume im Freien mit professionell angelegten Terrassen und Gartenwegen. Holz, Stein oder Beton – die Wahl liegt bei Ihnen.',
      },
    ],
    faq: [
      {
        question: 'Wann ist der beste Zeitpunkt für Gartenarbeiten?',
        answer: 'Das kommt auf die Art der Arbeit an. Pflanzungen erfolgen idealerweise im Frühjahr oder Herbst, während Rasenarbeiten und Schnitte über die ganze Vegetationsperiode möglich sind. Terrassenbau geht auch im Sommer.',
      },
      {
        question: 'Muss ich Pflanzen selbst besorgen?',
        answer: 'Die meisten Gartenbauer können Pflanzen direkt über ihre Partner beziehen und liefern. Das ist oft günstiger und spart Ihnen den Transport grosser Mengen.',
      },
      {
        question: 'Was kostet eine Gartenumgestaltung?',
        answer: 'Die Kosten variieren stark je nach Grösse und gewünschten Arbeiten. Eine einfache Bepflanzung ist günstiger als ein kompletter Terrassenbau. Mit Büeze.ch erhalten Sie mehrere Offerten zur freien Auswahl.',
      },
    ],
    metaTitle: 'Gartenbau & Gartengestaltung',
    metaDescription: 'Professionelle Gartenbauer für Gartengestaltung, Pflege und Terrassenbau. Kostenlose Offerten aus Ihrer Region.',
  },
  
  electrical: {
    formCategory: 'elektriker',
    title: 'Elektroarbeiten – Sicher und fachgerecht',
    description: 'Von der Steckdose bis zur Hausinstallation: Elektriker sorgen für Sicherheit und Komfort. Finden Sie qualifizierte Elektrofachkräfte aus Ihrer Region und erhalten Sie unverbindliche Offerten.',
    services: [
      {
        icon: Zap,
        title: 'Installation & Erweiterung',
        description: 'Neue Steckdosen, Lichtschalter oder komplette Elektroinstallationen – fachgerecht und nach Norm. Unsere Elektriker planen mit Ihnen die optimale Lösung für Ihr Zuhause.',
      },
      {
        icon: Lightbulb,
        title: 'Beleuchtungskonzepte',
        description: 'Indirektes Licht, LED-Strips oder moderne Lichtsysteme – setzen Sie Ihr Zuhause ins rechte Licht. Professionelle Elektrofachkräfte realisieren Ihre Beleuchtungswünsche.',
      },
      {
        icon: Zap,
        title: 'Reparatur & Wartung',
        description: 'Wenn\'s nicht mehr funktioniert: Schnelle Fehlersuche und zuverlässige Reparaturen. Von der Sicherung bis zum Verteilerkasten – unsere Elektriker lösen Ihr Problem.',
      },
    ],
    faq: [
      {
        question: 'Brauche ich für Elektroarbeiten eine Bewilligung?',
        answer: 'Für grössere Installationen kann eine Bewilligung nötig sein. Professionelle Elektriker wissen, welche Vorschriften gelten, und kümmern sich bei Bedarf um die Formalitäten.',
      },
      {
        question: 'Wie schnell kann ein Elektriker kommen?',
        answer: 'Bei Notfällen reagieren viele Elektriker innerhalb weniger Stunden. Für geplante Arbeiten vereinbaren Sie einfach einen passenden Termin über Büeze.ch.',
      },
      {
        question: 'Was kostet eine Elektroinstallation?',
        answer: 'Die Kosten hängen vom Umfang ab. Eine neue Steckdose ist günstiger als eine komplette Hausinstallation. Mit Büeze.ch vergleichen Sie Offerten und finden den besten Preis.',
      },
    ],
    metaTitle: 'Elektroarbeiten & Elektroinstallationen',
    metaDescription: 'Qualifizierte Elektriker für Installationen, Beleuchtung und Reparaturen. Kostenlose Offerten aus Ihrer Region.',
  },
  
  painting: {
    formCategory: 'maler',
    title: 'Malerarbeiten – Frische Farbe für Ihr Zuhause',
    description: 'Ein neuer Anstrich verleiht jedem Raum neues Leben. Finden Sie erfahrene Maler, die sauber arbeiten und Ihre Wünsche umsetzen. Holen Sie jetzt kostenlose Offerten ein.',
    services: [
      {
        icon: Paintbrush,
        title: 'Innenräume streichen',
        description: 'Ob Wohnzimmer, Schlafzimmer oder Flur – frische Farbe schafft Wohlfühlatmosphäre. Professionelle Maler beraten Sie bei der Farbwahl und sorgen für ein perfektes Ergebnis.',
      },
      {
        icon: Home,
        title: 'Fassadenanstrich',
        description: 'Schützen und verschönern Sie Ihre Hausfassade mit einem professionellen Aussenanstrich. Wetterbeständige Farben und saubere Ausführung garantieren lange Haltbarkeit.',
      },
      {
        icon: Palette,
        title: 'Spezialarbeiten',
        description: 'Spachteln, Tapezieren oder Effektlackierungen – für individuelle Gestaltungswünsche. Unsere Maler setzen auch ausgefallene Ideen professionell um.',
      },
    ],
    faq: [
      {
        question: 'Wie lange dauert ein Malerauftrag?',
        answer: 'Ein einzelnes Zimmer ist meist in 1-2 Tagen fertig. Bei grösseren Projekten oder Fassadenanstrichen kann es länger dauern. Ihr Maler informiert Sie vorab über die geplante Dauer.',
      },
      {
        question: 'Muss ich vorher ausräumen?',
        answer: 'Leichte Möbel können oft von den Malern verschoben werden. Wertvolle Gegenstände und Dekoration sollten Sie aber sicherheitshalber selbst aus dem Raum nehmen.',
      },
      {
        question: 'Was kostet ein Malerauftrag?',
        answer: 'Die Kosten hängen von der Fläche und der Art der Arbeit ab. Einfache Anstriche sind günstiger als Spezialarbeiten. Mit Büeze.ch vergleichen Sie mehrere Offerten kostenlos.',
      },
    ],
    metaTitle: 'Malerarbeiten & Anstrich',
    metaDescription: 'Erfahrene Maler für Innenräume, Fassaden und Spezialarbeiten. Kostenlose Offerten aus Ihrer Region.',
  },
  
  moving: {
    formCategory: 'transport',
    title: 'Transport & Umzug – Stressfrei von A nach B',
    description: 'Ob Privatumzug, Möbeltransport oder Räumung: Professionelle Helfer sparen Zeit und Nerven. Vergleichen Sie Offerten und finden Sie das passende Umzugsunternehmen.',
    services: [
      {
        icon: Truck,
        title: 'Privatumzug',
        description: 'Vom Packen bis zum Aufbau: Ein kompletter Umzugsservice für Ihr neues Zuhause. Professionelle Umzugshelfer kümmern sich um alles, damit Sie entspannt bleiben.',
      },
      {
        icon: Box,
        title: 'Möbeltransport',
        description: 'Einzelne Möbelstücke sicher und schnell transportiert – auch für schwere oder sperrige Teile. Unsere Partner haben das richtige Equipment und die Erfahrung.',
      },
      {
        icon: Package,
        title: 'Entsorgung & Räumung',
        description: 'Entrümpelung, Entsorgung oder Räumung von Wohnungen, Kellern und Dachböden. Die Profis übernehmen den gesamten Prozess – von der Demontage bis zur fachgerechten Entsorgung.',
      },
    ],
    faq: [
      {
        question: 'Wie lange vorher sollte ich einen Umzug planen?',
        answer: 'Je früher, desto besser. Mindestens 2-4 Wochen Vorlauf sind ideal, besonders in der Hochsaison (Frühling und Sommer). So haben Sie mehr Auswahl bei den Anbietern.',
      },
      {
        question: 'Sind meine Möbel versichert?',
        answer: 'Seriöse Umzugsunternehmen verfügen über eine Haftpflichtversicherung. Klären Sie die Details aber vorab in der Offerte und dokumentieren Sie wertvolle Gegenstände.',
      },
      {
        question: 'Was kostet ein Umzug?',
        answer: 'Die Kosten hängen von der Distanz, der Menge und den gewünschten Leistungen ab. Ein lokaler Umzug ist günstiger als ein Fernumzug. Mit Büeze.ch vergleichen Sie mehrere Angebote.',
      },
    ],
    metaTitle: 'Transport & Umzug',
    metaDescription: 'Professionelle Umzugsunternehmen für Privatumzüge, Möbeltransport und Räumungen. Kostenlose Offerten aus Ihrer Region.',
  },
  
  kitchen: {
    formCategory: 'kuechenbau',
    title: 'Küchenbau – Ihre Traumküche professionell umgesetzt',
    description: 'Von der Planung bis zur Montage: Erfahrene Küchenbauer realisieren Ihre Wunschküche. Ob moderne Einbauküche oder individuelle Massanfertigung – holen Sie kostenlos mehrere Offerten ein.',
    services: [
      {
        icon: ChefHat,
        title: 'Küchenplanung & -montage',
        description: 'Professionelle Planung und fachgerechte Montage Ihrer neuen Küche. Von der ersten Skizze bis zur Installation aller Geräte – unsere Küchenbauer begleiten Sie durch den gesamten Prozess.',
      },
      {
        icon: Box,
        title: 'Massküchen & Einbauküchen',
        description: 'Ob standardisierte Einbauküche oder massgeschneiderte Lösung – finden Sie den passenden Experten für Ihr Projekt. Hochwertige Materialien und präzise Verarbeitung garantiert.',
      },
      {
        icon: Wrench,
        title: 'Küchenrenovation',
        description: 'Ihre Küche braucht eine Auffrischung? Von der Erneuerung der Fronten bis zur kompletten Umgestaltung – erfahrene Handwerker verleihen Ihrer Küche neues Leben.',
      },
    ],
    faq: [
      {
        question: 'Wie lange dauert eine Küchenmontage?',
        answer: 'Eine durchschnittliche Küche ist in 2-4 Tagen komplett montiert und einsatzbereit. Der genaue Zeitrahmen hängt von der Grösse und Komplexität ab. Die Handwerker informieren Sie vorab über den Ablauf.',
      },
      {
        question: 'Muss ich meine alte Küche selbst ausbauen?',
        answer: 'Die meisten Küchenbauer bieten den Ausbau der alten Küche als Teil ihrer Leistung an. Das ist praktisch und stellt sicher, dass der Raum optimal für die neue Küche vorbereitet wird.',
      },
      {
        question: 'Was kostet eine neue Küche?',
        answer: 'Die Kosten variieren stark je nach Grösse, Ausstattung und Material. Eine Standardküche ist günstiger als eine Massanfertigung. Mit Büeze.ch erhalten Sie mehrere Offerten und können Preise transparent vergleichen.',
      },
      {
        question: 'Sind die Geräte in der Offerte enthalten?',
        answer: 'Das kommt auf den Anbieter an. Manche Küchenbauer liefern Komplettlösungen inklusive Geräte, andere nur die Möbel. Klären Sie dies direkt in der Offerte.',
      },
    ],
    metaTitle: 'Küchenbau & Küchenmontage',
    metaDescription: 'Professionelle Küchenbauer für Planung, Montage und Renovation. Kostenlose Offerten aus Ihrer Region.',
  },
};
