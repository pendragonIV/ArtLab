"use client";

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Define the types
type Lesson = { id: number; title: string; durationMinutes: number; };
type Chapter = { id: number; title: string; orderIndex: number; price: number; lessons: Lesson[]; };
type Course = {
  id: number;
  title: string;
  author: string;
  price: number;
  thumbnailUrl: string;
  chapters: Chapter[];
};

export default function ClasscutPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingCart, setAddingCart] = useState(false);
  
  // Store selected chapters: map of courseId -> array of chapterIds
  const [selectedChapters, setSelectedChapters] = useState<{ [courseId: number]: number[] }>({});

  useEffect(() => {
    fetch('http://localhost:5149/api/courses/classcuts')
      .then(res => res.json())
      .then(data => {
        setCourses(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching classcuts:", err);
        setLoading(false);
      });
  }, []);

  const toggleChapter = (courseId: number, chapterId: number) => {
    setSelectedChapters(prev => {
      const currentSelected = prev[courseId] || [];
      if (currentSelected.includes(chapterId)) {
        return { ...prev, [courseId]: currentSelected.filter(id => id !== chapterId) };
      } else {
        return { ...prev, [courseId]: [...currentSelected, chapterId] };
      }
    });
  };

  const calculateTotal = (courseId: number, chapters: Chapter[]) => {
    const selectedIds = selectedChapters[courseId] || [];
    let total = 0;
    selectedIds.forEach(id => {
      const chap = chapters.find(c => c.id === id);
      if (chap) total += chap.price;
    });
    return total;
  };

  const handleAddToCart = async (courseId: number) => {
    if (!session) {
      signIn('google');
      return;
    }
    const selectedIds = selectedChapters[courseId] || [];
    if (selectedIds.length === 0) return;

    setAddingCart(true);
    try {
      // @ts-ignore
      const token = session.backendToken;
      const res = await fetch('http://localhost:5149/api/cart/chapters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(selectedIds)
      });

      if (res.ok) {
        const data = await res.json();
        alert(`✅ ${data.message}`);
        // Clear selection for this course
        setSelectedChapters(prev => ({ ...prev, [courseId]: [] }));
        router.push('/cart');
      } else {
        const err = await res.text();
        alert(`Error: ${err}`);
      }
    } catch (e) {
      alert('An error occurred. Please try again.');
    } finally {
      setAddingCart(false);
    }
  };

  if (loading) return <div style={{ background: '#121212', height: '100vh', color: '#fff', padding: '50px', textAlign: 'center' }}>Loading classcuts...</div>;

  return (
    <>
      <Header />
      <main style={{ minHeight: '80vh', backgroundColor: '#121212', color: '#fff' }}>
        <div style={{ padding: '60px 66px', borderBottom: '1px solid #27272a', background: 'linear-gradient(180deg, #18181b 0%, #121212 100%)' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '12px' }}>ArtLab Classcut</h1>
          <p style={{ fontSize: '18px', color: '#a1a1aa' }}>Pay only for what you need. Select and buy specific chapters of a course.</p>
        </div>
        
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 66px' }}>
          
          {courses.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#a0a0a0', padding: '100px 0' }}>
              <h2>No courses currently offer Classcut.</h2>
            </div>
          ) : (
            courses.map(course => {
              const selectedIds = selectedChapters[course.id] || [];
              const total = calculateTotal(course.id, course.chapters);
              
              return (
                <div key={course.id} style={{ display: 'flex', gap: '40px', background: '#18181b', borderRadius: '12px', padding: '24px', border: '1px solid #27272a', marginBottom: '32px' }}>
                  <div style={{ width: '300px', flexShrink: 0 }}>
                    <img 
                      src={course.thumbnailUrl} 
                      alt={course.title} 
                      style={{ width: '100%', borderRadius: '8px', marginBottom: '16px', aspectRatio: '16/9', objectFit: 'cover' }}
                    />
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>{course.title}</h2>
                    <p style={{ color: '#a0a0a0', fontSize: '14px', marginBottom: '16px' }}>{course.author}</p>
                    <div style={{ fontSize: '14px', color: '#facc15' }}>Full Course: ${course.price.toFixed(2)}</div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #333' }}>
                      Available Chapters (Select multiple)
                    </h3>
                    
                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px', paddingRight: '10px' }}>
                      {course.chapters.length > 0 ? course.chapters.map(chapter => (
                        <div 
                          key={chapter.id} 
                          onClick={() => toggleChapter(course.id, chapter.id)}
                          style={{ 
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                            padding: '16px', background: selectedIds.includes(chapter.id) ? '#2a2000' : '#27272a', 
                            border: selectedIds.includes(chapter.id) ? '1px solid #facc15' : '1px solid transparent',
                            borderRadius: '8px', marginBottom: '12px', cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ 
                              width: '20px', height: '20px', borderRadius: '4px', 
                              border: selectedIds.includes(chapter.id) ? 'none' : '2px solid #666',
                              background: selectedIds.includes(chapter.id) ? '#facc15' : 'transparent',
                              display: 'flex', justifyContent: 'center', alignItems: 'center'
                            }}>
                              {selectedIds.includes(chapter.id) && <span style={{ color: '#000', fontSize: '14px', fontWeight: 'bold' }}>✓</span>}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', marginBottom: '4px', color: selectedIds.includes(chapter.id) ? '#facc15' : '#fff' }}>
                                {chapter.orderIndex}. {chapter.title}
                              </div>
                              <div style={{ fontSize: '13px', color: '#a0a0a0' }}>{chapter.lessons?.length || 0} Lessons</div>
                            </div>
                          </div>
                          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>${chapter.price.toFixed(2)}</span>
                        </div>
                      )) : (
                        <p style={{ color: '#888' }}>No chapters available.</p>
                      )}
                    </div>
                    
                    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ color: '#a0a0a0', fontSize: '14px', marginRight: '10px' }}>Selected: {selectedIds.length}</span>
                        <span style={{ fontSize: '24px', fontWeight: 'bold' }}>Total: ${total.toFixed(2)}</span>
                      </div>
                      <button 
                        disabled={selectedIds.length === 0 || addingCart}
                        onClick={() => handleAddToCart(course.id)}
                        style={{ 
                          background: selectedIds.length > 0 ? '#facc15' : '#444', 
                          color: selectedIds.length > 0 ? '#000' : '#888', 
                          border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold',
                          cursor: selectedIds.length > 0 && !addingCart ? 'pointer' : 'not-allowed',
                          fontSize: '16px'
                        }}
                      >
                        {addingCart ? 'Adding...' : `Add ${selectedIds.length} Chapter${selectedIds.length !== 1 ? 's' : ''} to Cart`}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
