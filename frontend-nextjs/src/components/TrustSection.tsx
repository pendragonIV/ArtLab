import { Shield, Clock, FileBadge } from 'lucide-react';
import styles from './TrustSection.module.css';

const trustItems = [
  {
    icon: Shield,
    title: 'DRM Protected',
    desc: 'Our videos are protected with industry-standard DRM to prevent piracy and ensure artists are fairly compensated.',
  },
  {
    icon: FileBadge,
    title: 'Project Files Included',
    desc: 'Get access to brushes, 3D models, source files, and assignments to follow along with the instructors.',
  },
  {
    icon: Clock,
    title: 'Lifetime Access',
    desc: 'Buy once, own forever. Learn at your own pace without monthly subscriptions or expiration dates.',
  }
];

export default function TrustSection() {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Why ArtLab</p>
        <h2 className={styles.title}>Built for Serious Creatives</h2>
        <p className={styles.subtitle}>
          We provide the highest quality learning experience for aspiring digital artists.
        </p>
      </div>

      <div className={styles.grid}>
        {trustItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className={styles.card}>
              <div className={styles.iconWrapper}>
                <Icon size={28} strokeWidth={1.7} />
              </div>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDesc}>{item.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
