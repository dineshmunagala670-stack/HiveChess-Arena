"use client";

import React, { useState, useTransition } from "react";

export default function ApiKeyPanel() {
  const [isPending, startTransition] = useTransition();
  const [apiKey, setApiKey] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const displayValue = apiKey || "Click Generate below to provision a token node...";
  const isPlaceholder = displayValue.startsWith("Click") || displayValue === "";

  const handleGenerate = () => {
    startTransition(async () => {
      try {
        setStatusMessage("");
        const response = await fetch("/api/v1/developer/key", { method: "POST" });
        const data = await response.json();
        
        if (response.ok && data.key) {
          setApiKey(data.key);
        } else {
          setStatusMessage(data.error || "Failed to provision access token configuration.");
        }
      } catch (err) {
        console.error("API key generation error:", err);
        setStatusMessage("Network failure connection timeout dropped.");
      }
    });
  };

  const handleCopy = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* 🔑 API KEY GENERATION INTERFACE HUB CARD */}
      <div className="space-y-5 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
            Authorized Token Value String
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              readOnly
              value={apiKey ? apiKey : displayValue}
              className={`w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs outline-none transition-all ${
                apiKey ? "text-slate-800 font-bold select-all bg-emerald-50/20 border-emerald-200" : "text-slate-400 italic"
              }`}
            />
            {apiKey && (
              <div className="absolute right-3 text-[10px] font-mono font-bold text-emerald-500 bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded-md">
                Active Credential
              </div>
            )}
          </div>
        </div>

        {statusMessage && (
          <div className="text-xs font-mono text-rose-500 bg-rose-50 border border-rose-100 p-2.5 rounded-xl">
            ⚠️ {statusMessage}
          </div>
        )}

        <div className="flex items-center space-x-3">
          <button
            disabled={isPending}
            onClick={isPlaceholder ? handleGenerate : handleCopy}
            className={`px-5 py-2.5 text-xs font-bold font-mono uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 select-none border border-transparent
              ${isPlaceholder 
                ? "bg-slate-900 hover:bg-slate-800 text-white" 
                : copied 
                  ? "bg-emerald-600 text-white" 
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/60"
              }`}
          >
            {isPending 
              ? "⌛ Generating..." 
              : isPlaceholder 
                ? "⚡ Generate API Key" 
                : copied 
                  ? "✓ Copied Token!" 
                  : "📋 Copy Key"}
          </button>

          {!isPlaceholder && (
            <button
              onClick={() => { setApiKey(""); setCopied(false); }}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 text-xs font-medium font-mono uppercase tracking-wider rounded-xl border border-slate-200/60 transition-all"
            >
              Clear View
            </button>
          )}
        </div>
      </div>

      {/* 📘 Headless AI Client Agent Connectivity SDK Guide */}
      <div className="bg-white border border-slate-200/50 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🤖</span>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">How To Connect Your Local AI Engine</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Follow this quick integration blueprint to attach your weights matrices, deep learning heuristics, or fine-tuned custom LLM script directly into live online lobby match streams.
          </p>
        </div>

        {/* STEP 1 */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-700 flex items-center space-x-2">
            <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center font-mono text-[10px] text-slate-500 border border-slate-200/60">1</span>
            <span>Install Python Core Requirements</span>
          </h3>
          <p className="text-xs text-slate-400 pl-7">
            Ensure your local worker thread execution pipeline possesses the network communication and basic validation chess arrays packages:
          </p>
          <div className="pl-7">
            <pre className="bg-slate-900 text-slate-200 font-mono text-xs p-3.5 rounded-xl select-all overflow-x-auto shadow-inner">
              pip install requests python-chess
            </pre>
          </div>
        </div>

        {/* STEP 2 */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-700 flex items-center space-x-2">
            <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center font-mono text-[10px] text-slate-500 border border-slate-200/60">2</span>
            <span>Configure the Universal Script Canvas</span>
          </h3>
          <p className="text-xs text-slate-400 pl-7">
            Create a local file named <span className="font-mono text-slate-600 bg-slate-100 px-1 py-0.5 rounded border border-slate-200/60 font-semibold">hive_connect_ai.py</span> and drop the following dynamic handshake loop into it. Paste your token above, enter an active match ID, and inject your model layers inside the prediction placeholder function:
          </p>
          <div className="pl-7">
            <div className="bg-slate-900 rounded-xl overflow-hidden shadow-inner flex flex-col max-h-[340px]">
              <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center shrink-0">
                <span className="text-[10px] text-slate-400 font-mono font-bold tracking-wider">hive_connect_ai.py</span>
                <span className="text-[9px] bg-slate-700 text-indigo-300 px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold">Client SDK Canvas</span>
              </div>
              <pre className="text-slate-300 font-mono text-[11px] p-4 overflow-y-auto whitespace-pre select-all flex-1 leading-relaxed">
{`#!/usr/bin/env python3
import time
import requests
import chess

# ==============================================================================
# ⬢ CONNECTION & AUTOMATIC SEAT HANDSHAKE CONFIGURATION
# ==============================================================================
BASE_URL = "http://localhost:3000"  # Replace with production url when hosting
API_KEY = "PASTE_YOUR_GENERATED_API_KEY_HERE"
GAME_ID = "PASTE_ACTIVE_GAME_ID_FROM_LOBBY_HERE"

POLL_INTERVAL = 1.0  
assigned_bot_color = None  

# ==============================================================================
# 🧠 MODEL INFERENCE LOOP ENTRY PLACEHOLDER
# ==============================================================================
def predict_custom_ai_move(move_history, legal_moves_san):
    """
    👉 DEVELOPERS: Wire up your HuggingFace models, pipelines, or engines here!
    """
    import random
    return random.choice(legal_moves_san) # Default fallback protector template

# ==============================================================================
# 🛠️ SYSTEM ENGINE PLATFORM MANAGEMENT TELEMETRY
# ==============================================================================
def fetch_game_state_handshake():
    global assigned_bot_color
    try:
        url = f"{BASE_URL}/api/v1/game/{GAME_ID}"
        headers = {"x-api-key": API_KEY}
        response = requests.get(url, headers=headers, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            assigned_bot_color = data.get("yourColor")
            return data
        elif response.status_code == 404:
            print("\\n[🏁] Match removed from server registry. Terminating runner script loops...")
            return {"status": "TERMINATED"}
    except Exception as e:
        print(f"[-] Telemetry disconnect: {e}")
  return None

def transmit_move_vector(san_move):
    state = fetch_game_state_handshake()
    if not state: return False
    board = chess.Board()
    for move in state.get("moveHistory", []): board.push_san(move)
    try:
        parsed_move = board.parse_san(san_move)
        uci_string = parsed_move.uci()
        payload = {
            "gameId": GAME_ID, "from": uci_string[0:2], "to": uci_string[2:4],
            "promotion": uci_string[4:5] if len(uci_string) > 4 else "q", "move": san_move
        }
        headers = {"x-api-key": API_KEY, "Content-Type": "application/json"}
        url = f"{BASE_URL}/api/v1/bot/move"
        response = requests.post(url, json=payload, headers=headers, timeout=5)
        if response.status_code == 200:
            print(f"[✓] Move [{san_move}] successfully committed to canvas layout!")
            return True
    except Exception as e: print(f"[-] Data transmission failure: {e}")
    return False

if __name__ == "__main__":
    print("================================================================")
    print("⬢ HIVE ARENA CLIENT AGENT MANAGER INFRASTRUCTURE ACTIVE")
    print("================================================================")
    while True:
        state = fetch_game_state_handshake()
        if not state: time.sleep(POLL_INTERVAL); continue
        status = state.get("status")
        if status not in ["ACTIVE", "MATCHMAKING"]:
            print(f"[🏁] Match is inactive. Disengaging execution blocks. Status: {status}")
            break
        if assigned_bot_color and assigned_bot_color != "SPECTATOR":
            history = state.get("moveHistory", [])
            if len(history) == 0:
                print(f"[.] Seat: {assigned_bot_color} | Clock FROZEN. Awaiting White move #1...", end="\\r")
            if state.get("activeTurn") == assigned_bot_color and status == "ACTIVE":
                print(f"\\n[!] Your turn detected! Computing action metrics for Move #{len(history) + 1}...")
                board = chess.Board()
                for m in history: board.push_san(m)
                legal_san_options = [board.san(move) for move in board.legal_moves]
                predicted_move = predict_custom_ai_move(history, legal_san_options)
                if predicted_move in legal_san_options: transmit_move_vector(predicted_move)
            else:
                if len(history) > 0:
                    print(f"[.] Slot: {assigned_bot_color} | Awaiting opponent deployment execution lines...", end="\\r")
        else:
            print("[.] Attempting dynamic server handshake seat allocation configuration...", end="\\r")
        time.sleep(POLL_INTERVAL)`}
              </pre>
            </div>
          </div>
        </div>

        {/* STEP 3 */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-700 flex items-center space-x-2">
            <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center font-mono text-[10px] text-slate-500 border border-slate-200/60">3</span>
            <span>Launch the Arena Process Execution</span>
          </h3>
          <p className="text-xs text-slate-400 pl-7">
            Spin up a fresh online lobby channel via the platform home screen selector, copy the active game UUID, update your code variables, and boot your local pipeline script loop. The automatic handshake assigns color slots instantly, and match time restrictions remain completely frozen until step 1 gets committed!
          </p>
          <div className="pl-7">
            <pre className="bg-slate-900 text-slate-200 font-mono text-xs p-3.5 rounded-xl select-all overflow-x-auto shadow-inner">
              python hive_connect_ai.py
            </pre>
          </div>
        </div>

      </div>

    </div>
  );
}