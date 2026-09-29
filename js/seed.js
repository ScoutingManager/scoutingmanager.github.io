/* ScoutingManager - datos de ejemplo (seed)
   Los torneos se han extraido del calendario original en Excel del usuario
   ("Copia de Torneos 25_26 Los 3 Tenores.xlsx") y distribuido sobre la temporada 2025/26.
   Los equipos y jugadores son datos ficticios de demostracion. */

const Seed = (() => {

  const COLORS = [
    { id: 'azul',    name: 'Azul Torneo',    hex: '#2D6CDF' },
    { id: 'verde',   name: 'Verde Torneo',   hex: '#2E8B57' },
    { id: 'naranja', name: 'Naranja Torneo', hex: '#E07A28' },
    { id: 'morado',  name: 'Morado Torneo',  hex: '#7B4397' },
    { id: 'rojo',    name: 'Rojo Torneo',    hex: '#C0392B' },
    { id: 'turquesa',name: 'Turquesa Torneo',hex: '#17A2B8' },
    { id: 'gris',    name: 'Eventos / Inicios de temporada', hex: '#6B7280' },
    { id: 'dorado',  name: 'Evento especial', hex: '#C9A227' }
  ];

  const CATEGORIES = [
    { id: 'prebenjamin', name: 'Prebenjamín', years: '2018-2019', order: 1 },
    { id: 'benjamin',    name: 'Benjamín',    years: '2016-2017', order: 2 },
    { id: 'alevin',      name: 'Alevín',      years: '2014-2015', order: 3 },
    { id: 'infantil',    name: 'Infantil',    years: '2012-2013', order: 4 },
    { id: 'cadete',      name: 'Cadete',      years: '2010-2011', order: 5 },
    { id: 'juvenil',     name: 'Juvenil',     years: '2008-2009', order: 6 }
  ];

  const TOURNAMENTS_RAW = [
    ['Canterpro 2007', '2025-09-08', 2, 'torneo', 'juvenil'],
    ['Adeje 2007', '2025-09-16', 2, 'torneo', 'juvenil'],
    ['Villa de Portugalete 2007', '2025-09-21', 2, 'torneo', 'juvenil'],
    ['Burgo Cup 2012', '2025-09-29', 2, 'torneo', 'infantil'],
    ['Best Cup 2008', '2025-09-22', 2, 'torneo', 'juvenil'],
    ['Glico Cup 2011', '2025-09-29', 2, 'torneo', 'cadete'],
    ['Madrid Youth Cup 2007-2008', '2025-09-22', 3, 'torneo', 'juvenil'],
    ['Madrid Youth 2010', '2025-09-29', 2, 'torneo', 'cadete'],
    ['Torneo Al-Ándalus Mundialito de Clubes Córdoba 2008', '2025-10-01', 3, 'torneo', 'juvenil'],
    ['La Espiga 2011-15-16', '2025-10-19', 2, 'torneo', 'benjamin'],
    ['RFFM JUV (inicio competición)', '2025-10-13', 1, 'evento', 'juvenil'],
    ['Inicio RFAF', '2025-10-06', 1, 'evento', null],
    ['Inicio FFCV', '2025-10-13', 1, 'evento', null],
    ['Talavera la Real 2013', '2025-10-19', 2, 'torneo', 'infantil'],
    ['Inicio FCF', '2025-10-20', 1, 'evento', null],
    ['Alcobendas Futuro 2017-18', '2025-10-12', 2, 'torneo', 'prebenjamin'],
    ['Sub16 (inicio competición)', '2025-10-16', 1, 'evento', 'cadete'],
    ['St.Venecia 2013', '2025-10-06', 2, 'torneo', 'infantil'],
    ['Torneo Brava 2015', '2025-10-12', 2, 'torneo', 'alevin'],
    ['Torneo Paolo Rossi 2012', '2025-10-05', 2, 'torneo', 'infantil'],
    ['T. Burgos 2014-16', '2025-10-13', 2, 'torneo', 'benjamin'],
    ['Torneo Brava 2014-16', '2025-10-05', 2, 'torneo', 'benjamin'],
    ['Faro International Cup 2015', '2025-11-02', 4, 'torneo', 'alevin'],
    ['Algarve', '2025-11-30', 3, 'torneo', null],
    ['CNSA U-14/16 (inicio competición)', '2025-12-01', 1, 'evento', 'cadete'],
    ['Portimao Cup 2011', '2025-12-14', 3, 'torneo', 'cadete'],
    ['Cup 2013', '2025-12-01', 2, 'torneo', 'infantil'],
    ['Cup 2012', '2025-12-02', 2, 'torneo', 'infantil'],
    ['Desert Cup 2015-16', '2026-01-06', 3, 'torneo', 'benjamin'],
    ['Sub15 (inicio competición)', '2026-01-17', 1, 'evento', 'cadete'],
    ['LaLiga Futures 2013', '2026-01-27', 2, 'torneo', 'infantil'],
    ['Fernández Trigo 2010-19', '2026-01-06', 2, 'torneo', 'prebenjamin'],
    ['Tic Tac Cup 2014-15', '2026-01-19', 2, 'torneo', 'alevin'],
    ['Aragón Cup 2012', '2026-01-27', 2, 'torneo', 'infantil'],
    ['Jabulani Cup 2014-18', '2026-01-06', 2, 'torneo', 'prebenjamin'],
    ['Zaratan Cup 2014', '2026-01-08', 2, 'torneo', 'alevin'],
    ['Cabanillas 2010', '2026-01-10', 2, 'torneo', 'cadete'],
    ['Cant. Inf. 2012-14-15', '2026-01-12', 2, 'torneo', 'alevin'],
    ['CNSA Sub-14 Sub-16 (inicio competición)', '2026-03-06', 1, 'evento', 'cadete'],
    ['Carnaval Cup 2011-13', '2026-03-13', 2, 'torneo', 'infantil'],
    ['Pinos Puente 2016', '2026-04-07', 2, 'torneo', 'benjamin'],
    ['Xilxes 2016', '2026-04-21', 2, 'torneo', 'benjamin'],
    ['Gañafote Cup 2014', '2026-04-27', 2, 'torneo', 'alevin'],
    ['Mundial Sub-12 LaLiga Futures', '2026-04-25', 3, 'torneo', 'infantil'],
    ['1900 Cup 2012-17', '2026-05-02', 2, 'torneo', 'benjamin'],
    ['Sub15 (fase final)', '2026-05-16', 1, 'evento', 'cadete'],
    ['Iscar Cup 2015-16-17-18', '2026-05-04', 3, 'torneo', 'prebenjamin'],
    ['Madrid Easter Cup 2007-2019', '2026-05-08', 2, 'torneo', 'prebenjamin'],
    ['MIC Football Cup 2007-14', '2026-05-01', 3, 'torneo', 'alevin'],
    ['Porto International Cup 2009-15', '2026-05-12', 4, 'torneo', 'alevin'],
    ['Oviedo Cup 2010-12-14', '2026-05-01', 2, 'torneo', 'alevin'],
    ['CNSA Sub-12 (inicio competición)', '2026-06-01', 1, 'evento', 'infantil'],
    ['TAR Football 2015', '2026-06-01', 2, 'torneo', 'alevin'],
    ['Tres Cantos Cup', '2026-06-03', 2, 'torneo', null],
    ['Lanzarote Cup 2012-14-16', '2026-07-17', 3, 'torneo', 'benjamin']
  ];

  const TORNEO_COLOR_CYCLE = ['azul', 'verde', 'naranja', 'morado', 'rojo', 'turquesa'];

  function addDays(dateStr, days) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  const FIRST_NAMES = ['Alejandro','Daniel','Pablo','Hugo','Mateo','Martín','Lucas','Marcos','Álvaro','Diego',
    'Adrián','David','Iker','Bruno','Rodrigo','Nico','Izan','Leo','Gonzalo','Enzo',
    'Marco','Thiago','Carlos','Javier','Sergio','Gabriel','Óscar','Samuel','Eric','Aarón'];
  const LAST_NAMES = ['García','Martínez','López','Sánchez','Pérez','Gómez','Fernández','Ruiz','Díaz','Hernández',
    'Moreno','Muñoz','Álvarez','Romero','Alonso','Gutiérrez','Navarro','Torres','Domínguez','Vázquez',
    'Ramos','Gil','Serrano','Blanco','Suárez','Molina','Ortega','Delgado','Castro','Ortiz'];
  const POSITIONS = ['Portero','Lateral derecho','Lateral izquierdo','Central derecho','Central izquierdo',
    'Mediocentro defensivo','Mediocentro','Interior derecho','Interior izquierdo','Mediapunta',
    'Extremo derecho','Extremo izquierdo','Delantero centro','Segundo delantero'];
  const FEET = ['diestro','diestro','diestro','zurdo','zurdo','ambidiestro'];
  const PAST_CLUBS = ['CD Alba','EF Rayo Sur','Atlético Norte','UD Las Rozas','CF Getafe Base','RSD Móstoles',
    'Club Deportivo Villa','AD Parla','EF San Fernando','CD Boadilla'];
  const NATIONALITIES = ['España','España','España','España','España','España','Marruecos','Argentina','Colombia','Portugal','Rumanía','Guinea Ecuatorial'];

  const CLUBS = [
    { id: 'club_jrv', name: 'Club Base', notes: 'Club propio - cantera de referencia.' },
    { id: 'club_rival_norte', name: 'CD Rival Norte', notes: 'Equipo rival seguido para scouting.' },
    { id: 'club_ciudad_sur', name: 'AD Ciudad Sur', notes: 'Equipo rival seguido para scouting.' }
  ];

  function hashIndex(str, mod) {
    let h = 0;
    for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) >>> 0; }
    return h % mod;
  }

  function buildClubsSquadsPlayers() {
    const teams = CLUBS.map(c => ({ ...c }));
    const squads = [];
    const players = [];

    CLUBS.forEach((club, clubIdx) => {
      CATEGORIES.forEach((cat, ci) => {
        // El club propio tiene 2 categorias por año (A/B); los rivales solo 1 plantilla por categoria.
        const variants = clubIdx === 0 ? ['A', 'B'] : ['A'];
        variants.forEach((suffix) => {
          const squadId = `squad_${club.id}_${cat.id}_${suffix}`;
          const birthYearRange = cat.years.split('-');
          const year = birthYearRange[0];
          squads.push({
            id: squadId,
            teamId: club.id,
            categoryId: cat.id,
            year,
            name: `${cat.name} ${year}${suffix === 'B' ? ' (B)' : ''}`
          });

          const numPlayers = clubIdx === 0 ? 5 : 4;
          for (let i = 0; i < numPlayers; i++) {
            const seedStr = squadId + '_' + i;
            const first = FIRST_NAMES[hashIndex(seedStr + 'f', FIRST_NAMES.length)];
            const last1 = LAST_NAMES[hashIndex(seedStr + 'l1', LAST_NAMES.length)];
            const last2 = LAST_NAMES[hashIndex(seedStr + 'l2', LAST_NAMES.length)];
            const position = POSITIONS[hashIndex(seedStr + 'p', POSITIONS.length)];
            const foot = FEET[hashIndex(seedStr + 'foot', FEET.length)];
            const birthYear = Number(birthYearRange[hashIndex(seedStr + 'y', 2)]);
            const pastClub = PAST_CLUBS[hashIndex(seedStr + 'c', PAST_CLUBS.length)];
            const nationality = NATIONALITIES[hashIndex(seedStr + 'n', NATIONALITIES.length)];
            const skills = {
              technique: 1 + hashIndex(seedStr + 'technique', 10),
              defense: 1 + hashIndex(seedStr + 'defense', 10),
              speed: 1 + hashIndex(seedStr + 'speed', 10),
              stamina: 1 + hashIndex(seedStr + 'stamina', 10),
              attack: 1 + hashIndex(seedStr + 'attack', 10)
            };
            players.push({
              id: DB.uid('player'),
              squadId, teamId: club.id, categoryId: cat.id,
              name: `${first} ${last1} ${last2}`,
              position,
              secondaryPosition: '',
              foot,
              nationality,
              birthYear,
              height: 130 + ci * 8 + (i % 3) * 3,
              weight: 28 + ci * 5 + (i % 3) * 2,
              rating: 3 + (hashIndex(seedStr + 'r', 3)),
              favorite: i === 0 && ci % 2 === 0 && clubIdx === 0,
              notes: '',
              photo: '',
              skills,
              history: [
                { team: pastClub, category: cat.name, season: '2023/24' },
                { team: `${club.name} · ${cat.name}${suffix === 'B' ? ' B' : ''}`, category: cat.name, season: '2025/26' }
              ]
            });
          }
        });
      });
    });
    return { teams, squads, players };
  }

  function buildTournaments() {
    let colorCursor = 0;
    return TOURNAMENTS_RAW.map(([name, start, days, type, categoryId]) => {
      const colorId = type === 'evento' ? 'gris' : TORNEO_COLOR_CYCLE[(colorCursor++) % TORNEO_COLOR_CYCLE.length];
      const teamIds = type === 'evento' ? [] : CLUBS.filter((c, idx) => idx === 0 || hashIndex(name + idx, 2) === 0).map(c => c.id);
      return {
        id: DB.uid('tour'),
        name,
        startDate: start,
        endDate: addDays(start, Math.max(0, days - 1)),
        colorId,
        categoryIds: categoryId ? [categoryId] : [],
        type,
        location: '',
        teamIds,
        description: type === 'evento'
          ? 'Marca de calendario / inicio de competición oficial.'
          : 'Torneo de fútbol base. Edita esta ficha para añadir sede, horarios y notas de scouting.',
        comments: [],
        createdBy: 'seed',
        createdAt: new Date().toISOString()
      };
    });
  }

  async function bootstrapAdmin() {
    const email = Auth.usernameToEmail('jrverde');
    let cred;
    try {
      cred = await window.FB.createUserWithEmailAndPassword(window.FB.auth, email, 'Mojacar2012*');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        cred = await window.FB.signInWithEmailAndPassword(window.FB.auth, email, 'Mojacar2012*');
      } else {
        throw err;
      }
    }
    await window.FB.setDoc(window.FB.doc(window.FB.db, 'users', cred.user.uid), {
      username: 'jrverde',
      email: 'admin@jrvscouting.local',
      role: 'admin',
      status: 'approved',
      permissions: { allCategories: true, canEditCalendar: true, canEditScouting: true, canManageUsers: true },
      prefs: { theme: 'real-madrid', language: 'es', notifications: true, dateFormat: 'dd/mm/yyyy', defaultView: 'month' },
      createdAt: new Date().toISOString()
    });
  }

  async function run() {
    if (await DB.isSeeded()) return;

    await bootstrapAdmin();

    await DB.colors.save(COLORS);
    await DB.categories.save(CATEGORIES);

    const { teams, squads, players } = buildClubsSquadsPlayers();
    await DB.teams.save(teams);
    await DB.squads.save(squads);
    await DB.players.save(players);

    await DB.tournaments.save(buildTournaments());

    await DB.markSeeded();
    try { await window.FB.signOut(window.FB.auth); } catch (e) {}
  }

  return { run, COLORS, CATEGORIES };
})();
