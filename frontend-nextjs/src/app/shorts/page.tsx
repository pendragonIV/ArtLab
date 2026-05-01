"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Share2, Play, ChevronUp, ChevronDown, Volume2, VolumeX, Bookmark } from 'lucide-react';
import Header from '@/components/Header';
import styles from './page.module.css';

// Mock data – will be replaced with real API
const MOCK_SHORTS = [
  {
    id: 1,
    title: 'How to shade realistic eyes in 60 seconds',
    instructor: 'Elena Rostova',
    category: 'Illustration',
    courseId: 1,
    courseName: 'Mastering Digital Portraits',
    likes: 1284,
    comments: 47,
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  },
  {
    id: 2,
    title: 'Quick tip: Rim light for 3D renders',
    instructor: 'Marcus Chen',
    category: '3D Art',
    courseId: 3,
    courseName: 'Blender For Artists',
    likes: 897,
    comments: 23,
    gradient: 'linear-gradient(135deg, #1b0036 0%, #2d1b69 50%, #0d0d1a 100%)',
  },
  {
    id: 3,
    title: 'Color theory trick every artist should know',
    instructor: 'Sora Kim',
    category: 'Concept Art',
    courseId: 5,
    courseName: 'Color & Composition Masterclass',
    likes: 2134,
    comments: 88,
    gradient: 'linear-gradient(135deg, #0a1628 0%, #1e3a5f 50%, #071020 100%)',
  },
];

export default function ShortsPage() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [muted, setMuted] = useState(true);

  const current = MOCK_SHORTS[currentIdx];

  const goNext = () => setCurrentIdx(i => Math.min(i + 1, MOCK_SHORTS.length - 1));
  const goPrev = () => setCurrentIdx(i => Math.max(i - 1, 0));

  const toggleLike = (id: number) => {
    setLiked(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleSave = (id: number) => {
    setSaved(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        {/* Left: info panel */}
        <div className={styles.infoPanel}>
          <div className={styles.infoPanelInner}>
            <div className={styles.sectionEyebrow}>ArtLab Shorts</div>
            <h1 className={styles.sectionTitle}>Bite-Sized Art Lessons</h1>
            <p className={styles.sectionDesc}>
              Quick, focused tips from our top instructors. Each short is a preview
              from a full ArtLab course. Swipe through and discover your next class.
            </p>

            <div className={styles.shortList}>
              {MOCK_SHORTS.map((s, i) => (
                <button
                  key={s.id}
                  className={`${styles.shortListItem} ${i === currentIdx ? styles.shortListItemActive : ''}`}
                  onClick={() => setCurrentIdx(i)}
                >
                  <span className={styles.shortListNum}>{i + 1}</span>
                  <div className={styles.shortListText}>
                    <div className={styles.shortListTitle}>{s.title}</div>
                    <div className={styles.shortListAuthor}>{s.instructor} · {s.category}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: phone player + side panel */}
        <div className={styles.playerSection}>
          {/* Phone video player */}
          <div className={styles.phoneFrame}>
            <div className={styles.videoArea} style={{ background: current.gradient }}>
              {/* Watermark */}
              <div className={styles.watermark}>ArtLab.</div>

              {/* Play icon */}
              <div className={styles.playBtn}>
                <Play size={36} fill="white" color="white" />
              </div>

              {/* Bottom overlay */}
              <div className={styles.videoOverlay}>
                <div className={styles.categoryTag}>{current.category}</div>
                <h2 className={styles.videoTitle}>{current.title}</h2>
                <p className={styles.videoAuthor}>{current.instructor}</p>
                <Link href={`/course/${current.courseId}`} className={styles.goCourseBtn}>
                  Go to Full Course →
                </Link>
              </div>

              {/* Mute button */}
              <button className={styles.muteBtn} onClick={() => setMuted(m => !m)}>
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>
          </div>

          {/* Side panel: nav arrows (top) + action buttons (bottom) */}
          <div className={styles.sidePanel}>
            {/* Nav arrows */}
            <div className={styles.navArrows}>
              <button
                className={`${styles.arrowBtn} ${currentIdx === 0 ? styles.arrowDisabled : ''}`}
                onClick={goPrev}
                disabled={currentIdx === 0}
              >
                <ChevronUp size={20} />
              </button>
              <span className={styles.navCounter}>{currentIdx + 1}/{MOCK_SHORTS.length}</span>
              <button
                className={`${styles.arrowBtn} ${currentIdx === MOCK_SHORTS.length - 1 ? styles.arrowDisabled : ''}`}
                onClick={goNext}
                disabled={currentIdx === MOCK_SHORTS.length - 1}
              >
                <ChevronDown size={20} />
              </button>
            </div>

            {/* Action buttons */}
            <div className={styles.actions}>
              <button
                className={`${styles.actionBtn} ${liked.has(current.id) ? styles.actionBtnLiked : ''}`}
                onClick={() => toggleLike(current.id)}
              >
                <Heart size={22} fill={liked.has(current.id) ? '#f43f5e' : 'none'} />
                <span>{current.likes + (liked.has(current.id) ? 1 : 0)}</span>
              </button>
              <button className={styles.actionBtn}>
                <MessageCircle size={22} />
                <span>{current.comments}</span>
              </button>
              <button
                className={`${styles.actionBtn} ${saved.has(current.id) ? styles.actionBtnSaved : ''}`}
                onClick={() => toggleSave(current.id)}
              >
                <Bookmark size={22} fill={saved.has(current.id) ? '#818cf8' : 'none'} />
                <span>Save</span>
              </button>
              <button className={styles.actionBtn}>
                <Share2 size={22} />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: related course card */}
        <div className={styles.coursePanel}>
          <div className={styles.coursePanelInner}>
            <div className={styles.relatedLabel}>From this short</div>
            <div className={styles.relatedCard}>
              <div className={styles.relatedThumb} style={{ background: current.gradient }} />
              <div className={styles.relatedInfo}>
                <div className={styles.relatedCourse}>{current.courseName}</div>
                <div className={styles.relatedInstructor}>{current.instructor}</div>
                <Link href={`/course/${current.courseId}`} className={styles.relatedBtn}>
                  View Course
                </Link>
              </div>
            </div>

            <div className={styles.relatedLabel} style={{ marginTop: 28 }}>Explore More</div>
            <div className={styles.exploreTags}>
              {['Illustration', '3D Art', 'Concept Art', 'Animation', 'Game Design'].map(tag => (
                <Link key={tag} href={`/category/${tag.toLowerCase().replace(' ', '-')}`} className={styles.exploreTag}>
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
