import Link from 'next/link';
import styles from './CTABanner.module.css';

export default function CTABanner() {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Ready to elevate your art?</h2>
      <p className={styles.subtitle}>
        Join our community today and get instant access to premium courses, project files, and mentorship from industry veterans.
      </p>
      <Link href="/register" className={styles.ctaBtn}>
        Get Started for Free
      </Link>
    </section>
  );
}
