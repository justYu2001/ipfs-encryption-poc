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

    const id = parsedQuery.data.id;

    const data = await downloadFileFromIPFS(id);
    
    const file = decryptFile(data);

    response.status(200).send(file);
};

export default apiHandler({
    GET: downloadNote,
});

const decryptFile = (data: string) => {
    const splittedData = data.split(":") as [string, string, string];

    const iv = Buffer.from(splittedData[0], "hex");

    const key = decrypt(splittedData[1]).toString("hex");

    const file = decrypt(splittedData[2], key, iv);

    return file;
};

const downloadFileFromIPFS = async (cid: string) => {
    const node = await create();
    
    const stream = node.cat(cid);
    const decoder = new TextDecoder();
    let data = "";
    
    for await (const chunk of stream) {
        data += decoder.decode(chunk, { stream: true });
    }

    await node.stop();

    return data;
};