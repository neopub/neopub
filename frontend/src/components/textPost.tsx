import { ITextPost } from "core/types";

export default function TextPost({ post }: { post: ITextPost }) {
  return <div>{post.content.text}</div>;
}
