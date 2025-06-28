import { useState, useEffect } from 'react';

type Player = 'black' | 'white';
type Cell = Player | null;
type BoardState = Cell[][];

const initialBoard: BoardState = Array(8).fill(null).map(() => Array(8).fill(null));
initialBoard[3][3] = 'white';
initialBoard[4][3] = 'black';
initialBoard[3][4] = 'black';
initialBoard[4][4] = 'white';

const DIRS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1], [1, 0], [1, 1],
];

export const useOthello = () => {
  const [board, setBoard] = useState<BoardState>(initialBoard);
  const [currentPlayer, setCurrentPlayer] = useState<Player>('black');
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);

  const getFlippablePieces = (x: number, y: number, player: Player, currentBoard: BoardState) => {
    const flippable: number[][] = [];

    if (currentBoard[y][x] !== null) {
        return [];
    }

    for (const [dx, dy] of DIRS) {
        const line: number[][] = [];
        let nx = x + dx;
        let ny = y + dy;

        while (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
            const piece = currentBoard[ny][nx];
            if (piece === null) {
                break;
            }
            if (piece === player) {
                flippable.push(...line);
                break;
            }
            line.push([nx, ny]);
            nx += dx;
            ny += dy;
        }
    }
    return flippable;
  };

  const getValidMoves = (player: Player, currentBoard: BoardState) => {
    const moves = [];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if (getFlippablePieces(x, y, player, currentBoard).length > 0) {
          moves.push([x, y]);
        }
      }
    }
    return moves;
  };

  const placePiece = (x: number, y: number) => {
    if (winner) return;

    const flippablePieces = getFlippablePieces(x, y, currentPlayer, board);
    if (flippablePieces.length === 0) {
        return;
    }

    const newBoard = board.map(row => [...row]);
    newBoard[y][x] = currentPlayer;
    for (const [fx, fy] of flippablePieces) {
        newBoard[fy][fx] = currentPlayer;
    }

    setBoard(newBoard);
    const nextPlayer = currentPlayer === 'black' ? 'white' : 'black';

    if (getValidMoves(nextPlayer, newBoard).length > 0) {
        setCurrentPlayer(nextPlayer);
    } else if (getValidMoves(currentPlayer, newBoard).length > 0) {
        // Current player can still move, so they play again
    } else {
        // Game over
        const blackScore = newBoard.flat().filter(c => c === 'black').length;
        const whiteScore = newBoard.flat().filter(c => c === 'white').length;
        if (blackScore > whiteScore) setWinner('black');
        else if (whiteScore > blackScore) setWinner('white');
        else setWinner('draw');
    }
  };

  const resetGame = () => {
    setBoard(initialBoard);
    setCurrentPlayer('black');
    setWinner(null);
  };

  return { board, currentPlayer, winner, placePiece, resetGame };
};
