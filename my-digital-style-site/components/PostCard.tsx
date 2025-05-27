/* "use client" */
import type { Post } from '@/lib/api';

export default function PostCard({ post }: { post: Post }) {
  return (
    <article className="border rounded-lg p-6 shadow-sm hover:shadow-md transition">
      <h3 className="text-lg font-bold mb-2">{post.title}</h3>
      <p className="text-sm leading-relaxed line-clamp-3">{post.body}</p>
    </article>
  );
}
