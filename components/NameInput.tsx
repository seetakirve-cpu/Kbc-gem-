
import React, { useState } from 'react';

interface Props {
  onNameSubmit: (name: string) => void;
}

const NameInput: React.FC<Props> = ({ onNameSubmit }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onNameSubmit(name.trim());
    } else {
      alert("कृपया खेल शुरू करने के लिए अपना नाम दर्ज करें। (Please enter your name to start the game.)");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen kbc-bg text-white p-6">
      <div className="bg-blue-900/40 p-10 rounded-3xl gold-border text-center max-w-lg w-full shadow-2xl animate-scale-in">
        <div className="mb-8">
          <i className="fas fa-user-circle text-6xl gold-text mb-4"></i>
          <h1 className="text-4xl font-black gold-text uppercase tracking-widest italic">KBC PRO</h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mt-2">Welcome to the Hot Seat</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Your Name / अपना नाम दर्ज करें"
              className="w-full bg-black/60 border-2 border-[#d4af37]/40 focus:border-[#d4af37] rounded-xl px-6 py-4 text-xl text-center outline-none transition-all placeholder:text-gray-600 font-bold"
              autoFocus
            />
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#d4af37] to-transparent rounded-xl opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none"></div>
          </div>
          
          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-[#d4af37] via-[#fcf6ba] to-[#d4af37] text-black font-black py-4 px-12 rounded-xl text-2xl hover:scale-105 transition-all shadow-[0_10px_30px_rgba(212,175,55,0.4)] active:scale-95 uppercase"
          >
            Start Game
          </button>
        </form>
        
        <p className="mt-8 text-xs text-gray-500 font-bold uppercase tracking-widest">
          Knowledge is Power • ज्ञान ही शक्ति है
        </p>
      </div>
    </div>
  );
};

export default NameInput;
