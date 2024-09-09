import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';

const difficultyLevels = ['Beginner', 'Intermediate', 'Advanced', 'Grand Master'];

const ChessGame = () => {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [suggestedMove, setSuggestedMove] = useState('');
  const [botDifficulty, setBotDifficulty] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    suggestMove();
  }, [game]);

  const makeMove = (from, to) => {
    try {
      const move = game.move({ from, to, promotion: 'q' });
      if (move) {
        setGame(new Chess(game.fen()));
        setSelectedSquare(null);
        setErrorMessage('');
        setTimeout(makeBotMove, 300);
      } else {
        setErrorMessage('Invalid move');
        setSelectedSquare(null);
      }
    } catch (error) {
      console.error("Invalid move:", error);
      setErrorMessage('Invalid move');
      setSelectedSquare(null);
    }
  };

  const handleSquareClick = (square) => {
    const piece = game.get(square);
    if (selectedSquare === square) {
      setSelectedSquare(null);
    } else if (selectedSquare) {
      makeMove(selectedSquare, square);
    } else if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
    } else {
      setErrorMessage('Select a valid piece');
    }
  };

  const makeBotMove = () => {
    const moves = game.moves({ verbose: true });
    if (moves.length > 0) {
      let move;
      switch (botDifficulty) {
        case 1: // Intermediate
          move = moves[Math.floor(Math.random() * moves.length)];
          break;
        case 2: // Advanced
          move = moves.reduce((best, current) => {
            return (current.flags.includes('c') || current.flags.includes('e')) ? current : best;
          }, moves[Math.floor(Math.random() * moves.length)]);
          break;
        case 3: // Grand Master
          move = moves.reduce((best, current) => {
            const score = (current.flags.includes('c') || current.flags.includes('e')) ? 2 : 
                          (current.flags.includes('p') || current.flags.includes('k')) ? 1 : 0;
            return score > best.score ? { move: current, score } : best;
          }, { move: moves[0], score: -1 }).move;
          break;
        default: // Beginner
          move = moves[Math.floor(Math.random() * moves.length)];
      }
      game.move(move);
      setGame(new Chess(game.fen()));
    }
  };

  const suggestMove = () => {
    const moves = game.moves();
    if (moves.length > 0) {
      setSuggestedMove(moves[Math.floor(Math.random() * moves.length)]);
    }
  };

  const renderSquare = (i) => {
    const file = 'abcdefgh'[i % 8];
    const rank = Math.floor((63 - i) / 8) + 1;
    const square = `${file}${rank}`;
    const piece = game.get(square);
    const isSelected = selectedSquare === square;
    const isLegal = selectedSquare && game.moves({ square: selectedSquare, verbose: true }).some(move => move.to === square);

    return (
      <div 
        key={square}
        className={`aspect-square flex items-center justify-center cursor-pointer border border-gray-400
                    ${(i + Math.floor(i / 8)) % 2 === 0 ? 'bg-gray-200' : 'bg-white'}
                    ${isSelected ? 'bg-yellow-200' : ''}
                    ${isLegal ? 'bg-green-200' : ''}`}
        onClick={() => handleSquareClick(square)}
      >
        {piece && (
          <span className={`text-5xl select-none ${piece.color === 'w' ? 'text-white' : 'text-black'} 
                            ${piece.color === 'w' ? 'drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]' : 'drop-shadow-[0_1.2px_1.2px_rgba(255,255,255,0.8)]'}`}>
            {getPieceSymbol(piece)}
          </span>
        )}
      </div>
    );
  };

  const getPieceSymbol = (piece) => {
    const symbols = {
      p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
      P: '♟', R: '♜', N: '♞', B: '♝', Q: '♛', K: '♚'
    };
    return symbols[piece.type] || '';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-2xl aspect-square grid grid-cols-8 border-2 border-gray-600 mb-4">
        {[...Array(64)].map((_, i) => renderSquare(i))}
      </div>
      <div className="text-lg font-semibold mb-2">
        <p>Suggested move: {suggestedMove}</p>
      </div>
      {errorMessage && (
        <div className="text-red-500 font-semibold mb-2">
          {errorMessage}
        </div>
      )}
      <div className="flex items-center space-x-2 mb-4">
        <span className="font-semibold">Bot Difficulty:</span>
        {difficultyLevels.map((level, index) => (
          <button
            key={level}
            className={`px-2 py-1 rounded text-sm ${botDifficulty === index ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setBotDifficulty(index)}
          >
            {level}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChessGame;