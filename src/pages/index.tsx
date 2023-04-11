import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

import { useState } from "react";
import toast from "react-hot-toast";
import { PageLayout } from "~/components/layout";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import { PostView } from "~/components/postview";

dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user } = useUser();

  const [input, setInput] = useState("");

  const ctx = api.useContext();

  const { mutate: createPost, isLoading: isPosting } =
    api.posts.create.useMutation({
      onSuccess: () => {
        setInput("");
        void ctx.posts.getAll.invalidate();
      },
      onError: (err) => {
        toast.error(
          err.data?.zodError?.fieldErrors?.content?.[0] ||
            "Something went wrong"
        );
      },
    });

  if (!user) return null;

  return (
    <div className="flex w-full gap-3">
      <div className=" flex justify-center items-center h-9 w-9 rounded-full border-2 border-purple-500 bg-purple-500">
        <UserButton />
      </div>

      <input
        placeholder="Type some emojis and click enter to post!"
        className="grow bg-transparent outline-none"
        type="text"
        name="emoji"
        id="emoji"
        value={input}
        onChange={(e) => setInput(e.currentTarget.value)}
        onKeyDown={(e) => {
          e.preventDefault();
          if (e.key === "Enter") {
            createPost({ content: e.currentTarget.value });
          }
        }}
        disabled={isPosting}
      />
      {input !== "" && !isPosting && (
        <button
          type="submit"
          className="rounded-md border-2 bg-transparent px-6 py-2 text-white transition-colors duration-200 hover:border-slate-400 hover:text-slate-400"
          onClick={() => {
            createPost({ content: input });
          }}
          disabled={isPosting}
        >
          Post
        </button>
      )}
      {isPosting && (
        <div className="flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};

const Feed = () => {
  const { data, isLoading, isError } = api.posts.getAll.useQuery();

  if (isLoading) return <LoadingPage />;

  if (isError) return <div>Something went wrong</div>;

  if (!data) return <div>Something went wrong</div>;

  return (
    <div className="">
      {data?.map((post) => (
        <PostView key={post.id} post={post} />
      ))}
    </div>
  );
};

const Home: NextPage = () => {
  const { isLoaded, isSignedIn } = useUser();

  //start fetching posts as soon as the page loads
  api.posts.getAll.useQuery();

  if (!isLoaded) return <div></div>;

  return (
    <>
      <Head>
        <title>Chirp 🐦</title>
        <meta name="description" content="🐦 Emoji tweet app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageLayout>
        <div className="flex border-b border-slate-400 p-4">
          {isSignedIn ? (
            <CreatePostWizard />
          ) : (
            <div className="flex justify-center">
              <SignInButton />{" "}
            </div>
          )}
        </div>
        <Feed />
      </PageLayout>
    </>
  );
};

export default Home;
