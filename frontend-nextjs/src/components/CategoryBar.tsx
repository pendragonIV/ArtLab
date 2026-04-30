import Link from 'next/link';
import { PenTool, Box, Video, Palette, Gamepad2, MonitorPlay, Code, FileVideo, Music, Scissors } from 'lucide-react';
import styles from './CategoryBar.module.css';

const categories = [
  { name: 'Illustration', icon: PenTool },
  { name: '2D Animation', icon: Video },
  { name: '3D Art', icon: Box },
  { name: 'Concept Art', icon: Palette },
  { name: 'Game Design', icon: Gamepad2 },
  { name: 'Webtoon', icon: MonitorPlay },
  { name: 'VFX', icon: FileVideo },
  { name: 'Programming', icon: Code },
  { name: 'Sound Design', icon: Music },
  { name: 'Video Editing', icon: Scissors }
];

export default function CategoryBar() {
  return (
    <section className={styles.categorySection}>
      <div className={styles.container}>
        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <Link key={idx} href={`/category/${cat.name.toLowerCase().replace(' ', '-')}`} className={styles.categoryCard}>
              <div className={styles.iconWrapper}>
                <Icon size={24} strokeWidth={1.5} color="#fff" />
              </div>
              <span className={styles.categoryName}>{cat.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
