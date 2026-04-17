
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Sparkles, Trophy } from 'lucide-react';
import { Language, Reward } from '../types';
import { speakHostResponse } from '../services/tts.ts';

interface Props {
  language: Language;
  playerName: string;
  onComplete: (reward: Reward) => void;
}

const REWARDS: Reward[] = [
  { type: 'EXTRA_LIFE', label: 'Extra Life', description: 'Recover one used lifeline!', hindiLabel: 'अतिरिक्त जीवन', hindiDescription: 'उपयोग की गई एक लाइफलाइन पुनः प्राप्त करें!' },
  { type: 'TIME_FREEZE', label: 'Time Freeze', description: 'No timer for the next question!', hindiLabel: 'समय शांत', hindiDescription: 'अगले प्रश्न के लिए कोई टाइमर नहीं!' },
  { type: 'SHIELD', label: 'Safety Shield', description: 'Safe zone active for next question!', hindiLabel: 'सुरक्षा कवच', hindiDescription: 'अगले प्रश्न के लिए सुरक्षित क्षेत्र सक्रिय!' },
  { type: 'DOUBLE_MONEY', label: 'Double Money', description: 'Win double rewards next!', hindiLabel: 'दोगुना पैसा', hindiDescription: 'दोगुना इनाम जीतें!' },
  { type: 'HINT', label: 'Secret Hint', description: 'The host will give you a tip!', hindiLabel: 'गुप्त संकेत', hindiDescription: 'मेजबान आपको एक संकेत देगा!' },
  { type: 'MULTIPLIER', label: '1.5x Multiplier', description: 'Current winnings increased!', hindiLabel: '1.5x गुणांक', hindiDescription: 'वर्तमान जीत में वृद्धि!' },
  { type: 'EXTRA_LIFE', label: 'Extra Life', description: 'Recover one used lifeline!', hindiLabel: 'अतिरिक्त जीवन', hindiDescription: 'उपयोग की गई एक लाइफलाइन पुनः प्राप्त करें!' },
  { type: 'TIME_FREEZE', label: 'Time Freeze', description: 'No timer for the next question!', hindiLabel: 'समय शांत', hindiDescription: 'अगले प्रश्न के लिए कोई टाइमर नहीं!' },
  { type: 'SHIELD', label: 'Safety Shield', description: 'Safe zone active for next question!', hindiLabel: 'सुरक्षा कवच', hindiDescription: 'अगले प्रश्न के लिए सुरक्षित क्षेत्र सक्रिय!' },
  { type: 'DOUBLE_MONEY', label: 'Double Money', description: 'Win double rewards next!', hindiLabel: 'दोगुना पैसा', hindiDescription: 'दोगुना इनाम जीतें!' },
  { type: 'HINT', label: 'Secret Hint', description: 'The host will give you a tip!', hindiLabel: 'गुप्त संकेत', hindiDescription: 'मेजबान आपको एक संकेत देगा!' },
  { type: 'MULTIPLIER', label: '1.5x Multiplier', description: 'Current winnings increased!', hindiLabel: '1.5x गुणांक', hindiDescription: 'वर्तमान जीत में वृद्धि!' },
];

