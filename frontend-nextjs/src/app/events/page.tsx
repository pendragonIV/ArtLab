"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Zap, Clock, Star, ArrowRight, Gift, Tag, Layers } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import styles from './page.module.css';
import { useLanguage } from '@/contexts/LanguageContext';

type Tab = 'events' | 'curated' | 'benefits';

export default function EventsPage() {
  const [tab, setTab] = useState<Tab>('events');
  const { t } = useLanguage();

  const EVENTS = [
    {
      id: 1,
      tag: 'HOT',
      until: 'May 15th', // We might want to keep the date hardcoded or use a date formatter, let's keep it as is for now or translate "Until" in the UI.
      accentColor: '#facc15',
      bg: 'linear-gradient(135deg, #1a1a0a 0%, #2d2800 100%)',
      title: t('eventsGoldenTitle'),
      desc: t('eventsGoldenDesc'),
      cta: '/events/30-off',
      ctaLabel: t('eventsGoldenCta'),
      image: 'https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?q=80&w=800&auto=format',
    },
    {
      id: 2,
      tag: 'SERIES',
      until: 'May 31st',
      accentColor: '#818cf8',
      bg: 'linear-gradient(135deg, #0d0d1f 0%, #1e1e3a 100%)',
      title: t('eventsSeriesTitle'),
      desc: t('eventsSeriesDesc'),
      cta: '/series',
      ctaLabel: t('eventsSeriesCta'),
      image: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=800&auto=format',
    },
    {
      id: 3,
      tag: 'EVENT',
      until: 'May 20th',
      accentColor: '#34d399',
      bg: 'linear-gradient(135deg, #071a10 0%, #0f2e1c 100%)',
      title: t('eventsWelcomeTitle'),
      desc: t('eventsWelcomeDesc'),
      cta: '/events/welcome',
      ctaLabel: t('eventsWelcomeCta'),
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format',
    },
  ];

  const CURATED = [
    { icon: Star, label: t('curatedTop10'), href: '/category/top', color: '#facc15', desc: t('curatedTop10Desc') },
    { icon: Zap, label: t('curatedNew'), href: '/category/new', color: '#818cf8', desc: t('curatedNewDesc') },
    { icon: Gift, label: t('curatedFree'), href: '/events/free-learning', color: '#34d399', desc: t('curatedFreeDesc') },
    { icon: Layers, label: t('curatedSeries'), href: '/series', color: '#f97316', desc: t('curatedSeriesDesc') },
    { icon: Tag, label: t('curatedFlash'), href: '/events/30-off', color: '#f43f5e', desc: t('curatedFlashDesc') },
  ];

  const BENEFITS = [
    { title: t('benefitLifetime'), desc: t('benefitLifetimeDesc') },
    { title: t('benefitMobile'), desc: t('benefitMobileDesc') },
    { title: t('benefitCert'), desc: t('benefitCertDesc') },
    { title: t('benefitComm'), desc: t('benefitCommDesc') },
    { title: t('benefitRefund'), desc: t('benefitRefundDesc') },
    { title: t('benefitLang'), desc: t('benefitLangDesc') },
  ];

  return (
    <>
      <Header />

      <main className={styles.main}>
        {/* ─── HERO ─────────────────────────────────────── */}
        <div className={styles.hero}>
          <div className={styles.heroBg} />
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>{t('eventsPageTitle').split('\n').map((line, i, arr) => (
            <span key={i}>{line}{i < arr.length - 1 && <br/>}</span>
          ))}</h1>
          <p className={styles.heroSub}>{t('eventsPageSub')}</p>
          </div>
        </div>

        {/* ─── TABS ─────────────────────────────────────── */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'events' ? styles.tabActive : ''}`} onClick={() => setTab('events')}>{t('eventsTab')}</button>
          <button className={`${styles.tab} ${tab === 'curated' ? styles.tabActive : ''}`} onClick={() => setTab('curated')}>{t('curatedTab')}</button>
          <button className={`${styles.tab} ${tab === 'benefits' ? styles.tabActive : ''}`} onClick={() => setTab('benefits')}>{t('benefitsTab')}</button>
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
                      <span className={styles.eventUntil}><Clock size={11} /> {t('eventsUntil')} {event.until}</span>
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
