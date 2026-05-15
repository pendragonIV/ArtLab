"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, Zap, Star, ShoppingCart } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './page.module.css';

// Countdown hook
function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return timeLeft;
}

// Mock EarlyBird courses (upcoming courses, not yet released)
const EARLY_BIRDS = [
  {
    id: 101,
    title: 'Advanced Character Rigging in Blender',
    instructor: 'Yuki Tanaka',
    category: '3D & Animation',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format',
    regularPrice: 89,
    earlyPrice: 49,
    savings: 45,
    releaseDate: new Date(Date.now() + 5 * 86400000), // 5 days from now
    spots: 28,
    totalSpots: 100,
    rating: null,
    isNew: true,
  },
  {
    id: 102,
    title: 'Digital Fashion Illustration: From Sketch to Collection',
    instructor: 'Sofia Reyes',
    category: 'Illustration',
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=600&auto=format',
    regularPrice: 79,
    earlyPrice: 39,
    savings: 51,
    releaseDate: new Date(Date.now() + 9 * 86400000),
    spots: 55,
    totalSpots: 150,
    rating: null,
    isNew: true,
  },
  {
    id: 103,
    title: 'Pixel Art for Game Developers',
    instructor: 'Alex Morrow',
    category: 'Game Design',
    thumbnail: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=600&auto=format',
    regularPrice: 69,
    earlyPrice: 35,
    savings: 49,
    releaseDate: new Date(Date.now() + 14 * 86400000),
    spots: 80,
    totalSpots: 200,
    rating: null,
    isNew: true,
  },
];

function EarlyBirdCard({ course }: { course: typeof EARLY_BIRDS[0] }) {
  const { t } = useLanguage();
  const time = useCountdown(course.releaseDate);
  const spotPct = Math.round(((course.totalSpots - course.spots) / course.totalSpots) * 100);

  return (
    <div className={styles.card}>
      <div className={styles.cardThumb}>
        <img src={course.thumbnail} alt={course.title} />
        <div className={styles.earlyTag}>
          <Zap size={11} /> {t('earlyBirdBadge')}
        </div>
        <div className={styles.savingsTag}>-{course.savings}%</div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardCat}>{course.category}</div>
        <h3 className={styles.cardTitle}>{course.title}</h3>
        <p className={styles.cardInstructor}>{course.instructor}</p>

        {/* Countdown */}
        <div className={styles.countdownBox}>
          <div className={styles.countdownLabel}><Clock size={12} /> {t('earlyBirdReleasesIn')}</div>
          <div className={styles.countdownRow}>
            {[{ v: time.d, l: 'd' }, { v: time.h, l: 'h' }, { v: time.m, l: 'm' }, { v: time.s, l: 's' }].map(t => (
              <div key={t.l} className={styles.countdownUnit}>
                <span className={styles.countdownNum}>{String(t.v).padStart(2, '0')}</span>
                <span className={styles.countdownSuffix}>{t.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Spots left */}
        <div className={styles.spotsRow}>
          <div className={styles.spotsBar}>
            <div className={styles.spotsProgress} style={{ width: `${spotPct}%` }} />
          </div>
          <span className={styles.spotsText}><strong>{course.spots}</strong> {t('earlyBirdSpotsLeft')}</span>
        </div>

        {/* Price + CTA */}
        <div className={styles.priceRow}>
          <div className={styles.priceGroup}>
            <span className={styles.earlyPrice}>${course.earlyPrice}</span>
            <span className={styles.regularPrice}>${course.regularPrice}</span>
          </div>
          <Link href={`/course/${course.id}`} className={styles.reserveBtn}>
            <ShoppingCart size={14} /> {t('earlyBirdReserveSpot')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function EarlyBirdsPage() {
  const { t } = useLanguage();

  return (
    <>
      <Header />

      <main className={styles.main}>
        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroBg} />
          <div className={styles.heroContent}>
            <div className={styles.heroPill}>
              <Zap size={13} /> {t('earlyBirdsDeals')}
            </div>
            <h1 className={styles.heroTitle}>{t('earlyBirdsHeroTitle1')}<br/>{t('earlyBirdsHeroTitle2')}</h1>
            <p className={styles.heroSub}>
              {t('earlyBirdsHeroSub')}
            </p>
            <div className={styles.heroStats}>
              <div className={styles.heroStat}><strong>{t('earlyBirdsSaveUpTo')}</strong> {t('earlyBirdsVsLaunch')}</div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}><strong>{t('earlyBirdsLimitedSpots')}</strong> {t('earlyBirdsPerCourse')}</div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}><strong>{t('earlyBirdsInstantAccess')}</strong> {t('earlyBirdsOnRelease')}</div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className={styles.howItWorks}>
          <div className={styles.howTitle}>{t('earlyBirdsHowWorks')}</div>
          <div className={styles.howSteps}>
            {[
              { num: '1', text: t('earlyBirdsStep1') },
              { num: '2', text: t('earlyBirdsStep2') },
              { num: '3', text: t('earlyBirdsStep3') },
            ].map(s => (
              <div key={s.num} className={styles.howStep}>
                <div className={styles.howNum}>{s.num}</div>
                <span>{s.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Course grid */}
        <div className={styles.grid}>
          {EARLY_BIRDS.map(course => (
            <EarlyBirdCard key={course.id} course={course} />
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}
