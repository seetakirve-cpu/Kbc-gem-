import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { Volume2, VolumeX, List, X, Power } from 'lucide-react';
import LanguageSelection from './components/LanguageSelection.tsx';
import NameInput from './components/NameInput.tsx';

const Disclaimer = lazy(() => import('./components/Disclaimer.tsx'));
const Sidebar = lazy(() => import('./components/Sidebar.tsx'));
const QuizArea = lazy(() => import('./components/QuizArea.tsx'));
const Lifelines = lazy(() => import('./components/Lifelines.tsx'));
const GameOver = lazy(() => import('./components/GameOver.tsx'));
const SpinAndWin = lazy(() => import('./components/SpinAndWin.tsx'));

import { Language, GameStatus, Question, Lifelines as LifelinesType, PollData, Reward } from './types.ts';
import { fetchQuestion } from './services/gemini.ts';
import { getTimerForLevel, MONEY_TREE } from './constants.tsx';
import { stopSpeech, speakFullQuestionSequence, speakHostResponse, prefetchQuestionAudio } from './services/tts.ts';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.NAME_INPUT);
  const [playerName, setPlayerName] = useState('');
  const [language, setLanguage] = useState<Language>(Language.ENGLISH);
  const [level, setLevel] = useState(1);
  const [question, setQuestion] = useState<Question | null>(null);
  const [nextQuestion, setNextQuestion] = useState<Question | null>(null);
  const [nextQuestionAudio, setNextQuestionAudio] = useState<AudioBuffer | null>(null);
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
  const [isMicActive, setIsMicActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [canStartTimer, setCanStartTimer] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [forceLock, setForceLock] = useState(false);
  const [lifelines, setLifelines] = useState<LifelinesType>({
    fiftyFifty: true, audiencePoll: true, doubleDip: true, flipQuestion: true
  });
  const [hasDoneSpinWin, setHasDoneSpinWin] = useState(false);
  const [activeReward, setActiveReward] = useState<Reward | null>(null);
  const [isTimeFrozenByReward, setIsTimeFrozenByReward] = useState(false);
  const [isShieldActive, setIsShieldActive] = useState(false);

  const timerRef = useRef<any>(null);

  const startUnifiedSpeech = useCallback(async (q: Question, l: number, lang: Language, name: string, prefetchedAudio: AudioBuffer | null = null) => {
    setIsSpeaking(true);
    setIsVoiceLoading(true);
    setVisibleOptions([]); 
    setCanStartTimer(false);

    await speakFullQuestionSequence(
      l, name, q, lang, 
      (key) => {
        setVisibleOptions(prev => [...new Set([...prev, key])]);
      },
      () => {
        setIsVoiceLoading(false);
      },
      0,
      prefetchedAudio
    );
    
    setIsSpeaking(false);
    setIsVoiceLoading(false);
    setCanStartTimer(true); 
  }, []);

  const prefetchNextQuestion = useCallback(async (nextLevel: number, lang: Language, name: string) => {
    if (nextLevel > 15) return;
    try {
      const q = await fetchQuestion(nextLevel, lang);
      setNextQuestion(q);
      // Also prefetch audio for this question
      const audio = await prefetchQuestionAudio(name, q, lang);
      setNextQuestionAudio(audio);
    } catch (error) {
      console.error("Prefetch failed:", error);
    }
  }, []);

  const loadQuestion = async (currLevel: number, lang: Language, name: string) => {
    stopSpeech();
    setLoading(true);
    setIsVoiceLoading(false);
    setVisibleOptions([]);
    setHiddenOptions([]);
    setPollData(null);
    setIsDoubleDipActive(false);
    setCanStartTimer(false);
    setSelectedOption(null);
    setForceLock(false);
    
    try {
      let q: Question;
      let audio: AudioBuffer | null = null;
      
      if (nextQuestion && level === currLevel) {
        q = nextQuestion;
        audio = nextQuestionAudio;
        setNextQuestion(null);
        setNextQuestionAudio(null);
      } else {
        q = await fetchQuestion(currLevel, lang);
      }
      
      setQuestion(q);
      const initialTime = getTimerForLevel(currLevel);
      setMaxTime(initialTime);
      setTimeLeft(initialTime);
      setLoading(false);

      if (isVoiceEnabled) {
        startUnifiedSpeech(q, currLevel, lang, name, audio);
      } else {
        setVisibleOptions(['A', 'B', 'C', 'D']);
        setCanStartTimer(true);
      }
      
      // Prefetch the NEXT level
      prefetchNextQuestion(currLevel + 1, lang, name);
    } catch (error) { setLoading(false); }
  };

  useEffect(() => {
    if (status === GameStatus.PLAYING && canStartTimer && timeLeft !== null && timeLeft > 0 && !loading && !isTimeFrozenByReward) {
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

  const handleVoiceCommand = async (intentData: any) => {
    if (!intentData || intentData.intent === 'NONE') return;

    const isHindi = language === Language.HINDI;

    switch (intentData.intent) {
      case 'SELECT_OPTION':
        if (intentData.target && ['A', 'B', 'C', 'D'].includes(intentData.target)) {
          setSelectedOption(intentData.target);
          const response = isHindi 
            ? `आपने विकल्प ${intentData.target} चुना है...` 
            : `You have selected Option ${intentData.target}...`;
          await speakHostResponse(response);
        }
        break;
      case 'LOCK_OPTION':
        const target = intentData.target || selectedOption;
        if (target && ['A', 'B', 'C', 'D'].includes(target)) {
          setSelectedOption(target);
          const response = isHindi 
            ? `तो कंप्यूटर जी, विकल्प ${target} को लॉक किया जाए!` 
            : `Computer ji, please lock Option ${target}!`;
          await speakHostResponse(response);
          setForceLock(true);
        }
        break;
      case 'USE_LIFELINE':
        if (intentData.target && lifelines[intentData.target as keyof LifelinesType]) {
          const response = isHindi 
            ? `आपने लाइफलाइन चुनी है...` 
            : `You have chosen a lifeline...`;
          await speakHostResponse(response);
          useLifeline(intentData.target as keyof LifelinesType);
        }
        break;
      case 'REPEAT_QUESTION':
        if (question) {
          const response = isHindi 
            ? `ज़रूर, मैं सवाल एक बार फिर दोहरा देता हूँ...` 
            : `Sure, let me repeat the question once more...`;
          await speakHostResponse(response);
          startUnifiedSpeech(question, level, language, playerName);
        }
        break;
      case 'QUIT_GAME':
        setShowQuitConfirm(true);
        break;
      default:
        break;
    }
  };

  const handleAnswer = (isCorrect: boolean, isFirstAttemptOfDoubleDip: boolean) => {
    stopSpeech();
    if (isFirstAttemptOfDoubleDip) {
      setSelectedOption(null);
      return;
    }
    clearInterval(timerRef.current);
    if (isCorrect) {
      setTimeout(() => {
        if (level === 5 && !hasDoneSpinWin) {
          setHasDoneSpinWin(true);
          setStatus(GameStatus.SPIN_WIN);
        } else if (level === 15) {
          setStatus(GameStatus.WON);
        } else {
          setLevel(l => l + 1);
          loadQuestion(level + 1, language, playerName);
        }
      }, 2000);
    } else {
      if (isShieldActive) {
        setIsShieldActive(false);
        const shieldText = isHindi 
          ? "घबराइए मत! आपके पास 'सुरक्षा कवच' था, इसलिए आप अब भी खेल में बने हुए हैं। लेकिन याद रहे, यह कवच अब खत्म हो गया है।"
          : "Don't worry! You had a 'Safety Shield', so you're still in the game. But remember, the shield is now exhausted.";
        speakHostResponse(shieldText);
        loadQuestion(level, language, playerName);
      } else {
        setTimeout(() => setStatus(GameStatus.LOST), 1500);
      }
    }
  };

  const handleRewardComplete = (reward: Reward) => {
    setActiveReward(reward);
    setStatus(GameStatus.PLAYING);
    
    // Apply immediate effects
    if (reward.type === 'EXTRA_LIFE') {
      const unusedKeys = (Object.keys(lifelines) as Array<keyof LifelinesType>).filter(k => !lifelines[k]);
      if (unusedKeys.length > 0) {
        const randomKey = unusedKeys[Math.floor(Math.random() * unusedKeys.length)];
        setLifelines(prev => ({ ...prev, [randomKey]: true }));
      }
    } else if (reward.type === 'TIME_FREEZE') {
      setIsTimeFrozenByReward(true);
    } else if (reward.type === 'SHIELD') {
      setIsShieldActive(true);
    }

    setLevel(6);
    loadQuestion(6, language, playerName);
  };

  const useLifeline = (type: keyof LifelinesType) => {
    if (!question || loading) return;
    setLifelines(prev => ({ ...prev, [type]: false }));
    if (type === 'fiftyFifty') {
      const incorrect = Object.keys(question.options).filter(k => k !== question.correctAnswer).sort(() => 0.5 - Math.random());
      setHiddenOptions(incorrect.slice(0, 2));
    } else if (type === 'doubleDip') setIsDoubleDipActive(true);
    else if (type === 'flipQuestion') loadQuestion(level, language, playerName);
    else if (type === 'audiencePoll') {
       const correctKey = question.correctAnswer;
       const data: PollData = { A: 0, B: 0, C: 0, D: 0 };
       let remaining = 100;
       
       // Audience is usually right, but not always 100% sure.
       // Higher levels might have a slightly less certain audience.
       const baseMin = level > 10 ? 45 : 60;
       const correctPercent = Math.floor(Math.random() * 20) + baseMin;
       data[correctKey as keyof PollData] = correctPercent;
       remaining -= correctPercent;
       
       const keys = (['A', 'B', 'C', 'D'] as const).filter(k => k !== correctKey);
       // Distribute remaining randomly among others
       const p1 = Math.floor(Math.random() * (remaining * 0.7));
       data[keys[0]] = p1;
       remaining -= p1;
       
       const p2 = Math.floor(Math.random() * (remaining * 0.8));
       data[keys[1]] = p2;
       remaining -= p2;
       
       data[keys[2]] = remaining;
       
       setPollData(data);
    }
  };

  const handleQuit = () => { stopSpeech(); setStatus(GameStatus.LOST); setShowQuitConfirm(false); };

  const isHindi = language === Language.HINDI;

  if (status === GameStatus.NAME_INPUT) return <NameInput onNameSubmit={(n) => { setPlayerName(n); setStatus(GameStatus.LANGUAGE_SELECT); }} />;
  if (status === GameStatus.LANGUAGE_SELECT) return <LanguageSelection onSelect={(l) => { setLanguage(l); setStatus(GameStatus.DISCLAIMER); }} />;
  if (status === GameStatus.WON || status === GameStatus.LOST) return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black text-gold-text">Loading Result...</div>}>
      <GameOver isWon={status === GameStatus.WON} levelReached={level} language={language} onRestart={() => window.location.reload()} />
    </Suspense>
  );

  if (status === GameStatus.SPIN_WIN) return (
    <Suspense fallback={<div className="min-h-screen kbc-bg flex items-center justify-center font-black italic gold-text text-4xl animate-pulse">BONUS ROUND LOADING...</div>}>
      <SpinAndWin language={language} playerName={playerName} onComplete={handleRewardComplete} />
    </Suspense>
  );

  const currentAmount = MONEY_TREE.find(l => l.id === level)?.amount || "₹0";

  return (
    <div className="min-h-screen kbc-bg flex flex-col md:flex-row relative text-white overflow-hidden">
      <Suspense fallback={<div className="fixed inset-0 z-[500] bg-black flex items-center justify-center">Loading...</div>}>
        {status === GameStatus.DISCLAIMER && <Disclaimer language={language} playerName={playerName} onStart={() => { setStatus(GameStatus.PLAYING); loadQuestion(1, language, playerName); }} />}
      </Suspense>
      
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
            {isSidebarOpen ? <X className="gold-text w-6 h-6" /> : <List className="gold-text w-6 h-6" />}
         </button>
      </div>

      <div className="flex-grow flex flex-col relative min-h-screen z-10">
        <header className="w-full flex justify-between items-center px-4 md:px-8 py-2 md:py-3 bg-black/60 border-b border-[#d4af37]/30 backdrop-blur-md sticky top-0 z-[50]">
          <div className="flex items-center space-x-3">
            <div className="flex flex-col">
              <span className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">{playerName} • LEVEL {level}</span>
              <div className="flex items-center gap-2">
                <span className="gold-text font-black text-lg md:text-2xl leading-none">{currentAmount}</span>
                {(activeReward?.type === 'DOUBLE_MONEY' || activeReward?.type === 'MULTIPLIER') && (
                  <span className="bg-green-600 text-white text-[8px] font-black px-1 rounded animate-pulse">BOOSTED</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 md:space-x-8">
            <button 
              onClick={() => setIsMicActive(!isMicActive)} 
              className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border transition-all ${isMicActive ? 'bg-red-600 text-white border-white animate-pulse' : 'bg-gray-800 text-gray-400 border-gray-700'}`}
              title={isMicActive ? "Microphone ON" : "Microphone OFF"}
            >
              <Power className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <button 
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} 
              className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border transition-all ${isVoiceEnabled ? 'bg-[#d4af37] text-black border-white' : 'bg-gray-800 text-gray-400 border-gray-700'}`}
            >
              {isVoiceEnabled ? <Volume2 className="w-5 h-5 md:w-6 md:h-6" /> : <VolumeX className="w-5 h-5 md:w-6 md:h-6" />}
            </button>
            
            <div className={`relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full border-2 ${isTimeFrozenByReward ? 'border-cyan-400 animate-pulse' : (timeLeft && timeLeft <= 10 ? 'animate-timer-critical border-red-500' : 'animate-timer-pulse border-blue-400')}`}>
               <span className={`text-xl font-black ${isTimeFrozenByReward ? 'text-cyan-200' : (timeLeft && timeLeft <= 10 ? 'text-red-200' : 'text-blue-100')}`}>{isTimeFrozenByReward ? '∞' : (timeLeft ?? '∞')}</span>
            </div>
            
            <button 
              onClick={() => setShowQuitConfirm(true)} 
              className="hidden md:block bg-red-900/60 border border-red-500/60 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase hover:bg-red-600 transition-all"
            >
              QUIT
            </button>
          </div>
        </header>

        <main className="flex-grow flex flex-col items-center justify-start p-1 md:p-6 overflow-y-auto w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center flex-grow space-y-6">
              <div className="w-16 h-16 border-4 border-t-[#d4af37] border-white/10 rounded-full animate-spin"></div>
              <p className="gold-text font-black uppercase tracking-widest animate-pulse">Wait for the Hot Seat...</p>
            </div>
          ) : question ? (
            <div className="w-full flex flex-col items-center space-y-2 md:space-y-4 animate-fade-in max-w-6xl mx-auto">
              <div className="w-full mt-2">
                <Suspense fallback={<div className="h-20"></div>}>
                  <Lifelines lifelines={lifelines} onUse={useLifeline} disabled={loading || isSpeaking || isDoubleDipActive} />
                </Suspense>
              </div>
              <div className="w-full">
                <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-text"></div></div>}>
                  <QuizArea 
                    question={question} 
                    language={language} 
                    hiddenOptions={hiddenOptions} 
                    isDoubleDipActive={isDoubleDipActive} 
                    visibleOptions={visibleOptions} 
                    isSpeaking={isSpeaking}
                    isVoiceLoading={isVoiceLoading}
                    isMicActive={isMicActive}
                    setIsMicActive={setIsMicActive}
                    selectedOption={selectedOption}
                    forceLock={forceLock}
                    activeReward={activeReward}
                    onAnswer={handleAnswer} 
                    onRepeat={() => startUnifiedSpeech(question, level, language, playerName)}
                    onVoiceCommand={handleVoiceCommand}
                  />
                </Suspense>
              </div>
            </div>
          ) : null}
        </main>
      </div>

      <aside className={`fixed md:relative top-0 right-0 h-screen w-72 lg:w-80 transition-transform duration-300 z-[100] md:translate-x-0 ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full md:translate-x-0'}`}>
        <Suspense fallback={<div className="h-full bg-blue-950"></div>}>
          <Sidebar currentLevel={level} activeReward={activeReward} />
        </Suspense>
        {isSidebarOpen && (
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute -left-12 top-24 w-12 h-12 bg-blue-950 rounded-l-full flex items-center justify-center border-l border-y border-[#d4af37] shadow-lg">
            <X className="gold-text w-5 h-5" />
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