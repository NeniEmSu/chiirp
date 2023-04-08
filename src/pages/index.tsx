import { SignInButton, useUser } from "@clerk/nextjs";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { api, type RouterOutputs } from "~/utils/api";

import { LoadingPage } from "~/components/loading";

dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user } = useUser();

  if (!user) return null;

  return (
    <div className="flex w-full gap-3">
      <Image
        src={user?.profileImageUrl}
        alt={user?.username || "User"}
        className="h-12 w-12 rounded-full"
        width={48}
        height={48}
      />
      <input
        type="text"
        name="Emoji"
        id="emoji"
        placeholder="Type some emojis!"
        className="w-full grow border-none bg-transparent focus:outline-none"
      />
    </div>
  );
};

type PostWithUser = RouterOutputs["posts"]["getAll"][number];
const PostView = ({ post }: { post: PostWithUser }) => {
  if (!post) return null;

  return (
    <div className="flex gap-3 border-b border-slate-400 p-4">
      <Image
        src={post?.authorProfileImageUrl}
        alt={post?.authorName || "Author name"}
        className="h-10 w-10 rounded-full"
        width={40}
        height={40}
      />
      <div className="flex flex-col">
        <div className="flex gap-1 text-slate-300">
          <span>{`@${post.authorName || "Author name"} `}</span>
          <span className="font-thin">{` · ${dayjs(
            post.createdAt
          ).fromNow()}`}</span>
        </div>
        <p>{post.content}</p>
      </div>
    </div>
  );
};

const Feed = () => {
  const { data, isLoading, isError } = api.posts.getAll.useQuery();

  if (isLoading) return <LoadingPage />;

  if (isError) return <div>Something went wrong</div>;

  if (!data) return <div>Something went wrong</div>;

  return (
    <>
      <div className="">
        {data?.map((post) => (
          <PostView key={post.id} post={post} />
        ))}
      </div>
    </>
  );
};

const Home: NextPage = () => {
  const { user, isLoaded,  } = useUser();

  //start fetching posts as soon as the page loads
  api.posts.getAll.useQuery();

  if (!isLoaded) return <div></div>;

  if (!user) return <SignInButton />;

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen justify-center">
        <div className="h-full w-full border-x md:max-w-2xl">
          <div className="flex border-b border-slate-400 p-4">
            {!user.isSignedIn ? (
              <div className="flex justify-center">
                <CreatePostWizard />
              </div>
            ) : (
              <SignInButton />
            )}
          </div>
          <Feed />
        </div>
      </main>
    </>
  );
};

export default Home;
