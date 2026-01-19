import React, { useState, useEffect, useRef } from 'react';
import { Question, Language } from '../types.ts';
import { recognizeVoiceCommand } from '../services/gemini.ts';

interface Props {
  question: Question;
  language: Language;
  hiddenOptions: string[];
  isDoubleDipActive: boolean;
  visibleOptions: string[];
  isSpeaking: boolean;
  isVoiceLoading: boolean;
  onAnswer: (correct: boolean, isFirstAttemptOfDoubleDip) => void;
  onRepeat: () => void;
  onVoiceCommand: (intentData: any) => void;
}

const QuizArea: React.FC<Props> = ({ 
  question, language, hiddenOptions, isDoubleDipActive, visibleOptions, isSpeaking, isVoiceLoading, onAnswer, onRepeat, onVoiceCommand 
}) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [failedOptions, setFailedOptions] = useState<string[]>([]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setSelected(null);
    setLocked(false);
    setShowResult(false);
    setFailedOptions([]);
  }, [question]);

  const handleOptionClick = (key: string) => {
    if (!locked && !showResult && !hiddenOptions.includes(key) && !failedOptions.includes(key)) {
      setSelected(key);
    }
  };

  const lockAnswer = (key?: string) => {
    const target = key || selected;
    if (!target) return;
    
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

  const startRecording = async () => {
    if (locked || showResult || isRecording || isTranscribing) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => e.data.size > 0 && audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64String = (reader.result as string).split(',')[1];
          if (!base64String) return;
          setIsTranscribing(true);
          const command = await recognizeVoiceCommand(base64String, 'audio/webm', language);
          setIsTranscribing(false);
          if (command && command.intent !== 'NONE') {
            if (command.intent === 'SELECT_OPTION') setSelected(command.target);
            if (command.intent === 'LOCK_OPTION') lockAnswer(command.target);
            onVoiceCommand(command);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      setTimeout(() => stopRecording(), 3000);
    } catch (err) { console.error(err); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
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
        <div className={`relative w-20 h-20 md:w-28 md:h-28 rounded-full border-4 overflow-hidden transition-all duration-300 ${isSpeaking ? 'animate-speaking border-white scale-110 shadow-[0_0_30px_rgba(255,255,255,0.4)]' : 'border-[#d4af37]'}`}>
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Host&skinColor=ae5d29&topType=shortHair&hairColor=70b2d9&facialHairType=beardLight" alt="Host" className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="w-full p-6 md:p-10 bg-black/80 border-2 border-[#d4af37] rounded-3xl text-center shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-white leading-relaxed drop-shadow-lg">{question.text}</h2>
      </div>

      <div className="flex items-center justify-center space-x-12 mt-2">
        <button 
          onClick={isRecording ? stopRecording : startRecording} 
          disabled={locked || showResult || isSpeaking} 
          className={`w-14 h-14 flex items-center justify-center rounded-full border-2 transition-all ${
            isSpeaking ? 'opacity-20 grayscale border-gray-600' :
            isRecording ? 'bg-red-500 animate-mic-pulse border-white' : 'bg-black/60 border-[#d4af37]/60 hover:scale-110'
          }`}
        >
          <i className={`fas ${isTranscribing ? 'fa-circle-notch fa-spin' : isRecording ? 'fa-stop' : 'fa-microphone'} text-white`}></i>
        </button>
        <button 
          onClick={onRepeat} 
          disabled={locked || showResult || isSpeaking} 
          className={`w-14 h-14 flex items-center justify-center rounded-full border-2 transition-all ${
            isSpeaking ? 'opacity-20 grayscale border-gray-600' : 'border-[#d4af37]/60 bg-black/60 hover:scale-110'
          }`}
        >
          <i className="fas fa-redo gold-text"></i>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full max-w-4xl mt-4">
        {Object.entries(question.options).map(([key, value]) => (
          <button
            key={key}
            onClick={() => handleOptionClick(key)}
            disabled={locked || showResult || !visibleOptions.includes(key)}
            className={`option-button flex items-center px-6 py-4 text-white text-lg md:text-xl font-bold transition-all duration-500 ${!visibleOptions.includes(key) ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'} ${getOptionClass(key)}`}
          >
            <span className="mr-6 gold-text text-2xl drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]">{key}:</span>
            <span className="text-left leading-tight">{value}</span>
          </button>
        ))}
      </div>

      <div className="h-20 flex items-center justify-center mt-2">
        {selected && !locked && !showResult && (
          <button onClick={() => lockAnswer()} className="bg-gradient-to-r from-orange-600 to-orange-400 text-white font-black py-3 px-16 rounded-full text-2xl shadow-2xl animate-bounce uppercase tracking-widest border border-white/20">
            {isHindi ? 'लॉक करें!' : 'Lock It!'}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizArea;