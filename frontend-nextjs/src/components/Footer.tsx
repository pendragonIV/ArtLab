import Link from 'next/link';
import { Globe, MessageSquare, MonitorPlay } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brandBox}>
          <Link href="/" className={styles.logo}>
            Art<span className={styles.accent}>Lab</span>
          </Link>
          <p className={styles.description}>
            The ultimate platform for digital artists. Learn from the best and master your craft with premium video courses and exclusive project files.
          </p>
          <div className={styles.socials}>
            <Link href="#" className={styles.socialLink}><Globe size={20} /></Link>
            <Link href="#" className={styles.socialLink}><MessageSquare size={20} /></Link>
            <Link href="#" className={styles.socialLink}><MonitorPlay size={20} /></Link>
          </div>
        </div>

        <div className={styles.linksBox}>
          <div className={styles.linkGroup}>
            <h4 className={styles.linkTitle}>Platform</h4>
            <Link href="/courses" className={styles.linkItem}>All Courses</Link>
            <Link href="/instructors" className={styles.linkItem}>Instructors</Link>
            <Link href="/pricing" className={styles.linkItem}>Pricing</Link>
            <Link href="/faq" className={styles.linkItem}>FAQ</Link>
          </div>
          <div className={styles.linkGroup}>
            <h4 className={styles.linkTitle}>Company</h4>
            <Link href="/about" className={styles.linkItem}>About Us</Link>
            <Link href="/careers" className={styles.linkItem}>Careers</Link>
            <Link href="/blog" className={styles.linkItem}>Blog</Link>
            <Link href="/contact" className={styles.linkItem}>Contact</Link>
          </div>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <p>© 2026 ArtLab. All rights reserved.</p>
        <div className={styles.legalLinks}>
          <Link href="/terms" className={styles.legalLink}>Terms of Service</Link>
          <Link href="/privacy" className={styles.legalLink}>Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
}
