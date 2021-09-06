import { ICodePost } from "core/types";

export default function CodePost({ post }: { post: ICodePost }) {
  return <pre>{post.content.code}</pre>;
}
