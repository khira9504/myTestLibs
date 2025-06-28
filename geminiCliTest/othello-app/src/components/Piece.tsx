type PieceProps = {
  color: 'black' | 'white';
};

const Piece = ({ color }: PieceProps) => {
  const pieceColor = color === 'black' ? 'bg-black' : 'bg-white';
  return <div className={`w-10 h-10 rounded-full ${pieceColor}`}></div>;
};

export default Piece;
