import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const postsRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 10,
      skip: 0,
      orderBy: { createdAt: "desc" },
    });

    const users = await clerkClient.users.getUserList({
      userId: posts.map((post) => post.authorId),
      limit: 10,
    });

    return posts.map((post) => {
      const user = users.find((user) => user.id === post.authorId);
      if (!user)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User not found",
        });
      return {
        ...post,
        authorName: user?.lastName,
        authorProfileImageUrl: user?.profileImageUrl,
      };
    });
  }),

  create: privateProcedure
    .input(z.object({ content: z.string().emoji().min(1).max(280) }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.create({
        data: {
          title: "Untitled",
          content: input.content,
          authorId: ctx.userId,
        },
      });

      return post;
    }),
});
