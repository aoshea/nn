// Import stylesheets
import './style.css';

import game = require('./game.js');

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
  if (in_level && this.drawText(tile.char)) {
    this.setState('state--idle', true);
    this.text_mask_animate_el.beginElement();
    //this.base_animate_el.beginElement();
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
console.log('char', char_set);
const max_chars = char_set.length;
const tile_mgr = game.createTileMgr(game.createTiles(char_set));
const tile_views = createTileViewMap();
tile_views.forEach((tile) => tile.addListeners(inputHandler));

function createTileViewMap() {
  const views = [];
  for (let i = 0; i < max_chars; ++i) {
    views.push(new TileView(i));
  }
  return views;
}

const input_view = document.querySelector('#text-input tspan');
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
let game_level = 0;
let hints = 3;

// statistics
let streak = '0';
let best_streak = '0';
let today_score = '3/8';
let today_hints = `${hints}/3`;
let current_streak = `Current ${streak}`;
let all_time_streak = `All-time ${best_streak}`;
let total_played = '0';
let game_result = `Zigga ${game_no} ${today_score}\n`;

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

  // tile_view_map = initTileViews(inputHandler);

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
  const complete_count = getCompleteCount();

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
  tile_mgr.shuffle(game_level, game.answersForLevel(answer_list, game_level));
  const res = tile_mgr.currentTilesAsChars(game_level);
  console.log(res);
}

function getCompleteCount() {
  const complete_count = 0; // tiles.reduce((count, tile) => {
  //return tile.state & T_COMPLETE ? count + 1 : count;
  // }, 0);
  return complete_count;
}

function initTileViews(handler) {
  const tile_view_map = {};
  for (let i = 0; i < 8; ++i) {
    const view = new TileView(i);
    view.addListeners(handler);
    tile_view_map[view.getKey()] = view;
  }
  return tile_view_map;
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
    for (let i = 0; i < tiles.length; ++i) {
      if (tiles[i].state & (T_IDLE | T_USE)) {
        tiles[i].complete();
      }
    }
    ++game_level;
    const tile = tiles[game_level + 2];
    const tile_char = getChar(tile.index);
    if (tile_char) {
      tile.show(tile_char);
    }
  } else {
    for (let i = 0; i < tiles.length; ++i) {
      if (tiles[i].state & (T_IDLE | T_USE | T_COMPLETE)) {
        tiles[i].end();
      }
    }

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
  console.log('is_correct', is_correct);
  /*

  const len = game_level + 3;
  const game_level_answers = answers.get(len);
  const input_value = getInputValue();
  if (game_level_answers.indexOf(input_value.toLowerCase()) !== -1) {
    advanceLevel();
  tile_mgr.select(index);
    clearInput();
  } else {
    // the wrong answer
    // shake input and clear input on animate end
    // prevent input until cleared
    input_view_animate.beginElement();
  }
  */
}

function handleHint() {
  if (hints > 0) {
    if (game_level < 5) {
      // what is the next letter? check input_indices

      const game_level_answer = answers.get(game_level + 3)[0];
      // check we are correct
      for (let i = 0; i < input_indices.length; ++i) {
        console.log(getChar(input_indices[i]), game_level_answer.charAt(i));
        if (getChar(input_indices[i]) !== game_level_answer.charAt(i)) {
          console.log('wrong input, clear it from here on');

          let k = input_indices.length;
          while (k > i) {
            input_indices.pop();
            --k;
          }
          break;
        }
      }
      const next_char = game_level_answer.charAt(input_indices.length);
      const next_char_index = getCharIndex(next_char);
      const next_tile = tiles.find((el) => el.index === next_char_index);
      if (next_tile) {
        next_tile.hint();
        addInput(getCharIndex(next_char));
        --hints;
      } else {
        throw new Error('No tile exists for ' + next_char_index + next_char);
      }
    }
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
  update();
  draw();
}

// update game
function update() {}

// draw game
function draw() {
  const min_len = 3;
  for (let i = 0; i < tile_views.length; ++i) {
    //const tile = tiles[i];
    const tile = tile_mgr.atIndex(i);
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
  hint_btn.textContent = `HINT ${hints} \uFE56 `;
  if (hints === 0) {
    hint_btn.setAttribute('disabled', 'disabled');
  }
}

// update input element
function renderInput() {
  input_view.textContent = tile_mgr.currentInput();
}
