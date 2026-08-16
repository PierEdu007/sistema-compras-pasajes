import React from 'react';
import '../../styles/components/InteractiveHero.css';

const HeroForegroundBirds: React.FC = () => {
  return (
    <div className="hero-foreground-birds">
      {/* 1. Andean Condor Gliding in Foreground High Above Text */}
      <div className="condor-glider-fg">
        <svg
          viewBox="0 0 70 35"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Condor Body */}
          <path
            d="M30 18 C33 15 38 15 41 18 C43 20 46 21 50 21 C53 21 54 18 55 17 C54 16 51 16 48 16 C43 16 39 15 35 13 C31 15 28 16 23 16 C20 16 18 16 17 17 C18 18 20 21 23 21 C26 21 28 20 30 18 Z"
            fill="#0f172a"
          />
          {/* White Neck Collar Accent */}
          <circle cx="47" cy="19" r="2" fill="#ffffff" opacity="0.95" />
          {/* Left Large Wing */}
          <path
            className="condor-wing-l"
            d="M35 14 C27 8 16 3 2 4 C0 5 1 8 5 9 C14 11 23 14 33 17 Z"
            fill="#020617"
          />
          {/* Right Large Wing */}
          <path
            className="condor-wing-r"
            d="M35 14 C43 8 54 3 68 4 C70 5 69 8 65 9 C56 11 47 14 37 17 Z"
            fill="#020617"
          />
        </svg>
      </div>

      {/* 2. Second Condor in Upper Sky */}
      <div className="condor-glider-fg-2">
        <svg
          viewBox="0 0 60 30"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M26 15 C28 13 32 13 34 15 C36 17 38 18 41 18 C30 11 20 14 15 15 C22 18 24 17 26 15 Z"
            fill="#1e293b"
          />
          <path
            d="M30 12 C24 7 14 3 2 4 C12 9 20 12 28 14 Z"
            fill="#0f172a"
          />
          <path
            d="M30 12 C36 7 46 3 58 4 C48 9 40 12 32 14 Z"
            fill="#0f172a"
          />
        </svg>
      </div>

      {/* 3. THE TUNKI BIRD (Gallito de las Rocas) - Flies Directly in Front of the Hero Title */}
      <div className="tunki-flyer-fg">
        <svg
          viewBox="0 0 95 70"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Tunki Sleek Dark Body */}
          <ellipse
            cx="50"
            cy="38"
            rx="20"
            ry="12"
            fill="#090d16"
            transform="rotate(-8 50 38)"
          />

          {/* Tunki Tail Feathers */}
          <path
            d="M32 40 L12 48 C10 49 9 47 11 45 L29 36 Z"
            fill="#020617"
          />
          <path
            d="M31 42 L10 52 C8 53 7 51 9 49 L28 38 Z"
            fill="#1e293b"
          />

          {/* Iconic Bright Orange/Scarlet Rounded Crest (High Definition) */}
          <path
            d="M58 33 C58 23 67 16 77 18 C83 20 88 25 87 32 C86 37 81 42 72 42 C65 42 59 38 58 33 Z"
            fill="url(#tunkiFgCrestGradient)"
          />

          {/* Crest Texture Highlights */}
          <path
            d="M65 22 C72 20 80 22 82 27 C78 25 72 25 65 28 Z"
            fill="#ff7849"
          />
          <path
            d="M72 20 C78 21 84 25 85 30 C82 27 77 26 71 26 Z"
            fill="#fed7aa"
            opacity="0.85"
          />

          {/* Golden Beak */}
          <path
            d="M86 32 L94 35 L86 38 Z"
            fill="#fbbf24"
          />

          {/* Eye */}
          <circle cx="77" cy="29" r="2.2" fill="#450a0a" />
          <circle cx="77.6" cy="28.4" r="0.8" fill="#ffffff" />

          {/* Upper Flapping Wing */}
          <g className="tunki-wing-upper">
            {/* Grey & Silver Andean Scapulars */}
            <path
              d="M46 34 C40 19 44 6 57 2 C61 8 59 21 51 32 Z"
              fill="#94a3b8"
            />
            {/* Primary Jet Black Flight Feathers */}
            <path
              d="M44 32 C35 15 37 2 50 0 C53 6 51 19 45 30 Z"
              fill="#020617"
            />
            {/* Wing Feather Highlight Tip */}
            <path
              d="M50 0 C54 3 56 9 53 15 C51 9 48 4 50 0 Z"
              fill="#e2e8f0"
            />
          </g>

          {/* Lower Flapping Wing */}
          <g className="tunki-wing-lower">
            <path
              d="M48 41 C42 52 44 63 55 67 C58 60 57 49 52 41 Z"
              fill="#0f172a"
            />
            <path
              d="M46 40 C39 50 41 60 51 64 C53 58 52 48 49 40 Z"
              fill="#334155"
            />
          </g>

          {/* Gradient Definitions */}
          <defs>
            <linearGradient
              id="tunkiFgCrestGradient"
              x1="58"
              y1="16"
              x2="88"
              y2="42"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#ff3b00" />
              <stop offset="50%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

export default HeroForegroundBirds;
