import Piece from './Piece';
import { useOthello } from '../hooks/useOthello';

type BoardProps = {
  board: ReturnType<typeof useOthello>['board'];
  placePiece: ReturnType<typeof useOthello>['placePiece'];
};

const Board = ({ board, placePiece }: BoardProps) => {
  return (
    <div className="bg-green-600 grid grid-cols-8 gap-1 p-1">
      {board.map((row, y) =>
        row.map((cell, x) => (
          <div
            key={`${x}-${y}`}
            className="w-12 h-12 bg-green-500 flex items-center justify-center cursor-pointer"
            onClick={() => placePiece(x, y)}
          >
            {cell && <Piece color={cell} />}
          </div>
        ))
      )}
    </div>
  );
};

export default Board;