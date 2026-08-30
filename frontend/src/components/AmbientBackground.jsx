import React from 'react';

const Leaf = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M3 21 C3 21 1 12 8 5 C15 -2 21 3 21 3 C21 3 23 12 16 19 C9 26 3 21 3 21 Z" />
  </svg>
);

const LeafVariant = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C12 2 12 7 8 11C4 15 2 22 2 22C2 22 9 20 13 16C17 12 22 12 22 12C22 12 17 9 12 2Z" />
  </svg>
);

export default function AmbientBackground() {
  const shapes = [
    { id: 1, Component: Leaf, color: 'text-success', size: 'w-24 h-24', pos: 'top-[5%] left-[5%]', delay: '' },
    { id: 2, Component: LeafVariant, color: 'text-primary', size: 'w-32 h-32', pos: 'top-[15%] right-[8%]', delay: 'delay-1' },
    { id: 3, Component: Leaf, color: 'text-secondary', size: 'w-20 h-20', pos: 'top-[40%] left-[12%]', delay: 'delay-2' },
    { id: 4, Component: LeafVariant, color: 'text-success', size: 'w-28 h-28', pos: 'top-[60%] right-[10%]', delay: 'delay-3' },
    { id: 5, Component: Leaf, color: 'text-primary', size: 'w-24 h-24', pos: 'bottom-[15%] left-[8%]', delay: 'delay-4' },
    { id: 6, Component: LeafVariant, color: 'text-secondary', size: 'w-20 h-20', pos: 'bottom-[8%] right-[15%]', delay: 'delay-5' },
    { id: 7, Component: Leaf, color: 'text-success', size: 'w-16 h-16', pos: 'top-[75%] left-[40%]', delay: 'delay-6' }
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {shapes.map(({ id, Component, color, size, pos, delay }) => (
        <div key={id} className={`absolute ${pos} opacity-[0.14] animate-ambient-float ${delay}`}>
          <Component className={`${size} ${color}`} />
        </div>
      ))}
    </div>
  );
}
