"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Zap, Clock, Star, ArrowRight, Gift, Tag, Layers } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import styles from './page.module.css';

type Tab = 'events' | 'curated' | 'benefits';

const EVENTS = [
  {
    id: 1,
    tag: 'HOT',
    until: 'May 15th',
    accentColor: '#facc15',
    bg: 'linear-gradient(135deg, #1a1a0a 0%, #2d2800 100%)',
    title: 'Seize the Golden Moment!\nGet up to 30% off',
    desc: 'Limited-time offer — save big on 200+ premium art and design courses.',
    cta: '/events/30-off',
    ctaLabel: 'Shop Now →',
    image: 'https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?q=80&w=800&auto=format',
  },
  {
    id: 2,
    tag: 'SERIES',
    until: 'May 31st',
    accentColor: '#818cf8',
    bg: 'linear-gradient(135deg, #0d0d1f 0%, #1e1e3a 100%)',
    title: 'All You Need in One Series\n— Up to 35% Off',
    desc: 'Structured learning paths that take you from zero to expert. Massive bundles, one price.',
    cta: '/series',
    ctaLabel: 'Browse Series →',
    image: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=800&auto=format',
  },
  {
    id: 3,
    tag: 'EVENT',
    until: 'May 20th',
    accentColor: '#34d399',
    bg: 'linear-gradient(135deg, #071a10 0%, #0f2e1c 100%)',
    title: 'Welcome Offer\n— 63% Off Your First Class',
    desc: 'New to ArtLab? Get your first course at an unbeatable price. One-time offer for new members.',
    cta: '/events/welcome',
    ctaLabel: 'Claim Offer →',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format',
  },
];

const CURATED = [
  { icon: Star, label: 'Top 10 This Week', href: '/category/top', color: '#facc15', desc: 'The courses students love most right now' },
  { icon: Zap, label: 'New Releases', href: '/category/new', color: '#818cf8', desc: 'Fresh content from our instructor team' },
  { icon: Gift, label: 'Free Courses', href: '/events/free-learning', color: '#34d399', desc: 'Start learning at zero cost' },
  { icon: Layers, label: 'Series Bundles', href: '/series', color: '#f97316', desc: 'Complete pipelines in one package' },
  { icon: Tag, label: 'Flash Sales', href: '/events/30-off', color: '#f43f5e', desc: 'Limited-time deeply discounted classes' },
];

const BENEFITS = [
  { title: '🎓 Lifetime Access', desc: 'Buy once, watch forever. All course materials including future updates.' },
  { title: '📱 Learn Anywhere', desc: 'Mobile, tablet, or desktop — your courses go with you everywhere.' },
  { title: '📄 Certificate', desc: 'Earn certificates of completion to showcase your skills.' },
  { title: '💬 Community', desc: 'Join a community of creatives, get feedback, and grow together.' },
  { title: '🔄 30-Day Refund', desc: 'Not satisfied? We offer a full refund within 30 days — no questions asked.' },
  { title: '🌍 Multilingual', desc: 'Subtitles available in 8+ languages including English, Korean, and Japanese.' },
];

export default function EventsPage() {
  const [tab, setTab] = useState<Tab>('events');

  return (
    <>
      <Header />

      <main className={styles.main}>
        {/* ─── HERO ─────────────────────────────────────── */}
        <div className={styles.hero}>
          <div className={styles.heroBg} />
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Tune In for Weekly<br/>Discounts & Events</h1>
            <p className={styles.heroSub}>Exclusive deals, curated picks, and member benefits — updated every week.</p>
          </div>
        </div>

        {/* ─── TABS ─────────────────────────────────────── */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'events' ? styles.tabActive : ''}`} onClick={() => setTab('events')}>Events</button>
          <button className={`${styles.tab} ${tab === 'curated' ? styles.tabActive : ''}`} onClick={() => setTab('curated')}>Curated Picks</button>
          <button className={`${styles.tab} ${tab === 'benefits' ? styles.tabActive : ''}`} onClick={() => setTab('benefits')}>Member Benefits</button>
        </div>

        <div className={styles.content}>
          {/* EVENTS TAB */}
          {tab === 'events' && (
            <div className={styles.eventList}>
              {EVENTS.map(event => (
                <Link key={event.id} href={event.cta} className={styles.eventCard}>
                  <div className={styles.eventCardLeft} style={{ background: event.bg }}>
                    <div className={styles.eventImg} style={{ backgroundImage: `url(${event.image})` }} />
                    <div className={styles.eventOverlay} />
                    <div className={styles.eventMeta}>
                      <span className={styles.eventTag} style={{ background: event.accentColor, color: '#000' }}>{event.tag}</span>
                      <span className={styles.eventUntil}><Clock size={11} /> Until {event.until}</span>
                    </div>
                    <h2 className={styles.eventTitle}>
                      {event.title.split('\n').map((l, i) => <span key={i}>{l}{i === 0 && <br/>}</span>)}
                    </h2>
                  </div>
                  <div className={styles.eventCardRight}>
                    <p className={styles.eventDesc}>{event.desc}</p>
                    <div className={styles.eventCta} style={{ color: event.accentColor }}>
                      {event.ctaLabel} <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* CURATED TAB */}
          {tab === 'curated' && (
            <div className={styles.curatedGrid}>
              {CURATED.map(item => {
                const Icon = item.icon;
                return (
                  <Link key={item.label} href={item.href} className={styles.curatedCard}>
                    <div className={styles.curatedIcon} style={{ background: `${item.color}22`, border: `1px solid ${item.color}44` }}>
                      <Icon size={20} color={item.color} />
                    </div>
                    <div>
                      <div className={styles.curatedLabel}>{item.label}</div>
                      <div className={styles.curatedDesc}>{item.desc}</div>
                    </div>
                    <ArrowRight size={14} className={styles.curatedArrow} />
                  </Link>
                );
              })}
            </div>
          )}

          {/* BENEFITS TAB */}
          {tab === 'benefits' && (
            <div className={styles.benefitsGrid}>
              {BENEFITS.map(b => (
                <div key={b.title} className={styles.benefitCard}>
                  <div className={styles.benefitTitle}>{b.title}</div>
                  <div className={styles.benefitDesc}>{b.desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
