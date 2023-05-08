function TileManager(tiles) {
  this.tiles = tiles;
}

TileManager.prototype.randomizeTiles = function (list, n) {
  let arr = list.slice(0);
  let temp;
  let random_index;
  while (n) {
    random_index = Math.floor(Math.random() * n--);
    temp = arr[n];
    arr[n] = arr[random_index];
    arr[random_index] = temp;
  }
  return arr;
};

TileManager.prototype.shuffle = function (game_level, answers) {
  const min_len = 3;
  const curr = this.tiles.map((t) => t.char).join('');
  let iterations = 0;
  let max_iterations = 100;
  while (iterations < max_iterations) {
    const randomized = this.randomizeTiles(this.tiles, game_level + min_len);
    const randomized_text = randomized.map((t) => t.char).join('');
    if (
      randomized_text !== curr &&
      answers.indexOf(randomized_text.slice(0, game_level + min_len)) === -1
    ) {
      this.tiles = randomized;
      break;
    }
    ++iterations;
  }
  console.log('shuffle iterations', iterations);
  console.log('tiles', this.tiles);
};

TileManager.prototype.clear = function () {
  for (let i = 0; i < this.tiles.length; ++i) {
    this.tiles[i].select_index = null;
  }
};

TileManager.prototype.clearOne = function () {
  let index = -1;
  let tile = null;
  for (let i = 0; i < this.tiles.length; ++i) {
    if (this.tiles[i].select_index > index) {
      index = this.tiles[i].select_index;
      tile = this.tiles[i];
    }
  }
  if (tile !== null) {
    tile.select_index = null;
  }
};

TileManager.prototype.select = function (index) {
  this.tiles[index].select_index = this.nextSelectIndex();
};

TileManager.prototype.hint = function (index) {
  this.tiles[index].is_hint = true;
};

TileManager.prototype.currentInput = function () {
  return this.tiles
    .filter(
      (x) => typeof x.select_index !== 'undefined' && x.select_index !== null
    )
    .sort((a, b) => a.select_index - b.select_index)
    .map((x) => x.char)
    .join('');
};

TileManager.prototype.atIndex = function (index) {
  return this.tiles[index];
};

TileManager.prototype.getTileIndexFromChar = function (char, game_level) {
  return this.getCurrentTiles(game_level).findIndex((x) => x.char === char);
};

TileManager.prototype.getCurrentTiles = function (game_level) {
  const min_len = 3;
  const ordered_tiles = this.tiles
    .slice(0)
    .sort((a, b) => a.original_index - b.original_index);
  const max_index = game_level + min_len;
  return ordered_tiles.slice(0, max_index);
};

TileManager.prototype.currentTilesAsChars = function (game_level) {
  const ordered_tiles = this.getCurrentTiles(game_level);
  let chars = '';
  for (let i = 0; i < ordered_tiles.length; ++i) {
    chars += ordered_tiles[i].char;
  }
  return chars;
};

TileManager.prototype.nextSelectIndex = function () {
  return this.tiles.reduce(
    (i, tile) => (tile.select_index >= i ? tile.select_index + 1 : i),
    0
  );
};

TileManager.prototype.nextChar = function (answers) {
  if (!Array.isArray(answers) || answers.length === 0) {
    throw new Error('Answers must be provided to find next letter');
  }

  const current_input = this.currentInput();
  const current_input_chars = current_input.split('');

  let next_index = 0;
  let best_answer_index = 0;
  for (let i = 0; i < answers.length; ++i) {
    const answer_chars = answers[i].split('');
    let k = 0;
    for (k = 0; k < current_input_chars.length; ++k) {
      if (current_input_chars[k] !== answer_chars[k]) {
        break;
      }
    }
    if (k > next_index) {
      next_index = k;
      best_answer_index = i;
    }
  }

  // now, in theory, we have the next index and best answer
  const best_answer = answers[best_answer_index];
  if (next_index >= best_answer.length) {
    throw new Error('Cannot show hint for correct guess');
  }
  const next_letter = best_answer.charAt(next_index);
  return next_letter;
};

