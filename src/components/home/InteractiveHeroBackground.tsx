import React, { useEffect, useRef } from 'react';
import heroLandscapeImg from '../../assets/hero-landscape.png';
import heroLandscapeNightImg from '../../assets/hero-landscape-night.jpg';
import '../../styles/components/InteractiveHero.css';

const InteractiveHeroBackground: React.FC = () => {
  const bgRef = useRef<HTMLDivElement>(null);
  const cloud1Ref = useRef<HTMLDivElement>(null);
  const cloud2Ref = useRef<HTMLDivElement>(null);
  const sunbeamRef = useRef<HTMLDivElement>(null);

  // Position interpolation state
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

      // 1. Mountain Base Layer: 120% size with parallax
      if (bgRef.current) {
        const bgMoveX = posX * -20;
        const bgMoveY = posY * -14;
        bgRef.current.style.transform = `translate3d(${bgMoveX}px, ${bgMoveY}px, 0) scale(1.05)`;
      }

      // 2. High Fluffy Clouds Layer
      if (cloud1Ref.current) {
        const c1MoveX = posX * 28;
        const c1MoveY = posY * 15;
        cloud1Ref.current.style.transform = `translate3d(${c1MoveX}px, ${c1MoveY}px, 0)`;
      }

      // 3. Valley Mist Layer
      if (cloud2Ref.current) {
        const c2MoveX = posX * 42;
        const c2MoveY = posY * 20;
        cloud2Ref.current.style.transform = `translate3d(${c2MoveX}px, ${c2MoveY}px, 0)`;
      }

      // 4. Sunbeam Lighting
      if (sunbeamRef.current) {
        const sunX = posX * -30;
        const sunY = posY * -18;
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
      {/* 1. Base Mountain Background (Machu Picchu Day & Night Crossfade) - 120% full-bleed */}
      <div ref={bgRef} className="interactive-hero-bg-container">
        <img
          src={heroLandscapeImg}
          alt="Machu Picchu Día - Turismo Tunki Chasky"
          className="interactive-hero-bg interactive-hero-bg-day"
        />
        <img
          src={heroLandscapeNightImg}
          alt="Machu Picchu Noche - Turismo Tunki Chasky"
          className="interactive-hero-bg interactive-hero-bg-night"
        />
      </div>

      {/* 2. Golden Andean Sunbeam Glow */}
      <div ref={sunbeamRef} className="sunbeam-glow" />

      {/* 3. Ethereal Soft Floating Clouds (NO solid grey bands) */}
      <div className="clouds-container">
        {/* Track 1: High Fluffy Cumulus Clouds */}
        <div ref={cloud1Ref} className="cloud-track-1">
          <div className="cloud-shape cloud-shape-1" />
          <div className="cloud-shape cloud-shape-2" />
          <div className="cloud-shape cloud-shape-3" />
          <div className="cloud-shape cloud-shape-1" />
          <div className="cloud-shape cloud-shape-2" />
          <div className="cloud-shape cloud-shape-3" />
        </div>

        {/* Track 2: Mid Altitude Mist */}
        <div ref={cloud2Ref} className="cloud-track-2">
          <div className="cloud-shape cloud-shape-mist-1" />
          <div className="cloud-shape cloud-shape-mist-2" />
          <div className="cloud-shape cloud-shape-mist-1" />
          <div className="cloud-shape cloud-shape-mist-2" />
        </div>
      </div>

      {/* 4. Contrast & Readability Gradient Overlay */}
      <div className="interactive-hero-overlay" />
    </div>
  );
};

export default InteractiveHeroBackground;
