import type { NextApiHandler } from "next";

import { create } from "ipfs-core";
import type { Options as IPFSConfig } from "ipfs-core";
import z from "zod";

import { env } from "@/env.mjs";
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

    const id = parsedQuery.data.id;

    const ipfsConfig: IPFSConfig | undefined = env.NODE_ENV === "production" ? {
        repo: "/tmp",
    } : undefined;

    const node = await create(ipfsConfig);

    const stream = node.cat(id);
    const decoder = new TextDecoder();
    let data = "";
    
    for await (const chunk of stream) {
        data += decoder.decode(chunk, { stream: true });
    }
    
    const file = decrypt(data);
    await node.stop();
    response.status(200).send(file);
};

export default apiHandler({
    GET: downloadNote,
});