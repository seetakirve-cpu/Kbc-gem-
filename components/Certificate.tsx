
import React, { useState } from 'react';
import { User, Award } from 'lucide-react';
import { Language } from '../types';

interface Props {
  language: Language;
  amount: string;
}

const Certificate: React.FC<Props> = ({ language, amount }) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const isHindi = language === Language.HINDI;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-4xl mx-auto p-4 animate-scale-in">
      <div id="certificate-canvas" className="relative w-full aspect-[1.414/1] bg-[#f9f5e8] border-[12px] border-double border-[#b38728] shadow-2xl p-8 flex flex-col items-center text-[#1a1a1a] overflow-hidden">
        {/* Decorative Corner Borders */}
        <div className="absolute top-0 left-0 w-32 h-32 border-t-8 border-l-8 border-[#d4af37]"></div>
        <div className="absolute top-0 right-0 w-32 h-32 border-t-8 border-r-8 border-[#d4af37]"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 border-b-8 border-l-8 border-[#d4af37]"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 border-b-8 border-r-8 border-[#d4af37]"></div>

        {/* Certificate Header */}
        <div className="mt-8 text-center space-y-2">
          <h1 className="text-4xl md:text-6xl font-serif font-black uppercase tracking-widest text-[#8a6d3b]">
            {isHindi ? 'विजेता प्रमाण-पत्र' : 'Certificate of Excellence'}
          </h1>
          <div className="h-1 w-64 bg-[#b38728] mx-auto"></div>
        </div>

        {/* User Photo Area */}
        <div className="mt-8 flex flex-col items-center">
          <div className="relative w-32 h-32 md:w-48 md:h-48 border-4 border-[#b38728] bg-white shadow-inner flex items-center justify-center overflow-hidden">
            {photo ? (
              <img src={photo} alt="Winner" className="w-full h-full object-cover" />
            ) : (
              <div className="text-gray-300 flex flex-col items-center">
                <User className="w-12 h-12 md:w-16 md:h-16 mb-2" />
                <span className="text-[10px] md:text-xs">{isHindi ? 'फोटो अपलोड करें' : 'Upload Photo'}</span>
              </div>
            )}
            {!photo && (
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            )}
          </div>
          {photo && (
            <button 
              onClick={() => setPhoto(null)} 
              className="mt-2 text-xs text-red-600 font-bold uppercase hover:underline"
            >
              {isHindi ? 'फोटो बदलें' : 'Change Photo'}
            </button>
          )}
        </div>

        {/* Main Text */}
        <div className="mt-8 text-center space-y-4 max-w-2xl">
          <p className="text-xl md:text-2xl font-medium italic">
            {isHindi ? 'गर्व के साथ घोषित किया जाता है कि' : 'This is to proudly certify that'}
          </p>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#b38728] border-b-2 border-dashed border-[#b38728] px-8 pb-1">
            {isHindi ? 'क्रोड़पति विजेता' : 'Crorepati Winner'}
          </h2>
          <p className="text-lg md:text-xl font-medium leading-relaxed">
            {isHindi 
              ? `ने कौन बनेगा करोड़पति क्विज प्रो में असाधारण ज्ञान का प्रदर्शन करते हुए ₹7 करोड़ की राशि जीती है।`
              : `has demonstrated exceptional knowledge in Crorepati Quiz Pro and has won the grand prize of ₹7 Crore.`}
          </p>
        </div>

        {/* Bottom Section */}
        <div className="mt-auto w-full flex justify-between items-end px-10 pb-8">
          <div className="text-center">
            <div className="w-40 border-b border-black mb-1"></div>
            <p className="text-xs font-bold uppercase">{isHindi ? 'क्विज मास्टर' : 'Quiz Master'}</p>
          </div>
          <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
             <div className="absolute inset-0 bg-[#d4af37] rounded-full opacity-10 animate-pulse"></div>
             <Award className="w-16 h-16 md:w-20 md:h-20 text-[#d4af37]" />
             <div className="absolute inset-0 border-4 border-[#d4af37] rounded-full scale-110"></div>
          </div>
          <div className="text-center">
            <div className="w-40 border-b border-black mb-1"></div>
            <p className="text-xs font-bold uppercase">{isHindi ? 'दिनांक' : 'Date'}</p>
            <p className="text-xs">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* CRITICAL DISCLAIMER */}
        <div className="absolute -bottom-1 w-full bg-red-600 text-white text-[9px] md:text-[11px] font-black uppercase tracking-widest py-1 text-center">
          {isHindi 
            ? 'अस्वीकरण: यह केवल मनोरंजन के लिए एक खेल है। यह प्रमाण-पत्र और जीती गई राशि पूरी तरह से काल्पनिक (VIRTUAL) हैं।'
            : 'DISCLAIMER: THIS IS A GAME FOR ENTERTAINMENT ONLY. THIS CERTIFICATE AND THE PRIZE MONEY ARE COMPLETELY VIRTUAL.'}
        </div>
      </div>

      <p className="text-yellow-200/60 text-sm italic text-center max-w-xl">
        {isHindi 
          ? '* यह एक नकली सर्टिफिकेट है। ऊपर दी गई फोटो आपकी डिवाइस पर ही रहती है।' 
          : '* This is a duplicate certificate for fun. Photos uploaded stay on your device only.'}
      </p>
    </div>
  );
};

export default Certificate;
