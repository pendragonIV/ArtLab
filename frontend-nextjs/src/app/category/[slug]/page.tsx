"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import CourseCard from '@/components/CourseCard';
import styles from './page.module.css';

type Course = {
  id: number;
  title: string;
  author: string;
  category: string;
  price: number;
  originalPrice: number;
  thumbnailUrl: string;
  isTrending?: boolean;
  isNew?: boolean;
};

export default function CategoryPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { t } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const formattedCategory = slug
    ? slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : '';

  useEffect(() => {
    if (!slug) return;
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/courses?category=${slug}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setCourses(data))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.heroSection}>
          <h1 className={styles.categoryTitle}>{formattedCategory} {t('categoryClasses')}</h1>
          <p className={styles.categoryDesc}>
            {t('categoryMasterFrom').replace('{cat}', formattedCategory.toLowerCase())}
          </p>
        </div>

        <div className={styles.container}>
          {loading ? (
            <div className={styles.emptyState}>
              <p style={{ color: '#a1a1aa' }}>{t('loadingCourses')}</p>
            </div>
          ) : courses.length > 0 ? (
            <div className={styles.grid}>
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  author={course.author}
                  price={course.price}
                  originalPrice={course.originalPrice}
                  thumbnailUrl={course.thumbnailUrl}
                  isTrending={course.isTrending}
                  isNew={course.isNew}
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <h2>{t('categoryNoCourses')}</h2>
              <p>{t('categoryNoCoursesDesc').replace('{cat}', formattedCategory.toLowerCase())}</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
