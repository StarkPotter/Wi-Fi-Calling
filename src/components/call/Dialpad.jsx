import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Delete } from 'lucide-react';

const keys = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
];

const subLabels = {
  '2': 'ABC', '3': 'DEF', '4': 'GHI', '5': 'JKL',
  '6': 'MNO', '7': 'PQRS', '8': 'TUV', '9': 'WXYZ',
  '0': '+', '*': '', '#': ''
};

export default function Dialpad({ value, onChange, onCall }) {
  const handlePress = (key) => {
    onChange(value + key);
  };

  const handleDelete = () => {
    onChange(value.slice(0, -1));
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Display */}
      <div className="w-full text-center mb-2 min-h-[56px] flex items-center justify-center">
        <span className="text-3xl font-light tracking-[0.15em] text-white">
          {value || <span className="text-white/30">Enter number</span>}
        </span>
        {value && (
          <button onClick={handleDelete} className="ml-3 p-2 text-white/40 hover:text-white/70 transition-colors">
            <Delete className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Keys */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
        {keys.flat().map((key) => (
          <motion.button
            key={key}
            whileTap={{ scale: 0.9 }}
            onClick={() => handlePress(key)}
            className="w-[80px] h-[80px] mx-auto rounded-full bg-white/10 backdrop-blur-sm
                       flex flex-col items-center justify-center
                       hover:bg-white/20 active:bg-white/25 transition-all duration-150"
          >
            <span className="text-2xl font-light text-white">{key}</span>
            {subLabels[key] && (
              <span className="text-[10px] tracking-[0.2em] text-white/40 mt-0.5">{subLabels[key]}</span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Call button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        onClick={onCall}
        disabled={!value}
        className="mt-4 w-[72px] h-[72px] rounded-full bg-emerald-500 
                   flex items-center justify-center shadow-lg shadow-emerald-500/30
                   disabled:opacity-30 disabled:shadow-none transition-all"
      >
        <Phone className="w-7 h-7 text-white" />
      </motion.button>
    </div>
  );
}