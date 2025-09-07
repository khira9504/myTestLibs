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
  const turnLabel = document.getElementById('turnLabel');
  const scoreLabel = document.getElementById('scoreLabel');
  const messageEl = document.getElementById('message');

  // 状態
  let board;
  let currentPlayer; // BLACK or WHITE
  let showHints = true;
  let lastMove = null; // {r, c}
  let gameOver = false;

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
          disc.className = 'disc ' + (board[r][c] === BLACK ? 'black' : 'white');
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
    passBtn.disabled = !(moves.length === 0 && !gameOver);
  }

  function checkGameProgress() {
    const movesNow = getValidMoves(board, currentPlayer);
    if (movesNow.length > 0) {
      clearMessage();
      return; // 打てる
    }

    // 現手番が打てない
    const movesOpp = getValidMoves(board, opponent(currentPlayer));
    if (movesOpp.length > 0) {
      setMessage(`打てる手がありません。パスしてください（${playerName(currentPlayer)}）。`);
      // パス可能
      return;
    }

    // 双方打てない -> 終局
    gameOver = true;
    const { black, white } = countDiscs(board);
    let result;
    if (black > white) result = '黒の勝ち';
    else if (white > black) result = '白の勝ち';
    else result = '引き分け';
    setMessage(`ゲーム終了: ${result}（黒 ${black} - 白 ${white}）`);
    render();
  }

  function onCellClick(e) {
    if (gameOver) return;
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
    // 本当に打てない場合のみ許可
    if (getValidMoves(board, currentPlayer).length > 0) return;
    currentPlayer = opponent(currentPlayer);
    setMessage('パスしました。' + playerName(currentPlayer) + 'の手番です。');
    render();
    checkGameProgress();
  }

  function onNewGame() {
    board = createInitialBoard();
    currentPlayer = BLACK;
    gameOver = false;
    lastMove = null;
    clearMessage();
    render();
    checkGameProgress();
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

    buildBoardUI();
    onNewGame();
  }

  // 起動
  init();
})();

