import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import Replicate from "replicate";
import { Pinecone } from "@pinecone-database/pinecone";
import { env } from "~/env";
const pc = new Pinecone({
  apiKey: env.PINECONE_API_KEY,
});
const db = pc.Index(env.PINECONE_DB);

const replicate = new Replicate({
  auth: env.REPLICATE_API_KEY,
});

export const empRouter = createTRPCRouter({
  addEmp: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        age: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      return {
        name: input.name,
        age: input.age,
      };
    }),
  getEmp: publicProcedure.query(async () => {
    return {
      name: "John Doe",
      age: 30,
    };
  }),
});

export type EmpRouter = typeof empRouter;
