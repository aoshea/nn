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
  const curr = this.tiles.map((t) => t.char).join('');
  let iterations = 0;
  let max_iterations = 100;
  while (iterations < max_iterations) {
    const randomized = this.randomizeTiles(this.tiles, game_level);
    const randomized_text = randomized.map((t) => t.char).join('');
    if (randomized_text !== curr && answers.indexOf(randomized_text) === -1) {
      this.tiles = randomized;
      break;
    }
    ++iterations;
  }
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

TileManager.prototype.currentTilesAsChars = function (game_level) {
  const min_len = 3;
  const ordered_tiles = this.tiles
    .slice(0)
    .sort((a, b) => a.original_index - b.original_index);
  const max_index = game_level + min_len;
  let chars = '';
  for (let i = 0; i < max_index; ++i) {
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

TileManager.prototype.nextLetter = function (answers) {
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

function Tile(char, original_index) {
  this.char = char;
  this.original_index = original_index;
}

module.exports = {
  createTiles,
  createTileMgr,
  orderCharSet,
  compareAnswer,
  answersForLevel,
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
