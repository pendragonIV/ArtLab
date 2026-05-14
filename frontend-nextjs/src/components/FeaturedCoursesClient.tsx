"use client";

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import styles from './FeaturedCourses.module.css';
import CourseCard from './CourseCard';
import { useLanguage } from '@/contexts/LanguageContext';

export default function FeaturedCoursesClient({ courses }: { courses: any[] }) {
  const { t } = useLanguage();

  if (courses.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.emptyState}>
          No courses available.
        </div>
      </section>
    );
  }

  const top10      = courses.slice(0, 3);
  const trending   = courses.filter(c => c.isTrending).slice(0, 3);
  if (trending.length === 0) trending.push(...courses.slice(0, 3));
  const newCourses = courses.filter(c => c.isNew).slice(0, 5);
  while (newCourses.length < 5 && courses.length > 0) {
    newCourses.push(courses[newCourses.length % courses.length]);
  }

  return (
    <section className={styles.section}>
      {/* Row 1 – TOP 10 */}
      <div className={styles.row}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>{t('featuredTop10')}</h2>
            <span className={`${styles.rowLabel} ${styles.rowLabelTop}`}>{t('featuredRanked')}</span>
          </div>
          <Link href="/courses" className={styles.viewAllBtn}>
            {t('viewMore')} <ChevronRight size={14} />
          </Link>
        </div>
        <div className={styles.grid3}>
          {top10.map((course, i) => <CourseCard key={`top-${i}`} {...course} />)}
        </div>
      </div>

      {/* Row 2 – Trending */}
      <div className={styles.row}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>{t('featuredTrending')}</h2>
            <span className={`${styles.rowLabel} ${styles.rowLabelHot}`}>{t('featuredHot')}</span>
          </div>
          <Link href="/courses" className={styles.viewAllBtn}>
            {t('viewMore')} <ChevronRight size={14} />
          </Link>
        </div>
        <div className={styles.grid3}>
          {trending.map((course, i) => <CourseCard key={`trend-${i}`} {...course} isTrending />)}
        </div>
      </div>

      {/* Divider */}
      <div className={styles.divider} />

      {/* Row 3 – New */}
      <div className={styles.row}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>{t('featuredNew')}</h2>
            <span className={`${styles.rowLabel} ${styles.rowLabelNew}`}>{t('featuredFresh')}</span>
          </div>
          <Link href="/courses" className={styles.viewAllBtn}>
            {t('viewMore')} <ChevronRight size={14} />
          </Link>
        </div>
        <div className={styles.grid5}>
          {newCourses.map((course, i) => <CourseCard key={`new-${i}`} {...course} isNew />)}
        </div>
      </div>
    </section>
  );
}
