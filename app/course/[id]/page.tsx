// app/course/[id]/page.tsx
import CourseView from "@/app/components/CourseView";




export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const courseId = parseInt(id);
  return (
    <main className="min-h-screen px-4 py-10">
      <CourseView courseId={courseId} />

    </main>

    
  );
}