"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, PlayCircle } from "lucide-react";
import styles from "./page.module.css";

type Lesson = {
  id: number;
  title: string;
  durationMinutes: number;
  isFreePreview: boolean;
};

type Chapter = {
  id: number;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
};

export default function CurriculumAccordion({ chapters, courseId }: { chapters: Chapter[], courseId: number }) {
  const [openChapters, setOpenChapters] = useState<Set<number>>(new Set([chapters?.[0]?.id]));

  const toggleChapter = (id: number) => {
    setOpenChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (!chapters || chapters.length === 0) {
    return <p style={{ color: '#a1a1aa' }}>Curriculum is being updated.</p>;
  }

  return (
    <div className={styles.curriculum}>
      {chapters.map(chapter => {
        const isOpen = openChapters.has(chapter.id);
        return (
          <div key={chapter.id} className={styles.chapterCard}>
            <button 
              className={styles.chapterHeader} 
              onClick={() => toggleChapter(chapter.id)}
              style={{ width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer' }}
            >
              <div>
                <h3 className={styles.chapterTitle}>Part {chapter.orderIndex}: {chapter.title}</h3>
                <span className={styles.chapterStats}>{chapter.lessons.length} lessons</span>
              </div>
              <ChevronDown size={20} color="#71717a" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
            </button>
            
            {isOpen && (
              <div className={styles.lessonList}>
                {chapter.lessons.map((lesson, index) => (
                  <Link
                    key={lesson.id}
                    href={`/learn/${courseId}/${lesson.id}`}
                    className={styles.lessonRow}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ color: '#52525b', fontSize: '13px', fontWeight: 600, width: '20px' }}>
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                      <PlayCircle size={16} color="#71717a" className={styles.lessonIcon} />
                      <span className={styles.lessonTitle}>{lesson.title}</span>
                    </div>
                    
                    <div className={styles.lessonMeta}>
                      {lesson.isFreePreview && <span className={styles.freeBadge}>Preview</span>}
                      <span className={styles.lessonDuration}>{lesson.durationMinutes} min</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
