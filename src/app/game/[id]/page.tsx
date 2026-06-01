"use client";

import React, { useEffect, useState, use, useTransition } from "react";
import Link from "next/link";
import { Chess } from "chess.js"; 
import { 
  submitHumanMove, 
  triggerComputerResponse, 
  abortActiveMatch, 
  claimMatchDraw 
} from "../../actions/game";

// Strict type definition for valid chess piece symbols
type ChessPiece = "r" | "n" | "b" | "q" | "k" | "p" | "R" | "N" | "B" | "Q" | "K" | "P";

interface UserProfile {
  name: string | null;
  humanElo: number;
}

interface BotProfile {
  username: string;
  aiElo: number;
}

interface GameState {
  id: string;
  status: "MATCHMAKING" | "ACTIVE" | "DRAW" | "WHITE_WINS" | "BLACK_WINS";
  mode: string;
  timeControl: string;
  whiteTime: number;
  blackTime: number;
  currentFen: string;
  moveHistory: string[];
  activeTurn: string;
  updatedAt: string;
  whiteHumanId?: string | null;
  blackHumanId?: string | null;
  whiteBotId?: string | null;
  blackBotId?: string | null;
  whiteHuman?: UserProfile | null;
  blackHuman?: UserProfile | null;
  whiteBot?: BotProfile | null;
  blackBot?: BotProfile | null;
}

const pieceDisplayNames: Record<ChessPiece, string> = {
  r: "♜", n: "♞", b: "♝", q: "♛", k: "♚", p: "♟", // Black Side
  R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔", P: "♙"  // White Side
};

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

function parseFenToBoard(fen: string): string[] {
  if (!fen) return Array(64).fill("");
  try {
    const placementPart = fen.split(" ")[0];
    const rows = placementPart.split("/");
    const continuousBoard: string[] = [];
    for (const row of rows) {
      for (const char of row) {
        if (isNaN(Number(char))) {
          continuousBoard.push(char);
        } else {
          const spaces = Number(char);
          for (let i = 0; i < spaces; i++) continuousBoard.push("");
        }
      }
    }
    return continuousBoard;
  } catch {
    return Array(64).fill("");
  }
}

