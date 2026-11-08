import React from 'react';

interface CrackedLockIconProps {
  variant?: 'icon' | 'badge';
  className?: string;
}

export const CrackedLockIcon: React.FC<CrackedLockIconProps> = ({
  className = ''
}) => {
  return (
    <span
      title="Cracked Pro Problem (Unlocked)"
      className={`inline-flex items-center justify-center text-amber-400 shrink-0 select-none ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-3.5 h-3.5 shrink-0"
        aria-label="Cracked Pro Problem"
      >
        {/* Sprung-open tilted shackle */}
        <path
          d="M7.5 10.5V6.8C7.5 4.3 9.5 2.3 12 2.3C14.1 2.3 15.9 3.7 16.4 5.7L17.2 4.2"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Left broken half of lock body */}
        <path
          d="M6.5 10.5H12.2L10.1 14.8L12.7 16.1L10.3 21.5H6.5C5.4 21.5 4.5 20.6 4.5 19.5V12.5C4.5 11.4 5.4 10.5 6.5 10.5Z"
          fill="currentColor"
          fillOpacity="0.22"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Right broken half of lock body (shifted slightly right/down to emphasize the crack) */}
        <path
          d="M14.7 11.1H17.8C18.9 11.1 19.8 12 19.8 13.1V20.1C19.8 21.2 18.9 22.1 17.8 22.1H12.8L15.2 16.7L12.6 15.4L14.7 11.1Z"
          fill="currentColor"
          fillOpacity="0.22"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
};
