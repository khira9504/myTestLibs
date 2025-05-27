import { usePosts } from '@/lib/usePosts';
import PostCard from '@/components/PostCard';

export default async function PostList() {
  const posts = await usePosts();
  return (
    <section id="posts" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-4 pb-16">
      {posts.slice(0, 12).map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </section>
  );
}
