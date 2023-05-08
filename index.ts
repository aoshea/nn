// Import stylesheets
import './style.css';

import game = require('./game.js');

let tt = 0;

function InputView() {
  this.root_el = document.querySelector('g#input-view');
  const input_char_el = this.root_el.querySelector('g#input-char');
  this.text_group_el = input_char_el.cloneNode(true);
  this.char_width = this.root_el.getBBox().width;
  this.char_value_els = [];
  this.to_remove = [input_char_el];

  this.last_input = null;
}

InputView.prototype.clearPrevious = function () {
  let el;
  while ((el = this.to_remove.pop())) {
    this.root_el.removeChild(el);
  }
};

InputView.prototype.reset = function (chars) {
  this.clearPrevious();
  const cx = 50;
  const c = Math.floor(chars / 2);
  const offset = chars % 2 === 0 ? 5 : 0;
  this.char_value_els = [];
  for (let i = 0; i < chars; ++i) {
    const char_el = this.text_group_el.cloneNode(true);
    const index = chars - 1 - i - c;
    const x = cx - (index * this.char_width + offset);
    char_el.id = `char-${i}`;
    char_el.setAttribute('transform', `translate(${x}, 0)`);
    this.char_value_els[i] = char_el.querySelector('tspan');
    this.root_el.appendChild(char_el);
    this.to_remove.push(char_el);
  }
};

InputView.prototype.render = function (input) {
  if (input === this.last_input) {
    return;
  }
  this.last_input = input;
  const chars = input.split('');
  for (let i = 0; i < this.char_value_els.length; ++i) {
    const el = this.char_value_els[i];
    el.textContent = i > chars.length ? '' : chars[i];
  }
};

function TileView(position) {
  this.timeout = null;
  this.position = position;
  this.root_el = document.querySelector(this.getKey());
  this.base_el = this.root_el.querySelector('polygon.layer--base');
  this.overlay_el = this.root_el.querySelector('rect.layer--overlay');
  this.overlay_el.addEventListener(
    'animationend',
    this.handleOverlayAnimationEnd.bind(this)
  );
  this.base_animate_el = this.base_el.querySelector('animate');
  this.text_mask_el = this.root_el.querySelector('polygon.layer--mask');
  this.text_mask_animate_el = this.text_mask_el.querySelector('animate');
  this.text_el = this.root_el.querySelector('text');
}

TileView.prototype.getKey = function () {
  return `g#b-${this.position}`;
};

TileView.prototype.addListeners = function (handler) {
  this.root_el.addEventListener('mousedown', handler, true);
  this.root_el.addEventListener('mouseup', handler, true);
  this.root_el.addEventListener('touchstart', handler, true);
  this.root_el.addEventListener('touchend', handler, true);
};

TileView.prototype.removeListeners = function (handler) {
  this.root_el.addEventListener('mousedown', handler, true);
  this.root_el.addEventListener('mouseup', handler, true);
  this.root_el.addEventListener('touchstart', handler, true);
  this.root_el.addEventListener('touchend', handler, true);
};

TileView.prototype.handleOverlayAnimationEnd = function () {
  this.setState('state--focus', false);
};

TileView.prototype.focus = function () {
  this.setState('state--focus', true);
};

TileView.prototype.draw = function (tile, in_level) {
  // this.drawText(tile.char);
  if (!in_level) {
    return;
  }

  this.drawText(tile.char);

  if (tile.transitioned()) {
    // initial drawing of char
    if (tile.transitionedTo(game.T_STATES.T_IDLE)) {
      this.setState('state--idle', true);
      this.text_mask_animate_el.beginElement();
    }

    // word completed with char
    if (tile.transitionedTo(game.T_STATES.T_COMPLETE | game.T_STATES.T_END)) {
      this.base_animate_el.beginElement();
    }

    // hinted?
    if (tile.transitionedTo(game.T_STATES.T_HINT)) {
      console.log('a tile was hinted');
      this.setState('state--hint', true);
    }
    tile.endTransition();
  }

  /*
  if (tile.transitioned()) {
    if (tile.transitionTo(T_COMPLETE | T_END)) {
      this.base_animate_el.beginElement();
    }
    if (tile.transitionTo(T_IDLE | T_END)) {
      this.text_mask_animate_el.beginElement();
    }

    this.setState('state--use', tile.state & T_USE);
    this.setState('state--empty', tile.state & T_EMPTY);
    this.setState('state--idle', tile.state & T_IDLE);
    this.setState('state--hint', tile.state & T_HINT);
    tile.prev_state = tile.state;
  }
  */
};

TileView.prototype.drawText = function (char) {
  if (this.text_el.textContent !== char) {
    this.text_el.textContent = char;
    return true;
  }
  return false;
};

