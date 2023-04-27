import { Writable } from "stream";

import type { NextApiHandler, NextApiRequest, PageConfig } from "next";

import { create } from "ipfs-core";
import formidable from "formidable";
import type { Fields, Files, Options } from "formidable";

import { getServerAuthSession } from "@/server/auth"; 
import { prisma } from "@/server/db";
import { encrypt } from "@/utils/aes";

const notesApiHandler: NextApiHandler = async (request, response) => {
    const { method } = request;

    if (method !== "POST" && method !== "GET") {
        return response.status(405).end();
    }

    const session = await getServerAuthSession({
        req: request,
        res: response,
    });

    if (!session) {
        return response.status(401).end();
    }


    try {
        const node = await create();

        const chunks: never[] = [];

        await formdiablePromise(request, {
            ...formdiableConfig,
            fileWriteStreamHandler: () => fileConsumer(chunks),
        });

        const fileData = Buffer.concat(chunks);
        const encryptedFile = encrypt(fileData);

        const file = await node.add(encryptedFile);

        await prisma.note.create({
            data: {
                id: file.cid.toString(),
                ownerId: session.user.id
            }
        });

        return response.status(204).send({
            id: file.cid.toString(),
        });
    } catch (error) {
        console.log(error);
        
        return response.status(500).send({
            message: "Unknown Error",
        })
    }
};

export default notesApiHandler;

export const config: PageConfig = {
    api: {
        bodyParser: false,
    }  
};

const formdiableConfig: Options = {
    keepExtensions: true,
    maxFileSize: 10_000_000,
    maxFieldsSize: 10_000_000,
    maxFields: 7,
    allowEmptyFiles: false,
    multiples: false,
};

interface FormdiablePromise {
    (request: NextApiRequest, options?: Options): Promise<{ fields: Fields; files: Files }>;
}

const formdiablePromise: FormdiablePromise = (request, options) => {
    return new Promise((resolve, reject) => {
        const form = formidable(options);

        form.parse(request, (error, fields, files) => {
            if (error) {
                return reject(error);
            }

            return resolve({fields, files});
        });
    });
};

const fileConsumer = <T = unknown>(acc: T[]) => {
    return new Writable({
        write: (chunk, _enc, next) => {
            acc.push(chunk as T);
            next();
        },
    })
};