"use client";

import Link from 'next/link';
import { PenTool, Box, Video, Palette, Gamepad2, MonitorPlay, Code, FileVideo, Music, Scissors } from 'lucide-react';
import styles from './CategoryBar.module.css';
import { useLanguage } from '@/contexts/LanguageContext';

const categories = [
  { nameKey: 'catIllustration', name: 'Illustration', icon: PenTool, color: '#a78bfa' },
  { nameKey: 'cat2DAnimation', name: '2D Animation', icon: Video, color: '#60a5fa' },
  { nameKey: 'cat3DArt', name: '3D Art', icon: Box, color: '#f472b6' },
  { nameKey: 'catConceptArt', name: 'Concept Art', icon: Palette, color: '#34d399' },
  { nameKey: 'catGameDesign', name: 'Game Design', icon: Gamepad2, color: '#fbbf24' },
  { nameKey: 'catWebtoon', name: 'Webtoon', icon: MonitorPlay, color: '#f97316' },
  { nameKey: 'catVFX', name: 'VFX', icon: FileVideo, color: '#e879f9' },
  { nameKey: 'catProgramming', name: 'Programming', icon: Code, color: '#22d3ee' },
  { nameKey: 'catSoundDesign', name: 'Sound Design', icon: Music, color: '#fb7185' },
  { nameKey: 'catVideoEdit', name: 'Video Edit', icon: Scissors, color: '#a3e635' }
];

export default function CategoryBar() {
  const { t } = useLanguage();

  return (
    <section className={styles.categorySection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{t('browseCategory')}</h2>
      </div>
      <div className={styles.scrollWrapper}>
        <div className={styles.container}>
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <Link key={idx} href={`/category/${cat.name.toLowerCase().replace(' ', '-')}`} className={styles.categoryCard}>
                <div className={styles.iconWrapper}>
                  <Icon size={22} strokeWidth={1.7} color={cat.color} />
                </div>
                <span className={styles.categoryName}>{t(cat.nameKey as any)}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
