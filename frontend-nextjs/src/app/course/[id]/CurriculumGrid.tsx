"use client";

import React, { useState } from 'react';
import { Play, Lock } from 'lucide-react';
import Link from 'next/link';

type Lesson = {
  id: number;
  title: string;
  durationMinutes: number;
  isFreePreview: boolean;
  orderIndex: number;
};

type Chapter = {
  id: number;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
};

export default function CurriculumGrid({ chapters, courseId }: { chapters: Chapter[], courseId: number }) {
  if (!chapters || chapters.length === 0) return <p style={{ color: '#a1a1aa' }}>No curriculum available yet.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', marginTop: '24px' }}>
      {chapters.map((chapter) => (
        <div key={chapter.id}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#6366f1', fontSize: '14px', background: 'rgba(99, 102, 241, 0.1)', padding: '4px 12px', borderRadius: '99px' }}>Part {chapter.orderIndex}</span>
            {chapter.title}
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
            {chapter.lessons.map((lesson) => (
              <Link 
                href={lesson.isFreePreview ? `/learn/${courseId}/${lesson.id}` : '#'}
                key={lesson.id} 
                style={{ 
                  background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', 
                  padding: '20px', textDecoration: 'none', transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', gap: '12px',
                  cursor: lesson.isFreePreview ? 'pointer' : 'default',
                  opacity: lesson.isFreePreview ? 1 : 0.7
                }}
                className="curriculumCard"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 600 }}>Lesson {lesson.orderIndex}</span>
                  {lesson.isFreePreview ? (
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#000', background: '#4ade80', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>Preview</span>
                  ) : (
                    <Lock size={14} color="#71717a" />
                  )}
                </div>
                
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#fff', lineHeight: 1.4, flex: 1 }}>{lesson.title}</h4>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#71717a', fontSize: '13px', marginTop: 'auto' }}>
                  <Play size={14} />
                  <span>{lesson.durationMinutes} min</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
      <style dangerouslySetInnerHTML={{__html: `
        .curriculumCard:hover {
          transform: translateY(-4px);
          border-color: #3f3f46 !important;
          background: #27272a !important;
        }
      `}} />
    </div>
  );
}
