import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import styles from './CTABanner.module.css';

const badges = ['No subscription required', 'Lifetime access', '100% secure checkout'];

export default function CTABanner() {
  return (
    <section className={styles.section}>
      <p className={styles.eyebrow}>✦ Limited Time Offer</p>
      <h2 className={styles.title}>
        Ready to Elevate<br />Your Creative Career?
      </h2>
      <p className={styles.subtitle}>
        Join 50,000+ students today and get instant access to premium courses, project files, and mentorship from industry veterans.
      </p>

      <div className={styles.btnGroup}>
        <Link href="/register" className={styles.ctaBtn}>
          Get Started for Free →
        </Link>
        <Link href="/series" className={styles.secondaryBtn}>
          Browse Courses
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
