export interface Post {
  id: number;
  title: string;
  body: string;
}

export async function fetchPosts(): Promise<Post[]> {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts', {
    next: { revalidate: 60 }
  });
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}
