/* CompetitionHub — интерактивность страниц. Bootstrap отвечает за UI-компоненты. */
(function () {
  'use strict';
  const D = window.CHData;
  const $ = (selector, root=document) => root.querySelector(selector);
  const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const shortDate = value => {
    const date = new Date(value + 'T12:00:00');
    return Number.isNaN(date.getTime()) ? 'Дата уточняется' : date.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});
  };
  const cat = key => D.categories[key] || {name:'Другое',icon:'🏆'};
  const statusText = key => D.statuses[key] || 'Неизвестно';
  const formatText = key => key === 'team' ? 'Командный' : 'Личный';
  const statusBadge = key => `<span class="badge rounded-pill status-${safe(key)}">${safe(statusText(key))}</span>`;
  const fmt = n => Number(n).toLocaleString('ru-RU');
  const getIdFromUrl = () => new URLSearchParams(location.search).get('id');
  function showToast(message) {
    const el = $('#appToast');
    if (!el) return;
    $('#appToastText').textContent = message;
    bootstrap.Toast.getOrCreateInstance(el,{delay:3600}).show();
  }
  function eventCard(item) {
    const number = D.count(item);
    return `<div class="col-12 col-md-6 col-xl-4"><article class="card event-card h-100">
      <div class="event-art ${safe(item.category)}"><img class="event-art-img" src="images/${safe(item.id.startsWith('custom-')?item.category:item.id)}.svg" alt="" loading="lazy"></div>
      <div class="card-body d-flex flex-column"><div class="event-tags mb-3"><span class="badge rounded-pill muted-pill">${safe(cat(item.category).name)}</span>${statusBadge(item.status)}</div>
      <h3 class="card-title h5 mb-2">${safe(item.title)}</h3><div class="event-meta d-grid gap-2 mt-1 mb-3"><span>◷ ${safe(shortDate(item.date))}</span><span>⌖ ${safe(item.location)}</span><span>♟ ${safe(formatText(item.format))} · ${fmt(number)}/${fmt(item.limit)} мест</span></div>
      <div class="mt-auto pt-2"><a href="product.html?id=${encodeURIComponent(item.id)}" class="btn btn-primary w-100">Подробнее →</a></div></div></article></div>`;
  }

  // Форма быстрого создания: собственный сценарий, встроенный в Bootstrap Modal.
  function quickCreate() {
    const form=$('#quickCreateForm');
    if (!form) return;
    const date=$('#quickDate');
    date.min=D.dateShift(0);
    date.value=D.dateShift(7);
    date.addEventListener('change',()=>date.setCustomValidity(''));
    form.addEventListener('submit',event=>{
      event.preventDefault();
      form.classList.add('was-validated');
      if(date.value<D.dateShift(0)) date.setCustomValidity('Дата не должна быть в прошлом');
      else date.setCustomValidity('');
      if(!form.checkValidity()) return;
      const competition=D.addCompetition({
        title:$('#quickTitle').value.trim(),
        category:$('#quickCategory').value,
        format:$('#quickFormat').value,
        date:date.value,
        limit:Number($('#quickLimit').value),
        location:$('#quickLocation').value.trim(),
        description:$('#quickDescription').value.trim(),
        rules:$('#quickRules').value.trim()
      });
      if(!competition){
        const error=$('#quickCreateError');
        error.textContent='Не удалось сохранить событие. Проверь настройки браузера.';
        error.classList.remove('d-none');
        return;
      }
      location.href='product.html?id='+encodeURIComponent(competition.id);
    });
    form.addEventListener('reset',()=>{form.classList.remove('was-validated');date.value=D.dateShift(7);});
  }

  function home() {
    const all=D.competitions();
    const featured=all.filter(x=>x.featured && x.status!=='finished').slice(0,3);
    $('#featuredList').innerHTML=(featured.length?featured:all.slice(0,3)).map(eventCard).join('');
    $('#statCompetitions').textContent=fmt(all.length);
    $('#statParticipants').textContent=fmt(all.reduce((sum,x)=>sum+D.count(x),0));
  }
  function catalog() {
    const form=$('#catalogFilters'), grid=$('#competitionGrid'), empty=$('#emptyCatalog'), count=$('#resultsCount');
    const params=new URLSearchParams(location.search);
    if (D.categories[params.get('category')]) $('#filterCategory').value=params.get('category');
    function update() {
      const query=$('#searchQuery').value.trim().toLocaleLowerCase('ru');
      const category=$('#filterCategory').value, status=$('#filterStatus').value, format=$('#filterFormat').value;
      const found=D.competitions().filter(x=>(!query || (x.title+' '+x.description+' '+x.location).toLocaleLowerCase('ru').includes(query)) && (category==='all'||x.category===category) && (status==='all'||x.status===status) && (format==='all'||x.format===format));
      grid.innerHTML=found.map(eventCard).join('');
      count.textContent=`Найдено: ${found.length} из ${D.competitions().length}`;
      empty.classList.toggle('d-none',found.length>0);
    }
    form.addEventListener('input',update);
    form.addEventListener('change',update);
    form.addEventListener('reset',()=>setTimeout(()=>{history.replaceState(null,'',location.pathname);update();},0));
    $('#emptyReset').addEventListener('click',()=>form.reset());
    update();
  }
  function product() {
    const item=D.byId(getIdFromUrl()||'run-city');
    const holder=$('#competitionDetails');
    if(!item){ holder.innerHTML='<div class="alert alert-warning" role="alert">Соревнование не найдено. <a href="catalog.html">Вернуться в каталог</a>.</div>';return; }
    document.title=item.title+' — CompetitionHub';
    const regOpen=item.status==='registration' && D.count(item)<Number(item.limit);
    const roster=[...(item.seedPlayers||[]),...D.joins().filter(x=>x.competitionId===item.id).map(x=>x.team||x.name)];
    const rosterHtml=roster.length?roster.slice(0,16).map((name,index)=>`<li class="list-group-item d-flex align-items-center justify-content-between"><span><span class="rank-pill me-2">${index+1}</span>${safe(name)}</span><span class="badge rounded-pill muted-pill">Участник</span></li>`).join(''):'<li class="list-group-item text-secondary">Участники пока не зарегистрировались.</li>';
    holder.innerHTML=`<div class="row g-5 mb-5 align-items-center"><div class="col-lg-5"><div class="event-art detail-art ${safe(item.category)}"><img class="event-art-img" src="images/${safe(item.id.startsWith('custom-')?item.category:item.id)}.svg" alt="" loading="lazy"></div></div><div class="col-lg-7"><div class="event-tags mb-3"><span class="badge muted-pill rounded-pill">${safe(cat(item.category).name)}</span>${statusBadge(item.status)}</div><h1 class="detail-title mb-3">${safe(item.title)}</h1><p class="lead text-secondary mb-4">${safe(item.description)}</p><div class="d-flex gap-3 align-items-center flex-wrap mb-3"><button class="btn btn-primary btn-lg" id="detailJoinButton" data-bs-toggle="modal" data-bs-target="#joinModal" ${regOpen?'':'disabled'}>${regOpen?'Подать заявку →':'Регистрация закрыта'}</button><a class="btn btn-outline-primary btn-lg" href="bracket.html?id=${encodeURIComponent(item.id)}">Турнирная сетка</a></div><span class="small text-secondary" id="detailCountText">${fmt(D.count(item))} из ${fmt(item.limit)} мест занято</span><div class="progress mt-2" role="progressbar" aria-label="Заполненность соревнования" aria-valuenow="${Math.min(100,Math.round(D.count(item)/item.limit*100))}" aria-valuemin="0" aria-valuemax="100" style="height:9px"><div class="progress-bar" style="width:${Math.min(100,Math.round(D.count(item)/item.limit*100))}%"></div></div></div></div>
      <div class="row g-4"><section class="col-lg-8"><h2 class="h4 fw-bold mb-3">О соревновании</h2><p class="text-secondary mb-4">${safe(item.description)}</p><ul class="nav nav-tabs mb-4" id="detailTabs" role="tablist"><li class="nav-item" role="presentation"><button class="nav-link active" id="rules-tab" data-bs-toggle="tab" data-bs-target="#rules-pane" type="button" role="tab" aria-controls="rules-pane" aria-selected="true">Правила</button></li><li class="nav-item" role="presentation"><button class="nav-link" id="roster-tab" data-bs-toggle="tab" data-bs-target="#roster-pane" type="button" role="tab" aria-controls="roster-pane" aria-selected="false">Участники</button></li><li class="nav-item" role="presentation"><button class="nav-link" id="schedule-tab" data-bs-toggle="tab" data-bs-target="#schedule-pane" type="button" role="tab" aria-controls="schedule-pane" aria-selected="false">Расписание</button></li></ul>
      <div class="tab-content" id="detailTabContent"><div class="tab-pane fade show active" id="rules-pane" role="tabpanel" aria-labelledby="rules-tab" tabindex="0"><div class="accordion" id="rulesAccordion"><div class="accordion-item"><h3 class="accordion-header"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#rulesMain" aria-expanded="true" aria-controls="rulesMain">Условия участия</button></h3><div class="accordion-collapse collapse show" id="rulesMain" data-bs-parent="#rulesAccordion"><div class="accordion-body">${safe(item.rules).replace(/\n/g,'<br>')}</div></div></div><div class="accordion-item"><h3 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#rulesDetails" aria-expanded="false" aria-controls="rulesDetails">Как подать заявку?</button></h3><div class="accordion-collapse collapse" id="rulesDetails" data-bs-parent="#rulesAccordion"><div class="accordion-body">Нажми «Подать заявку», укажи имя и электронную почту или перейди на <a href="order.html?id=${encodeURIComponent(item.id)}">страницу формы</a>. Заявка появится в личном кабинете этого браузера.</div></div></div></div></div><div class="tab-pane fade" id="roster-pane" role="tabpanel" aria-labelledby="roster-tab" tabindex="0"><ul class="list-group list-group-flush">${rosterHtml}</ul><p class="text-secondary small mt-3">Состав участников формируется по заявкам и указанным данным организатора.</p></div><div class="tab-pane fade" id="schedule-pane" role="tabpanel" aria-labelledby="schedule-tab" tabindex="0"><div class="table-responsive"><table class="table table-striped align-middle"><caption class="visually-hidden">Расписание соревнования</caption><tbody><tr><th scope="row">Регистрация</th><td>${item.status==='registration'?'Открыта':'Закрыта'}</td></tr><tr><th scope="row">Дата соревнования</th><td>${safe(shortDate(item.date))}</td></tr><tr><th scope="row">Формат</th><td>${safe(formatText(item.format))}</td></tr><tr><th scope="row">Место</th><td>${safe(item.location)}</td></tr></tbody></table></div></div></div></section>
      <aside class="col-lg-4"><div class="info-sidecard"><h2 class="h5 fw-bold mb-4">Детали события</h2><div class="detail-facts"><div class="fact-block"><span>Дата</span><strong>${safe(shortDate(item.date))}</strong></div><div class="fact-block"><span>Формат</span><strong>${safe(formatText(item.format))}</strong></div><div class="fact-block"><span>Участников</span><strong id="detailSideCount">${fmt(D.count(item))} / ${fmt(item.limit)}</strong></div><div class="fact-block"><span>Награда</span><strong>${safe(item.prize)}</strong></div></div><hr><p class="small text-secondary mb-1">Место проведения</p><p class="fw-semibold mb-0">⌖ ${safe(item.location)}</p></div><div class="mt-3"><a class="btn btn-outline-secondary w-100" href="catalog.html">← К каталогу соревнований</a></div></aside></div>`;
    const joinForm=$('#joinModalForm');
    const profile=D.profile();
    if(profile){$('#joinName').value=profile.name;$('#joinEmail').value=profile.email;}
    joinForm.addEventListener('submit',e=>{
      e.preventDefault();
      joinForm.classList.add('was-validated');
      if(!joinForm.checkValidity())return;
      const result=D.addJoin({competitionId:item.id,name:$('#joinName').value.trim(),email:$('#joinEmail').value.trim(),team:$('#joinTeam').value.trim()});
      if(!result.ok){const err=$('#joinError');err.textContent=result.error;err.classList.remove('d-none');return;}
      bootstrap.Modal.getOrCreateInstance($('#joinModal')).hide();
      showToast('Заявка сохранена! Смотри раздел «Мои заявки» в кабинете.');
      // Сразу обновляем показания интерфейса без перезагрузки страницы.
      const newCount = D.count(item);
      const percent = Math.min(100, Math.round(newCount / item.limit * 100));
      const progress = $('.progress-bar');
      const progressContainer = $('.progress[role="progressbar"]');
      if (progress) progress.style.width = percent + '%';
      if (progressContainer) progressContainer.setAttribute('aria-valuenow', String(percent));
      const countText = $('#detailCountText');
      if (countText) countText.textContent = `${fmt(newCount)} из ${fmt(item.limit)} мест занято`;
      const sideCount = $('#detailSideCount');
      if (sideCount) sideCount.textContent = `${fmt(newCount)} / ${fmt(item.limit)}`;
      const rosterList = $('#roster-pane .list-group');
      if (rosterList && rosterList.children.length < 16) {
        const emptyRow = rosterList.querySelector('.text-secondary');
        if (emptyRow) emptyRow.remove();
        const entry = document.createElement('li');
        entry.className = 'list-group-item';
        entry.textContent = $('#joinTeam').value.trim() || $('#joinName').value.trim();
        rosterList.append(entry);
      }
      if (newCount >= Number(item.limit)) {
        const joinButton = $('#detailJoinButton');
        if (joinButton) {
          joinButton.disabled = true;
          joinButton.removeAttribute('data-bs-toggle');
          joinButton.removeAttribute('data-bs-target');
          joinButton.textContent = 'Регистрация закрыта';
        }
      }
      joinForm.reset();
      joinForm.classList.remove('was-validated');
      const error = $('#joinError');
      if (error) error.classList.add('d-none');
    });
  }
  function order() {
    const select=$('#orderCompetition');
    const all=D.competitions().filter(x=>x.status==='registration' && D.count(x)<x.limit);
    all.forEach(x=>{const option=document.createElement('option');option.value=x.id;option.textContent=x.title;select.append(option);});
    const id=getIdFromUrl();
    if(id && all.some(x=>x.id===id))select.value=id;
    const profile=D.profile();
    if(profile){$('#orderName').value=profile.name;$('#orderEmail').value=profile.email;}
    $('#orderForm').addEventListener('submit',e=>{
      e.preventDefault();
      const form=e.currentTarget;form.classList.add('was-validated');
      if(!form.checkValidity())return;
      const result=D.addJoin({competitionId:select.value,name:$('#orderName').value.trim(),email:$('#orderEmail').value.trim(),phone:$('#orderPhone').value.trim(),team:$('#orderTeam').value.trim(),message:$('#orderMessage').value.trim()});
      if(!result.ok){showToast(result.error);return;}
      showToast('Заявка сохранена в браузере!');
      form.reset();form.classList.remove('was-validated');
      const info=document.createElement('div');info.className='alert alert-success mt-4';info.setAttribute('role','status');info.innerHTML='Заявка успешно сохранена. <a href="profile.html" class="alert-link">Перейти в личный кабинет</a>.';
      const existing=$('.alert-success',form.parentElement);if(existing)existing.remove();
      form.after(info);
    });
    $('#orderForm').addEventListener('reset',e=>setTimeout(()=>e.target.classList.remove('was-validated'),0));
  }
  function create() {
    const form=$('#createForm'),date=$('#createDate');
    date.min=D.dateShift(0);date.value=D.dateShift(7);
    form.addEventListener('submit',e=>{
      e.preventDefault();form.classList.add('was-validated');
      if(date.value < D.dateShift(0))date.setCustomValidity('Дата не должна быть в прошлом');else date.setCustomValidity('');
      if(!form.checkValidity())return;
      const comp=D.addCompetition({title:$('#createTitle').value.trim(),category:$('#createCategory').value,format:$('#createFormat').value,date:date.value,limit:Number($('#createLimit').value),location:$('#createLocation').value.trim(),description:$('#createDescription').value.trim(),rules:$('#createRules').value.trim()});
      if(!comp){showToast('Не удалось сохранить соревнование. Проверь настройки браузера.');return;}
      location.href='product.html?id='+encodeURIComponent(comp.id);
    });
    date.addEventListener('input',()=>date.setCustomValidity(''));
    form.addEventListener('reset',()=>setTimeout(()=>{form.classList.remove('was-validated');date.value=D.dateShift(7);},0));
  }
  function rating() {
    const select=$('#ratingCategory'), rows=$('#ratingRows'), podium=$('#topPodium');
    const names=['Первое место','Второе место','Третье место'];
    function render(){
      const filtered=D.leaderboard.filter(x=>select.value==='all'||x.category===select.value).sort((a,b)=>b.points-a.points);
      $('#ratingCount').textContent=fmt(filtered.length);
      $('#ratingWins').textContent=fmt(filtered.reduce((sum,x)=>sum+x.wins,0));
      podium.innerHTML=filtered.slice(0,3).map((x,i)=>`<div class="col-md-4"><article class="podium-card ${i===0?'is-first':''} h-100">
        <div class="d-flex justify-content-between align-items-center mb-3"><span class="podium-position">0${i+1} / ${names[i]}</span><span class="podium-medal" aria-hidden="true">${['🥇','🥈','🥉'][i]}</span></div>
        <div class="participant-avatar mb-3" aria-hidden="true">${safe(x.name.slice(0,1).toUpperCase())}</div>
        <h3 class="h5 fw-bold mb-2">${safe(x.name)}</h3><p class="podium-category small mb-3">${safe(cat(x.category).name)}</p>
        <div class="d-flex align-items-baseline gap-2"><strong class="fs-3">${fmt(x.points)}</strong><span class="small">очков</span></div>
        <div class="podium-stats mt-3 pt-3">${fmt(x.wins)} побед · ${fmt(x.losses)} поражений</div></article></div>`).join('');
      rows.innerHTML=filtered.map((x,i)=>`<tr><td><span class="rank-pill">${i+1}</span></td><td><span class="participant-initial me-2">${safe(x.name.slice(0,1).toUpperCase())}</span><strong>${safe(x.name)}</strong></td><td><span class="badge muted-pill">${safe(cat(x.category).name)}</span></td><td>${x.wins}</td><td>${x.losses}</td><td><strong>${fmt(x.points)}</strong></td></tr>`).join('');
    }
    select.addEventListener('change',render);
    render();
  }
  function bracket() {
    const select=$('#bracketCompetition');
    const all=D.competitions();
    all.forEach(x=>{const option=document.createElement('option');option.value=x.id;option.textContent=x.title;select.append(option);});
    const preselect=getIdFromUrl();
    // В качестве примера открываем завершённый турнир: так виден весь путь к чемпиону.
    const initial=all.find(x=>x.status==='finished');
    if(initial)select.value=initial.id;
    if(preselect&&D.byId(preselect))select.value=preselect;
    function match(a,b,label,scoreA,scoreB){
      const scored=scoreA!==null&&scoreB!==null;
      const team=(name,score,win)=>`<div class="bracket-team ${win?'winner':''}"><span class="team-name"><span class="team-dot" aria-hidden="true"></span>${safe(name)}</span><strong class="score">${scored?score:'—'}</strong></div>`;
      return `<div class="bracket-match"><span class="round-label">${safe(label)}</span>${team(a,scoreA,scored&&scoreA>scoreB)}${team(b,scoreB,scored&&scoreB>scoreA)}</div>`;
    }
    function draw(){
      const item=D.byId(select.value); if(!item)return;
      const joined=D.joins().filter(x=>x.competitionId===item.id).map(x=>x.team||x.name);
      const roster=[...(item.seedPlayers||[]),...joined].slice(0,8);
      while(roster.length<8)roster.push('Место свободно');
      const played=item.status!=='registration';
      const complete=item.status==='finished';
      const quarterScores=[[2,0],[1,2],[2,1],[0,2]];
      const quarterWinners=[];
      const quarter=quarterScores.map(([a,b],i)=>{
        const left=roster[i*2],right=roster[i*2+1];
        quarterWinners.push(played?(a>b?left:right):`Победитель матча ${i+1}`);
        return match(left,right,`Матч ${i+1}`,played?a:null,played?b:null);
      }).join('');
      const semiScores=[[2,1],[0,2]];
      const semiWinners=[];
      const semi=semiScores.map(([a,b],i)=>{
        const left=quarterWinners[i*2],right=quarterWinners[i*2+1];
        semiWinners.push(complete?(a>b?left:right):`Победитель полуфинала ${i+1}`);
        return match(left,right,`Полуфинал ${i+1}`,complete?a:null,complete?b:null);
      }).join('');
      const final=match(semiWinners[0],semiWinners[1],'Финальный матч',complete?3:null,complete?1:null);
      const winner=complete?semiWinners[0]:null;
      const activeStage=item.status==='registration'?'Регистрация':item.status==='live'?'1/4 финала':'Завершено';
      $('#bracketStage').textContent=activeStage;
      $('#bracketParticipants').textContent='8';
      $('#bracketMatches').textContent='7';
      $('#bracketBoard').innerHTML=`
       <div class="bracket-board-heading d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div><span class="section-kicker">СЕТКА СОРЕВНОВАНИЯ</span><h2 class="h4 fw-bold mb-2">${safe(item.title)}</h2><p class="small text-secondary mb-0">${safe(cat(item.category).name)} · ${safe(formatText(item.format))} · ${safe(shortDate(item.date))}</p></div>${statusBadge(item.status)}
       </div>
       <div class="bracket-grid" id="bracketGrid" aria-label="Сетка из четвертьфинала, полуфинала и финала">
        <svg class="bracket-connections" id="bracketConnections" aria-hidden="true"></svg>
        <section class="bracket-column"><h3>01 / Четвертьфинал</h3><div class="bracket-matches">${quarter}</div></section>
        <section class="bracket-column semifinal"><h3>02 / Полуфинал</h3><div class="bracket-matches">${semi}</div></section>
        <section class="bracket-column final"><h3>03 / Финал</h3><div class="bracket-matches">${final}</div><div class="champion-summary"><span class="small fw-semibold">${winner?'ПОБЕДИТЕЛЬ':'ПОБЕДИТЕЛЬ ОПРЕДЕЛИТСЯ'}</span><strong>${winner?safe(winner):'После финала'}</strong></div></section>
       </div>
       <p class="small text-secondary mb-0 mt-4">Линии показывают, из каких двух матчей формируется следующая пара. Результаты незавершённых этапов пока не определены.</p>`;
      requestAnimationFrame(drawConnections);
    }
    // SVG-соединения рассчитываются по реальному положению матчей.
    function drawConnections(){
      const grid=$('#bracketGrid'),svg=$('#bracketConnections');
      if(!grid||!svg)return;
      const groups=[...grid.querySelectorAll('.bracket-column')].map(col=>[...col.querySelectorAll('.bracket-match')]);
      if(groups.length!==3||groups[0].length!==4||groups[1].length!==2||groups[2].length!==1)return;
      const box=grid.getBoundingClientRect();
      svg.setAttribute('viewBox',`0 0 ${grid.clientWidth} ${grid.clientHeight}`);
      svg.setAttribute('width',grid.clientWidth);svg.setAttribute('height',grid.clientHeight);
      const pos=(el,side)=>{const r=el.getBoundingClientRect();return {x:(side==='right'?r.right:r.left)-box.left,y:(r.top+r.bottom)/2-box.top};};
      let paths='';
      for(let round=0;round<2;round++){
        groups[round].forEach((source,i)=>{
          const start=pos(source,'right'),end=pos(groups[round+1][Math.floor(i/2)],'left');
          const middle=(start.x+end.x)/2;
          paths+=`<path d="M ${start.x} ${start.y} H ${middle} V ${end.y} H ${end.x}" />`;
        });
      }
      svg.innerHTML=paths;
    }
    select.addEventListener('change',draw);
    window.addEventListener('resize',()=>requestAnimationFrame(drawConnections));
    draw();
  }
  function profile() {
    const prof=D.profile();
    if(prof){$('#profileName').textContent=prof.name;$('#profileEmail').textContent=prof.email;$('#profileAvatar').textContent=prof.name.trim().slice(0,1).toUpperCase();$('#profileLoginLink').textContent='Изменить профиль';$('#profileLogout').classList.remove('d-none');}
    $('#profileLogout').addEventListener('click',()=>{D.clearProfile();location.reload();});
    const own=D.competitions().filter(x=>x.ownerId&&x.ownerId===D.browserId());
    const joined=D.joins().filter(x=>!prof||x.email.toLowerCase()===prof.email.toLowerCase());
    $('#profileCreatedCount').textContent=own.length;$('#profileJoinedCount').textContent=joined.length;
    const empty=(str)=>`<div class="py-4 text-center"><span class="d-block fs-2 mb-2">◎</span><p class="text-secondary mb-0">${str}</p></div>`;
    $('#createdList').innerHTML=own.length?own.map(x=>`<div class="profile-event"><div><a href="product.html?id=${encodeURIComponent(x.id)}">${safe(x.title)}</a><div class="text-secondary small mt-1">${safe(shortDate(x.date))} · ${safe(cat(x.category).name)}</div></div>${statusBadge(x.status)}</div>`).join(''):empty('Ты ещё не создавал соревнований.');
    $('#joinedList').innerHTML=joined.length?joined.map(x=>{const c=D.byId(x.competitionId);return `<div class="profile-event"><div><a href="product.html?id=${encodeURIComponent(x.competitionId)}">${safe(c?.title||'Соревнование')}</a><div class="text-secondary small mt-1">Заявка: ${safe(x.name)} · ${safe(x.email)}</div></div><span class="badge rounded-pill status-registration">Заявка сохранена</span></div>`;}).join(''):empty('Пока нет заявок на участие.');
  }
  function auth() {
    const p=D.profile();if(p){$('#authName').value=p.name;$('#authEmail').value=p.email;}
    $('#authForm').addEventListener('submit',e=>{
      e.preventDefault();const form=e.currentTarget;form.classList.add('was-validated');if(!form.checkValidity())return;
      if(!D.setProfile({name:$('#authName').value.trim(),email:$('#authEmail').value.trim()})){showToast('Не удалось сохранить профиль.');return;}
      location.href='profile.html';
    });
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const handlers={home,catalog,product,order,create,bracket,rating,profile,auth};
    const name=document.body.dataset.page;
    quickCreate();
    if(handlers[name])handlers[name]();
  });
}());
