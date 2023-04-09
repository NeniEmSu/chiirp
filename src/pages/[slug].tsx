import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

import { createServerSideHelpers } from "@trpc/react-query/server";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import Link from "next/link";
import superjson from "superjson";
import { PageLayout } from "~/components/layout";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";

dayjs.extend(relativeTime);

const ProfileFeed = ({
  userId,
  profileImageUrl,
  username,
}: {
  userId: string;
  profileImageUrl: string;
  username: string;
}) => {
  const { data: posts, isLoading } = api.posts.getPostsByUserId.useQuery({
    userId,
  });

  if (isLoading) return <div>Loading...</div>;

  if (!posts) return <div>User had no posts yet.</div>;

  return (
    <div className="flex flex-col space-y-1">
      {posts?.map((post) => (
        <div key={post.id} className="rounded-md bg-purple-900 p-4">
          <div className="flex items-center space-x-4">
            <Image
              src={profileImageUrl}
              alt={`${username ?? ""}'s profile pic`}
              className="h-12 w-12 rounded-full border-2 border-purple-500 bg-purple-500"
          width={48}
          height={48}
            />
            <div className="flex flex-col">
              <div className="text-lg font-bold">
                <span className="text-purple-500">@</span>
                {username}
                <Link href={`/post/${post?.id}`}>
                  <span className="font-thin">{` · ${dayjs(
                    post.createdAt
                  ).fromNow()}`}</span>
                </Link>
              </div>
              <div className="mt-4 text-lg">{post.content}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const ProfilePage: NextPage<{ username: string }> = ({ username }) => {
  const { data } = api.profile.getUserByUsername.useQuery({
    username,
  });

  if (!data) return <div>404</div>;

  const { username: dataUsername, profileImageUrl, id: userId } = data;

  return (
    <>
      <Head>
        <title>{`Chirp 🐦 | @${dataUsername || "Author"} Profile`}</title>
      </Head>
      <PageLayout>
        <div className="relative h-36 bg-slate-500">
          <Image
            src={profileImageUrl}
            alt={`${dataUsername ?? ""}'s profile pic`}
            width={128}
            height={128}
            className="absolute bottom-0 left-0 -mb-[64px] ml-4 rounded-full border-4 border-purple-500 bg-purple-500"
          />
        </div>
        <div className="h-[64px]"></div>
        <div className="p-4 text-2xl font-bold">
          <span className="text-purple-500">@</span>
          {`${data.username ?? ""}`}
        </div>
        <div className="w-full border-b border-slate-400">
          <ProfileFeed
            userId={userId}
            profileImageUrl={profileImageUrl}
            username={dataUsername || "neniemsu"}
          />
        </div>
      </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: { prisma, userId: null },
    transformer: superjson, // optional - adds superjson serialization
  });

  const slug = context.params?.slug;

  if (typeof slug !== "string") throw new Error("no slug");

  const username = slug.replace("@", "");

  await ssg.profile.getUserByUsername.prefetch({ username });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      username,
    },
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};

export default ProfilePage;
