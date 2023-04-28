import { Writable } from "stream";

import type { NextApiHandler, NextApiRequest, PageConfig } from "next";

import { create } from "ipfs-core";
import formidable from "formidable";
import type { Fields, Files, Options } from "formidable";

import { env } from "@/env.mjs";
import { getServerAuthSession } from "@/server/auth"; 
import { prisma } from "@/server/db";
import { encrypt } from "@/utils/aes";
import { apiHandler } from "@/utils/api-route";

const uploadNote: NextApiHandler = async (request, response) => {
    const session = await getServerAuthSession({
        req: request,
        res: response,
    });

    if (!session) {
        return response.status(401).end();
    }

    const node = await create();

    const chunks: never[] = [];
    let fileExtension = "";

    await formdiablePromise(request, {
        ...formdiableConfig,
        fileWriteStreamHandler: () => fileConsumer(chunks),
        filename: (name, extension) => {
            fileExtension = extension;
            return `${name}.${extension}`;
        },
    });

    const fileData = Buffer.concat(chunks);
    const encryptedFile = encrypt(fileData);

    const file = await node.add(encryptedFile);
    await node.stop();

    await prisma.note.create({
        data: {
            id: file.cid.toString(),
            ownerId: session.user.id,
            fileExtension,
        }
    });

    return response.status(200).send({
        id: file.cid.toString(),
    });
};

export default apiHandler({
    POST: uploadNote,
});

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
    uploadDir: env.NODE_ENV === "production" ? "/tmp" : "",
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