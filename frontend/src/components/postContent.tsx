import { TPost } from "core/types";
import TextPost from "components/textPost";
import CodePost from "components/codePost";

export default function PostContent({ post }: { post: TPost }) {
  switch (post.type) {
    case "text":
      return <TextPost post={post} />;
    case "code":
      return <CodePost post={post} />;
  }
}
