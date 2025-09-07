// シンプルなブラウザ版オセロ実装
// 盤面ロジック + UI 更新

(function () {
  'use strict';

  const SIZE = 8;
  const EMPTY = 0;
  const BLACK = 1;  // 黒
  const WHITE = -1; // 白

  // DOM 参照
  const boardEl = document.getElementById('board');
  const newGameBtn = document.getElementById('newGameBtn');
  const passBtn = document.getElementById('passBtn');
  const hintsToggle = document.getElementById('hintsToggle');
  const opponentSelect = document.getElementById('opponentSelect');
  const playerColorSelect = document.getElementById('playerColorSelect');
  const difficultySelect = document.getElementById('difficultySelect');
  const strengthMeter = document.getElementById('strengthMeter');
  const victoryOverlay = document.getElementById('victoryOverlay');
  const winnerIcon = document.getElementById('winnerIcon');
  const victoryText = document.getElementById('victoryText');
  const playAgainBtn = document.getElementById('playAgainBtn');
  const turnLabel = document.getElementById('turnLabel');
  const scoreLabel = document.getElementById('scoreLabel');
  const messageEl = document.getElementById('message');

  // 状態
  let board;
  let currentPlayer; // BLACK or WHITE
  let showHints = true;
  let lastMove = null; // {r, c}
  let gameOver = false;
  let opponentType = 'human'; // 'human' | 'cpu'
  let humanColor = BLACK;      // BLACK or WHITE（CPU時のみ有効）
  let cpuThinking = false;
  let cpuTimer = null; // CPU指し待ちのタイマーID
  let winnerColor = null; // BLACK | WHITE | 0(引き分け) | null
  let difficulty = 'weak'; // 'weak' | 'normal' | 'strong'

  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [ 0, -1],          [ 0, 1],
    [ 1, -1], [ 1, 0], [ 1, 1]
  ];

  // 参照キャッシュ（セルDOM）
  const cellRefs = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));

  // ユーティリティ
  const inBounds = (r, c) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;
  const opponent = (p) => (p === BLACK ? WHITE : BLACK);
  const playerName = (p) => (p === BLACK ? '黒' : '白');
  const isHumanTurn = () => opponentType === 'human' || currentPlayer === humanColor;

  function createEmptyBoard() {
    return Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
  }

  function createInitialBoard() {
    const b = createEmptyBoard();
    // 初期配置（0始まり）
    // (3,3)=白, (3,4)=黒, (4,3)=黒, (4,4)=白
    b[3][3] = WHITE;
    b[3][4] = BLACK;
    b[4][3] = BLACK;
    b[4][4] = WHITE;
    return b;
  }

  // 合法手の一覧を返す: [{ r, c, flips: [[r,c], ...] }, ...]
  function getValidMoves(bd, player) {
    const moves = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (bd[r][c] !== EMPTY) continue;
        const flipsTotal = [];
        for (const [dr, dc] of directions) {
          let rr = r + dr, cc = c + dc;
          const flipsDir = [];
          // まず相手の石が連続している必要
          if (!inBounds(rr, cc) || bd[rr][cc] !== opponent(player)) continue;
          while (inBounds(rr, cc) && bd[rr][cc] === opponent(player)) {
            flipsDir.push([rr, cc]);
            rr += dr; cc += dc;
          }
          if (!inBounds(rr, cc)) continue;
          if (bd[rr][cc] === player && flipsDir.length > 0) {
            flipsTotal.push(...flipsDir);
          }
        }
        if (flipsTotal.length > 0) {
          moves.push({ r, c, flips: flipsTotal });
        }
      }
    }
    return moves;
  }

  function applyMove(bd, move, player) {
    const { r, c, flips } = move;
    bd[r][c] = player;
    for (const [rr, cc] of flips) {
      bd[rr][cc] = player;
    }
  }

  function countDiscs(bd) {
    let black = 0, white = 0;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (bd[r][c] === BLACK) black++;
        else if (bd[r][c] === WHITE) white++;
      }
    }
    return { black, white };
  }

  // 盤面UI生成（1回だけ）
  function buildBoardUI() {
    boardEl.innerHTML = '';
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('aria-rowindex', String(r + 1));
        cell.setAttribute('aria-colindex', String(c + 1));
        cell.tabIndex = 0;
        cell.dataset.row = String(r);
        cell.dataset.col = String(c);
        cell.addEventListener('click', onCellClick);
        cell.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onCellClick.call(cell, e);
          }
        });
        boardEl.appendChild(cell);
        cellRefs[r][c] = cell;
      }
    }
  }

  function clearMessage() {
    messageEl.textContent = '';
  }

  function setMessage(msg) {
    messageEl.textContent = msg;
  }

  function render() {
    const moves = getValidMoves(board, currentPlayer);
    const moveKey = new Set(moves.map((m) => `${m.r},${m.c}`));

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = cellRefs[r][c];
        cell.classList.remove('hint', 'last-move', 'disabled');
        cell.innerHTML = '';

        // 石の描画
        if (board[r][c] !== EMPTY) {
          const disc = document.createElement('div');
          const isBlack = board[r][c] === BLACK;
          disc.className = 'disc ' + (isBlack ? 'black' : 'white');
          if (gameOver && (winnerColor === BLACK && isBlack || winnerColor === WHITE && !isBlack)) {
            disc.classList.add('celebrate');
          }
          cell.appendChild(disc);
        }

        // 最後の着手
        if (lastMove && lastMove.r === r && lastMove.c === c) {
          cell.classList.add('last-move');
        }

        // 合法手ヒント
        if (showHints && moveKey.has(`${r},${c}`)) {
          cell.classList.add('hint');
        }

        // ゲーム終了時はUI上のクリックを無効風に
        if (gameOver) {
          cell.classList.add('disabled');
        }
      }
    }

    // ステータス
    const { black, white } = countDiscs(board);
    scoreLabel.textContent = `黒: ${black} 石　|　白: ${white} 石`;
    turnLabel.textContent = `手番: ${playerName(currentPlayer)}`;

    // パスボタン制御
    passBtn.disabled = !(moves.length === 0 && !gameOver && isHumanTurn());
  }

  function checkGameProgress() {
    const movesNow = getValidMoves(board, currentPlayer);
    if (movesNow.length > 0) {
      clearMessage();
      // CPUの手番で打てるなら指す
      maybeCpuTurn();
      return; // 打てる
    }

    // 現手番が打てない
    const movesOpp = getValidMoves(board, opponent(currentPlayer));
    if (movesOpp.length > 0) {
      if (isHumanTurn()) {
        setMessage(`打てる手がありません。パスしてください（${playerName(currentPlayer)}）。`);
        return; // 人間にパスを促す
      } else {
        // CPU パス
        currentPlayer = opponent(currentPlayer);
        setMessage('CPUは打てる手がありません。パスします。' + playerName(currentPlayer) + 'の手番です。');
        render();
        // 次の進行をチェック（人間側に手があるか、なければ終局）
        checkGameProgress();
        // もし再びCPUの手番で打てるなら実行
        maybeCpuTurn();
        return;
      }
    }

    // 双方打てない -> 終局
    gameOver = true;
    const { black, white } = countDiscs(board);
    let result;
    if (black > white) { result = '黒の勝ち'; winnerColor = BLACK; }
    else if (white > black) { result = '白の勝ち'; winnerColor = WHITE; }
    else { result = '引き分け'; winnerColor = 0; }
    setMessage(`ゲーム終了: ${result}（黒 ${black} - 白 ${white}）`);
    render();
    showVictory(result);
  }

  function onCellClick(e) {
    if (gameOver) return;
    if (!isHumanTurn()) return; // CPUの手番は無視
    const r = Number(this.dataset.row);
    const c = Number(this.dataset.col);
    const moves = getValidMoves(board, currentPlayer);
    const move = moves.find((m) => m.r === r && m.c === c);
    if (!move) return; // 非合法

    applyMove(board, move, currentPlayer);
    lastMove = { r, c };
    currentPlayer = opponent(currentPlayer);
    clearMessage();
    render();
    checkGameProgress();
  }

  function onPass() {
    if (gameOver) return;
    if (!isHumanTurn()) return; // CPUの手番は手動パス不可
    // 本当に打てない場合のみ許可
    if (getValidMoves(board, currentPlayer).length > 0) return;
    currentPlayer = opponent(currentPlayer);
    setMessage('パスしました。' + playerName(currentPlayer) + 'の手番です。');
    render();
    checkGameProgress();
  }

  function onNewGame() {
    // CPU思考の保留があればキャンセル
    if (cpuTimer) { clearTimeout(cpuTimer); cpuTimer = null; }
    cpuThinking = false;
    board = createInitialBoard();
    currentPlayer = BLACK;
    gameOver = false;
    lastMove = null;
    winnerColor = null;
    hideVictory();
    clearMessage();
    render();
    checkGameProgress();
    // CPUが先手の場合は思考開始
    maybeCpuTurn();
  }

  function init() {
    // ヒント表示の初期値（可能なら保存）
    try {
      const saved = localStorage.getItem('othell_codex_hints');
      if (saved !== null) showHints = saved === '1';
    } catch {}
    hintsToggle.checked = showHints;

    hintsToggle.addEventListener('change', () => {
      showHints = hintsToggle.checked;
      try { localStorage.setItem('othell_codex_hints', showHints ? '1' : '0'); } catch {}
      render();
    });
    newGameBtn.addEventListener('click', onNewGame);
    passBtn.addEventListener('click', onPass);

    // 対戦相手/色の初期化（保存があれば復元）
    try {
      const savedOpp = localStorage.getItem('othell_codex_opp');
      if (savedOpp === 'cpu' || savedOpp === 'human') opponentType = savedOpp;
      const savedColor = localStorage.getItem('othell_codex_color');
      if (savedColor === 'white') humanColor = WHITE; else humanColor = BLACK;
    } catch {}

    opponentSelect.value = opponentType;
    playerColorSelect.value = humanColor === BLACK ? 'black' : 'white';
    playerColorSelect.disabled = opponentType !== 'cpu';

    // 難易度の初期化（保存されていれば復元）
    try {
      const savedDiff = localStorage.getItem('othell_codex_diff');
      if (savedDiff === 'weak' || savedDiff === 'normal' || savedDiff === 'strong') difficulty = savedDiff;
    } catch {}
    if (difficultySelect) {
      difficultySelect.value = difficulty;
      difficultySelect.disabled = opponentType !== 'cpu';
    }
    if (strengthMeter) {
      strengthMeter.style.display = opponentType === 'cpu' ? 'inline-flex' : 'none';
      updateStrengthMeter();
    }

    opponentSelect.addEventListener('change', () => {
      opponentType = opponentSelect.value;
      playerColorSelect.disabled = opponentType !== 'cpu';
      if (difficultySelect) difficultySelect.disabled = opponentType !== 'cpu';
      if (strengthMeter) strengthMeter.style.display = opponentType === 'cpu' ? 'inline-flex' : 'none';
      try { localStorage.setItem('othell_codex_opp', opponentType); } catch {}
      onNewGame();
    });
    playerColorSelect.addEventListener('change', () => {
      humanColor = playerColorSelect.value === 'white' ? WHITE : BLACK;
      try { localStorage.setItem('othell_codex_color', humanColor === WHITE ? 'white' : 'black'); } catch {}
      onNewGame();
    });

    playAgainBtn.addEventListener('click', () => {
      onNewGame();
    });

    if (difficultySelect) {
      difficultySelect.addEventListener('change', () => {
        difficulty = difficultySelect.value;
        try { localStorage.setItem('othell_codex_diff', difficulty); } catch {}
        updateStrengthMeter();
        onNewGame();
      });
    }

    buildBoardUI();
    onNewGame();
  }

  function maybeCpuTurn() {
    if (opponentType !== 'cpu' || gameOver) return;
    if (currentPlayer === humanColor) return;
    if (cpuThinking) return;
    const moves = getValidMoves(board, currentPlayer);
    if (moves.length === 0) return; // パスや終局はcheckGameProgress側で処理
    cpuThinking = true;
    setMessage('CPU思考中…');
    cpuTimer = setTimeout(() => {
      const move = chooseCpuMove(board, currentPlayer);
      if (move) {
        applyMove(board, move, currentPlayer);
        lastMove = { r: move.r, c: move.c };
        currentPlayer = opponent(currentPlayer);
        render();
        checkGameProgress();
      }
      cpuThinking = false;
      cpuTimer = null;
    }, 420);
  }

  function chooseCpuMove(bd, player) {
    if (difficulty === 'weak') return chooseWeakMove(bd, player);
    if (difficulty === 'normal') return chooseNormalMove(bd, player);
    return chooseStrongMove(bd, player);
  }

  function chooseWeakMove(bd, player) {
    const moves = getValidMoves(bd, player);
    if (moves.length === 0) return null;
    // 角を最優先
    const isCorner = (r, c) => (r === 0 || r === SIZE - 1) && (c === 0 || c === SIZE - 1);
    const cornerMoves = moves.filter(m => isCorner(m.r, m.c));
    if (cornerMoves.length) return cornerMoves[Math.floor(Math.random() * cornerMoves.length)];
    // それ以外は最大反転枚数（同数ならランダム）
    let best = [], bestScore = -Infinity;
    for (const m of moves) {
      const score = m.flips.length;
      if (score > bestScore) { bestScore = score; best = [m]; }
      else if (score === bestScore) { best.push(m); }
    }
    return best[Math.floor(Math.random() * best.length)];
  }

  const POS_WEIGHTS = [
    [120, -20, 20, 5, 5, 20, -20, 120],
    [-20, -40, -5, -5, -5, -5, -40, -20],
    [ 20,  -5, 15, 3, 3, 15,  -5,  20],
    [  5,  -5,  3, 3, 3,  3,  -5,   5],
    [  5,  -5,  3, 3, 3,  3,  -5,   5],
    [ 20,  -5, 15, 3, 3, 15,  -5,  20],
    [-20, -40, -5, -5, -5, -5, -40, -20],
    [120, -20, 20, 5, 5, 20, -20, 120],
  ];

  function evaluateRelativeTo(bd, me) {
    // 位置スコア + 機動力 + 石差 + 角
    let pos = 0;
    let disc = 0;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const v = bd[r][c];
        if (!v) continue;
        pos += v * POS_WEIGHTS[r][c];
        disc += v;
      }
    }
    const posMe = pos * me;      // 自分視点の位置差
    const discMe = disc * me;    // 自分視点の石差
    const mobMe = getValidMoves(bd, me).length;
    const mobOpp = getValidMoves(bd, -me).length;
    const mobility = mobMe - mobOpp;
    // 角ボーナス
    let corners = 0;
    const cs = [[0,0],[0,7],[7,0],[7,7]];
    for (const [r,c] of cs) {
      corners += (bd[r][c] === me ? 1 : (bd[r][c] === -me ? -1 : 0));
    }
    return posMe + 3 * mobility + 0.5 * discMe + 25 * corners;
  }

  function cloneBoard(bd) {
    return bd.map(row => row.slice());
  }

  function chooseNormalMove(bd, player) {
    const moves = getValidMoves(bd, player);
    if (moves.length === 0) return null;
    let bestMoves = [], bestScore = -Infinity;
    for (const m of moves) {
      const nb = cloneBoard(bd);
      applyMove(nb, m, player);
      const score = evaluateRelativeTo(nb, player);
      if (score > bestScore) { bestScore = score; bestMoves = [m]; }
      else if (score === bestScore) { bestMoves.push(m); }
    }
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  function sortMovesHeuristic(bd, player, moves) {
    // 評価の高い順に並べる（枝刈り効率UP）
    return moves
      .map(m => {
        const nb = cloneBoard(bd);
        applyMove(nb, m, player);
        return { m, s: evaluateRelativeTo(nb, player) };
      })
      .sort((a,b) => b.s - a.s)
      .map(x => x.m);
  }

  function negamax(bd, player, depth, alpha, beta, me) {
    const moves = getValidMoves(bd, player);
    if (depth === 0) {
      return evaluateRelativeTo(bd, me);
    }
    if (moves.length === 0) {
      // パス or 終局
      const oppMoves = getValidMoves(bd, -player);
      if (oppMoves.length === 0) {
        // 終局: 石差を強調
        let disc = 0;
        for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) disc += bd[r][c];
        return (disc * me) * 1000; // 大きめの値で勝敗を決定付ける
      }
      return -negamax(bd, -player, depth, -beta, -alpha, me);
    }
    let value = -Infinity;
    const ordered = sortMovesHeuristic(bd, player, moves);
    for (const m of ordered) {
      const nb = cloneBoard(bd);
      applyMove(nb, m, player);
      const score = -negamax(nb, -player, depth - 1, -beta, -alpha, me);
      if (score > value) value = score;
      if (value > alpha) alpha = value;
      if (alpha >= beta) break; // 枝刈り
    }
    return value;
  }

  function chooseStrongMove(bd, player) {
    const moves = getValidMoves(bd, player);
    if (moves.length === 0) return null;
    const depth = moves.length <= 10 ? 3 : 2; // 分岐が多い時は浅く
    let best = null, bestVal = -Infinity;
    const ordered = sortMovesHeuristic(bd, player, moves);
    for (const m of ordered) {
      const nb = cloneBoard(bd);
      applyMove(nb, m, player);
      const val = -negamax(nb, -player, depth - 1, -Infinity, Infinity, player);
      if (val > bestVal) { bestVal = val; best = m; }
    }
    return best || ordered[0];
  }

  function updateStrengthMeter() {
    if (!strengthMeter) return;
    const level = difficulty === 'weak' ? 1 : (difficulty === 'normal' ? 2 : 3);
    const dots = strengthMeter.querySelectorAll('.dot');
    dots.forEach((d, i) => {
      d.classList.toggle('filled', i < level);
    });
    const label = difficulty === 'weak' ? '弱い' : (difficulty === 'normal' ? '普通' : '強い');
    strengthMeter.setAttribute('aria-label', `CPUの強さ: ${label}`);
  }

  function showVictory(resultText) {
    victoryText.textContent = resultText;
    winnerIcon.className = 'winner-icon';
    victoryOverlay.classList.remove('black', 'white');
    if (winnerColor === BLACK) {
      winnerIcon.classList.add('black');
      victoryOverlay.classList.add('black');
    } else if (winnerColor === WHITE) {
      winnerIcon.classList.add('white');
      victoryOverlay.classList.add('white');
    } else {
      // 引き分けは中立色：白黒ミックス表現の代わりに枠のみ
    }
    victoryOverlay.classList.add('show');
    victoryOverlay.setAttribute('aria-hidden', 'false');
  }

  function hideVictory() {
    victoryOverlay.classList.remove('show', 'black', 'white');
    victoryOverlay.setAttribute('aria-hidden', 'true');
    winnerIcon.className = 'winner-icon';
  }

  // 起動
  init();
})();
