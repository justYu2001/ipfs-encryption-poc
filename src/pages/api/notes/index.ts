import { randomBytes } from "crypto";
import { Writable } from "stream";

import type { NextApiHandler, NextApiRequest, PageConfig } from "next";

import { create } from "ipfs-core";
import formidable from "formidable";
import type { Fields, Files, Options } from "formidable";

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

    const node = await create({ repo: "/tmp" });

    const { fileData, fileExtension } = await getFile(request);

    const encryptedData = encryptFile(fileData);

    const file = await node.add(encryptedData);
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

const encryptFile = (fileData: Buffer) => {
    const key = randomBytes(16);
    const iv = randomBytes(16);
    const encryptedFile = encrypt(fileData, key.toString("hex"), iv);
    const encryptedKey = encrypt(key);

    return `${iv.toString("hex")}:${encryptedKey}:${encryptedFile}`;
};

export default apiHandler({
    POST: uploadNote,
});

export const config: PageConfig = {
    api: {
        bodyParser: false,
    }  
};

const getFile = async (request: NextApiRequest) => {
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

    return {
        fileData: Buffer.concat(chunks),
        fileExtension,
    };
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