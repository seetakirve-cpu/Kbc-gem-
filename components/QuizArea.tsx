import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Loader2, RotateCcw } from 'lucide-react';
import { Question, Language, Reward } from '../types.ts';
import { recognizeVoiceCommand } from '../services/gemini.ts';
import { Gift, Zap, Shield, Repeat, Coins, Lightbulb } from 'lucide-react';

interface Props {
  question: Question;
  language: Language;
  hiddenOptions: string[];
  isDoubleDipActive: boolean;
  visibleOptions: string[];
  isSpeaking: boolean;
  isVoiceLoading: boolean;
  isMicActive: boolean;
  setIsMicActive: (active: boolean) => void;
  selectedOption: string | null;
  forceLock: boolean;
  activeReward: Reward | null;
  onAnswer: (correct: boolean, isFirstAttemptOfDoubleDip: boolean) => void;
  onRepeat: () => void;
  onVoiceCommand: (intentData: any) => void;
}

const QuizArea: React.FC<Props> = ({ 
  question, language, hiddenOptions, isDoubleDipActive, visibleOptions, isSpeaking, isVoiceLoading, isMicActive, setIsMicActive, selectedOption, forceLock, activeReward, onAnswer, onRepeat, onVoiceCommand 
}) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [failedOptions, setFailedOptions] = useState<string[]>([]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  useEffect(() => {
    setSelected(null);
    setLocked(false);
    setShowResult(false);
    setFailedOptions([]);
  }, [question]);

  useEffect(() => {
    if (selectedOption && !locked && !showResult) {
      setSelected(selectedOption);
    }
  }, [selectedOption, locked, showResult]);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language === Language.HINDI ? 'hi-IN' : 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        processTranscript(transcript.toLowerCase());
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setIsMicActive(false); // User denied permission
        }
      };

      recognitionRef.current.onend = () => {
        if (isListeningRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {}
        } else {
          setIsRecording(false);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]);

  const handleOptionClick = (key: string) => {
    if (!locked && !showResult && !hiddenOptions.includes(key) && !failedOptions.includes(key)) {
      setSelected(key);
    }
  };

  const lockAnswer = (key?: string) => {
    const target = key || selected;
    if (!target || locked || showResult) return;
    
    setSelected(target);
    setLocked(true);
    
    setTimeout(() => {
      const isCorrect = target === question.correctAnswer;
      setShowResult(true);
      
      if (isCorrect) {
        setTimeout(() => onAnswer(true, false), 2500);
      } else {
        if (isDoubleDipActive && failedOptions.length === 0) {
          setTimeout(() => {
            setFailedOptions(prev => [...prev, target]);
            setSelected(null);
            setLocked(false);
            setShowResult(false);
            onAnswer(false, true);
          }, 1500);
        } else {
          setTimeout(() => onAnswer(false, false), 3500);
        }
      }
    }, 2000);
  };

  const processTranscript = (text: string) => {
    // Option selection
    // Matches "Option A", "A", "विकल्प ए", etc.
    const optionMatch = text.match(/\b(option|विकल्प|जवाब|answer|select|चुना)\s*([a-d])\b/i) || 
                        text.match(/\b([a-d])\b/i);
    
    if (optionMatch && !locked && !showResult) {
      const key = optionMatch[optionMatch.length - 1].toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key) && !hiddenOptions.includes(key) && !failedOptions.includes(key)) {
        handleOptionClick(key);
      }
    }

    // Locking
    if (text.includes('lock') || text.includes('लॉक') || text.includes('फाइनल') || text.includes('final') || text.includes('confirm')) {
      if (selected && !locked && !showResult) {
        lockAnswer();
      }
    }

    // Lifelines
    if (text.includes('audience') || text.includes('ऑडियंस') || text.includes('पोल')) onVoiceCommand({ intent: 'USE_LIFELINE', target: 'audiencePoll' });
    if (text.includes('50') || text.includes('fifty') || text.includes('फिफ्टी')) onVoiceCommand({ intent: 'USE_LIFELINE', target: 'fiftyFifty' });
    if (text.includes('double') || text.includes('डबल')) onVoiceCommand({ intent: 'USE_LIFELINE', target: 'doubleDip' });
    if (text.includes('flip') || text.includes('फ्लिप')) onVoiceCommand({ intent: 'USE_LIFELINE', target: 'flipQuestion' });
    
    // Repeat
    if (text.includes('repeat') || text.includes('दोहराओ') || text.includes('फिर से') || text.includes('again')) onRepeat();
  };

  useEffect(() => {
    if (isMicActive && !isSpeaking && !locked && !showResult && !isRecording) {
      startRecording();
    } else if ((!isMicActive || isSpeaking || locked || showResult) && isRecording) {
      stopRecording();
    }
  }, [isMicActive, isSpeaking, locked, showResult, isRecording]);

  useEffect(() => {
    if (selectedOption && !locked && !showResult) {
      setSelected(selectedOption);
    }
  }, [selectedOption, locked, showResult]);

  useEffect(() => {
    if (forceLock && !locked && !showResult) {
      lockAnswer();
    }
  }, [forceLock, locked, showResult]);

  const startRecording = () => {
    if (!recognitionRef.current || isRecording) return;
    try {
      isListeningRef.current = true;
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recognition:', err);
    }
  };

  const stopRecording = () => {
    if (!recognitionRef.current || !isRecording) return;
    isListeningRef.current = false;
    recognitionRef.current.stop();
    setIsRecording(false);
  };

  const getOptionClass = (key: string) => {
    if (hiddenOptions.includes(key)) return 'opacity-0 pointer-events-none';
    if (failedOptions.includes(key)) return 'opacity-40 grayscale bg-red-950/20';
    if (showResult) {
      if (key === question.correctAnswer) return 'option-correct scale-105 z-10';
      if (key === selected) return 'option-wrong';
      return 'opacity-20 grayscale blur-[1px]';
    }
    if (selected === key) return locked ? 'option-selected animate-pulse scale-105' : 'option-selected';
    return 'hover:bg-blue-900/40 border-[#d4af37]/40';
  };

  const isHindi = language === Language.HINDI;

  return (
    <div className="flex flex-col items-center justify-center p-2 md:p-4 space-y-4 w-full max-w-5xl mx-auto">
      
      <div className={`transition-all duration-500 overflow-hidden ${isVoiceLoading ? 'h-16 opacity-100 mb-2' : 'h-0 opacity-0 mb-0'}`}>
        <div className="bg-gradient-to-r from-blue-900/90 via-black to-blue-900/90 border-2 border-[#d4af37] px-6 py-3 rounded-2xl backdrop-blur-xl flex flex-col items-center shadow-[0_0_40px_rgba(212,175,55,0.4)]">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
            <span className="gold-text text-sm md:text-lg font-black uppercase tracking-wider italic text-center animate-pulse">
              {isHindi ? 'व्हॉइस जनरेट होने मे सवाल पडणे मे वक्त लग रहा है...' : 'Voice is generating, reading will start shortly...'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center mb-1 animate-fade-in">
        <div className={`relative w-16 h-16 md:w-28 md:h-28 rounded-full border-4 overflow-hidden transition-all duration-300 ${isSpeaking ? 'animate-speaking border-white scale-110 shadow-[0_0_30px_rgba(255,255,255,0.4)]' : 'border-[#d4af37]'}`}>
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Host&skinColor=ae5d29&topType=shortHair&hairColor=70b2d9&facialHairType=beardLight" alt="Host" className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="w-full p-4 md:p-10 bg-black/80 border-2 border-[#d4af37] rounded-3xl text-center shadow-2xl relative overflow-hidden group">
        {isDoubleDipActive && (
          <div className="absolute top-1 right-2 bg-orange-600 text-white text-[8px] md:text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse z-20 border border-white/20">
            DOUBLE DIP ACTIVE
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        
        {activeReward && (
          <div className="flex items-center justify-center gap-2 mb-4 animate-bounce">
            <div className="bg-gold/20 px-3 py-1 rounded-full border border-gold/40 flex items-center gap-2">
              <span className="gold-text uppercase text-[10px] font-black tracking-widest italic flex items-center gap-2">
                {activeReward.type === 'SHIELD' && <Shield className="w-3 h-3" />}
                {activeReward.type === 'TIME_FREEZE' && <Zap className="w-3 h-3" />}
                {activeReward.type === 'HINT' && <Lightbulb className="w-3 h-3" />}
                {activeReward.type === 'EXTRA_LIFE' && <Repeat className="w-3 h-3" />}
                {activeReward.type === 'DOUBLE_MONEY' && <Coins className="w-3 h-3" />}
                {activeReward.type === 'MULTIPLIER' && <Gift className="w-3 h-3" />}
                {isHindi ? activeReward.hindiLabel : activeReward.label} Active
              </span>
            </div>
          </div>
        )}

        <h2 className="text-lg md:text-3xl lg:text-4xl font-bold text-white leading-tight md:leading-relaxed drop-shadow-lg">{question.text}</h2>
      </div>

      <div className="flex items-center justify-center space-x-8 md:space-x-12 mt-1 md:mt-2">
        <div className="relative">
          <button 
            onClick={isRecording ? stopRecording : startRecording} 
            disabled={locked || showResult || isSpeaking} 
            className={`w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full border-2 transition-all ${
              isSpeaking ? 'opacity-20 grayscale border-gray-600' :
              isRecording ? 'bg-red-500 animate-mic-pulse border-white' : 'bg-black/60 border-[#d4af37]/60 hover:scale-110'
            }`}
          >
            {isTranscribing ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 text-white animate-spin" /> : isRecording ? <Square className="w-5 h-5 md:w-6 md:h-6 text-white" /> : <Mic className="w-5 h-5 md:w-6 md:h-6 text-white" />}
          </button>
          {isMicActive && !isRecording && !isTranscribing && !isSpeaking && !locked && !showResult && (
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] md:text-[10px] gold-text font-bold animate-pulse">
              LISTENING...
            </div>
          )}
        </div>
        <button 
          onClick={onRepeat} 
          disabled={locked || showResult || isSpeaking} 
          className={`w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full border-2 transition-all ${
            isSpeaking ? 'opacity-20 grayscale border-gray-600' : 'border-[#d4af37]/60 bg-black/60 hover:scale-110'
          }`}
        >
          <RotateCcw className="w-5 h-5 md:w-6 md:h-6 gold-text" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-6 w-full max-w-4xl mt-1 md:mt-4">
        {Object.entries(question.options).map(([key, value]) => (
          <button
            key={key}
            onClick={() => handleOptionClick(key)}
            disabled={locked || showResult || !visibleOptions.includes(key)}
            className={`option-button flex items-center px-4 py-1.5 md:px-6 md:py-4 text-white text-base md:text-xl font-bold transition-all duration-500 ${!visibleOptions.includes(key) ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'} ${getOptionClass(key)}`}
          >
            <span className="mr-4 md:mr-6 gold-text text-xl md:text-2xl drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]">{key}:</span>
            <span className="text-left leading-tight text-xs md:text-xl">{value}</span>
          </button>
        ))}
      </div>

      <div className="h-16 md:h-20 flex items-center justify-center mt-1 md:mt-2">
        {selected && !locked && !showResult && (
          <button onClick={() => lockAnswer()} className="bg-gradient-to-r from-orange-600 to-orange-400 text-white font-black py-2 px-10 md:py-3 md:px-16 rounded-full text-xl md:text-2xl shadow-2xl animate-bounce uppercase tracking-widest border border-white/20">
            {isHindi ? 'लॉक करें!' : 'Lock It!'}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizArea;