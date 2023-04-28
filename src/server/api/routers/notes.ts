import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { prisma } from "@/server/db";

export const noteRouter = createTRPCRouter({
    fetchNotes: protectedProcedure
        .query(async ({ ctx: { session } }) => {

            return await prisma.note.findMany({
                where: {
                    ownerId: session.user.id,
                }
            });
        }),
});