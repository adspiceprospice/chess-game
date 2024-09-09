import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';

const difficultyLevels = ['Beginner', 'Intermediate', 'Advanced', 'Grand Master'];

const ChessGame = () => {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [suggestedMove, setSuggestedMove] = useState(null);
  const [botDifficulty, setBotDifficulty] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [winProbability, setWinProbability] = useState({ white: 50, black: 50 });
  const [pointDifference, setPointDifference] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [gameStatus, setGameStatus] = useState('');

  useEffect(() => {
    suggestMove();
    calculateWinProbability();
    checkGameStatus();
  }, [game]);

  const makeMove = (from, to) => {
    try {
      const move = game.move({ from, to, promotion: 'q' });
      if (move) {
        setGame(new Chess(game.fen()));
        setSelectedSquare(null);
        setErrorMessage('');
        updateMoveHistory(move, 'player');
        setTimeout(() => makeBotMove(), 300);
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
      updateMoveHistory(move, 'bot');
    }
  };

  const suggestMove = () => {
    const moves = game.moves({ verbose: true });
    if (moves.length > 0) {
      // Simple suggestion: prefer captures and checks
      const suggestedMove = moves.reduce((best, current) => {
        const score = (current.flags.includes('c') || current.flags.includes('e')) ? 2 : 
                      (current.flags.includes('p') || current.flags.includes('k')) ? 1 : 0;
        return score > best.score ? { move: current, score } : best;
      }, { move: moves[0], score: -1 }).move;
      setSuggestedMove(suggestedMove);
    }
  };

  const calculateWinProbability = () => {
    const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    let whiteScore = 0;
    let blackScore = 0;
    
    game.board().forEach(row => {
      row.forEach(piece => {
        if (piece) {
          if (piece.color === 'w') {
            whiteScore += pieceValues[piece.type];
          } else {
            blackScore += pieceValues[piece.type];
          }
        }
      });
    });
    
    const totalScore = whiteScore + blackScore;
    const whiteProbability = Math.round((whiteScore / totalScore) * 100);
    setWinProbability({ white: whiteProbability, black: 100 - whiteProbability });
    setPointDifference(whiteScore - blackScore);
  };

  const renderSquare = (i) => {
    const file = 'abcdefgh'[i % 8];
    const rank = 8 - Math.floor(i / 8);
    const square = `${file}${rank}`;
    const piece = game.get(square);
    const isSelected = selectedSquare === square;
    const isLegal = selectedSquare && game.moves({ square: selectedSquare, verbose: true }).some(move => move.to === square);
    const isSuggested = suggestedMove && (suggestedMove.from === square || suggestedMove.to === square);

    return (
      <div 
        key={square}
        className={`aspect-square flex items-center justify-center cursor-pointer border border-gray-400 relative
                    ${(i + Math.floor(i / 8)) % 2 === 0 ? 'bg-gray-200' : 'bg-white'}
                    ${isSelected ? 'bg-yellow-200' : ''}
                    ${isLegal ? 'bg-green-200' : ''}
                    ${isSuggested ? 'bg-blue-200' : ''}`}
        onClick={() => handleSquareClick(square)}
      >
        {piece && (
          <span className={`text-4xl select-none ${piece.color === 'w' ? 'text-white' : 'text-black'} 
                            ${piece.color === 'w' ? 'drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]' : 'drop-shadow-[0_1.2px_1.2px_rgba(255,255,255,0.8)]'}`}>
            {getPieceSymbol(piece)}
          </span>
        )}
        {i % 8 === 0 && (
          <span className="absolute text-xs text-gray-500 left-0.5 top-0.5">
            {rank}
          </span>
        )}
        {i >= 56 && (
          <span className="absolute text-xs text-gray-500 right-0.5 bottom-0.5">
            {file}
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

  const checkGameStatus = () => {
    if (game.isCheckmate()) {
      setGameStatus(`Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!`);
    } else if (game.isDraw()) {
      setGameStatus('Draw!');
    } else if (game.isStalemate()) {
      setGameStatus('Stalemate!');
    } else if (game.isThreefoldRepetition()) {
      setGameStatus('Draw by threefold repetition!');
    } else if (game.isInsufficientMaterial()) {
      setGameStatus('Draw by insufficient material!');
    } else {
      setGameStatus('');
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const updateMoveHistory = (move, player) => {
    setMoveHistory(prevHistory => {
      const moveNumber = Math.floor(prevHistory.length / 2) + 1;
      if (player === 'player') {
        return [...prevHistory, `${moveNumber}. ${move.san}`];
      } else {
        const lastMove = prevHistory[prevHistory.length - 1];
        return [...prevHistory.slice(0, -1), `${lastMove} ${move.san}`];
      }
    });
  };

  const resetGame = () => {
    setGame(new Chess());
    setSelectedSquare(null);
    setMoveHistory([]);
    setGameStatus('');
    setErrorMessage('');
  };

  const undoMove = () => {
    const undoneMove = game.undo();
    if (undoneMove) {
      game.undo(); // Undo one more move to revert both player and bot moves
      setGame(new Chess(game.fen()));
      setMoveHistory(prevHistory => prevHistory.slice(0, -1));
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-4 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'}`}>
      <div className="flex justify-between w-full max-w-6xl mb-4">
        <div className="w-1/4 mr-4">
          <h2 className="text-xl font-bold mb-2">Move History</h2>
          <div className={`h-96 overflow-y-auto p-2 ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded`}>
            {moveHistory.map((move, index) => (
              <div key={index} className="mb-1">
                <span className="text-blue-500">{move.split(' ')[0]}</span>
                {move.split(' ')[1] && <span className="text-red-500"> {move.split(' ')[1]}</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="w-1/2">
          <div className="w-full aspect-square grid grid-cols-8 border-2 border-gray-600 mb-4">
            {[...Array(64)].map((_, i) => renderSquare(i))}
          </div>
          <div className="text-lg font-semibold mb-2">
            <p>Suggested move: {suggestedMove ? `${suggestedMove.from} to ${suggestedMove.to}` : 'None'}</p>
          </div>
          <div className="mb-2 w-full max-w-2xl bg-gray-200 rounded-full h-5 dark:bg-gray-700">
            <div className="bg-blue-600 h-5 rounded-full text-center text-xs text-white" style={{width: `${winProbability.white}%`}}>
              White {winProbability.white}%
            </div>
          </div>
          <div className="text-lg font-semibold mb-2">
            Point difference: {pointDifference > 0 ? `White +${pointDifference}` : pointDifference < 0 ? `Black +${Math.abs(pointDifference)}` : 'Even'}
          </div>
          {errorMessage && (
            <div className="text-red-500 font-semibold mb-2">
              {errorMessage}
            </div>
          )}
          <div className="flex justify-between mt-4">
            <button
              className={`px-4 py-2 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
              onClick={resetGame}
            >
              Reset Game
            </button>
            <button
              className={`px-4 py-2 rounded ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white`}
              onClick={undoMove}
            >
              Undo Move
            </button>
          </div>
        </div>
        <div className="w-1/4 ml-4">
          <button
            className={`px-4 py-2 rounded mb-4 ${darkMode ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-300 hover:bg-gray-400 text-black'}`}
            onClick={toggleDarkMode}
          >
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          {gameStatus && (
            <div className={`p-4 rounded mb-4 ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
              <h2 className="text-xl font-bold mb-2">Game Over</h2>
              <p>{gameStatus}</p>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2 mb-4">
        <span className="font-semibold">Bot Difficulty:</span>
        {difficultyLevels.map((level, index) => (
          <button
            key={level}
            className={`px-2 py-1 rounded text-sm ${
              botDifficulty === index
                ? darkMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500 text-white'
                : darkMode
                ? 'bg-gray-600 text-white'
                : 'bg-gray-200 text-black'
            }`}
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