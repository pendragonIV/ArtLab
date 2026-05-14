"use client";

import { Shield, Clock, FileBadge } from 'lucide-react';
import styles from './TrustSection.module.css';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TrustSection() {
  const { t } = useLanguage();

  const trustItems = [
    {
      icon: Shield,
      title: t('trustItem1Title'),
      desc: t('trustItem1Desc'),
    },
    {
      icon: FileBadge,
      title: t('trustItem2Title'),
      desc: t('trustItem2Desc'),
    },
    {
      icon: Clock,
      title: t('trustItem3Title'),
      desc: t('trustItem3Desc'),
    }
  ];

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>{t('trustEyebrow')}</p>
        <h2 className={styles.title}>{t('trustTitle')}</h2>
        <p className={styles.subtitle}>{t('trustSubtitle')}</p>
      </div>

      <div className={styles.grid}>
        {trustItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className={styles.card}>
              <div className={styles.iconWrapper}>
                <Icon size={28} strokeWidth={1.7} />
              </div>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDesc}>{item.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
