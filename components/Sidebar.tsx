
import React from 'react';
import { MONEY_TREE } from '../constants';
import { Reward } from '../types';
import { Gift, Zap, Shield, Repeat, Coins, Lightbulb } from 'lucide-react';

interface Props {
  currentLevel: number;
  activeReward: Reward | null;
}

const Sidebar: React.FC<Props> = ({ currentLevel, activeReward }) => {
  const isHindi = activeReward?.hindiLabel !== undefined;

  const RewardIcon = () => {
    if (!activeReward) return null;
    switch (activeReward.type) {
      case 'EXTRA_LIFE': return <Repeat className="gold-text w-5 h-5" />;
      case 'TIME_FREEZE': return <Zap className="gold-text w-5 h-5" />;
      case 'SHIELD': return <Shield className="gold-text w-5 h-5" />;
      case 'DOUBLE_MONEY': return <Coins className="gold-text w-5 h-5" />;
      case 'HINT': return <Lightbulb className="gold-text w-5 h-5" />;
      case 'MULTIPLIER': return <Gift className="gold-text w-5 h-5" />;
      default: return <Gift className="gold-text w-5 h-5" />;
    }
  };
  return (
    <div className="bg-[#000d1a]/95 w-full h-full p-6 flex flex-col border-l border-[#d4af37]/30 shadow-2xl overflow-y-auto">
      <div className="mb-6 text-center">
        <h3 className="gold-text font-black text-xl tracking-[0.2em] uppercase italic">
          MONEY TREE
        </h3>
        <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto mt-2"></div>
      </div>

      <div className="flex flex-col space-y-1 justify-center">
        {MONEY_TREE.map((level) => {
          const isActive = level.id === currentLevel;
          const isCompleted = level.id < currentLevel;
          const isSafeZone = level.isSafeZone;
          
          return (
            <div 
              key={level.id}
              className={`relative flex items-center h-9 px-4 transition-all duration-300 rounded-lg overflow-hidden ${
                isActive 
                  ? 'bg-gradient-to-r from-orange-600 to-orange-400 scale-105 z-10 shadow-[0_0_20px_rgba(234,88,12,0.5)]' 
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-center w-10 mr-2">
                <span className={`text-[10px] font-black ${
                  isActive ? 'text-white' : isCompleted ? 'text-green-400' : isSafeZone ? 'text-white' : 'text-[#d4af37]/40'
                }`}>
                  {level.id < 10 ? `0${level.id}` : level.id}
                </span>
                <div className={`w-1.5 h-1.5 rotate-45 ml-2 ${
                  isActive ? 'bg-white' : isSafeZone ? 'bg-white/80' : 'bg-[#d4af37]/30'
                }`}></div>
              </div>

              <div className={`flex-grow text-right font-bold tracking-tighter ${
                isActive 
                  ? 'text-white text-base' 
                  : isCompleted 
                    ? 'text-green-500/50 line-through' 
                    : isSafeZone 
                      ? 'text-white text-sm' 
                      : 'text-orange-200/40'
              }`}>
                {level.amount}
              </div>

              {isSafeZone && (
                <div className={`absolute right-0 top-0 bottom-0 w-1 ${isActive ? 'bg-white' : 'bg-white/20'}`}></div>
              )}
            </div>
          );
        })}
      </div>

      {activeReward && (
        <div className="mt-8 p-4 rounded-xl gold-border bg-[#001a33] animate-pulse">
          <div className="flex items-center gap-3 mb-2">
            <RewardIcon />
            <span className="gold-text font-black uppercase text-xs tracking-tighter italic">ACTIVE REWARD</span>
          </div>
          <p className="text-white font-black uppercase text-lg leading-tight">
            {isHindi ? activeReward.hindiLabel : activeReward.label}
          </p>
          <p className="text-blue-200 text-[10px] italic mt-1 leading-tight">
            {isHindi ? activeReward.hindiDescription : activeReward.description}
          </p>
        </div>
      )}

      <div className="mt-auto pt-4 text-center">
        <p className="text-[10px] gold-text opacity-40 font-bold uppercase tracking-widest">
          The Grand Prize: ₹7 Crore
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