TileView.prototype.setState = function (class_name, is_active) {
  const fn = is_active ? 'add' : 'remove';
  this.root_el.classList[fn](class_name);
};

// Will be set by template
window.ZZ_INFO =
  'aeg|aegr|aegrs|adegrs|abdegrs|abdegirs,age|gear|rage|gears|rages|sarge|grades|badgers|abridges|brigades';
window.ZZ_GAME_NO = '1';

const info = window.ZZ_INFO;
const game_no = window.ZZ_GAME_NO;

let touch = false;

// loop
let its = 0;
const answer_list = window.ZZ_INFO.split(',')[1];
const char_set = game.orderCharSet(window.ZZ_INFO.split(',')[0]);
const max_chars = char_set.length;
const tile_mgr = game.createTileMgr(game.createTiles(char_set));
const tile_views = createTileViewMap();
tile_views.forEach((tile) => tile.addListeners(inputHandler));

// key handlers
window.onkeypress = function (e) {
  if (e.keyCode === 48) {
    // zero
    console.log('Reset storage.');
    resetStorage();
  }
};

function createTileViewMap() {
  const views = [];
  for (let i = 0; i < max_chars; ++i) {
    views.push(new TileView(i));
  }
  return views;
}

function getStorageData() {
  const item = window.localStorage.getItem('z-words');
  if (item === null || typeof item === 'undefined') {
    return resetStorage();
  } else {
    return JSON.parse(item);
  }
}

function resetStorage() {
  const gameKey = `game-${window.ZZ_GAME_NO}`;
  const data = {
    [gameKey]: {
      level: 0,
      hints: 3,
      words: [],
      tiles: [],
    },
    streak: 0,
    all_time_streak: 0,
  };
  window.localStorage.setItem('z-words', JSON.stringify(data));
  return data;
}

function saveStorageData(data) {
  window.localStorage.setItem('z-words', JSON.stringify(data));
}

function fromGlobalStorage(prop, def_value) {
  const data = getStorageData();
  return data[prop] ?? def_value;
}

function updateGlobalStorage(prop, value) {
  const data = getStorageData();
  data[prop] = value;
  saveStorageData(data);
}

function updateGameStorage(obj) {
  const gameKey = `game-${window.ZZ_GAME_NO}`;
  const data = getStorageData();
  const game = data[gameKey];
  const newData = {
    ...data,
    [gameKey]: {
      ...game[gameKey],
      ...obj
    },
  };
  saveStorageData(newData);
}

function fromGameStorage(prop, def_value) {
  const gameKey = `game-${window.ZZ_GAME_NO}`;
  const data = getStorageData();
  const game = data[gameKey];
  if (game === null ?? typeof game === 'undefined') {
    console.error('No storage for this game id', gameKey);
    return def_value;
  }
  return game[prop] ?? def_value;
}

const input_view_animate = document.querySelector('#text-input-animate');
input_view_animate.addEventListener(
  'beginEvent',
  handleInputAnimateBeginEvent,
  true
);
input_view_animate.addEventListener(
  'endEvent',
  handleInputAnimateEndEvent,
  true
);

let t = 0;
let min_chars = 3;

// game level saved in storage
let game_level = fromGameStorage('level', 0);
// game serialized tiles saved in storage
let savedTiles = fromGameStorage('tiles', []);

// hints saved in storage
let hints = fromGameStorage('hints', 3);

// statistics
let streak = fromGlobalStorage('streak', 0);
let best_streak = fromGlobalStorage('all_time_streak', 0);
let today_score = '3/8';
let today_hints = `${hints}/3`;
let current_streak = `Current ${streak}`;
let all_time_streak = `All-time ${best_streak}`;
let total_played = '0';
let game_result = `Zigga ${game_no} ${today_score}\n`;

// input char display
const input_char_view = new InputView();
input_char_view.reset(game_level + min_chars);

// set idle state on tiles
tile_mgr.show(game_level, savedTiles);

// plums
const plumtexts = [
  'Nice',
  'Great',
  'Amazing',
  'Incredible',
  'Superb',
  'You win',
];
const plumTspan = document.querySelector('text#plum tspan');
const plumAnimate = document.querySelector('animate#plum-animate');
const plumAnimateFade = document.querySelector('animate#plum-animate-fade');
const plumAnimateSkew = document.querySelector(
  'animateTransform#plum-animate-skew'
);

main();

function main() {
  setLayoutHeight();
  addGlobalListeners();
  addGameListeners();
  updateStats();

  // start tick
  gameloop();
}

