import React from 'react';
import { motion } from 'framer-motion';
import { PhoneOff, Mic, MicOff, Volume2 } from 'lucide-react';

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function ActiveCallScreen({ remoteName, remoteId, duration, onHangUp, isConnecting, isMuted, onToggleMute }) {

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 
                 flex flex-col items-center justify-between py-20"
    >
      <div className="flex flex-col items-center gap-5 mt-8">
        {/* Avatar */}
        <div className="relative">
          {!isConnecting && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -inset-3 rounded-full bg-emerald-500/10"
            />
          )}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 
                          flex items-center justify-center text-white text-3xl font-semibold">
            {(remoteName || remoteId || '?')[0].toUpperCase()}
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-semibold text-white">{remoteName || remoteId}</h2>
          <p className="text-white/40 text-sm mt-1">#{remoteId}</p>
          {isConnecting ? (
            <motion.p
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-yellow-400 mt-4 text-sm font-medium"
            >
              Calling...
            </motion.p>
          ) : (
            <p className="text-emerald-400 mt-4 text-lg font-mono tracking-wider">
              {formatDuration(duration)}
            </p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-8 mb-4">
        <button
          onClick={onToggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all
                     ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/60 hover:text-white'}`}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onHangUp}
          className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center
                     shadow-lg shadow-red-500/30"
        >
          <PhoneOff className="w-7 h-7 text-white" />
        </motion.button>

        <button className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center
                          text-white/60 hover:text-white transition-all">
          <Volume2 className="w-6 h-6" />
        </button>
      </div>
    </motion.div>
  );
}