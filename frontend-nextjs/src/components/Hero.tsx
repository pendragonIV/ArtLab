import Link from 'next/link';
import styles from './Hero.module.css';

export default function Hero() {
  return (
    <section className={styles.heroSection}>
      <div className={styles.sliderContainer}>
        <img 
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
          alt="Featured Course" 
          className={styles.slideImage} 
        />
        <div className={styles.slideOverlay}>
          <span className={styles.badge}>NEW CLASS</span>
          <h1 className={styles.title}>
            Master the Art of<br />Digital Creation
          </h1>
          <p className={styles.subtitle}>
            Learn from industry-leading experts.
          </p>
        </div>
      </div>
    </section>
  );
}
