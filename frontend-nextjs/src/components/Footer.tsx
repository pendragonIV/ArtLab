"use client";

import Link from 'next/link';
import { Globe, MessageSquare, MonitorPlay } from 'lucide-react';
import styles from './Footer.module.css';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brandBox}>
          <Link href="/" className={styles.logo}>
            Art<span className={styles.accent}>Lab</span>
          </Link>
          <p className={styles.description}>
            {t('footerDesc')}
          </p>
          <div className={styles.socials}>
            <Link href="#" className={styles.socialLink}><Globe size={20} /></Link>
            <Link href="#" className={styles.socialLink}><MessageSquare size={20} /></Link>
            <Link href="#" className={styles.socialLink}><MonitorPlay size={20} /></Link>
          </div>
        </div>

        <div className={styles.linksBox}>
          <div className={styles.linkGroup}>
            <h4 className={styles.linkTitle}>{t('footerPlatform')}</h4>
            <Link href="/courses" className={styles.linkItem}>{t('footerAllCourses')}</Link>
            <Link href="/instructors" className={styles.linkItem}>{t('footerInstructors')}</Link>
            <Link href="/pricing" className={styles.linkItem}>{t('footerPricing')}</Link>
            <Link href="/faq" className={styles.linkItem}>{t('footerFAQ')}</Link>
          </div>
          <div className={styles.linkGroup}>
            <h4 className={styles.linkTitle}>{t('footerCompany')}</h4>
            <Link href="/about" className={styles.linkItem}>{t('footerAbout')}</Link>
            <Link href="/careers" className={styles.linkItem}>{t('footerCareers')}</Link>
            <Link href="/blog" className={styles.linkItem}>{t('footerBlog')}</Link>
            <Link href="/contact" className={styles.linkItem}>{t('footerContact')}</Link>
          </div>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <p>{t('footerRights')}</p>
        <div className={styles.legalLinks}>
          <Link href="/terms" className={styles.legalLink}>{t('footerTerms')}</Link>
          <Link href="/privacy" className={styles.legalLink}>{t('footerPrivacy')}</Link>
        </div>
      </div>
    </footer>
  );
}