function handleInputAnimateBeginEvent() {
  // disable all interaction
  tile_views.forEach((tile_view) => {
    tile_view.removeListeners(inputHandler);
  });
  removeGameListeners();
}

function handleInputAnimateEndEvent() {
  tile_mgr.clear();
  // enable all interaction
  tile_views.forEach((tile_view) => {
    tile_view.addListeners(inputHandler);
  });
  addGameListeners();
}

function getStorageItem(key) {
  const item = window.localStorage.getItem(key);
  if (item === null || typeof item === 'undefined') {
    window.localStorage.setItem(key, '0');
    return '0';
  }
  return item;
}

function getTileIcon(position) {
  let a = '\uD83D\uDFE7';
  let b = '\u2B1C';
  let c = '\u2B1B';

  return a;

  /*
  const tile = tiles[position];
  if (!tile) return c;
  if (tile.state & T_HINT) {
    return b;
  } else if (tile.state & (T_COMPLETE | T_END)) {
    return a;
  } else {
    return c;
  }
  */
}

function buildGameResult(game_no, complete_count, max_chars = 8) {
  let a = '\uD83D\uDFE7';
  let b = '\u2B1C';
  let c = '\u2B1B';
  let result = `Zigga ${game_no} ${complete_count}/${max_chars}\n`;
  result += '    ' + getTileIcon(7) + '\n';
  result += '  ' + getTileIcon(4) + getTileIcon(5) + getTileIcon(6) + '\n';
  result +=
    ' ' +
    getTileIcon(0) +
    getTileIcon(1) +
    getTileIcon(2) +
    getTileIcon(3) +
    '\n';
  return result;
}

function updateStats() {
  const complete_count = tile_mgr.getCompleteCount();

  const el = document.querySelector('.result-today');
  const score_el = el.querySelector('span + span');
  const percent_el = el.querySelector('span + span + span');
  score_el.textContent = `${complete_count}/${max_chars}`;
  percent_el.textContent = `${(complete_count / max_chars) * 100}%`;

  /*

  document.querySelector('#game-no > span').textContent = `Game ${game_no}`;
  today_score = `Result ${complete_count}/${max_chars}`;
  document.querySelector('#today-score').textContent = today_score;
  today_hints = `Hints ${3 - hints}/3`;
  document.querySelector('#today-hints').textContent = today_hints;

  streak = getStorageItem('z-streak');
  best_streak = getStorageItem('z-best-streak');
  total_played = getStorageItem('z-total-played');

  current_streak = `Current ${streak}`;
  document.querySelector('#current-streak').textContent = current_streak;
  all_time_streak = `All-time ${best_streak}`;
  document.querySelector('#all-time-streak').textContent = all_time_streak;

  document.querySelector(
    '#total-played'
  ).textContent = `Played ${total_played}`;
  game_result = `Game ${game_no} ${today_score}\n \uD83D\uDFE7`;
  document.querySelector('#share-result').textContent = buildGameResult(
    game_no,
    complete_count,
    max_chars
  );
  */
}

function handleReset() {
  resetStorage();
}

function addGlobalListeners() {
  window.addEventListener('resize', setLayoutHeight);
  document
    .querySelector('button[name="stats"]')
    .addEventListener('click', handleClickStats, true);
  document
    .querySelector('button[name="close-drawer"]')
    .addEventListener('click', handleClickStats, true);
  document
    .querySelector('button[name="share"]')
    .addEventListener('click', handleShare, true);
  document
    .querySelector('button[name="reset"]')
    .addEventListener('click', handleReset, true);
}

function addGameListeners() {
  document
    .querySelector('button[name="delete"]')
    .addEventListener('click', handleDelete, true);
  document
    .querySelector('button[name="shuffle"]')
    .addEventListener('click', handleShuffle, true);
  document
    .querySelector('button[name="hint"]')
    .addEventListener('click', handleHint, true);
  document
    .querySelector('button[name="enter"]')
    .addEventListener('click', handleEnter, true);
}

function removeGameListeners() {
  document
    .querySelector('button[name="delete"]')
    .removeEventListener('click', handleDelete, true);
  document
    .querySelector('button[name="shuffle"]')
    .removeEventListener('click', handleShuffle, true);
  document
    .querySelector('button[name="hint"]')
    .removeEventListener('click', handleHint, true);
  document
    .querySelector('button[name="enter"]')
    .removeEventListener('click', handleEnter, true);
}

