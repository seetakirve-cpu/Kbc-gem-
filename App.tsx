import React, { useState, useEffect, useRef, useCallback } from 'react';
import LanguageSelection from './components/LanguageSelection.tsx';
import NameInput from './components/NameInput.tsx';
import Disclaimer from './components/Disclaimer.tsx';
import Sidebar from './components/Sidebar.tsx';
import QuizArea from './components/QuizArea.tsx';
import Lifelines from './components/Lifelines.tsx';
import GameOver from './components/GameOver.tsx';
import { Language, GameStatus, Question, Lifelines as LifelinesType, PollData } from './types.ts';
import { fetchQuestion } from './services/gemini.ts';
import { getTimerForLevel, MONEY_TREE } from './constants.tsx';
import { stopSpeech, speakFullQuestionSequence } from './services/tts.ts';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.NAME_INPUT);
  const [playerName, setPlayerName] = useState('');
  const [language, setLanguage] = useState<Language>(Language.ENGLISH);
  const [level, setLevel] = useState(1);
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [maxTime, setMaxTime] = useState<number | null>(null);
  const [hiddenOptions, setHiddenOptions] = useState<string[]>([]);
  const [visibleOptions, setVisibleOptions] = useState<string[]>([]);
  const [pollData, setPollData] = useState<PollData | null>(null);
  const [isDoubleDipActive, setIsDoubleDipActive] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [canStartTimer, setCanStartTimer] = useState(false);
  const [lifelines, setLifelines] = useState<LifelinesType>({
    fiftyFifty: true, audiencePoll: true, doubleDip: true, flipQuestion: true
  });

  const timerRef = useRef<any>(null);

  const startUnifiedSpeech = useCallback(async (q: Question, l: number, lang: Language) => {
    setIsSpeaking(true);
    setIsVoiceLoading(true);
    setVisibleOptions([]); 
    setCanStartTimer(false);

    await speakFullQuestionSequence(
      l, q, lang, 
      (key) => {
        setVisibleOptions(prev => [...new Set([...prev, key])]);
      },
      () => {
        setIsVoiceLoading(false);
      }
    );
    
    setIsSpeaking(false);
    setIsVoiceLoading(false);
    setCanStartTimer(true); 
  }, []);

  const loadQuestion = async (currLevel: number, lang: Language) => {
    stopSpeech();
    setLoading(true);
    setIsVoiceLoading(false);
    setVisibleOptions([]);
    setHiddenOptions([]);
    setPollData(null);
    setIsDoubleDipActive(false);
    setCanStartTimer(false);
    
    try {
      const q = await fetchQuestion(currLevel, lang);
      setQuestion(q);
      const initialTime = getTimerForLevel(currLevel);
      setMaxTime(initialTime);
      setTimeLeft(initialTime);
      setLoading(false);

      if (isVoiceEnabled) {
        startUnifiedSpeech(q, currLevel, lang);
      } else {
        setVisibleOptions(['A', 'B', 'C', 'D']);
        setCanStartTimer(true);
      }
    } catch (error) { setLoading(false); }
  };

  useEffect(() => {
    if (status === GameStatus.PLAYING && canStartTimer && timeLeft !== null && timeLeft > 0 && !loading) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 1) { clearInterval(timerRef.current); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else if (status === GameStatus.PLAYING && timeLeft === 0 && canStartTimer) {
      handleAnswer(false, false);
    }
    return () => clearInterval(timerRef.current);
  }, [status, timeLeft, loading, canStartTimer]);

  const handleVoiceCommand = (intentData: any) => {
    if (intentData.intent === 'USE_LIFELINE') useLifeline(intentData.target);
    if (intentData.intent === 'QUIT_GAME') setShowQuitConfirm(true);
  };

  const handleAnswer = (isCorrect: boolean, isFirstAttemptOfDoubleDip: boolean) => {
    stopSpeech();
    if (isFirstAttemptOfDoubleDip) return;
    clearInterval(timerRef.current);
    if (isCorrect) {
      setTimeout(() => {
        if (level === 15) setStatus(GameStatus.WON);
        else { setLevel(l => l + 1); loadQuestion(level + 1, language); }
      }, 2000);
    } else {
      setTimeout(() => setStatus(GameStatus.LOST), 1500);
    }
  };

  const useLifeline = (type: keyof LifelinesType) => {
    if (!question || loading) return;
    setLifelines(prev => ({ ...prev, [type]: false }));
    if (type === 'fiftyFifty') {
      const incorrect = Object.keys(question.options).filter(k => k !== question.correctAnswer).sort(() => 0.5 - Math.random());
      setHiddenOptions(incorrect.slice(0, 2));
    } else if (type === 'doubleDip') setIsDoubleDipActive(true);
    else if (type === 'flipQuestion') loadQuestion(level, language);
    else if (type === 'audiencePoll') {
       const correctKey = question.correctAnswer;
       const data = { A: 10, B: 10, C: 10, D: 10 };
       data[correctKey as keyof PollData] = 70;
       setPollData(data);
    }
  };

  const handleQuit = () => { stopSpeech(); setStatus(GameStatus.LOST); setShowQuitConfirm(false); };

  const isHindi = language === Language.HINDI;

  if (status === GameStatus.NAME_INPUT) return <NameInput onNameSubmit={(n) => { setPlayerName(n); setStatus(GameStatus.LANGUAGE_SELECT); }} />;
  if (status === GameStatus.LANGUAGE_SELECT) return <LanguageSelection onSelect={(l) => { setLanguage(l); setStatus(GameStatus.DISCLAIMER); }} />;
  if (status === GameStatus.WON || status === GameStatus.LOST) return <GameOver isWon={status === GameStatus.WON} levelReached={level} language={language} onRestart={() => window.location.reload()} />;

  const currentAmount = MONEY_TREE.find(l => l.id === level)?.amount || "₹0";

  return (
    <div className="min-h-screen kbc-bg flex flex-col md:flex-row relative text-white overflow-hidden">
      {status === GameStatus.DISCLAIMER && <Disclaimer language={language} onStart={() => { setStatus(GameStatus.PLAYING); loadQuestion(1, language); }} />}
      
      {showQuitConfirm && (
        <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-6 backdrop-blur-xl animate-fade-in">
          <div className="bg-[#001a33] p-10 rounded-3xl gold-border max-w-md w-full text-center space-y-8 animate-scale-in">
            <h2 className="text-3xl font-black gold-text uppercase italic">{isHindi ? 'खेल छोड़ना?' : 'Quit Game?'}</h2>
            <p className="text-xl text-blue-100">{isHindi ? 'क्या आप वाकई खेल छोड़ना चाहते हैं?' : 'Are you sure you want to leave the game?'}</p>
            <div className="flex gap-4">
              <button onClick={handleQuit} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl uppercase transition-all shadow-lg shadow-red-900/40">Yes, Quit</button>
              <button onClick={() => setShowQuitConfirm(false)} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl uppercase transition-all shadow-lg shadow-green-900/40">Stay</button>
            </div>
          </div>
        </div>
      )}

      <div className="md:hidden fixed top-24 left-4 z-[60]">
         <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-12 h-12 bg-blue-900/90 border border-[#d4af37] rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform">
            <i className={`fas ${isSidebarOpen ? 'fa-times' : 'fa-list-ul'} gold-text text-xl`}></i>
         </button>
      </div>

      <div className="flex-grow flex flex-col relative min-h-screen z-10">
        <header className="w-full flex justify-between items-center px-4 md:px-8 py-3 bg-black/60 border-b border-[#d4af37]/30 backdrop-blur-md sticky top-0 z-[50]">
          <div className="flex items-center space-x-3">
            <div className="flex flex-col">
              <span className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">{playerName} • LEVEL {level}</span>
              <span className="gold-text font-black text-lg md:text-2xl leading-none">{currentAmount}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 md:space-x-8">
            <button 
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} 
              className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border transition-all ${isVoiceEnabled ? 'bg-[#d4af37] text-black border-white' : 'bg-gray-800 text-gray-400 border-gray-700'}`}
            >
              <i className={`fas ${isVoiceEnabled ? 'fa-volume-up' : 'fa-volume-mute'}`}></i>
            </button>
            
            <div className={`relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full border-2 ${timeLeft && timeLeft <= 10 ? 'animate-timer-critical border-red-500' : 'animate-timer-pulse border-blue-400'}`}>
               <span className={`text-xl font-black ${timeLeft && timeLeft <= 10 ? 'text-red-200' : 'text-blue-100'}`}>{timeLeft ?? '∞'}</span>
            </div>
            
            <button 
              onClick={() => setShowQuitConfirm(true)} 
              className="hidden md:block bg-red-900/60 border border-red-500/60 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase hover:bg-red-600 transition-all"
            >
              QUIT
            </button>
          </div>
        </header>

        <main className="flex-grow flex flex-col items-center justify-start p-2 md:p-6 overflow-y-auto w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center flex-grow space-y-6">
              <div className="w-16 h-16 border-4 border-t-[#d4af37] border-white/10 rounded-full animate-spin"></div>
              <p className="gold-text font-black uppercase tracking-widest animate-pulse">Wait for the Hot Seat...</p>
            </div>
          ) : question ? (
            <div className="w-full flex flex-col items-center space-y-2 md:space-y-4 animate-fade-in max-w-6xl mx-auto">
              <div className="w-full mt-2">
                <Lifelines lifelines={lifelines} onUse={useLifeline} disabled={loading || isSpeaking} />
              </div>
              <div className="w-full">
                <QuizArea 
                  question={question} 
                  language={language} 
                  hiddenOptions={hiddenOptions} 
                  isDoubleDipActive={isDoubleDipActive} 
                  visibleOptions={visibleOptions} 
                  isSpeaking={isSpeaking}
                  isVoiceLoading={isVoiceLoading}
                  onAnswer={handleAnswer} 
                  onRepeat={() => startUnifiedSpeech(question, level, language)}
                  onVoiceCommand={handleVoiceCommand}
                />
              </div>
            </div>
          ) : null}
        </main>
      </div>

      <aside className={`fixed md:relative top-0 right-0 h-screen w-72 lg:w-80 transition-transform duration-300 z-[100] md:translate-x-0 ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full md:translate-x-0'}`}>
        <Sidebar currentLevel={level} />
        {isSidebarOpen && (
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute -left-12 top-24 w-12 h-12 bg-blue-950 rounded-l-full flex items-center justify-center border-l border-y border-[#d4af37] shadow-lg">
            <i className="fas fa-chevron-right gold-text"></i>
          </button>
        )}
      </aside>

      {pollData && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 animate-fade-in">
          <div className="bg-[#000d1a] p-6 md:p-12 rounded-3xl gold-border max-w-lg w-full text-center space-y-6 animate-scale-in">
            <h3 className="gold-text text-2xl md:text-3xl font-black uppercase italic tracking-widest">{isHindi ? 'ऑडियन्स पोल' : 'Audience Poll'}</h3>
            <div className="flex items-end justify-around h-48 md:h-64 gap-3 md:gap-4">
              {Object.entries(pollData).map(([key, value]) => (
                <div key={key} className="flex flex-col items-center w-full">
                  <span className="text-blue-100 text-[10px] md:text-sm font-bold mb-1">{value}%</span>
                  <div className="relative w-full bg-blue-900/40 rounded-t-lg border border-white/10 overflow-hidden" style={{ height: `${value}%` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-700 to-cyan-400 animate-pulse"></div>
                  </div>
                  <div className="w-full mt-2 bg-white text-black font-black py-1 rounded text-sm md:text-lg">{key}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setPollData(null)} className="bg-[#d4af37] text-black font-black py-3 px-12 rounded-full hover:scale-105 transition-all uppercase shadow-lg">
              {isHindi ? 'आगे बढ़ें' : 'CONTINUE'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;