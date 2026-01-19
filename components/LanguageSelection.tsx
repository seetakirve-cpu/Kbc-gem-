
import React from 'react';
import { Language } from '../types';

interface Props {
  onSelect: (lang: Language) => void;
}

const LanguageSelection: React.FC<Props> = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen kbc-bg text-white p-6">
      <div className="bg-blue-900/50 p-10 rounded-2xl gold-border text-center max-w-md w-full">
        <h1 className="text-4xl font-bold mb-8 gold-text uppercase tracking-widest">Select Language</h1>
        <div className="space-y-4">
          <button 
            onClick={() => onSelect(Language.HINDI)}
            className="w-full py-4 text-xl font-bold rounded-lg border-2 border-[#d4af37] hover:bg-[#d4af37] hover:text-black transition-all duration-300"
          >
            हिंदी (Hindi)
          </button>
          <button 
            onClick={() => onSelect(Language.ENGLISH)}
            className="w-full py-4 text-xl font-bold rounded-lg border-2 border-[#d4af37] hover:bg-[#d4af37] hover:text-black transition-all duration-300"
          >
            English
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelection;
