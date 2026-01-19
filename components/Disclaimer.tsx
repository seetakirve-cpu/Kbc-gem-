
import React from 'react';
import { Language } from '../types';

interface Props {
  language: Language;
  onStart: () => void;
}

const Disclaimer: React.FC<Props> = ({ language, onStart }) => {
  const isHindi = language === Language.HINDI;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 p-4">
      <div className="bg-[#001a33] p-8 rounded-xl gold-border max-w-lg w-full text-center space-y-6">
        <h2 className="text-3xl font-bold gold-text">
          {isHindi ? 'अस्वीकरण' : 'Disclaimer'}
        </h2>
        <p className="text-lg text-gray-200">
          {isHindi 
            ? 'यह केवल एक खेल है। जीते गए अंक/पैसे आभासी हैं और केवल मनोरंजन के लिए हैं।' 
            : 'This is just a game. Points/Money won are virtual and for entertainment only.'}
        </p>
        <button 
          onClick={onStart}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-10 rounded-full text-xl shadow-lg transition-transform active:scale-95"
        >
          {isHindi ? 'खेल शुरू करें' : 'Start Game'}
        </button>
      </div>
    </div>
  );
};

export default Disclaimer;
