
export enum Language {
  ENGLISH = 'en',
  HINDI = 'hi'
}

export enum GameStatus {
  NAME_INPUT = 'NAME_INPUT',
  LANGUAGE_SELECT = 'LANGUAGE_SELECT',
  DISCLAIMER = 'DISCLAIMER',
  PLAYING = 'PLAYING',
  SPIN_WIN = 'SPIN_WIN',
  WON = 'WON',
  LOST = 'LOST'
}

export type RewardType = 'EXTRA_LIFE' | 'TIME_FREEZE' | 'SHIELD' | 'DOUBLE_MONEY' | 'HINT' | 'MULTIPLIER';

export interface Reward {
  type: RewardType;
  label: string;
  description: string;
  hindiLabel: string;
  hindiDescription: string;
}

export interface Question {
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  hostIntro?: string; // Dramatic intro for this specific question
}

export interface Level {
  id: number;
  amount: string;
  isSafeZone: boolean;
}

export interface Lifelines {
  fiftyFifty: boolean;
  audiencePoll: boolean;
  doubleDip: boolean;
  flipQuestion: boolean;
}

export interface PollData {
  A: number;
  B: number;
  C: number;
  D: number;
}
