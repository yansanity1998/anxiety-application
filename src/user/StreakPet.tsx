import React from 'react';

// Simple emoji pets for demonstration; replace with SVGs or images as needed
const pets = [
  { streak: 10, emoji: '🐣', label: 'Hatchling Pet (10 Days!)' },
  { streak: 20, emoji: '🐥', label: 'Chick Pet (20 Days!)' },
  { streak: 30, emoji: '🐦', label: 'Bird Pet (30 Days!)' },
  { streak: 50, emoji: '🦄', label: 'Unicorn Pet (50 Days!)' },
  { streak: 60, emoji: '🐉', label: 'Dragon Pet (60 Days!)' },
  { streak: 100, emoji: '🦚', label: 'Legendary Pet (100 Days!)' },
];

// Animation class for each pet milestone
const petAnimations: Record<number, string> = {
  10: 'animate-bounce-slow',    // Hatchling: gentle bounce
  20: 'animate-wiggle',         // Chick: wiggle
  30: 'animate-float',          // Bird: float up and down
  50: 'animate-rotate',         // Unicorn: slow rotate
  60: 'animate-pulse-fast',     // Dragon: pulse
  100: 'animate-shine',         // Legendary: shine effect
};

export interface StreakPetProps {
  streak: number;
  className?: string;
  showLabel?: boolean;
}

export const StreakPet: React.FC<StreakPetProps> = ({ streak, className = '', showLabel = true }) => {
  // Find the highest milestone pet the user has reached
  const pet = [...pets].reverse().find(p => streak >= p.streak);
  if (!pet) return null;
  // Pick the animation for the current pet
  const animationClass = petAnimations[pet.streak] || '';
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <span style={{ fontSize: '2.5rem', lineHeight: 1 }} className={animationClass}>{pet.emoji}</span>
      {showLabel && (
        <span className="text-xs font-semibold mt-1 text-gray-700 bg-white/80 px-2 py-1 rounded-xl shadow">
          {pet.label}
        </span>
      )}
    </div>
  );
};

export default StreakPet; 