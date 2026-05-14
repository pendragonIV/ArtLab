import { backendFetch } from '@/lib/http';
import FeaturedCoursesClient from './FeaturedCoursesClient';

// Define the type for the course data returned from the backend
type Course = {
  id: number;
  title: string;
  author: string;
  category: string;
  price: number;
  originalPrice: number;
  thumbnailUrl: string;
  isNew: boolean;
  isTrending: boolean;
};

export default async function FeaturedCourses() {
  let courses: Course[] = [];
  try {
    const res = await backendFetch('/api/courses', { cache: 'no-store' }, { name: 'FeaturedCourses' });
    if (res.ok) {
      courses = await res.json();
    }
  } catch (error) {
    console.error("[FeaturedCourses] fetch failed:", error);
  }

  return <FeaturedCoursesClient courses={courses} />;
}
