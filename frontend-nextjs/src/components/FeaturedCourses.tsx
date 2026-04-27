import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import styles from './FeaturedCourses.module.css';

const CourseCard = ({ course }: { course: any }) => (
  <Link href={`/course/${course.id}`} className={styles.card}>
    <div className={styles.thumbnailWrapper}>
      <span className={styles.badge}>NEW</span>
      <img src={course.thumbnail} alt={course.title} className={styles.thumbnail} />
    </div>
    <h3 className={styles.courseTitle}>{course.title}</h3>
    <p className={styles.author}>{course.author}</p>
    <div className={styles.priceBox}>
      <span className={styles.price}>{course.price}</span>
      <span className={styles.originalPrice}>{course.originalPrice}</span>
      <span className={styles.couponTag}>[Coupon]</span>
    </div>
  </Link>
);

export default function FeaturedCourses() {
  const dummyCourse = {
    id: '1',
    title: 'Advanced Character Illustration in Photoshop',
    author: 'Elena Rostova',
    price: '$89',
    originalPrice: '$199',
    thumbnail: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?q=80&w=2558&auto=format&fit=crop'
  };

  return (
    <section className={styles.section}>
      {/* Row 1 */}
      <div className={styles.row}>
        <div className={styles.header}>
          <h2 className={styles.title}>Today's TOP 10</h2>
          <Link href="/courses" className={styles.viewAllBtn}>View all <ChevronRight size={16} /></Link>
        </div>
        <div className={styles.grid3}>
          {[1,2,3].map(i => <CourseCard key={i} course={{...dummyCourse, id: `top-${i}`}} />)}
        </div>
      </div>

      {/* Row 2 */}
      <div className={styles.row}>
        <div className={styles.header}>
          <h2 className={styles.title}>Currently Trending</h2>
          <Link href="/courses" className={styles.viewAllBtn}>View all <ChevronRight size={16} /></Link>
        </div>
        <div className={styles.grid3}>
          {[1,2,3].map(i => <CourseCard key={i} course={{...dummyCourse, id: `trend-${i}`}} />)}
        </div>
      </div>

      {/* Row 3 */}
      <div className={styles.row}>
        <div className={styles.header}>
          <h2 className={styles.title}>New</h2>
          <Link href="/courses" className={styles.viewAllBtn}>View all <ChevronRight size={16} /></Link>
        </div>
        <div className={styles.grid5}>
          {[1,2,3,4,5].map(i => <CourseCard key={i} course={{...dummyCourse, id: `new-${i}`}} />)}
        </div>
      </div>
    </section>
  );
}