TileManager.prototype.complete = function (game_level) {
  this.getCurrentTiles(game_level).forEach((tile) => tile.complete());
};

TileManager.prototype.show = function (game_level) {
  this.getCurrentTiles(game_level).forEach((tile) => tile.show());
};

TileManager.prototype.getCompleteCount = function () {
  return this.tiles.reduce((count, tile) => {
    if (tile.isComplete()) {
      return count + 1;
    }
    return count;
  }, 0);
};

TileManager.prototype.serializeStates = function () {
  return this.tiles.map((tile) => [tile.char, tile.original_index, tile.state]);
};

/**
 * Tile class
 */
const T_EMPTY = 1 << 0;
const T_IDLE = 1 << 1;
const T_USE = 1 << 2;
const T_COMPLETE = 1 << 3;
const T_HINT = 1 << 4;
const T_END = 1 << 5;
const T_SHUFFLE = 1 << 6;

const T_STATES = {
  T_EMPTY,
  T_IDLE,
  T_USE,
  T_COMPLETE,
  T_HINT,
  T_END,
  T_SHUFFLE,
};

function Tile(char, original_index) {
  this.char = char;
  this.original_index = original_index;
  this.is_hint = false;
  this.state = T_EMPTY;
  this.prevState = this.state;
}

Tile.prototype.isComplete = function () {
  return this.state & T_COMPLETE;
};

Tile.prototype.updateState = function (newState) {
  this.prevState = this.state;
  this.state = newState;
};

Tile.prototype.transitionedTo = function (newState) {
  const inPrevState = this.prevState & newState;
  const inState = this.state & newState;
  return inState && !inPrevState;
};

Tile.prototype.transitioned = function () {
  return this.state !== this.prevState;
};

Tile.prototype.endTransition = function () {
  this.prevState = this.state;
};

Tile.prototype.show = function (savedState) {
  if (this.state & T_EMPTY) {
    const addState = savedState ? savedState : T_IDLE;
    let newState = this.state | addState; // add idle state
    newState = newState & ~T_EMPTY; // remove empty state
    this.updateState(newState);
  }
};

Tile.prototype.complete = function () {
  let newState = this.state | T_COMPLETE; // add state
  newState = newState & ~T_IDLE; // remove idle state
  this.updateState(newState);
};

Tile.prototype.hint = function () {
  this.updateState(this.state | T_HINT);
};

/**
 * End Tile class
 */

module.exports = {
  createTiles,
  createTileMgr,
  orderCharSet,
  compareAnswer,
  answersForLevel,
  T_STATES,
};

function answersForLevel(answer_list, game_level) {
  const min_len = 3;
  return answer_list
    .split('|')
    .filter((x) => x.length === min_len + game_level);
}

function compareAnswer(input, answer_list, game_level) {
  const answers = answersForLevel(answer_list, game_level);
  return answers.indexOf(input) !== -1;
}

function createTileMgr(tiles) {
  return new TileManager(tiles);
}

function createTiles(char_set) {
  const chars = char_set.split('');
  const tiles = [];
  for (let i = 0; i < chars.length; ++i) {
    tiles.push(new Tile(chars[i], i));
  }
  return tiles;
}

function orderCharSet(char_set) {
  const char_list = char_set.split('|');
  const ordered = char_list.slice(0, 1);
  for (let i = 1; i < char_list.length; ++i) {
    const x = char_list[i];
    let prev = ordered[i - 1];
    const chars = x.split('');
    for (let j = 0; j < chars.length; ++j) {
      const ch = chars[j];
      if (prev.indexOf(ch) === -1) {
        prev = prev + ch;
      }
    }
    ordered.push(prev);
  }
  return ordered[ordered.length - 1];
}
