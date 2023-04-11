import type { RouterOutputs } from "~/utils/api";

import dayjs from "dayjs";
import Image from "next/image";
import Link from "next/link";

import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

type PostWithUser = RouterOutputs["posts"]["getAll"][number];
export const PostView = ({ post }: { post: PostWithUser }) => {
  if (!post) return null;

  return (
    <Link href={`/post/${post?.id}`} className="flex gap-3 border-b border-slate-400 p-4">
      <Link href={`/@${post?.authorName || "Author"}`}>
        <Image
          src={post?.authorProfileImageUrl}
          alt={post?.authorName || "Author name"}
          className="h-12 w-12 rounded-full border-2 border-purple-500 bg-purple-500"
          width={48}
          height={48}
        />
      </Link>
      <div className="flex flex-col">
        <div className="flex gap-1 text-slate-300">
          <Link href={`/@${post?.authorName || "Author"}`}>
            {" "}
            <span className="text-bold"><span className="text-purple-500">@</span>{`${
              post.authorName || "Author name"
            } `}</span>
          </Link>
          <Link href={`/post/${post?.id}`}>
            <span className="font-thin">{` · ${dayjs(
              post.createdAt
            ).fromNow()}`}</span>
          </Link>
        </div>
        <p className="text-2xl">{post.content}</p>
      </div>
    </Link>
  );
};