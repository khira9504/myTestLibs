import Board from './components/Board';
import { useOthello } from './hooks/useOthello';

function App() {
  const { board, currentPlayer, winner, placePiece, resetGame } = useOthello();
  const blackScore = board.flat().filter(c => c === 'black').length;
  const whiteScore = board.flat().filter(c => c === 'white').length;

  return (
    <div className="min-h-screen bg-gray-800 flex flex-col items-center justify-center">
      <h1 className="text-4xl text-white mb-4">Othello</h1>
      <div className="text-white text-2xl mb-4">
        {winner ? (
          <p>Winner: {winner}</p>
        ) : (
          <p>Current Player: {currentPlayer}</p>
        )}
        <p>Black: {blackScore} - White: {whiteScore}</p>
      </div>
      <Board board={board} placePiece={placePiece} />
      <button
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        onClick={resetGame}
      >
        Reset Game
      </button>
    </div>
  );
}

export default App;