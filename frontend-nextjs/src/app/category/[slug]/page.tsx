import Header from '@/components/Header';
import CourseCard from '@/components/CourseCard';
import styles from './page.module.css';

// Define the type for a course matching what the backend returns
type Course = {
  id: number;
  title: string;
  author: string;
  category: string;
  price: number;
  originalPrice: number;
  thumbnailUrl: string;
  isTrending?: boolean;
  isNew?: boolean;
};

// Next.js 14 server component dynamic route
export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  // Wait for the slug parameter
  const { slug } = await params;
  
  // Format slug for display (e.g. "3d-art" -> "3D Art", "concept-art" -> "Concept Art")
  const formattedCategory = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  let courses: Course[] = [];
  try {
    // Fetch courses filtered by category from our ASP.NET Core backend
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/courses?category=${slug}`, {
      // In development, Next.js caches aggressively. We use revalidate 0 for live updates.
      next: { revalidate: 0 }
    });
    
    if (res.ok) {
      courses = await res.json();
    }
  } catch (error) {
    console.error("Failed to fetch courses for category:", error);
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.heroSection}>
          <h1 className={styles.categoryTitle}>{formattedCategory} Classes</h1>
          <p className={styles.categoryDesc}>Master {formattedCategory.toLowerCase()} from industry-leading professionals.</p>
        </div>

        <div className={styles.container}>
          {courses.length > 0 ? (
            <div className={styles.grid}>
              {courses.map((course) => (
                <CourseCard 
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  author={course.author}
                  price={course.price}
                  originalPrice={course.originalPrice}
                  thumbnailUrl={course.thumbnailUrl}
                  isTrending={course.isTrending}
                  isNew={course.isNew}
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <h2>No courses found</h2>
              <p>We're working on adding new {formattedCategory.toLowerCase()} courses soon!</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
