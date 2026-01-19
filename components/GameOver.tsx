import React, { useState } from 'react';
import { Language } from '../types.ts';
import { MONEY_TREE } from '../constants.tsx';
import Certificate from './Certificate.tsx';

interface Props {
  isWon: boolean;
  levelReached: number;
  language: Language;
  onRestart: () => void;
}

const GameOver: React.FC<Props> = ({ isWon, levelReached, language, onRestart }) => {
  const [showCertificate, setShowCertificate] = useState(false);
  const isHindi = language === Language.HINDI;
  
  const getPrizeAmount = () => {
    if (isWon) return MONEY_TREE.find(l => l.id === 15)?.amount || "₹7 Crore";
    const completedSafeZones = MONEY_TREE.filter(l => l.isSafeZone && levelReached > l.id);
    if (completedSafeZones.length > 0) {
      return completedSafeZones[0].amount;
    }
    return "₹0";
  };

  const currentWin = getPrizeAmount();

  if (showCertificate && isWon) {
    return (
      <div className="min-h-screen kbc-bg flex flex-col items-center justify-center p-6 space-y-8">
        <Certificate language={language} amount={currentWin} />
        <button 
          onClick={() => setShowCertificate(false)}
          className="bg-white/10 hover:bg-white/20 text-white py-2 px-8 rounded-full transition-all"
        >
          {isHindi ? 'वापस जाएं' : 'Go Back'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen kbc-bg text-white p-6">
      <div className="bg-[#001a33]/90 p-12 rounded-3xl gold-border text-center max-w-2xl w-full space-y-8 animate-scale-in shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
        <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] opacity-30 ${isWon ? 'bg-yellow-400' : 'bg-red-600'}`}></div>

        <h1 className={`text-5xl md:text-6xl font-black tracking-tighter uppercase italic drop-shadow-2xl ${isWon ? 'gold-text' : 'text-red-500'}`}>
          {isWon 
            ? (isHindi ? 'ऐतिहासिक जीत!' : 'HISTORIC WIN!') 
            : (isHindi ? 'खेल समाप्त' : 'GAME OVER')}
        </h1>
        
        <div className="py-10 px-12 border-y border-[#d4af37]/30 bg-blue-900/40 relative">
          <p className="text-xl md:text-2xl text-gray-400 font-bold uppercase tracking-widest mb-4">
            {isHindi ? 'आपकी कुल जीत' : 'Your Total Winnings'}
          </p>
          <div className="text-6xl md:text-8xl font-black gold-text drop-shadow-lg">
            {currentWin}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4">
          <button 
            onClick={onRestart}
            className="w-full md:w-auto bg-[#d4af37] text-black font-black py-4 px-12 rounded-full text-2xl hover:bg-white transition-all transform hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(212,175,55,0.4)]"
          >
            {isHindi ? 'फिर से खेलें' : 'PLAY AGAIN'}
          </button>
          
          {isWon && (
            <button 
              onClick={() => setShowCertificate(true)}
              className="w-full md:w-auto bg-gradient-to-r from-green-600 to-green-500 text-white font-black py-4 px-12 rounded-full text-2xl hover:brightness-110 transition-all transform hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(34,197,94,0.4)]"
            >
              <i className="fas fa-medal mr-3"></i>
              {isHindi ? 'सर्टिफिकेट देखें' : 'VIEW CERTIFICATE'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameOver;