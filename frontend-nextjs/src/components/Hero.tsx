"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import styles from './Hero.module.css';
import { useLanguage } from '@/contexts/LanguageContext';

// Static per-slide data (non-translatable)
const SLIDE_METAS = [
  { id: 1, cta: '/series',   ctaSecondary: '/my-courses', bg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop', accent: '#6366f1' },
  { id: 2, cta: '/series',   ctaSecondary: '/category',   bg: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=2370&auto=format&fit=crop', accent: '#d946ef' },
  { id: 3, cta: '/classcut', ctaSecondary: '/classcut',   bg: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=2564&auto=format&fit=crop', accent: '#f97316' },
  { id: 4, cta: '/shorts',   ctaSecondary: '/series',     bg: 'https://images.unsplash.com/photo-1578926288207-32356a3c5f64?q=80&w=2560&auto=format&fit=crop', accent: '#22d3ee' },
];

const AUTOPLAY_MS = 5000;

export default function Hero() {
  const { t } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [animKey, setAnimKey] = useState(0); // force re-render for fade-in
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  // Build translated slides
  const SLIDES = SLIDE_METAS.map((m, i) => {
    const idx = i + 1;
    return {
      ...m,
      badge:    t(`heroBadge${idx}` as any),
      title:    t(`heroTitle${idx}` as any),
      subtitle: t(`heroSub${idx}` as any),
      cta:      { label: t(`heroBtn${idx}` as any), href: m.cta },
      ctaSecondary: { label: t('browseAll'), href: m.ctaSecondary },
    };
  });

  const total = SLIDES.length;

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
    setProgress(0);
    setAnimKey(k => k + 1);
  }, []);

  const goNext = useCallback(() => goTo((current + 1) % total), [current, total, goTo]);
  const goPrev = useCallback(() => goTo((current - 1 + total) % total), [current, total, goTo]);

  // Autoplay
  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
      return;
    }
    intervalRef.current = setInterval(goNext, AUTOPLAY_MS);
    progressRef.current = setInterval(() => {
      setProgress(p => Math.min(p + (100 / (AUTOPLAY_MS / 50)), 100));
    }, 50);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [playing, goNext, current]);

  const slide = SLIDES[current];

  return (
    <section className={styles.heroSection}>
      {/* ── Background images (all preloaded, only current visible) ── */}
      {SLIDES.map((s, i) => (
        <div
          key={s.id}
          className={`${styles.bgLayer} ${i === current ? styles.bgLayerActive : ''}`}
          style={{ backgroundImage: `url(${s.bg})` }}
        />
      ))}

      {/* ── Gradient overlays ── */}
      <div className={styles.gradientOverlay} style={{ '--slide-accent': slide.accent } as React.CSSProperties} />

      {/* ── Content ── */}
      <div className={styles.slideContent} key={animKey}>
        <span className={styles.badge}>{slide.badge}</span>
        <h1 className={styles.title}>
          {slide.title.split('\n').map((line, i) => (
            <span key={i}>{line}{i < slide.title.split('\n').length - 1 && <br />}</span>
          ))}
        </h1>
        <p className={styles.subtitle}>{slide.subtitle}</p>

        {/* Stats row */}
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>200+</span>
            <span className={styles.statLabel}>Courses</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNumber}>50K+</span>
            <span className={styles.statLabel}>Students</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNumber}>100+</span>
            <span className={styles.statLabel}>Expert Instructors</span>
          </div>
        </div>

        <div className={styles.ctaGroup}>
          <Link href={slide.cta.href} className={styles.primaryBtn}>
            {slide.cta.label}
          </Link>
          <Link href={slide.ctaSecondary.href} className={styles.secondaryBtn}>
            {slide.ctaSecondary.label}
          </Link>
        </div>
      </div>

      {/* ── Controls bar (Coloso-style: counter + progress + arrows + play) ── */}
      <div className={styles.controls}>
        {/* Left arrow */}
        <button className={styles.arrowBtn} onClick={goPrev} aria-label="Previous slide">
          <ChevronLeft size={18} />
        </button>

        {/* Counter + progress bar */}
        <div className={styles.counterWrap}>
          <span className={styles.counterCurrent}>{String(current + 1).padStart(2, '0')}</span>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressBar}
              style={{
                width: playing ? `${progress}%` : '0%',
                backgroundColor: slide.accent,
              }}
            />
          </div>
          <span className={styles.counterTotal}>{String(total).padStart(2, '0')}</span>
        </div>

        {/* Right arrow */}
        <button className={styles.arrowBtn} onClick={goNext} aria-label="Next slide">
          <ChevronRight size={18} />
        </button>

        {/* Play / Pause */}
        <button
          className={styles.playBtn}
          onClick={() => { setPlaying(p => !p); setProgress(0); }}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={13} /> : <Play size={13} />}
        </button>

        {/* Dot indicators */}
        <div className={styles.dots}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
              style={i === current ? { backgroundColor: slide.accent } : {}}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
