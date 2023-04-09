import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { z } from "zod";

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

// Create a new ratelimiter, that allows 10 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
});


export const postsRouter = createTRPCRouter({

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.id },
      });

      if (!post) throw new TRPCError({ code: "NOT_FOUND" });

      const user = await clerkClient.users.getUserList({
        userId: [post.authorId],
        limit: 1,
      });

      if (!user[0])
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User not found",
        }); 

      if(!user[0].username || !user[0].profileImageUrl) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User data missing",
        });
      }

      const { username, profileImageUrl } = user[0];
        
      return {
        ...post,
        authorName: username,
        authorProfileImageUrl: profileImageUrl,
      };
    }),

  getPostsByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.post.findMany({
        where: {
          authorId: input.userId,
        },
        orderBy: { createdAt: "desc" },
      });
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
        authorName: user.username,
        authorProfileImageUrl: user.profileImageUrl,
      };
    });
  }),

  create: privateProcedure
    .input(
      z.object({
        content: z.string().emoji("Only emojis are allowed").min(1).max(280),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.userId;

      // Use a constant string to limit all requests with a single ratelimit
      // Or use a userID, apiKey or ip address for individual limits.
      const identifier = "authorId";
      const { success } = await ratelimit.limit(identifier);

      if (!success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Too many requests, Unable to process at this time",
        });
      }

      const post = await ctx.prisma.post.create({
        data: {
          title: "Untitled",
          content: input.content,
          authorId,
        },
      });

      return post;
    }),
});
