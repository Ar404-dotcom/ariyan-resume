(function () {
  'use strict';

  // Chess "microservice" - chess.js + chessboard.js + simple bot
  
  function ensureDeps() {
    console.log('Chess deps check:', {
      Chess: typeof Chess,
      Chessboard: typeof Chessboard,
      jQuery: typeof jQuery
    });
    
    // chess.js exposes Chess globally
    if (typeof Chess === 'undefined') {
      throw new Error('chess.js not loaded');
    }
    // chessboard.js exposes Chessboard globally
    if (typeof Chessboard === 'undefined') {
      throw new Error('chessboard.js not loaded');
    }
  }

  const ChessService = {
    _board: null,
    _game: null,
    _playerColor: 'w',
    _containerId: 'chessboard',
    _thinking: false,
    _storageKey: 'chess_game_state',
    _isDragging: false,

    open() {
      try {
        console.log('ChessService.open() called');
        this.reset();
      } catch (err) {
        console.error('Chess initialization failed:', err);
        alert('Chess failed to load: ' + err.message);
      }
    },

    newGame() {
      if (confirm('Start a new game? Current game will be lost.')) {
        sessionStorage.removeItem(this._storageKey);
        this.reset();
        console.log('New game started');
      }
    },

    close() {
      this._thinking = false;
      this._saveGame();
    },

    _saveGame() {
      if (this._game) {
        const gameState = {
          fen: this._game.fen(),
          history: this._game.history(),
          playerColor: this._playerColor
        };
        sessionStorage.setItem(this._storageKey, JSON.stringify(gameState));
        console.log('Game saved to sessionStorage');
      }
    },

    _loadGame() {
      const saved = sessionStorage.getItem(this._storageKey);
      if (saved) {
        try {
          const gameState = JSON.parse(saved);
          console.log('Loading saved game:', gameState);
          return gameState;
        } catch (e) {
          console.error('Error loading saved game:', e);
          sessionStorage.removeItem(this._storageKey);
        }
      }
      return null;
    },

    reset() {
      ensureDeps();

      const container = document.getElementById(this._containerId);
      if (!container) {
        throw new Error('Chess container not found');
      }

      console.log('Creating new game...');
      
      // Try to load saved game or create new one
      const savedGame = this._loadGame();
      
      if (savedGame && savedGame.fen) {
        this._game = new Chess(savedGame.fen);
        this._playerColor = savedGame.playerColor || 'w';
        console.log('Restored game from sessionStorage');
      } else {
        this._game = new Chess();
        console.log('Started new game');
      }
      
      this._thinking = false;

      // Clear container
      container.innerHTML = '';

      const self = this;
      
      console.log('Creating board...');
      
      // Custom piece theme using Font Awesome icons
      const pieceIcons = {
        'wP': '♙', 'wN': '♘', 'wB': '♗', 'wR': '♖', 'wQ': '♕', 'wK': '♔',
        'bP': '♟', 'bN': '♞', 'bB': '♝', 'bR': '♜', 'bQ': '♛', 'bK': '♚'
      };
      
      this._board = Chessboard(this._containerId, {
        position: 'start',
        draggable: true,
        pieceTheme: function(piece) {
          // Return a data URI with the chess symbol
          const symbol = pieceIcons[piece];
          const color = piece.charAt(0) === 'w' ? '#f0f0f0' : '#333';
          const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50" y="75" font-size="70" text-anchor="middle" fill="' + color + '" style="font-family: Arial, sans-serif;">' + symbol + '</text></svg>';
          return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
        },
        onDragStart: function(source, piece, position, orientation) {
          // Mark as dragging to prevent window close
          self._isDragging = true;
          const chessWindow = document.getElementById('chess-window');
          if (chessWindow) chessWindow.classList.add('dragging');
          
          // Don't allow moves if game is over or bot is thinking
          if (self._game.game_over()) return false;
          if (self._thinking) return false;
          
          // Only allow player (white) to move white pieces
          if (self._playerColor === 'w' && piece.search(/^b/) !== -1) return false;
          if (self._playerColor === 'b' && piece.search(/^w/) !== -1) return false;
          
          return true;
        },
        onDrop: function(source, target) {
          return self._onDrop(source, target);
        },
        onSnapEnd: function() {
          // Clear dragging state
          self._isDragging = false;
          const chessWindow = document.getElementById('chess-window');
          if (chessWindow) chessWindow.classList.remove('dragging');
          self._syncBoard();
        }
      });

      console.log('Board created successfully!');
      this._syncBoard();
    },

    _syncBoard() {
      if (this._board && this._game) {
        this._board.position(this._game.fen());
      }
    },

    _onDrop(source, target) {
      // Try the move
      const move = this._game.move({
        from: source,
        to: target,
        promotion: 'q' // always promote to queen for simplicity
      });

      // Illegal move
      if (move === null) return 'snapback';

      // Update board
      this._syncBoard();
      this._saveGame();

      // Check for game end
      if (this._checkEnd()) return;

      // Bot's turn
      setTimeout(() => this._botMove(), 500);
    },

    _botMove() {
      if (this._game.game_over()) return;
      
      this._thinking = true;

      // Get all legal moves
      const moves = this._game.moves();
      
      if (moves.length === 0) {
        this._thinking = false;
        return;
      }

      // Simple bot: pick a random move (can be upgraded to use Stockfish later)
      const randomIndex = Math.floor(Math.random() * moves.length);
      const move = moves[randomIndex];
      
      this._game.move(move);
      this._syncBoard();
      this._saveGame();
      this._thinking = false;

      this._checkEnd();
    },

    _checkEnd() {
      if (this._game.in_checkmate()) {
        const winner = this._game.turn() === 'w' ? 'Bot' : 'Player';
        setTimeout(() => alert(winner + ' wins by checkmate!'), 100);
        return true;
      }
      
      if (this._game.in_stalemate()) {
        setTimeout(() => alert('Draw by stalemate!'), 100);
        return true;
      }
      
      if (this._game.in_draw()) {
        setTimeout(() => alert('Draw!'), 100);
        return true;
      }
      
      return false;
    }
  };

  window.ChessService = ChessService;
  console.log('ChessService loaded');
})();
