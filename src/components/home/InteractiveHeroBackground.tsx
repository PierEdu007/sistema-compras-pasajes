import React, { useEffect, useRef } from 'react';
import heroLandscapeImg from '../../assets/hero-landscape.png';
import '../../styles/components/InteractiveHero.css';

const InteractiveHeroBackground: React.FC = () => {
  const bgRef = useRef<HTMLImageElement>(null);
  const cloud1Ref = useRef<HTMLDivElement>(null);
  const cloud2Ref = useRef<HTMLDivElement>(null);
  const sunbeamRef = useRef<HTMLDivElement>(null);

  // Smooth position state with linear interpolation (Lerp)
  const targetX = useRef(0);
  const targetY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;

      targetX.current = x;
      targetY.current = y;
    };

    const handleMouseLeave = () => {
      targetX.current = 0;
      targetY.current = 0;
    };

    const animate = () => {
      currentX.current += (targetX.current - currentX.current) * 0.05;
      currentY.current += (targetY.current - currentY.current) * 0.05;

      const posX = currentX.current;
      const posY = currentY.current;

      // 1. Mountain Base Layer: Moves subtly (no edge gap because image is 120% wide)
      if (bgRef.current) {
        const bgMoveX = posX * -22;
        const bgMoveY = posY * -15;
        bgRef.current.style.transform = `translate3d(${bgMoveX}px, ${bgMoveY}px, 0) scale(1.06)`;
      }

      // 2. High Clouds: Medium parallax
      if (cloud1Ref.current) {
        const c1MoveX = posX * 30;
        const c1MoveY = posY * 16;
        cloud1Ref.current.style.transform = `translate3d(${c1MoveX}px, ${c1MoveY}px, 0)`;
      }

      // 3. Valley Fog: Faster parallax
      if (cloud2Ref.current) {
        const c2MoveX = posX * 48;
        const c2MoveY = posY * 24;
        cloud2Ref.current.style.transform = `translate3d(${c2MoveX}px, ${c2MoveY}px, 0)`;
      }

      // 4. Sunbeam Lighting
      if (sunbeamRef.current) {
        const sunX = posX * -35;
        const sunY = posY * -20;
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
      {/* 1. Base Mountain Background (Machu Picchu) - 120% size to eliminate white side gaps */}
      <img
        ref={bgRef}
        src={heroLandscapeImg}
        alt="Machu Picchu - Turismo Tunki Chasky"
        className="interactive-hero-bg"
      />

      {/* 2. Golden Andean Sunbeam Glow */}
      <div ref={sunbeamRef} className="sunbeam-glow" />

      {/* 3. Clearly Visible Moving Clouds & Andean Mist Layers */}
      <div className="clouds-container">
        {/* Upper Drifting Clouds (Track 1) */}
        <div ref={cloud1Ref} className="cloud-track-1">
          <svg className="cloud-svg-block" viewBox="0 0 1200 220" preserveAspectRatio="none" fill="none">
            <path
              d="M0,160 Q120,80 260,110 Q400,60 520,100 Q650,40 800,85 Q940,30 1080,80 Q1180,50 1200,120 L1200,220 L0,220 Z"
              fill="rgba(255, 255, 255, 0.22)"
            />
            <path
              d="M0,180 Q160,100 320,130 Q480,90 640,120 Q800,80 960,110 Q1120,70 1200,140 L1200,220 L0,220 Z"
              fill="rgba(255, 255, 255, 0.16)"
            />
          </svg>
          <svg className="cloud-svg-block" viewBox="0 0 1200 220" preserveAspectRatio="none" fill="none">
            <path
              d="M0,160 Q120,80 260,110 Q400,60 520,100 Q650,40 800,85 Q940,30 1080,80 Q1180,50 1200,120 L1200,220 L0,220 Z"
              fill="rgba(255, 255, 255, 0.22)"
            />
            <path
              d="M0,180 Q160,100 320,130 Q480,90 640,120 Q800,80 960,110 Q1120,70 1200,140 L1200,220 L0,220 Z"
              fill="rgba(255, 255, 255, 0.16)"
            />
          </svg>
        </div>

        {/* Mid-mountain Mist Layer (Track 2) */}
        <div ref={cloud2Ref} className="cloud-track-2">
          <svg className="cloud-svg-block" viewBox="0 0 1200 180" preserveAspectRatio="none" fill="none">
            <path
              d="M0,120 Q180,40 360,80 Q540,30 720,70 Q900,40 1080,75 L1200,110 L1200,180 L0,180 Z"
              fill="rgba(255, 255, 255, 0.18)"
            />
          </svg>
          <svg className="cloud-svg-block" viewBox="0 0 1200 180" preserveAspectRatio="none" fill="none">
            <path
              d="M0,120 Q180,40 360,80 Q540,30 720,70 Q900,40 1080,75 L1200,110 L1200,180 L0,180 Z"
              fill="rgba(255, 255, 255, 0.18)"
            />
          </svg>
        </div>

        {/* Low Valley Mist (Track 3) */}
        <div className="cloud-track-3">
          <svg className="cloud-svg-block" viewBox="0 0 1200 160" preserveAspectRatio="none" fill="none">
            <path
              d="M0,100 Q250,20 500,60 Q750,20 1000,50 L1200,80 L1200,160 L0,160 Z"
              fill="rgba(255, 255, 255, 0.14)"
            />
          </svg>
          <svg className="cloud-svg-block" viewBox="0 0 1200 160" preserveAspectRatio="none" fill="none">
            <path
              d="M0,100 Q250,20 500,60 Q750,20 1000,50 L1200,80 L1200,160 L0,160 Z"
              fill="rgba(255, 255, 255, 0.14)"
            />
          </svg>
        </div>
      </div>

      {/* 4. Contrast & Readability Gradient Overlay */}
      <div className="interactive-hero-overlay" />
    </div>
  );
};

export default InteractiveHeroBackground;
