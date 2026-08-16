import React, { useEffect, useRef } from 'react';
import heroLandscapeImg from '../../assets/hero-landscape.png';
import '../../styles/components/InteractiveHero.css';

const InteractiveHeroBackground: React.FC = () => {
  const bgRef = useRef<HTMLImageElement>(null);
  const cloud1Ref = useRef<HTMLDivElement>(null);
  const cloud2Ref = useRef<HTMLDivElement>(null);
  const sunbeamRef = useRef<HTMLDivElement>(null);

  // Position state with damping
  const targetX = useRef(0);
  const targetY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate normalized offset from center (-1 to 1)
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;

      targetX.current = x;
      targetY.current = y;
    };

    const handleMouseLeave = () => {
      targetX.current = 0;
      targetY.current = 0;
    };

    // Smooth animation loop using linear interpolation (Lerp)
    const animate = () => {
      // Damping factor (0.05 gives a silky smooth glide)
      currentX.current += (targetX.current - currentX.current) * 0.05;
      currentY.current += (targetY.current - currentY.current) * 0.05;

      const posX = currentX.current;
      const posY = currentY.current;

      // 1. Mountain Base Layer: Moves subtly in opposite direction (deep 3D depth)
      if (bgRef.current) {
        const bgMoveX = posX * -14;
        const bgMoveY = posY * -10;
        bgRef.current.style.transform = `translate3d(${bgMoveX}px, ${bgMoveY}px, 0) scale(1.06)`;
      }

      // 2. Distant Clouds Layer: Moves with medium parallax
      if (cloud1Ref.current) {
        const c1MoveX = posX * 20;
        const c1MoveY = posY * 12;
        cloud1Ref.current.style.transform = `translate3d(${c1MoveX}px, ${c1MoveY}px, 0)`;
      }

      // 3. Valley Mist Layer: Moves faster (foreground depth)
      if (cloud2Ref.current) {
        const c2MoveX = posX * 35;
        const c2MoveY = posY * 18;
        cloud2Ref.current.style.transform = `translate3d(${c2MoveX}px, ${c2MoveY}px, 0)`;
      }

      // 4. Sunbeam Lighting: Shifts with light perspective
      if (sunbeamRef.current) {
        const sunX = posX * -25;
        const sunY = posY * -15;
        sunbeamRef.current.style.transform = `translate3d(${sunX}px, ${sunY}px, 0)`;
      }

      animFrameId.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    animFrameId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, []);

  return (
    <div className="interactive-hero-wrapper">
      {/* 1. Base Mountain Background (Machu Picchu) */}
      <img
        ref={bgRef}
        src={heroLandscapeImg}
        alt="Machu Picchu - Turismo Tunki Chasky"
        className="interactive-hero-bg"
      />

      {/* 2. Ambient Sunbeam Glow */}
      <div ref={sunbeamRef} className="sunbeam-glow" />

      {/* 3. Moving Clouds & Valley Mist (Cinemagraph Layer) */}
      <div className="clouds-container">
        <div ref={cloud1Ref} className="cloud-layer cloud-layer-1" />
        <div ref={cloud2Ref} className="cloud-layer cloud-layer-2" />
      </div>

      {/* 4. Andean Condors Gliding in High Altitude */}
      <div className="condor-glider">
        <svg
          className="condor-svg"
          viewBox="0 0 60 30"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Condor Body & Head */}
          <path
            d="M26 15 C28 13 32 13 34 15 C36 17 38 18 41 18 C43 18 44 16 45 15 C44 14 42 14 40 14 C36 14 33 13 30 11 C27 13 24 14 20 14 C18 14 16 14 15 15 C16 16 17 18 19 18 C22 18 24 17 26 15 Z"
            fill="#1e293b"
          />
          {/* White Collar Neck Accent */}
          <circle cx="38" cy="16" r="1.5" fill="#f8fafc" opacity="0.9" />
          {/* Left Wing */}
          <path
            className="wing-left"
            d="M30 12 C24 7 14 3 2 4 C0 5 1 7 4 8 C12 9 20 12 28 14 Z"
            fill="#0f172a"
          />
          {/* Right Wing */}
          <path
            className="wing-right"
            d="M30 12 C36 7 46 3 58 4 C60 5 59 7 56 8 C48 9 40 12 32 14 Z"
            fill="#0f172a"
          />
        </svg>
      </div>

      {/* Second Condor in Far Distance */}
      <div className="condor-glider-2">
        <svg
          viewBox="0 0 60 30"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M26 15 C28 13 32 13 34 15 C36 17 38 18 41 18 C30 11 20 14 15 15 C22 18 24 17 26 15 Z"
            fill="#334155"
          />
          <path
            d="M30 12 C24 7 14 3 2 4 C12 9 20 12 28 14 Z"
            fill="#1e293b"
          />
          <path
            d="M30 12 C36 7 46 3 58 4 C48 9 40 12 32 14 Z"
            fill="#1e293b"
          />
        </svg>
      </div>

      {/* 5. The Tunki Bird (Gallito de las Rocas - Rupicola peruvianus) */}
      <div className="tunki-flyer">
        <svg
          viewBox="0 0 90 65"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Tunki Sleek Dark Body */}
          <ellipse
            cx="48"
            cy="36"
            rx="18"
            ry="11"
            fill="#0f172a"
            transform="rotate(-8 48 36)"
          />

          {/* Tunki Tail Feathers */}
          <path
            d="M32 37 L14 44 C12 45 11 43 13 41 L29 34 Z"
            fill="#020617"
          />
          <path
            d="M31 39 L12 48 C10 49 9 47 11 45 L28 36 Z"
            fill="#1e293b"
          />

          {/* Bright Orange/Scarlet Rounded Crest (Iconic Gallito de las Rocas) */}
          <path
            d="M56 31 C56 22 64 16 73 18 C79 19 83 24 82 30 C81 35 76 39 68 39 C62 39 57 36 56 31 Z"
            fill="url(#tunkiCrestGradient)"
          />

          {/* Crest Highlights & Feather Texture */}
          <path
            d="M62 20 C68 18 76 20 78 25 C74 23 68 23 62 26 Z"
            fill="#ff7849"
          />
          <path
            d="M68 18 C74 19 80 23 81 28 C78 25 73 24 67 24 Z"
            fill="#ffc09f"
            opacity="0.8"
          />

          {/* Small Yellow Beak emerging from crest */}
          <path
            d="M81 30 L88 32 L81 35 Z"
            fill="#facc15"
          />

          {/* Eye */}
          <circle cx="73" cy="27" r="1.8" fill="#450a0a" />
          <circle cx="73.5" cy="26.5" r="0.6" fill="#ffffff" />

          {/* Tunki Wings (Flapping Animated Group) */}
          {/* Top Wing */}
          <g className="tunki-wing-top">
            {/* Upper Wing Coverts (Grey & Silver Andean Feathering) */}
            <path
              d="M44 32 C38 18 42 6 54 2 C58 8 56 20 48 30 Z"
              fill="#94a3b8"
            />
            {/* Primary Black Flight Feathers */}
            <path
              d="M42 30 C34 14 36 2 48 0 C50 6 48 18 43 28 Z"
              fill="#0f172a"
            />
            {/* Wing Highlight Tip */}
            <path
              d="M48 0 C51 3 53 8 50 14 C48 8 46 4 48 0 Z"
              fill="#cbd5e1"
            />
          </g>

          {/* Bottom Secondary Wing */}
          <g className="tunki-wing-bottom">
            <path
              d="M46 38 C40 48 42 58 52 62 C55 56 54 46 49 38 Z"
              fill="#1e293b"
            />
            <path
              d="M44 37 C38 46 39 55 48 59 C50 54 49 45 46 37 Z"
              fill="#334155"
            />
          </g>

          {/* Gradients */}
          <defs>
            <linearGradient
              id="tunkiCrestGradient"
              x1="56"
              y1="16"
              x2="83"
              y2="39"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#ff4500" />
              <stop offset="50%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 6. Contrast & Readability Gradient Overlay */}
      <div className="interactive-hero-overlay" />
    </div>
  );
};

export default InteractiveHeroBackground;
