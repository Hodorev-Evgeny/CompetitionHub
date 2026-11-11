/* Учебные данные CompetitionHub. Backend и API в КР №2 не требуются. */
(function () {
  'use strict';
  const PREFIX = 'competitionhub_v1_';
  const categories = {
    sport: { name: 'Спорт', icon: '⚽' },
    esport: { name: 'Киберспорт', icon: '🎮' },
    intellect: { name: 'Интеллект', icon: '🧠' },
    creative: { name: 'Творчество', icon: '🎨' }
  };
  const statuses = {
    registration: 'Идёт регистрация',
    live: 'В процессе',
    finished: 'Завершено'
  };
  function load(name, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + name);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (error) {
      console.warn('Не удалось прочитать localStorage', error);
      return fallback;
    }
  }
  function save(name, value) {
    try { localStorage.setItem(PREFIX + name, JSON.stringify(value)); return true; }
    catch (error) { console.warn('Не удалось сохранить данные', error); return false; }
  }
  function dateShift(days) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }
  const examples = [
    { id:'run-city', title:'City Run: осенний забег', category:'sport', format:'single', status:'registration', date:dateShift(12), location:'Москва · Парк Горького', limit:80, registered:36, icon:'🏃', featured:true, prize:'Медали и кубок', description:'Городской забег для всех, кто любит движение и хочет испытать свои силы. Две дистанции, живое общение и финишная медаль для каждого участника.', rules:'Участники должны прийти за 30 минут до старта.\nСпортивная форма и удобная обувь обязательны.\nСоблюдайте маршрут и указания организаторов.', seedPlayers:['Антон','Егор','Мария','Алина','Данила','Ольга','Никита','Светлана'] },
    { id:'cyber-tactics', title:'Cyber Tactics Cup', category:'esport', format:'team', status:'live', date:dateShift(2), location:'Онлайн · Discord', limit:16, registered:12, icon:'🎮', featured:true, prize:'Кубок победителя', description:'Командный киберспортивный турнир, где решают тактика и взаимодействие. Команды проходят путь от первого раунда до большого финала.', rules:'Команда состоит из пяти игроков.\nЗапрещены любые нечестные преимущества.\nОпоздание более 10 минут считается техническим поражением.', seedPlayers:['Nebula','Vortex','Raptors','Eclipse','Aurora','Matrix','Phoenix','Dynamo'] },
    { id:'quiz-night', title:'BrainStorm: битва умов', category:'intellect', format:'team', status:'registration', date:dateShift(18), location:'Москва · Молодёжный центр', limit:32, registered:15, icon:'🧠', featured:true, prize:'Памятные призы', description:'Командная интеллектуальная игра на логику, эрудицию и смекалку. Вас ждут раунды с необычными вопросами и настоящий азарт.', rules:'В команде от 2 до 5 человек.\nВремя ответа ограничено.\nИспользование интернета во время раунда запрещено.', seedPlayers:['Эрудиты','Кварки','Сова','Вектор','Импульс','Парадокс','Атлас','Синтез'] },
    { id:'art-express', title:'Art Express: конкурс плакатов', category:'creative', format:'single', status:'registration', date:dateShift(25), location:'Онлайн · Портфолио', limit:100, registered:46, icon:'🎨', featured:false, prize:'Публикация работ', description:'Творческий конкурс цифровых плакатов. Тема сезона — «Город будущего». Прояви фантазию и создай работу в собственном стиле.', rules:'Одна авторская работа от участника.\nФормат изображения: PNG или JPG.\nИспользование чужих работ запрещено.', seedPlayers:['Вероника','Лиза','Тимофей','Арина','Илья','Кира','Максим','Ева'] },
    { id:'chess-masters', title:'Chess Masters Open', category:'intellect', format:'single', status:'finished', date:dateShift(-9), location:'Москва · Шахматный клуб', limit:32, registered:32, icon:'♟️', featured:false, prize:'Кубок клуба', description:'Открытый любительский шахматный турнир с классическим контролем времени. Турнир завершён, результаты доступны в сетке.', rules:'Действуют стандартные правила шахмат.\nОпоздание более 15 минут означает поражение.', seedPlayers:['Александр Морозов','Артём','Дарья','Иван','Ярослав','Павел','Елена','Сергей'] },
    { id:'valor-weekend', title:'Weekend Arena: 5×5', category:'esport', format:'team', status:'registration', date:dateShift(30), location:'Онлайн · Турнирный сервер', limit:16, registered:7, icon:'⚡', featured:false, prize:'Дипломы финалистов', description:'Быстрый уикенд-турнир для команд. Разминка, групповые встречи и напряжённый плей-офф.', rules:'Команда из пяти участников.\nВсе матчи проходят по расписанию.\nСоблюдайте правила честной игры.', seedPlayers:['Zero','Titans','Omega','Volt','Horizon','Spectra','Lynx','Orbit'] },
    { id:'streetball', title:'Streetball 3×3', category:'sport', format:'team', status:'live', date:dateShift(1), location:'Москва · Открытая площадка', limit:12, registered:12, icon:'🏀', featured:false, prize:'Кубок и медали', description:'Уличный баскетбольный турнир в формате 3 на 3. Динамичные матчи и атмосфера летней площадки.', rules:'Три полевых игрока и один запасной.\nИгра до 21 очка или по времени.\nУважайте судей и соперников.', seedPlayers:['Комета','Баскет','Трио','Шторм','Спринт','Олимп','Вектор','Сокол'] },
    { id:'photo-stories', title:'Город в кадре — фотоконкурс', category:'creative', format:'single', status:'finished', date:dateShift(-14), location:'Онлайн', limit:50, registered:50, icon:'📷', featured:false, prize:'Выставка финалистов и дипломы', description:'Открытый конкурс городской фотографии с двумя этапами: отбор жюри и финальное голосование. Участники представляют авторский кадр на тему городской жизни, а лучшие работы получают место на итоговой выставке.', rules:'Один конкурсный снимок от участника.\nФайл в формате JPG или PNG.\nЖюри оценивает композицию, техническое качество и раскрытие темы.\nПобедители определяются по сумме баллов.', seedPlayers:['Анастасия','Кирилл','Надежда','Роман','София','Даша','Глеб','Юлия'] }
  ];
  const leaderboard = [
    {name:'Александр Волков', category:'sport', wins:14, losses:2, points:1850, icon:'🥇'},
    {name:'Команда Nebula', category:'esport', wins:12, losses:3, points:1790, icon:'🎮'},
    {name:'Мария Соколова', category:'intellect', wins:11, losses:2, points:1720, icon:'🧠'},
    {name:'Вероника Орлова', category:'creative', wins:10, losses:2, points:1640, icon:'🎨'},
    {name:'Дмитрий Смирнов', category:'sport', wins:9, losses:4, points:1590, icon:'🏃'},
    {name:'Команда Vortex', category:'esport', wins:9, losses:5, points:1480, icon:'🎮'},
    {name:'Ирина Петрова', category:'intellect', wins:8, losses:3, points:1410, icon:'♟️'},
    {name:'Николай Зайцев', category:'sport', wins:7, losses:4, points:1320, icon:'⚽'},
    {name:'Арина Лебедева', category:'creative', wins:7, losses:5, points:1240, icon:'🎨'},
    {name:'Команда Orbit', category:'esport', wins:6, losses:3, points:1180, icon:'🎮'}
  ];
  function competitions() {
    const own = load('competitions', []);
    return [...(Array.isArray(own) ? own : []), ...examples];
  }
  function byId(id) { return competitions().find(item => item.id === id); }
  function joins() { const all = load('joins', []); return Array.isArray(all) ? all : []; }
  function count(comp) { return (Number(comp.registered) || 0) + joins().filter(x => x.competitionId === comp.id).length; }
  function addJoin(input) {
    const comp = byId(input.competitionId);
    if (!comp) return { ok:false, error:'Соревнование не найдено.' };
    if (comp.status !== 'registration') return { ok:false, error:'Регистрация на это соревнование закрыта.' };
    if (count(comp) >= Number(comp.limit)) return { ok:false, error:'Все места уже заняты.' };
    if (joins().some(x => x.competitionId === comp.id && x.email.toLowerCase() === input.email.toLowerCase()))
      return { ok:false, error:'Заявка с таким e-mail уже подана.' };
    const data = joins();
    data.push({competitionId:comp.id,name:input.name, email:input.email, team:input.team || '', phone:input.phone || '', message:input.message || '', date:new Date().toISOString()});
    if (!save('joins',data)) return {ok:false,error:'Не удалось сохранить заявку в браузере.'};
    return {ok:true};
  }
  function addCompetition(data) {
    const own=load('competitions',[]);
    const id='custom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
    const comp={...data,id,icon:categories[data.category]?.icon || '🏆',status:'registration',registered:0,featured:false,prize:'Участие и признание',seedPlayers:[],ownerId:browserId()};
    if (!save('competitions',[comp,...(Array.isArray(own)?own:[])])) return null;
    return comp;
  }
  function browserId() {
    let id=load('browserId',null);
    if (!id) { id='local-'+Date.now()+'-'+Math.random().toString(36).slice(2,9); save('browserId',id); }
    return id;
  }
  function profile() { return load('profile',null); }
  function setProfile(p) {return save('profile',p);}
  function clearProfile() { try {localStorage.removeItem(PREFIX+'profile'); return true;} catch {return false;} }
  window.CHData={categories,statuses,examples,leaderboard,competitions,byId,joins,count,addJoin,addCompetition,browserId,profile,setProfile,clearProfile,dateShift};
}());
