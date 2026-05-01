import Link from 'next/link';
import { PenTool, Box, Video, Palette, Gamepad2, MonitorPlay, Code, FileVideo, Music, Scissors } from 'lucide-react';
import styles from './CategoryBar.module.css';

const categories = [
  { name: 'Illustration', icon: PenTool, color: '#a78bfa' },
  { name: '2D Animation', icon: Video, color: '#60a5fa' },
  { name: '3D Art', icon: Box, color: '#f472b6' },
  { name: 'Concept Art', icon: Palette, color: '#34d399' },
  { name: 'Game Design', icon: Gamepad2, color: '#fbbf24' },
  { name: 'Webtoon', icon: MonitorPlay, color: '#f97316' },
  { name: 'VFX', icon: FileVideo, color: '#e879f9' },
  { name: 'Programming', icon: Code, color: '#22d3ee' },
  { name: 'Sound Design', icon: Music, color: '#fb7185' },
  { name: 'Video Edit', icon: Scissors, color: '#a3e635' }
];

export default function CategoryBar() {
  return (
    <section className={styles.categorySection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Browse by Category</h2>
      </div>
      <div className={styles.scrollWrapper}>
        <div className={styles.container}>
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <Link key={idx} href={`/category/${cat.name.toLowerCase().replace(' ', '-')}`} className={styles.categoryCard}>
                <div className={styles.iconWrapper}>
                  <Icon size={22} strokeWidth={1.7} color={cat.color} />
                </div>
                <span className={styles.categoryName}>{cat.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