function formatTimeClock(totalSeconds: number): string {
  if (totalSeconds <= 0) return "00:00";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function calculateCapturedPieces(aliveSquares: string[]) {
  const defaultCounts: Record<string, number> = {
    'P': 8, 'R': 2, 'N': 2, 'B': 2, 'Q': 1, // White
    'p': 8, 'r': 2, 'n': 2, 'b': 2, 'q': 1  // Black
  };
  
  const currentCounts: Record<string, number> = {};
  Object.keys(defaultCounts).forEach(key => currentCounts[key] = 0);

  aliveSquares.forEach(piece => {
    if (piece && defaultCounts[piece] !== undefined) {
      currentCounts[piece]++;
    }
  });

  const whiteCapturedPool: string[] = []; 
  const blackCapturedPool: string[] = []; 

  ['p', 'r', 'n', 'b', 'q'].forEach(k => {
    const deadCount = defaultCounts[k] - currentCounts[k];
    for (let i = 0; i < deadCount; i++) whiteCapturedPool.push(k);
  });

  ['P', 'R', 'N', 'B', 'Q'].forEach(k => {
    const deadCount = defaultCounts[k] - currentCounts[k];
    for (let i = 0; i < deadCount; i++) blackCapturedPool.push(k);
  });

  return { whiteCapturedPool, blackCapturedPool };
}

export default function GameRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [game, setGame] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedSquareIndex, setSelectedSquareIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const [whiteTimeLeft, setWhiteTimeLeft] = useState(0);
  const [blackTimeLeft, setBlackTimeLeft] = useState(0);
  const [lastMoveCount, setLastMoveCount] = useState(-1);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [legalTargetSquares, setLegalTargetSquares] = useState<string[]>([]);
  const [optimisticBoard, setOptimisticBoard] = useState<string[] | null>(null);

  // 1. Core Data Fetching Telemetry Sync Loop
  useEffect(() => {
    async function fetchGameState() {
      try {
        const response = await fetch(`/api/v1/game/${id}`);
        if (response.ok) {
          const data = await response.json();
          setGame(data);
        }
      } catch (err) {
        console.error("Sync telemetry error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchGameState();
    const syncInterval = setInterval(fetchGameState, 1500);
    return () => clearInterval(syncInterval);
  }, [id]);

  // 2. Clear Optimistic Overrides & Sync Clocks on Real Server Updates
  useEffect(() => {
    if (!game) return;
    if (game.moveHistory.length !== lastMoveCount || loading) {
      setWhiteTimeLeft(game.whiteTime);
      setBlackTimeLeft(game.blackTime);
      setLastMoveCount(game.moveHistory.length);
      setOptimisticBoard(null); 
    }
  }, [game?.moveHistory?.length, game?.whiteTime, game?.blackTime, lastMoveCount, loading]);

  // 3. Independent Game Clock Countdown Ticker
  useEffect(() => {
    if (!game || game.status !== "ACTIVE" || game.timeControl === "INFINITE") return;
    
    // ⏱️ VISUAL LOCK FIX: Freeze frontend timer tickers solid until the absolute opening move is committed
    if (game.moveHistory.length === 0) return;

    const clockTimer = setInterval(() => {
      if (game.activeTurn === "WHITE") {
        setWhiteTimeLeft((prev) => Math.max(0, prev - 1));
      } else {
        setBlackTimeLeft((prev) => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(clockTimer);
  }, [game?.activeTurn, game?.status, game?.timeControl, game?.moveHistory?.length]);

  // 4. Asynchronous Simulated Bot Processing Chain
  useEffect(() => {
    if (!game || game.status !== "ACTIVE" || game.activeTurn !== "BLACK" || game.mode !== "HUMAN_VS_COMPUTER") {
      setIsBotThinking(false);
      return;
    }

    setIsBotThinking(true);
    const thinkingTimer = setTimeout(async () => {
      try {
        await triggerComputerResponse(id);
      } catch (err) {
        console.error("Bot action execution exception:", err);
      } finally {
        setIsBotThinking(false);
      }
    }, 1500);

    return () => clearTimeout(thinkingTimer);
  }, [game?.activeTurn, game?.moveHistory?.length, game?.status, id]);

  if (loading || !game) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-mono text-xs text-slate-400">
        Aligning Board Vectors...
      </div>
    );
  }

  const serverParsedSquares = parseFenToBoard(game.currentFen);
  const activeDisplaySquares = optimisticBoard || serverParsedSquares;
  const { whiteCapturedPool, blackCapturedPool } = calculateCapturedPieces(activeDisplaySquares);

  // --- 🛰️ COMPUTE LAST MOVE ACCENT TRACE ---
  let traceFromIndex: number | null = null;
  let traceToIndex: number | null = null;

  if (game.moveHistory && game.moveHistory.length > 0) {
    try {
      const tracerEngine = new Chess();
      for (const step of game.moveHistory) tracerEngine.move(step);
      const verboseLogs = tracerEngine.history({ verbose: true });
      if (verboseLogs.length > 0) {
        const lastExecutedMove = verboseLogs[verboseLogs.length - 1];
        traceFromIndex = ranks.indexOf(lastExecutedMove.from[1]) * 8 + files.indexOf(lastExecutedMove.from[0]);
        traceToIndex = ranks.indexOf(lastExecutedMove.to[1]) * 8 + files.indexOf(lastExecutedMove.to[0]);
      }
    } catch (err) {
      console.error("Trace error:", err);
    }
  }

  const isLocked = game.status === "MATCHMAKING";
  const isMatchFinished = game.status === "WHITE_WINS" || game.status === "BLACK_WINS" || game.status === "DRAW";
  const acceptsManualInput = game.status === "ACTIVE" && !isBotThinking && !isMatchFinished &&
                             (game.mode === "HUMAN_VS_HUMAN" || (game.mode === "HUMAN_VS_COMPUTER" && game.activeTurn === "WHITE") || (game.mode === "HUMAN_VS_AI" && game.activeTurn === "WHITE") || (game.mode === "AI_VS_HUMAN" && game.activeTurn === "BLACK"));

  // --- 🏷️ PARSE DYNAMIC PLAYER PROFILES ---
  const whitePlayerName = game.whiteHuman?.name 
    ? game.whiteHuman.name 
    : game.whiteBotId === "automated_website_engine_node" 
      ? "🤖 Website Core Bot" 
      : game.whiteBot?.username || "Awaiting Remote AI White...";

  const whitePlayerRating = game.whiteHuman 
    ? `${game.whiteHuman.humanElo} Elo` 
    : `${game.whiteBot?.aiElo ?? 1200} Elo`;

  const blackPlayerName = game.blackHuman?.name 
    ? game.blackHuman.name 
    : game.blackBotId === "automated_website_engine_node" 
      ? "🤖 Website Core Bot" 
      : game.blackBot?.username || "Awaiting Remote AI Black...";

  const blackPlayerRating = game.blackHuman 
    ? `${game.blackHuman.humanElo} Elo` 
    : `${game.blackBot?.aiElo ?? 1200} Elo`;

  // --- 🎮 POINT-AND-CLICK TRANSACTION CORE ---
  const handleSquareClick = (index: number) => {
    if (isLocked || !acceptsManualInput || isPending) return;

    const row = Math.floor(index / 8);
    const col = index % 8;
    const clickedAlgebraicSquare = files[col] + ranks[row];
    const pieceAtClickedSquare = activeDisplaySquares[index];

    const tracerEngine = new Chess();
    for (const step of game.moveHistory) tracerEngine.move(step);

    if (selectedSquareIndex === null) {
      if (pieceAtClickedSquare !== "") {
        setSelectedSquareIndex(index);
        const legalMoves = tracerEngine.moves({ square: clickedAlgebraicSquare as any, verbose: true }) as any[];
        setLegalTargetSquares(legalMoves.map(m => m.to));
        setActionError(null);
      }
      return;
    }

    if (selectedSquareIndex === index) {
      setSelectedSquareIndex(null);
      setLegalTargetSquares([]);
      return;
    }

    const sourcePiece = activeDisplaySquares[selectedSquareIndex];
    const isSourceWhite = sourcePiece === sourcePiece.toUpperCase();
    const isClickedWhite = pieceAtClickedSquare !== "" && pieceAtClickedSquare === pieceAtClickedSquare.toUpperCase();

    if (pieceAtClickedSquare !== "" && isSourceWhite === isClickedWhite) {
      setSelectedSquareIndex(index);
      const legalMoves = tracerEngine.moves({ square: clickedAlgebraicSquare as any, verbose: true }) as any[];
      setLegalTargetSquares(legalMoves.map(m => m.to));
      return;
    }

    const sourceRow = Math.floor(selectedSquareIndex / 8);
    const sourceCol = selectedSquareIndex % 8;
    const sourceAlgebraicSquare = files[sourceCol] + ranks[sourceRow];

    if (!legalTargetSquares.includes(clickedAlgebraicSquare)) {
      setSelectedSquareIndex(null);
      setLegalTargetSquares([]);
      return;
    }

    // ✨ Optimistic client UI movement prediction
    const localOverride = [...activeDisplaySquares];
    localOverride[index] = localOverride[selectedSquareIndex]; 
    localOverride[selectedSquareIndex] = ""; 
    setOptimisticBoard(localOverride); 

    const cachedSelectedIdx = selectedSquareIndex;
    setSelectedSquareIndex(null);
    setLegalTargetSquares([]);
    setActionError(null);

    startTransition(async () => {
      try {
        let payload: any = { from: sourceAlgebraicSquare, to: clickedAlgebraicSquare };
        if (activeDisplaySquares[cachedSelectedIdx].toLowerCase() === "p" && (row === 0 || row === 7)) {
          payload.promotion = "q";
        }
        await submitHumanMove(id, payload);
      } catch (err: any) {
        setOptimisticBoard(null); 
        setActionError(err.message || "Invalid vector movement layout rules.");
      }
    });
  };

  // --- 💥 BOARD TERMINATION COMPONENT METHODS ---
  const handleAbortMatch = () => {
    if (!confirm("Are you sure you want to kill this live game session?")) return;
    startTransition(async () => {
      await abortActiveMatch(id);
    });
  };

  const handleClaimDraw = () => {
    if (!confirm("Declare a mutual match draw? This updates final player Elo brackets.")) return;
    startTransition(async () => {
      await claimMatchDraw(id);
    });
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(game.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8 max-w-6xl mx-auto flex flex-col justify-between space-y-6 relative select-none font-sans antialiased">
      
      {/* End-Game Declarative Backdrop Overlay Modal */}
      {isMatchFinished && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full text-center space-y-5">
            {game.status === "WHITE_WINS" && (
              <div className="space-y-1">
                <div className="text-5xl animate-bounce">🏆🎉</div>
                <h2 className="text-xl font-black text-emerald-600 tracking-tight uppercase">White Achieved Victory</h2>
              </div>
            )}
            {game.status === "BLACK_WINS" && (
              <div className="space-y-1">
                <div className="text-5xl">💥⚔️</div>
                <h2 className="text-xl font-black text-rose-500 tracking-tight uppercase">Black Achieved Victory</h2>
              </div>
            )}
            {game.status === "DRAW" && (
              <div className="space-y-1">
                <div className="text-5xl">⚖️🤝</div>
                <h2 className="text-xl font-black text-amber-500 tracking-tight uppercase">Stalemate Match Draw</h2>
              </div>
            )}
            <Link href="/" className="block w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all font-mono shadow-md">
              Return to Control Deck
            </Link>
          </div>
        </div>
      )}

      {/* HEADER RIBBON BAR */}
      <header className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200/40 shadow-sm">
        <div className="space-y-0.5">
          <Link href="/" className="text-[10px] font-bold text-slate-400 hover:text-slate-600 block uppercase tracking-wider font-mono">← Control Deck</Link>
          <h1 className="text-sm font-black text-slate-800 tracking-tight uppercase">Vector Arena: {game.mode.replace(/_/g, " ")}</h1>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono text-slate-500">
          <span className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/60 text-[9px] font-bold uppercase tracking-wider font-mono">{game.timeControl}</span>
          <span className="font-bold text-emerald-500 uppercase tracking-tight">{game.status}</span>
        </div>
      </header>

      {/* CORE PLAYGROUND ENVIRONMENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN PANEL: BOARD CHANNELS */}
        <div className="lg:col-span-7 flex flex-col items-center space-y-3 w-full">
          
          {/* 👤 PLAYER BAR: TOP PROFILE (BLACK SIDE) */}
          <div className={`w-full max-w-[480px] flex justify-between items-center px-4 py-3 rounded-2xl border bg-white transition-all duration-200 ${game.activeTurn === "BLACK" ? 'border-sky-400 border-b-4' : 'border-slate-200/60'}`}>
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{blackPlayerName}</span>
                <span className="text-[9px] font-mono text-slate-400">({blackPlayerRating})</span>
                {isBotThinking && <span className="text-[8px] font-bold bg-sky-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">Thinking...</span>}
              </div>
              {/* Graveyard Loot Pool: White pieces captured FROM White */}
              <div className="flex items-center space-x-0.5 text-base text-slate-400 min-h-[16px] leading-none">
                {whiteCapturedPool.length > 0 ? (
                  whiteCapturedPool.map((p, i) => <span key={i} className="drop-shadow-sm">{pieceDisplayNames[p.toUpperCase() as ChessPiece]}</span>)
                ) : (
                  <span className="text-[8px] font-mono uppercase tracking-widest text-slate-300">Clean Sheet</span>
                )}
              </div>
            </div>
            {game.timeControl !== "INFINITE" && (
              <span className="text-sm font-mono font-bold tracking-wider bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl text-slate-700">
                {formatTimeClock(blackTimeLeft)}
              </span>
            )}
          </div>

          {/* 🌿 INTERACTIVE EXPERT CHESS CANVAS PLATFORM */}
          <div className="relative w-full aspect-square max-w-[480px] bg-white p-3 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-center">
            <div className={`w-full h-full grid grid-cols-8 grid-rows-8 gap-0 rounded-xl overflow-hidden border border-slate-700/10 ${isLocked ? 'blur-sm select-none pointer-events-none opacity-25' : 'opacity-100'}`}>
              {activeDisplaySquares.map((pieceValue, index) => {
                const row = Math.floor(index / 8);
                const col = index % 8;
                
                const squareAlgebraicName = files[col] + ranks[row];
                const isSquareDark = (row + col) % 2 === 1;
                const isWhitePiece = pieceValue !== "" && pieceValue === pieceValue.toUpperCase();
                
                const isCurrentlySelected = selectedSquareIndex === index;
                const isLastMoveTrace = index === traceFromIndex || index === traceToIndex;
                const isALegalMoveDestination = legalTargetSquares.includes(squareAlgebraicName);

                return (
                  <button 
                    key={index}
                    disabled={isLocked || isMatchFinished || isBotThinking}
                    onClick={() => handleSquareClick(index)}
                    className={`w-full h-full flex items-center justify-center outline-none border-none transition-all duration-150 relative
                      ${isSquareDark ? 'bg-[#769656]' : 'bg-[#eeeed2]'} 
                      ${isLastMoveTrace ? 'after:absolute after:inset-0 after:bg-yellow-400/25 z-10' : ''}
                      ${isCurrentlySelected ? 'bg-amber-200/80 ring-4 ring-amber-400 ring-inset z-20' : ''}
                    `}
                  >
                    {isALegalMoveDestination && (
                      pieceValue === "" ? (
                        <div className="absolute w-3 h-3 bg-black/15 rounded-full z-40 pointer-events-none" />
                      ) : (
                        <div className="absolute inset-1 border-[4px] border-black/15 rounded-full z-40 pointer-events-none" />
                      )
                    )}

                    <span className={`text-[40px] z-30 select-none leading-none block
                      ${isWhitePiece 
                        ? "text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.55)]" 
                        : "text-zinc-900 drop-shadow-[0_0.5px_0.5px_rgba(255,255,255,0.45)]"
                      }
                    `}>
                      {pieceDisplayNames[pieceValue as ChessPiece] || ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 👤 PLAYER BAR: BOTTOM PROFILE (WHITE SIDE) */}
          <div className={`w-full max-w-[480px] flex justify-between items-center px-4 py-3 rounded-2xl border bg-white transition-all duration-200 ${game.activeTurn === "WHITE" ? 'border-emerald-400 border-b-4' : 'border-slate-200/60'}`}>
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{whitePlayerName}</span>
                <span className="text-[9px] font-mono text-slate-400">({whitePlayerRating})</span>
              </div>
              {/* Graveyard Loot Pool Container: Black pieces captured FROM Black */}
              <div className="flex items-center space-x-0.5 text-base text-zinc-800 min-h-[16px] leading-none">
                {blackCapturedPool.length > 0 ? (
                  blackCapturedPool.map((p, i) => <span key={i} className="drop-shadow-sm">{pieceDisplayNames[p.toLowerCase() as ChessPiece]}</span>)
                ) : (
                  <span className="text-[8px] font-mono uppercase tracking-widest text-slate-300">Clean Sheet</span>
                )}
              </div>
            </div>
            {game.timeControl !== "INFINITE" && (
              <span className="text-sm font-mono font-bold tracking-wider bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl text-slate-700">
                {formatTimeClock(whiteTimeLeft)}
              </span>
            )}
          </div>

          {actionError && <div className="w-full max-w-[480px] bg-rose-50 border border-rose-100 p-2.5 rounded-xl text-center text-xs font-mono text-rose-500 animate-fade-in">⚠️ {actionError}</div>}
        </div>

        {/* RIGHT COLUMN PANEL: TELEMETRY SIDEBAR MOVE LOG & MANAGEMENT BLOCK */}
        <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm min-h-[460px] flex flex-col justify-between space-y-5 w-full">
          
          <div className="space-y-4 flex-1 flex flex-col">
            
            {/* Interactive Click-to-Copy UUID Widget */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0 flex-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Environment Session UUID</span>
                <span className="text-xs font-mono text-slate-600 truncate block select-all">{game.id}</span>
              </div>
              <button
                onClick={handleCopyId}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider transition-all select-none shadow-sm shrink-0 border border-transparent active:scale-[0.98]
                  ${copied ? "bg-emerald-600 text-white" : "bg-slate-900 text-white hover:bg-slate-800"}`}
              >
                {copied ? "✓ Copied!" : "📋 Copy ID"}
              </button>
            </div>

            {/* LIVE STEP REGISTER CONTAINER */}
            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Match Execution History</label>
              <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-4 overflow-y-auto font-mono text-xs text-slate-600 space-y-1.5 shadow-inner flex-1 max-h-[260px]">
                {game.moveHistory.length === 0 ? (
                  <div className="text-center italic py-4 text-slate-300">No steps logged. Awaiting deployment vector...</div>
                ) : (
                  game.moveHistory.map((move, idx) => (
                    <div key={idx} className="flex justify-between border-b border-slate-200/10 py-0.5">
                      <span className="text-slate-400 text-[10px]">Step #{idx + 1}:</span>
                      <span className="font-bold text-slate-700">{move}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* CORE TERMINATION CONTROL PANEL BUTTONS */}
          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
            <button
              disabled={isPending || isMatchFinished}
              onClick={handleClaimDraw}
              className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold font-mono uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 active:scale-[0.98] text-center"
            >
              🤝 Offer Draw
            </button>
            <button
              disabled={isPending || isMatchFinished}
              onClick={handleAbortMatch}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold font-mono uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 active:scale-[0.98] text-center"
            >
              💥 Abort Match
            </button>
          </div>
          
        </div>
      </div>
    </main>
  );
}