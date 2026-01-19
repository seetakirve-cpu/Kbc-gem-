
import { Level } from './types';

export const MONEY_TREE: Level[] = [
  { id: 15, amount: "₹7 Crore", isSafeZone: true },
  { id: 14, amount: "₹5 Crore", isSafeZone: false },
  { id: 13, amount: "₹3 Crore", isSafeZone: true },
  { id: 12, amount: "₹1 Crore", isSafeZone: false },
  { id: 11, amount: "₹50,00,000", isSafeZone: false },
  { id: 10, amount: "₹25,00,000", isSafeZone: true },
  { id: 9, amount: "₹12,50,000", isSafeZone: false },
  { id: 8, amount: "₹6,40,000", isSafeZone: false },
  { id: 7, amount: "₹3,20,000", isSafeZone: false },
  { id: 6, amount: "₹1,60,000", isSafeZone: false },
  { id: 5, amount: "₹80,000", isSafeZone: true },
  { id: 4, amount: "₹40,000", isSafeZone: false },
  { id: 3, amount: "₹20,000", isSafeZone: false },
  { id: 2, amount: "₹10,000", isSafeZone: false },
  { id: 1, amount: "₹5,000", isSafeZone: false },
].sort((a, b) => b.id - a.id);

export const getTimerForLevel = (level: number): number | null => {
  // Q1 to Q5: 45-second timer.
  if (level <= 5) return 45;
  // Q6 to Q10: 60-second timer.
  if (level <= 10) return 60;
  // Q11 to Q15: No timer (unlimited time).
  return null;
};
