import { cache } from 'react';
import { fetchPosts } from './api';

export const usePosts = cache(async () => {
  return await fetchPosts();
});
