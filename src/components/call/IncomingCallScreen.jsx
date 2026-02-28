import React from 'react';
import { motion } from 'framer-motion';
import { Phone, PhoneOff } from 'lucide-react';

export default function IncomingCallScreen({ callerName, callerId, onAnswer, onReject }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 
                 flex flex-col items-center justify-between py-20"
    >
      {/* Ripple animation */}
      <div className="flex flex-col items-center gap-6 mt-8">
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-emerald-500/20 w-28 h-28 -m-4"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0, 0.2] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            className="absolute inset-0 rounded-full bg-emerald-500/10 w-28 h-28 -m-4"
          />
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 
                          flex items-center justify-center text-white text-2xl font-semibold">
            {(callerName || callerId || '?')[0].toUpperCase()}
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-semibold text-white">{callerName || callerId}</h2>
          <p className="text-white/50 mt-1 text-sm">#{callerId}</p>
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-emerald-400 mt-3 text-sm font-medium"
          >
            Incoming call...
          </motion.p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-16">
        <div className="flex flex-col items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onReject}
            className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center
                       shadow-lg shadow-red-500/30"
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </motion.button>
          <span className="text-white/50 text-xs">Decline</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onAnswer}
            className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center
                       shadow-lg shadow-emerald-500/30"
          >
            <Phone className="w-7 h-7 text-white" />
          </motion.button>
          <span className="text-white/50 text-xs">Accept</span>
        </div>
      </div>
    </motion.div>
  );
}