import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { PageLayout } from "~/components/layout";
import { PostView } from "~/components/postview";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import { api } from "~/utils/api";

const SinglePostPage: NextPage<{ id: string }> = ({ id }: { id: string }) => {
  const { data: post } = api.posts.getById.useQuery({
    id,
  });
  
  if (!post) return <div>404</div>;

  const {
    content,
    authorName,
  } = post;

  return (
    <>
      <Head>
        <title>{`Chirp 🐦 | ${content} - @${authorName}`}</title>
      </Head>
      <PageLayout>
      <PostView post={post} />
      </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = generateSSGHelper();

  const id = context.params?.id;

  if (typeof id !== "string") throw new Error("no id");

  await ssg.posts.getById.prefetch({ id });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
    },
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};

export default SinglePostPage;
