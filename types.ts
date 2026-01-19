
export enum Language {
  ENGLISH = 'en',
  HINDI = 'hi'
}

export enum GameStatus {
  NAME_INPUT = 'NAME_INPUT',
  LANGUAGE_SELECT = 'LANGUAGE_SELECT',
  DISCLAIMER = 'DISCLAIMER',
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOST = 'LOST'
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
