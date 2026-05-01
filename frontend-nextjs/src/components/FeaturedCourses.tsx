import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import styles from './FeaturedCourses.module.css';
import CourseCard from './CourseCard';

// Define the type for the course data returned from the backend
type Course = {
  id: number;
  title: string;
  author: string;
  category: string;
  price: number;
  originalPrice: number;
  thumbnailUrl: string;
  isNew: boolean;
  isTrending: boolean;
};

export default async function FeaturedCourses() {
  let courses: Course[] = [];
  try {
    const res = await fetch('http://localhost:5149/api/courses', { cache: 'no-store' });
    if (res.ok) {
      courses = await res.json();
    }
  } catch (error) {
    console.error("Failed to fetch courses:", error);
  }

  if (courses.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.emptyState}>
          No courses available or backend is not running.
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
            <h2 className={styles.title}>Today's TOP 10</h2>
            <span className={`${styles.rowLabel} ${styles.rowLabelTop}`}>RANKED</span>
          </div>
          <Link href="/courses" className={styles.viewAllBtn}>
            View all <ChevronRight size={14} />
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
            <h2 className={styles.title}>Currently Trending</h2>
            <span className={`${styles.rowLabel} ${styles.rowLabelHot}`}>HOT</span>
          </div>
          <Link href="/courses" className={styles.viewAllBtn}>
            View all <ChevronRight size={14} />
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
            <h2 className={styles.title}>New Arrivals</h2>
            <span className={`${styles.rowLabel} ${styles.rowLabelNew}`}>FRESH</span>
          </div>
          <Link href="/courses" className={styles.viewAllBtn}>
            View all <ChevronRight size={14} />
          </Link>
        </div>
        <div className={styles.grid5}>
          {newCourses.map((course, i) => <CourseCard key={`new-${i}`} {...course} isNew />)}
        </div>
      </div>
    </section>
  );
}
