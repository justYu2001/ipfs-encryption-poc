import type { NextApiHandler } from "next";

import { create } from "ipfs-core";
import z from "zod";

import { getServerAuthSession } from "@/server/auth";
import { apiHandler } from "@/utils/api-route";
import { decrypt } from "@/utils/aes";

const NoteIdSchema = z.object({
    id: z.string(),
});

const downloadNote: NextApiHandler = async (request, response) => {
    const session = await getServerAuthSession({
        req: request,
        res: response,
    });

    if (!session) {
        return response.status(401).end();
    }

    const parsedQuery = NoteIdSchema.safeParse(request.query);

    if (!parsedQuery.success) {
        return response.status(422).send({
            message: "Invalid File ID",
        });
    }

    console.log("downloading");

    const id = parsedQuery.data.id;

    const node = await create();

    const stream = node.cat(id);
    await node.stop();
    const decoder = new TextDecoder();
    let data = "";

    for await (const chunk of stream) {
        data += decoder.decode(chunk, { stream: true });
    }

    const file = decrypt(data);
    response.status(200).send(file);
};

export default apiHandler({
    GET: downloadNote,
});