function setLayoutHeight() {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

function toggleStats() {
  const drawer = document.querySelector('.drawer');
  drawer.classList.toggle('active');
}

function handleClickStats() {
  updateStats();
  toggleStats();
}

function handleShuffle() {
  const answersForLevel = game.answersForLevel(answer_list, game_level);
  tile_mgr.shuffle(game_level, answersForLevel);
}

function inputHandler(e) {
  e.stopPropagation();
  switch (e.type) {
    case 'touchstart':
      touch = true;
      break;
    case 'touchend':
      if (touch) {
        handleClick(e.currentTarget);
      }
      break;
    case 'mouseup':
      if (!touch) {
        handleClick(e.currentTarget);
      }
      break;
    default:
      return false;
  }
}

function handleClick(target) {
  const index = parseInt(target.id.split('-')[1], 10);
  const tile_view = tile_views[index];
  console.log('index', index, tile_view);
  tile_view.focus();
  const tile = tile_mgr.atIndex(index);
  if (typeof tile.select_index === 'undefined' || tile.select_index === null) {
    tile_mgr.select(index);
  }
  console.log(tile_mgr.currentInput());
}

function handleDelete() {
  tile_mgr.clearOne();
}

function showPlum(index) {
  console.log('showPlum', index);
  plumTspan.textContent = plumtexts[index];
  plumAnimate.beginElement();
  plumAnimateFade.beginElement();
  plumAnimateSkew.beginElement();
}

function advanceLevel() {
  updateStats();
  showPlum(game_level);

  if (game_level < max_chars - 3) {
    tile_mgr.complete(game_level);

    ++game_level;
    tile_mgr.show(game_level);
    input_char_view.reset(game_level + min_chars);
    const serializedTiles = tile_mgr.serialize();
    console.log('save serialedz tilesl', serializedTiles);
    updateGameStorage({
      tiles: serializedTiles,
      level: game_level
    });

    /*
    const tile = tiles[game_level + 2];
    const tile_char = getChar(tile.index);
    if (tile_char) {
      tile.show(tile_char);
    }
    */
  } else {
    /*
    for (let i = 0; i < tiles.length; ++i) {
      if (tiles[i].state & (T_IDLE | T_USE | T_COMPLETE)) {
        tiles[i].end();
      }
    }
    */
    setTimeout(toggleStats, 3000);
  }
}

function handleEnter() {
  const is_correct = game.compareAnswer(
    tile_mgr.currentInput(),
    answer_list,
    game_level
  );
  if (is_correct) {
    advanceLevel();
    tile_mgr.clear();
  } else {
    input_view_animate.beginElement();
  }
}

function handleHint() {
  if (hints <= 0) {
    console.log('Hint: Out of hints.');
    return;
  }
  if (game_level >= 5) {
    console.log('Hint: Game level too high');
    return;
  }

  const answersForLevel = game.answersForLevel(answer_list, game_level);
  const nextChar = tile_mgr.nextChar(answersForLevel);
  const nextCharIndex = tile_mgr.getIndexFromChar(nextChar);
  if (tile_mgr.atIndex(nextCharIndex)) {
    tile_mgr.atIndex(nextCharIndex).hint();
    --hints;
    updateGameStorage({hints: hints});
    tile_mgr.select(nextCharIndex);
  }
}

function handleShare() {
  const zigga = document.querySelector('#share-result');
  const shareData = {
    title: 'ZIGGAWORDS',
    text: zigga.textContent,
    url: location.href,
  };

  try {
    navigator
      .share(shareData)
      .then((res) => {
        console.log('succesfully shared', res);
      })
      .catch((err) => {
        console.error('error sharing', err);
      });
  } catch (e) {
    console.error(e);
    try {
      navigator.clipboard
        .writeText(zigga.textContent)
        .then((res) => {
          console.log('success', res);
        })
        .catch((err) => {
          console.log('share failed', err);
        });
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }
}

function gameloop() {
  window.requestAnimationFrame(gameloop);

  ++tt;
  if (tt % 5 === 0) {
    update();
    draw();
  }
}

// update game
function update() {}

// draw game
function draw() {
  const min_len = 3;
  for (let i = 0; i < tile_views.length; ++i) {
    //const tile = tiles[i];
    const tile = tile_mgr.atIndex(i);
    // console.log(i, tile.char);
    tile_views[i].draw(tile, i < game_level + min_len);
    //const tile_view = tile_view_map[tile.getKey(i)];
    // tile_view.draw(tile);
    //tile_view.drawText(tile.char);
  }
  ++t;
  renderInput();
  renderUI();
}

function renderUI() {
  const hint_btn = document.querySelector('button[name="hint"]');
  hint_btn.dataset.count = hints;
  hint_btn.textContent = 'HINT';
  if (hints === 0) {
    hint_btn.setAttribute('disabled', 'disabled');
  }
}

// update input element
function renderInput() {
  input_char_view.render(tile_mgr.currentInput());
}
