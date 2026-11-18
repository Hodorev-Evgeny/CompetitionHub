/* CompetitionHub: расширение интерфейса, не меняет существующие данные и обработчики. */
(() => {
  'use strict';
  const root = document.documentElement;
  const themeKey = 'competitionhub_theme';
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const paths = {
    search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    moon:'<path d="M20.5 15.5A9 9 0 0 1 8.5 3.5 9 9 0 1 0 20.5 15.5Z"/>',
    chat:'<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l2-4a8.5 8.5 0 1 1 15-4.5Z"/><path d="M8 11h9m-9 4h5"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    send:'<path d="m3 3 18 9-18 9 4-9-4-9Zm4 9h14"/>',
    mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/>',
    github:'<path d="M9 19c-4 1.5-4-2-6-2.5m12 5v-3.9c0-1 .3-1.6-.5-2.2 3.3-.4 6.5-1.6 6.5-7A5.5 5.5 0 0 0 19.5 4c.1-.4.6-1.8-.2-3 0 0-1.2-.4-3.8 1.5a13 13 0 0 0-7 0C5.9.6 4.7 1 4.7 1c-.8 1.2-.3 2.6-.2 3A5.5 5.5 0 0 0 3 8.4c0 5.4 3.2 6.6 6.5 7-.7.5-.5 1.3-.5 2.2V22" transform="translate(1 1) scale(.91)"/>',
    telegram:'<path d="m3 11 18-7-4 16-5-4-3 3v-5l9-7-11 6-4-2Z"/>',
    vk:'<path d="M3 7h4c.5 4 2 7 4 8V7h4v5c2-1 3.5-3 4-5h3c-.5 3-2.5 5-4 6 2 1 3.5 3 4 5h-4c-1-2-2-3-3-3v3h-2C7 18 4 13 3 7Z"/>'
  };
  const icon = name => `<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
  const initial = read(themeKey, 'light');
  root.dataset.bsTheme = initial === 'dark' ? 'dark' : 'light';
  function init() {
    if (document.querySelector('.ch-tools')) return;
    const nav = document.querySelector('#mainNavbar, .site-navbar .navbar-collapse');
    if (!nav) return;
    const helpNav = document.createElement('li');
    helpNav.className = 'nav-item';
    helpNav.innerHTML = '<a class="nav-link" href="help.html">Помощь</a>';
    if (location.pathname.endsWith('/help.html')) { helpNav.firstChild.classList.add('active'); helpNav.firstChild.setAttribute('aria-current','page'); }
    const menu = nav.querySelector('.main-navigation, .navbar-nav');
    if (menu && !menu.querySelector('a[href="help.html"]')) menu.append(helpNav);
    if (location.pathname.endsWith('/help.html')) { const link=nav.querySelector('a[href="help.html"]'); if(link){link.classList.add('active');link.setAttribute('aria-current','page');} }
    const header=nav.closest('.site-navbar');
    header?.classList.remove('navbar-expand-lg');
    header?.classList.add('navbar-expand-xl');
    const tools = document.createElement('div');
    tools.className = 'ch-tools';
    tools.innerHTML = `<button class="ch-tool" type="button" id="chSearchOpen" aria-label="Поиск по сайту" title="Поиск по сайту (Ctrl+K)">${icon('search')}</button><button class="ch-tool" type="button" id="chTheme" aria-label="Переключить тему"></button>`;
    const profile=nav.querySelector('.profile-entry');
    if(profile && profile.parentNode===nav) nav.insertBefore(tools,profile); else nav.append(tools);
    // Keep a direct visible link even when the responsive navigation is collapsed.
    const container=nav.parentElement;
    if(container && !container.querySelector('.ch-help-quick')) {
      const quick=document.createElement('a'); quick.className='ch-help-quick'; quick.href='help.html'; quick.textContent='Помощь';
      if(location.pathname.endsWith('/help.html')) quick.setAttribute('aria-current','page');
      const toggler=container.querySelector('.navbar-toggler');
      if(toggler && toggler.parentNode===container) container.insertBefore(quick,toggler); else container.insertBefore(quick,nav);
    }
    const theme = tools.querySelector('#chTheme');
    function updateThemeButton() {
      const dark = root.dataset.bsTheme === 'dark';
      theme.innerHTML = icon(dark ? 'sun' : 'moon');
      const label = dark ? 'Включить светлую тему' : 'Включить тёмную тему';
      theme.setAttribute('aria-label', label); theme.title = label; theme.setAttribute('aria-pressed', String(dark));
    }
    updateThemeButton();
    let switching = false;
    theme.addEventListener('click', async () => {
      if (switching) return;
      const next = root.dataset.bsTheme === 'dark' ? 'light' : 'dark';
      const apply = () => { root.dataset.bsTheme = next; write(themeKey, next); updateThemeButton(); };
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { apply(); return; }
      const box = theme.getBoundingClientRect();
      const x = box.x + box.width / 2, y = box.y + box.height / 2;
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      if (document.startViewTransition) {
        switching = true;
        root.classList.add('ch-theme-wipe');
        try {
          const transition = document.startViewTransition(apply);
          await transition.ready;
          root.animate({clipPath:[`circle(0px at ${x}px ${y}px)`,`circle(${radius}px at ${x}px ${y}px)`]},
            {duration:680,easing:'cubic-bezier(.22,.8,.25,1)',pseudoElement:'::view-transition-new(root)'});
          await transition.finished;
        } catch { apply(); }
        finally { root.classList.remove('ch-theme-wipe'); switching = false; }
      } else {
        root.classList.add('ch-theme-changing'); apply();
        clearTimeout(theme.timer); theme.timer=setTimeout(()=>root.classList.remove('ch-theme-changing'),380);
      }
      theme.querySelector('svg')?.animate([{transform:'rotate(-100deg) scale(.4)',opacity:.2},{transform:'rotate(0) scale(1)',opacity:1}],{duration:450,easing:'cubic-bezier(.2,.8,.2,1)'});
    });
    addFooter(); addSearch(); addChat(); addAnimations();
  }
  function addFooter() {
    document.querySelectorAll('.site-footer a').forEach(a => {
      const href = a.getAttribute('href') || '';
      const type = href.startsWith('mailto:')?'mail':href.includes('github.com')?'github':href.includes('t.me/')?'telegram':href.includes('vk.com/')?'vk':null;
      if (type && !a.querySelector('svg')) { a.classList.add('ch-contact'); a.insertAdjacentHTML('afterbegin', icon(type)); }
    });
    const list = document.querySelector('.site-footer a[href="rating.html"]')?.closest('ul');
    if (list && !list.querySelector('a[href="help.html"]')) { const li = document.createElement('li'); li.innerHTML = '<a href="help.html">Помощь и правила</a>'; list.append(li); }
  }
  const pages = [
    ['Главная','Обзор платформы и популярные соревнования','index.html','старт создать турнир'],
    ['Соревнования','Каталог всех событий и фильтры','catalog.html','спорт киберспорт интеллект творчество регистрация'],
    ['Турнирная сетка','Матчи, этапы, результаты и победители','bracket.html','финал плей-офф счет команды'],
    ['Рейтинг','Таблица лидеров и очки участников','rating.html','лидеры победы результаты'],
    ['Личный кабинет','Профиль, заявки и мои соревнования','profile.html','учетная запись участник'],
    ['Создание соревнования','Форма для организаторов','create.html','создать опубликовать турнир'],
    ['Заявка на участие','Форма регистрации на событие','order.html','подать заявку записаться'],
    ['Настройка профиля','Создание и изменение демо-профиля','auth.html','вход аккаунт имя почта'],
    ['Помощь и правила','Как участвовать, организовать турнир и связаться с нами','help.html','faq вопросы поддержка контакты регистрация']
  ];
  const normalize = value => String(value ?? '').toLocaleLowerCase('ru').replace(/ё/g,'е').trim();
  function searchIndex() {
    const result = pages.map(([title,desc,url,keywords])=>({title,desc,url,keywords,type:'Раздел'}));
    const D = window.CHData;
    if (!D) return result;
    for (const event of D.competitions()) {
      const category = D.categories[event.category]?.name || '';
      const status = D.statuses[event.status] || '';
      result.push({ title:event.title, desc:[category,event.location,status].filter(Boolean).join(' · '), url:'product.html?id='+encodeURIComponent(event.id), keywords:[event.description,event.rules,event.format === 'team'?'командный':'личный',event.date,status,category].join(' '),type:'Соревнование' });
    }
    for (const person of D.leaderboard || []) result.push({title:person.name,desc:`Рейтинг · ${person.points} очков`,url:'rating.html',keywords:`${D.categories[person.category]?.name || ''} участник команда`,type:'Участник'});
    return result;
  }
  function addSearch() {
    const dialog = document.createElement('dialog');
    dialog.className='ch-search'; dialog.setAttribute('aria-labelledby','chSearchTitle');
    dialog.innerHTML=`<div class="ch-dialog-head"><h2 id="chSearchTitle">Поиск по сайту</h2><button type="button" class="ch-icon-button" aria-label="Закрыть поиск">${icon('close')}</button></div><div class="ch-search-body"><label class="visually-hidden" for="chSearchInput">Поисковый запрос</label><div class="ch-search-field">${icon('search')}<input id="chSearchInput" class="form-control" type="search" placeholder="Соревнование, раздел, участник…" autocomplete="off"></div><p class="ch-search-caption" aria-live="polite"></p><div class="ch-results"></div></div><div class="ch-dialog-foot">Enter — открыть первый результат · Esc — закрыть</div>`;
    document.body.append(dialog);
    const input = dialog.querySelector('input'), caption = dialog.querySelector('.ch-search-caption'), results = dialog.querySelector('.ch-results');
    function render() {
      const q = normalize(input.value), tokens = q.split(/\s+/).filter(Boolean);
      let matches = searchIndex().filter(item => tokens.every(token => normalize([item.title,item.desc,item.keywords].join(' ')).includes(token)));
      if (!q) matches = matches.filter(i=>i.type==='Раздел');
      else matches.sort((a,b)=>Number(normalize(b.title).includes(q))-Number(normalize(a.title).includes(q)));
      caption.textContent = q ? `Найдено: ${matches.length}` : 'Быстрые переходы';
      results.replaceChildren();
      if (!matches.length) { const p=document.createElement('p'); p.className='ch-no-results'; p.textContent='Ничего не найдено. Попробуй другой запрос.'; results.append(p); }
      for (const item of matches.slice(0,40)) { const a=document.createElement('a'); a.href=item.url; a.className='ch-result'; const box=document.createElement('div'); const title=document.createElement('strong'); title.textContent=item.title; const desc=document.createElement('small'); desc.textContent=item.desc; box.append(title,desc); const type=document.createElement('span'); type.className='ch-result-type'; type.textContent=item.type; a.append(box,type); results.append(a); }
    }
    function open() { if (dialog.open) return; input.value=''; render(); dialog.showModal(); input.focus(); }
    document.querySelector('#chSearchOpen').addEventListener('click',open);
    dialog.querySelector('button').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',e=>{if(e.target===dialog) {const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
    input.addEventListener('input',render);
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();results.querySelector('a')?.click();}});
    document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();open();}});
  }
  const faq = [
    {keys:['зарегистр','заявк','участв','запис','участие'],text:'Открой каталог, выбери соревнование со статусом «Идёт регистрация» и нажми «Подать заявку». Заполни необходимые поля.',url:'catalog.html',label:'Перейти в каталог'},
    {keys:['созда','организ','опубликов'],text:'Нажми «Создать своё» на главной или кнопку создания в каталоге. Укажи название, дату, место и правила.',url:'index.html',label:'На главную'},
    {keys:['сетк','матч','финал','победит','результат'],text:'На странице турнирной сетки выбери нужное событие. Там будут показаны этапы и результаты матчей.',url:'bracket.html',label:'Турнирная сетка'},
    {keys:['рейтинг','очк','лидер'],text:'В рейтинге можно увидеть участников, количество побед и набранные очки.',url:'rating.html',label:'Открыть рейтинг'},
    {keys:['профил','кабинет','мои'],text:'Личный кабинет показывает информацию профиля, твои заявки и созданные соревнования.',url:'profile.html',label:'Личный кабинет'},
    {keys:['контакт','поддерж','почт','связ','помощ'],text:'Контактные ссылки находятся внизу каждой страницы. Дополнительные инструкции доступны в разделе помощи.',url:'help.html#contacts',label:'Контакты'},
    {keys:['привет','здравств'],text:'Привет! Могу подсказать, как подать заявку, создать соревнование или посмотреть результаты.'}
  ];
  function addChat() {
    const wrapper = document.createElement('aside'); wrapper.className='ch-chat'; wrapper.setAttribute('aria-label','Чат-помощник');
    wrapper.innerHTML=`<section class="ch-chat-panel" id="chChatPanel" hidden aria-labelledby="chChatTitle"><header class="ch-chat-head"><div><strong id="chChatTitle">CompetitionHub</strong><small>Автоматический помощник</small></div><button type="button" class="ch-icon-button" aria-label="Закрыть чат">${icon('close')}</button></header><div class="ch-messages" role="log" aria-live="polite"></div><div class="ch-suggestions"><button type="button">Как участвовать?</button><button type="button">Как создать турнир?</button><button type="button">Где результаты?</button></div><form class="ch-chat-form"><label class="visually-hidden" for="chChatInput">Сообщение</label><input class="form-control" id="chChatInput" placeholder="Напиши вопрос…" maxlength="300" required autocomplete="off"><button class="btn btn-primary" type="submit" aria-label="Отправить">${icon('send')}</button></form><div class="ch-chat-note">Ответы по справке сайта, без живого оператора.</div></section><button type="button" class="ch-chat-launch" aria-expanded="false" aria-controls="chChatPanel" aria-label="Открыть чат-помощник">${icon('chat')}</button>`;
    document.body.append(wrapper);
    const panel=wrapper.querySelector('.ch-chat-panel'), launch=wrapper.querySelector('.ch-chat-launch'), log=wrapper.querySelector('.ch-messages'), input=wrapper.querySelector('input');
    const key='competitionhub_chat_v1'; let messages=read(key,[]); if(!Array.isArray(messages)) messages=[];
    function draw(message) { const el=document.createElement('div'); el.className='ch-message '+(message.from==='user'?'ch-message-user':'ch-message-bot'); el.textContent=message.text; if(message.from==='bot'&&message.url&&/^(catalog|index|bracket|rating|profile|help)\.html(?:#contacts)?$/.test(message.url)){const a=document.createElement('a');a.href=message.url;a.textContent=message.label;el.append(a);} log.append(el);log.scrollTop=log.scrollHeight; }
    function add(message) {messages.push(message);messages=messages.slice(-60);write(key,messages);draw(message);while(log.children.length>60)log.firstElementChild.remove();}
    if(!messages.length) add({from:'bot',text:'Привет! Я помогу разобраться с соревнованиями. Выбери вопрос или напиши свой.'}); else messages.slice(-60).forEach(draw);
    function toggle(show){panel.hidden=!show; launch.setAttribute('aria-expanded',String(show)); launch.setAttribute('aria-label',show?'Закрыть чат-помощник':'Открыть чат-помощник');launch.innerHTML=icon(show?'close':'chat'); if(show){log.scrollTop=log.scrollHeight;input.focus();} else launch.focus();}
    launch.addEventListener('click',()=>toggle(panel.hidden));panel.querySelector('.ch-chat-head button').addEventListener('click',()=>toggle(false));
    panel.addEventListener('keydown',e=>{if(e.key==='Escape')toggle(false);});
    function send(value){const text=value.trim();if(!text)return;add({from:'user',text});const q=normalize(text);const answer=faq.find(item=>item.keys.some(k=>q.includes(k)))||{text:'Не нашёл ответ на этот вопрос. Попробуй спросить о регистрации, создании турнира, рейтинге или открой раздел помощи.',url:'help.html',label:'Помощь и правила'};add({from:'bot',text:answer.text,url:answer.url,label:answer.label});input.value='';}
    wrapper.querySelector('form').addEventListener('submit',e=>{e.preventDefault();send(input.value);});
    wrapper.querySelectorAll('.ch-suggestions button').forEach(b=>b.addEventListener('click',()=>send(b.textContent)));
    document.querySelectorAll('[data-ch-open-chat]').forEach(b=>b.addEventListener('click',()=>toggle(true)));
  }
  function addAnimations() {
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches) return;
    const main = document.querySelector('main');
    if (!main) return;
    // 1. 3D tilt + pointer-tracked highlight. One delegated listener per card.
    const tiltCards = new WeakSet();
    const pointer = matchMedia('(hover:hover) and (pointer:fine)');
    function bindTilt(card) {
      if (tiltCards.has(card)) return;
      tiltCards.add(card); card.classList.add('ch-tilt');
      let frame = 0, position, bounds;
      const reset = () => {
        cancelAnimationFrame(frame); frame=0; bounds=null;
        card.classList.remove('ch-tilt-active');
        card.style.setProperty('--ch-rx','0deg'); card.style.setProperty('--ch-ry','0deg');
      };
      card.addEventListener('pointerenter', e => {
        if (!pointer.matches || motion.matches || e.pointerType === 'touch') return;
        bounds=card.getBoundingClientRect(); card.classList.add('ch-tilt-active');
      });
      card.addEventListener('pointermove', e => {
        if (!bounds || motion.matches) return;
        position=[e.clientX,e.clientY];
        if(frame) return;
        frame=requestAnimationFrame(()=>{
          frame=0; if(!bounds) return;
          const x=Math.max(0,Math.min(1,(position[0]-bounds.left)/bounds.width));
          const y=Math.max(0,Math.min(1,(position[1]-bounds.top)/bounds.height));
          card.style.setProperty('--ch-rx',`${(0.5-y)*15}deg`);
          card.style.setProperty('--ch-ry',`${(x-0.5)*19}deg`);
          card.style.setProperty('--ch-mx',`${x*100}%`); card.style.setProperty('--ch-my',`${y*100}%`);
        });
      });
      card.addEventListener('pointerleave',reset); card.addEventListener('pointercancel',reset);
    }
    // 2. Tournament timeline: rounds appear in order; existing SVG paths are drawn,
    // without changing match geometry (app.js uses bounding rectangles for the lines).
    const animatedBrackets = new WeakSet();
    function playBracket(grid) {
      if (animatedBrackets.has(grid) || motion.matches || !grid.isConnected) return;
      const cols=[...grid.querySelectorAll('.bracket-column')];
      const paths=[...grid.querySelectorAll('.bracket-connections path')];
      if(cols.length!==3 || paths.length!==6) return;
      animatedBrackets.add(grid);
      const animate=(el,frames,options)=>el.animate(frames,{fill:'backwards',easing:'cubic-bezier(.2,.75,.25,1)',...options});
      cols.forEach((col,round)=>{
        const heading=col.querySelector('h3');
        if(heading) animate(heading,[{opacity:0},{opacity:1}],{duration:330,delay:round*670});
        col.querySelectorAll('.bracket-match').forEach((match,i)=>{
          const delay=round*670+i*95;
          animate(match,[{opacity:.05,clipPath:'inset(0 100% 0 0)'},{opacity:1,clipPath:'inset(0 0 0 0)'}],{duration:480,delay});
          match.querySelectorAll('.bracket-team.winner').forEach(team=>animate(team,[{boxShadow:'inset 0 0 0 0 #3678c900'},{boxShadow:'inset 5px 0 0 #4d94ee'},{boxShadow:'inset 0 0 0 0 #3678c900'}],{duration:650,delay:delay+400}));
        });
      });
      paths.forEach((path,i)=>{
        const length=path.getTotalLength();
        const delay=i<4?480+i*55:1150+(i-4)*70;
        animate(path,[{strokeDasharray:`${length} ${length}`,strokeDashoffset:length,stroke:'#4d94ee',strokeWidth:3},{strokeDasharray:`${length} ${length}`,strokeDashoffset:0,stroke:'#4d94ee',strokeWidth:2}],{duration:550,delay});
      });
      const champion=grid.querySelector('.champion-summary');
      if(champion) animate(champion,[{opacity:0,clipPath:'inset(100% 0 0 0)'},{opacity:1,clipPath:'inset(0 0 0 0)'}],{duration:520,delay:1930});
    }
    const bracketPending=new WeakSet();
    const bracketObserver='IntersectionObserver' in window ? new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting){playBracket(entry.target);if(animatedBrackets.has(entry.target)) bracketObserver.unobserve(entry.target);}});
    },{threshold:.08}) : null;
    const revealed=new WeakSet(), pending=new WeakSet();
    const observer='IntersectionObserver' in window ? new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top||a.boundingClientRect.left-b.boundingClientRect.left);
      visible.forEach((entry,i)=>{
        const el=entry.target; observer.unobserve(el);
        if(revealed.has(el)||motion.matches) return;
        revealed.add(el);
        el.style.setProperty('--ch-delay',`${Math.min(i,6)*85}ms`);
        el.classList.add('ch-reveal');
      });
    }, {threshold:.12}) : null;
    const cards='.event-card,.category-card,.ch-help-step,.podium-card';
    const revealSelector=cards+',.step-card,.stat-tile,.info-point,.section-heading,.hero-title,.hero-lead,.hero-match,.floating-label,.page-heading h1';
    function scan() {
      main.querySelectorAll(cards).forEach(bindTilt);
      main.querySelectorAll(revealSelector).forEach(el=>{
        if(!observer || pending.has(el) || el.closest('.bracket-grid')) return;
        pending.add(el); observer.observe(el);
      });
      main.querySelectorAll('.bracket-grid').forEach(grid=>{
        if(animatedBrackets.has(grid) || grid.querySelectorAll('.bracket-connections path').length!==6) return;
        if(!bracketObserver) {playBracket(grid);return;}
        if(!bracketPending.has(grid)){bracketPending.add(grid);bracketObserver.observe(grid);}
      });
    }
    let scheduled=0;
    const schedule=()=>{ if(!scheduled) scheduled=requestAnimationFrame(()=>{scheduled=0;scan();}); };
    scan();
    if('MutationObserver' in window) new MutationObserver(schedule).observe(main,{childList:true,subtree:true});
    // Bonus: replay the animation when a different competition is selected (new grid).
    schedule();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
