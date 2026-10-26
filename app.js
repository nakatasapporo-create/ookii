(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const TOTAL = 6;
  const modeNames = {size: 'おおきさ', amount: 'かず', length: 'ながさ'};
  const words = {
    size: ['おおきい', 'ちいさい'],
    amount: ['おおい', 'すくない'],
    length: ['ながい', 'みじかい']
  };
  const objects = {
    size: [
      {item:'apple',noun:'りんご'}, {item:'balloon',noun:'ふうせん'},
      {item:'flower',noun:'おはな'}, {item:'star',noun:'ほし'},
      {item:'cookie',noun:'クッキー'}, {item:'fish',noun:'さかな'}
    ],
    amount: [
      {item:'apple',noun:'りんご'}, {item:'star',noun:'ほし'},
      {item:'flower',noun:'おはな'}, {item:'fish',noun:'さかな'},
      {item:'cookie',noun:'クッキー'}, {item:'balloon',noun:'ふうせん'}
    ],
    length: [
      {item:'pencil',noun:'えんぴつ'}, {item:'ribbon',noun:'リボン'},
      {item:'crayon',noun:'クレヨン'}, {item:'rope',noun:'ひも'}
    ]
  };

  const state = {
    mode: 'all', deck: [], round: 0, results: [],
    busy: false, music: true, voice: true,
    audio: null, timer: null, lastCorrectSide: -1
  };

  function shuffled(arr) {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function buildDeck(mode) {
    const pattern = mode === 'all'
      ? shuffled(['size','amount','length','size','amount','length'])
      : Array(TOTAL).fill(mode);
    const selections = {};
    const counts = {size: 0, amount: 0, length: 0};
    const flips = {size: Math.round(Math.random()), amount: Math.round(Math.random()), length: Math.round(Math.random())};
    for (const key of Object.keys(objects)) selections[key] = shuffled(objects[key]);
    let previousSide = -1;
    return pattern.map((type) => {
      const n = counts[type]++;
      const object = selections[type][n % selections[type].length];
      const wordIndex = (n + flips[type]) % 2;
      let correctSide = Math.round(Math.random());
      // Avoid always having the correct answer in one position.
      if (correctSide === previousSide && Math.random() < .65) correctSide = 1 - correctSide;
      previousSide = correctSide;
      const word = words[type][wordIndex];
      const text = type === 'amount'
        ? `${object.noun}が ${word}のは どっち？`
        : `${word} ${object.noun}は どっち？`;
      return {type, ...object, word, wordIndex, correctSide, text};
    });
  }

  // Every illustration is drawn as an SVG so the comparisons are clear at any iPad size.
  function shape(item, x, y, size) {
    const scale = size / 100;
    const head = `<g transform="translate(${x} ${y}) scale(${scale})">`;
    const tail = `</g>`;
    if (item === 'apple') return head + `
      <path d="M0-31 C-1-43 5-48 9-50" fill="none" stroke="#665b41" stroke-width="5" stroke-linecap="round"/>
      <path d="M3-45 Q24-62 28-38 Q15-30 3-45" fill="#68ac74"/>
      <path d="M0-28 C-22-43-49-20-41 14 C-35 49-12 45 0 40 C15 46 35 42 42 11 C50-24 22-41 0-28" fill="#f27775" stroke="#d45764" stroke-width="3"/>
      <path d="M-24-15 Q-35 0-24 16" stroke="#ffc4bd" stroke-width="7" fill="none" stroke-linecap="round" opacity=".9"/>` + tail;
    if (item === 'balloon') return head + `
      <ellipse cx="0" cy="-9" rx="34" ry="43" fill="#f5a3c0" stroke="#db7fa5" stroke-width="3"/>
      <path d="M-7 35 L0 45 L7 35" fill="#d877a7"/><path d="M0 45 Q-12 58 1 67" stroke="#bc93ab" stroke-width="3" fill="none"/>
      <ellipse cx="-13" cy="-25" rx="8" ry="17" transform="rotate(25 -13 -25)" fill="#ffdbe8" opacity=".9"/>` + tail;
    if (item === 'flower') return head + `
      <path d="M0 5 V52" stroke="#5ba47f" stroke-width="8" stroke-linecap="round"/>
      <path d="M0 32 Q-30 8-34 30 Q-20 49 0 39 M0 42 Q24 15 32 35 Q15 51 0 45" fill="#78bc86"/>
      ${[0,60,120,180,240,300].map(a=>`<ellipse cx="0" cy="-27" rx="15" ry="24" transform="rotate(${a})" fill="#b79ce9" stroke="#a48bd8" stroke-width="1.5"/>`).join('')}
      <circle r="18" fill="#ffce67" stroke="#e8ad4e" stroke-width="2"/><circle cx="-6" cy="-6" r="5" fill="#fff0a8"/>` + tail;
    if (item === 'star') return head + `
      <path d="M0-48 L13-16 L47-15 L21 7 L30 42 L0 23 L-30 42 L-21 7 L-47-15 L-13-16 Z" fill="#ffd56f" stroke="#efb849" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="-13" cy="-5" r="4" fill="#c48b4b"/><circle cx="13" cy="-5" r="4" fill="#c48b4b"/><path d="M-6 8 Q0 13 6 8" stroke="#c48b4b" stroke-width="3" fill="none" stroke-linecap="round"/>` + tail;
    if (item === 'cookie') return head + `
      <circle r="43" fill="#e7b87f" stroke="#c99764" stroke-width="3"/>
      <circle cx="-23" cy="-15" r="7" fill="#a96d50"/><circle cx="12" cy="-24" r="6" fill="#a96d50"/><circle cx="25" cy="12" r="8" fill="#a96d50"/><circle cx="-11" cy="22" r="7" fill="#a96d50"/><circle cx="-1" cy="-1" r="6" fill="#a96d50"/><circle cx="-31" cy="18" r="4" fill="#fff0c6"/>` + tail;
    if (item === 'fish') return head + `
      <path d="M25-10 L55-32 L55 31 L25 10" fill="#77c8df" stroke="#54acc4" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="-10" cy="0" rx="43" ry="29" fill="#84d9e9" stroke="#54acc4" stroke-width="3"/>
      <path d="M-15-28 L8-47 L14-22" fill="#70c3dc"/><circle cx="-31" cy="-7" r="5" fill="#39546a"/>
      <path d="M-29 10 Q-19 17-9 10" stroke="#54acc4" stroke-width="3" fill="none" stroke-linecap="round"/>` + tail;
    return '';
  }

  function longThing(item, long) {
    const width = long ? 255 : 116;
    const start = 160 - width / 2;
    const y = 119;
    const end = start + width;
    if (item === 'pencil') return `
      <g><rect x="${start+23}" y="${y-20}" width="${width-54}" height="40" fill="#f7c969" stroke="#d8a94e" stroke-width="2"/>
      <rect x="${start+17}" y="${y-20}" width="18" height="40" rx="4" fill="#efa1a6" stroke="#d88896" stroke-width="2"/>
      <path d="M${end-31} ${y-20} L${end} ${y} L${end-31} ${y+20}Z" fill="#eac9a5" stroke="#bca285" stroke-width="2"/>
      <path d="M${end-9} ${y-6} L${end} ${y} L${end-9} ${y+6}Z" fill="#566379"/>
      <path d="M${start+40} ${y-9} H${end-39}" stroke="#ffe5aa" stroke-width="5" stroke-linecap="round"/></g>`;
    if (item === 'ribbon') return `
      <g><rect x="${start}" y="${y-17}" width="${width}" height="34" rx="12" fill="#baabef" stroke="#9886d6" stroke-width="3"/>
      <path d="M${start+8} ${y-7} H${end-8}" stroke="#e6dcff" stroke-width="6" stroke-linecap="round"/>
      <path d="M${start+12} ${y+17} l-6 16 18-11 M${end-12} ${y+17} l6 16 -18-11" fill="#baabef" stroke="#9886d6" stroke-width="2"/></g>`;
    if (item === 'crayon') return `
      <g><rect x="${start+18}" y="${y-23}" width="${width-35}" height="46" rx="8" fill="#76cbb2" stroke="#50aa92" stroke-width="3"/>
      <path d="M${start+18} ${y-23} H${start+41} V${y+23} H${start+18} Z" fill="#5daf9d"/>
      <path d="M${end-17} ${y-23} L${end+3} ${y} L${end-17} ${y+23}Z" fill="#a1dfc7" stroke="#50aa92" stroke-width="3"/>
      <path d="M${start+50} ${y-12} H${end-29}" stroke="#c9efe0" stroke-width="5" stroke-linecap="round"/></g>`;
    return `<g><path d="M${start+4} ${y+3} C${start+width*.2} ${y-39},${start+width*.31} ${y+40},${start+width*.5} ${y} S${start+width*.8} ${y-27},${end-3} ${y+3}" fill="none" stroke="#c58e63" stroke-width="17" stroke-linecap="round"/>
      <path d="M${start+4} ${y+3} C${start+width*.2} ${y-39},${start+width*.31} ${y+40},${start+width*.5} ${y} S${start+width*.8} ${y-27},${end-3} ${y+3}" fill="none" stroke="#f2d6aa" stroke-width="7" stroke-linecap="round" stroke-dasharray="7 10"/></g>`;
  }

  function picture(question, isTarget) {
    const type = question.type;
    const value = isTarget ? question.wordIndex : 1 - question.wordIndex;
    let drawing = '';
    if (type === 'size') {
      const size = value === 0 ? 170 : 87;
      drawing = shape(question.item,160,117,size);
    } else if (type === 'amount') {
      const count = value === 0 ? 7 : 2;
      const points = count === 2
        ? [[115,118],[205,118]]
        : [[49,72],[123,72],[197,72],[271,72],[85,165],[160,165],[235,165]];
      drawing = points.map(([x,y])=>shape(question.item,x,y,56)).join('');
    } else {
      drawing = longThing(question.item,value===0);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" role="img" aria-hidden="true">${drawing}</svg>`;
  }

  function renderProgress() {
    $('progressStars').innerHTML = Array.from({length:TOTAL},(_,i)=>`<span class="progress-star ${state.results[i] ? 'earned' : ''}">★</span>`).join('');
    $('progressNumber').textContent = `${state.results.filter(Boolean).length} / ${TOTAL}`;
  }

  function renderQuestion() {
    clearTimeout(state.timer);
    state.busy = false;
    $('rewardScreen').hidden = true;
    $('finishScreen').hidden = true;
    if (state.round >= TOTAL) return finish();
    const question = state.deck[state.round];
    $('lessonPill').innerHTML = `<span class="pill-dot"></span> ${modeNames[question.type]} の もんだい　${state.round+1} / ${TOTAL}`;
    $('questionText').textContent = question.text;
    $('visualLeft').innerHTML = picture(question,question.correctSide===0);
    $('visualRight').innerHTML = picture(question,question.correctSide===1);
    document.querySelectorAll('.choice-card').forEach(button=>{
      button.disabled = false;
      button.classList.remove('wrong','correct');
    });
    $('helpLine').innerHTML = '<span class="help-sparkle">✦</span> すきな えを ゆびで タッチしてね！';
    renderProgress();
  }

  function makeConfetti() {
    const colors = ['#f398ae','#fed16c','#9adac0','#a99bef','#7acde9'];
    $('confettiField').innerHTML = Array.from({length:27},(_,i)=>{
      const x = (i*47.7 + 13) % 100;
      const delay = -((i*11)%25)/10;
      const duration = 2.1 + (i%6)*.29;
      return `<i class="confetti" style="--confetti-color:${colors[i%5]};--confetti-x:${x}%;--confetti-delay:${delay}s;--confetti-duration:${duration}s"></i>`;
    }).join('');
  }

  function playJingle() {
    if (!state.music) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!state.audio) state.audio = new AudioContext();
      const audio = state.audio;
      if (audio.state === 'suspended') audio.resume().catch(()=>{});
      const start = audio.currentTime + .025;
      const notes = [523.25,659.25,783.99,1046.5,783.99,1046.5];
      const offsets = [0,.18,.36,.58,.88,1.08];
      const lengths = [.24,.24,.28,.28,.22,.72];
      notes.forEach((frequency,i)=>{
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = i===5 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(frequency,start+offsets[i]);
        gain.gain.setValueAtTime(.0001,start+offsets[i]);
        gain.gain.exponentialRampToValueAtTime(.13,start+offsets[i]+.02);
        gain.gain.exponentialRampToValueAtTime(.0001,start+offsets[i]+lengths[i]);
        osc.connect(gain).connect(audio.destination);
        osc.start(start+offsets[i]);
        osc.stop(start+offsets[i]+lengths[i]+.02);
      });
    } catch (_) { /* No audio hardware or playback is blocked; keep the visual reward. */ }
  }

  function speak(text) {
    if (!state.voice || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = .82;
      utterance.pitch = 1.08;
      const voices = window.speechSynthesis.getVoices();
      const japanese = voices.find(v=>v.lang.toLowerCase().startsWith('ja'));
      if (japanese) utterance.voice = japanese;
      window.speechSynthesis.speak(utterance);
    } catch (_) { /* Device voice might not be installed. */ }
  }

  function choose(side) {
    if (state.busy || state.round>=TOTAL) return;
    const question = state.deck[state.round];
    const button = document.querySelector(`.choice-card[data-choice="${side}"]`);
    if (side !== question.correctSide) {
      button.classList.remove('wrong');
      void button.offsetWidth;
      button.classList.add('wrong');
      $('helpLine').innerHTML = '<span class="help-sparkle">♡</span> おしい！ もういちど えらんでね';
      return;
    }
    state.busy = true;
    state.results[state.round] = true;
    document.querySelectorAll('.choice-card').forEach(b=>b.disabled=true);
    button.classList.add('correct');
    renderProgress();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    playJingle();
    $('rewardCopy').textContent = `${state.results.filter(Boolean).length}こめの ほしを ゲット！`;
    $('rewardScreen').hidden = false;
    $('nextButton').focus({preventScroll:true});
    state.timer = setTimeout(next,4400);
  }

  function next() {
    clearTimeout(state.timer);
    if (!state.busy) return;
    state.round++;
    renderQuestion();
  }

  function skip() {
    clearTimeout(state.timer);
    if (state.busy) return;
    state.results[state.round] = false;
    state.round++;
    renderQuestion();
  }

  function finish() {
    state.busy = true;
    const correct = state.results.filter(Boolean).length;
    $('finishTitle').textContent = correct===TOTAL ? 'ぜんぶ できたね！' : 'がんばったね！';
    $('finishScreen').querySelector('.finish-message').textContent = `${correct}こ せいかいしたよ！`;
    $('finishScreen').querySelector('.finish-stars').textContent = Array.from({length:TOTAL},(_,i)=>i<correct?'★':'☆').join(' ');
    $('finishScreen').hidden = false;
    if (correct===TOTAL) playJingle();
  }

  function start(mode, doSpeak=false) {
    clearTimeout(state.timer);
    state.mode = mode;
    state.deck = buildDeck(mode);
    state.round = 0;
    state.results = [];
    document.querySelectorAll('.mode-button').forEach(button=>{
      const active = button.dataset.mode===mode;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });
    renderQuestion();
    if (doSpeak) speak(state.deck[0].text);
  }

  document.querySelectorAll('.choice-card').forEach(button=>button.addEventListener('click',()=>choose(Number(button.dataset.choice))));
  document.querySelectorAll('.mode-button').forEach(button=>button.addEventListener('click',()=>start(button.dataset.mode,true)));
  $('speakButton').addEventListener('click',()=>speak(state.deck[state.round].text));
  $('nextButton').addEventListener('click',next);
  $('skipButton').addEventListener('click',skip);
  $('againButton').addEventListener('click',()=>start(state.mode,true));
  $('musicToggle').addEventListener('click',()=>{
    state.music=!state.music;
    $('musicToggle').setAttribute('aria-pressed',String(state.music));
    $('musicLabel').textContent=`おと ${state.music?'ON':'OFF'}`;
    if (state.music) playJingle();
  });
  $('voiceToggle').addEventListener('click',()=>{
    state.voice=!state.voice;
    $('voiceToggle').setAttribute('aria-pressed',String(state.voice));
    $('voiceLabel').textContent=`こえ ${state.voice?'ON':'OFF'}`;
    if (!state.voice && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    if (state.voice && state.round < TOTAL) speak(state.deck[state.round].text);
  });

  makeConfetti();
  start('all');
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', {scope:'./'}).catch(() => {
        // Learning still works normally if the browser does not permit offline caching.
      });
    });
  }
})();