const SpinAndWin: React.FC<Props> = ({ language, playerName, onComplete }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<Reward | null>(null);
  const [showResult, setShowResult] = useState(false);
  const isHindi = language === Language.HINDI;

  useEffect(() => {
    const introText = isHindi 
      ? `शानदार! 5 सवाल सही जवाब देने पर, ${playerName} जी, आप पहुँच गए हैं हमारे 'स्पिन एंड विन' राउंड में। यहाँ आपके सामने 12 चिट्ठियाँ हैं, जिनमें छिपे हैं शानदार डिजिटल इनाम। चलिए, पहिया घुमाते हैं!`
      : `Incredible! After 5 correct answers, ${playerName}, you've entered our 'Spin & Win' round. Before us are 12 chits containing premium digital rewards. Let's see what fate has in store for you!`;
    
    speakHostResponse(introText);
  }, [language, playerName]);

  const spin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    const extraSpins = 5 + Math.random() * 5;
    const finalRotation = rotation + (extraSpins * 360) + (Math.random() * 360);
    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const degree = finalRotation % 360;
      const index = Math.floor(((360 - degree + (360/24)) % 360) / (360 / 12));
      const reward = REWARDS[index % 12];
      setWinner(reward);
      
      const winText = isHindi
        ? `बधाई हो! आपको मिला है: ${reward.hindiLabel}। ${reward.hindiDescription} ये आपके खेल में बहुत काम आएगा।`
        : `Congratulations! You have won: ${reward.label}. ${reward.description} This will be immensely helpful in your journey!`;
      
      speakHostResponse(winText).then(() => {
        setShowResult(true);
      });
    }, 5000);
  };

  return (
    <div className="fixed inset-0 z-[600] bg-black/95 flex flex-col items-center justify-center p-6 backdrop-blur-2xl">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h2 className="text-4xl md:text-6xl font-black gold-text mb-4 uppercase tracking-[0.2em] italic">
          Spin & Win
        </h2>
        <p className="text-blue-200 text-lg md:text-xl font-medium tracking-wide">
          {isHindi ? '5 सवाल पूरे! अब समय है एक विशेष इनाम का।' : '5 questions cleared! Time for a special reward.'}
        </p>
      </motion.div>

      <div className="relative w-80 h-80 md:w-[500px] md:h-[500px] flex items-center justify-center">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -top-4 z-20">
          <div className="w-8 h-12 bg-red-600 clip-path-polygon-[0%_0%,100%_0%,50%_100%] shadow-[0_0_20px_rgba(220,38,38,0.5)]"></div>
        </div>

        {/* Wheel Container */}
        <motion.div 
          animate={{ rotate: rotation }}
          transition={{ duration: 5, ease: "circOut" }}
          className="w-full h-full rounded-full border-8 border-[#d4af37] relative overflow-hidden shadow-[0_0_80px_rgba(212,175,55,0.3)] bg-[#001a33]"
        >
          {REWARDS.map((_, i) => (
            <div 
              key={i}
              className="absolute top-0 left-1/2 w-1 h-full bg-[#d4af37]/20 origin-bottom"
              style={{ transform: `translateX(-50%) rotate(${i * 30}deg)` }}
            >
              <div 
                className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                style={{ transform: `rotate(0deg)` }}
              >
                <div className="w-12 h-16 bg-white rounded-md border-2 border-gold shadow-lg flex items-center justify-center italic text-blue-900 font-bold text-lg">?</div>
              </div>
            </div>
          ))}
          
          {/* Inner Circle Decoration */}
          <div className="absolute inset-[35%] rounded-full bg-gradient-to-br from-[#004e92] to-[#000428] border-4 border-[#d4af37] z-10 flex items-center justify-center">
            <Sparkles className="w-12 h-12 gold-text animate-pulse" />
          </div>
        </motion.div>

        {/* Spin Button */}
        <button 
          onClick={spin}
          disabled={isSpinning || !!winner}
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white flex items-center justify-center font-black text-xl md:text-2xl transition-all ${
            isSpinning || !!winner ? 'bg-gray-700 opacity-50' : 'bg-gradient-to-br from-orange-500 to-red-600 hover:scale-110 active:scale-95 shadow-[0_0_40px_rgba(249,115,22,0.6)]'
          }`}
        >
          {isSpinning ? '...' : (isHindi ? 'घुमाएँ' : 'SPIN')}
        </button>
      </div>

      <AnimatePresence>
        {showResult && winner && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[700] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
          >
            <div className="bg-[#001a33] p-10 rounded-3xl gold-border max-w-md w-full text-center space-y-6 shadow-[0_0_100px_rgba(212,175,55,0.4)]">
              <div className="w-24 h-24 bg-gradient-to-br from-gold to-[#b38728] rounded-full mx-auto flex items-center justify-center shadow-xl">
                <Trophy className="w-12 h-12 text-blue-950" />
              </div>
              <div>
                <h3 className="text-4xl font-black gold-text mb-2 uppercase tracking-tight">
                  {isHindi ? winner.hindiLabel : winner.label}
                </h3>
                <p className="text-xl text-blue-100 font-medium italic">
                  {isHindi ? winner.hindiDescription : winner.description}
                </p>
              </div>
              <button 
                onClick={() => onComplete(winner)}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-black py-4 rounded-full text-xl shadow-xl transition-all active:scale-95 uppercase tracking-widest"
              >
                {isHindi ? 'जारी रखें' : 'Continue'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SpinAndWin;
