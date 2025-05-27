import { useEffect, useState } from "react";

export default function App() {
  const [posts, setPosts] = useState();

  useEffect(() => {
    fetch("https://senseiengineer.com/wp-json/wp/v2/topic?_embed&order=asc")
    .then(res => res.json())
    .then(data => {
      setPosts(data)
    })
  }, []);

  return (
    <>
      <ul class="w-[94%] mx-auto my-[20px]">
				{posts && posts.length > 0 ? (
					posts.map(post => (
            <li id={post.id} class="mb-[18px] text-[16px]">
              ・<a href={"/topic/?" + post.id} class="topicList_link">{new Date(post.modified).toISOString().split('T')[0].replace(/-/g, '.')}　{post.title.rendered}</a>
            </li>
					))
				) : (
          <li>Now Loading...</li>
				)}
      </ul>
    </>
  );
};
