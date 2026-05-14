import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import styles from './CTABanner.module.css';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CTABanner() {
  const { t } = useLanguage();
  const badges = [t('ctaBadge1'), t('ctaBadge2'), t('ctaBadge3')];

  return (
    <section className={styles.section}>
      <p className={styles.eyebrow}>{t('ctaEyebrow')}</p>
      <h2 className={styles.title}>
        {t('ctaTitle').split('\n').map((line: string, i: number) => (
          <span key={i}>{line}{i < t('ctaTitle').split('\n').length - 1 && <br />}</span>
        ))}
      </h2>
      <p className={styles.subtitle}>{t('ctaSubtitle')}</p>

      <div className={styles.btnGroup}>
        <Link href="/register" className={styles.ctaBtn}>
          {t('ctaBtn1')}
        </Link>
        <Link href="/series" className={styles.secondaryBtn}>
          {t('ctaBtn2')}
        </Link>
      </div>

      <div className={styles.trustBadges}>
        {badges.map((b, i) => (
          <span key={i} className={styles.trustBadge}>
            <CheckCircle size={13} />
            {b}
          </span>
        ))}
      </div>
    </section>
  );
}
