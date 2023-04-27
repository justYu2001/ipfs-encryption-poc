import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import type { BinaryLike } from "crypto";

import { env } from "@/env.mjs";

const ALGORITHM = "aes-256-ctr";
const ENCRYPTION_KEY = env.FILE_ENCRYPTION_KEY;
const IV_LENGTH = 16;

export const encrypt = (data: BinaryLike) => {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encryptedData = cipher.update(data);
    encryptedData = Buffer.concat([encryptedData, cipher.final()]);
    return `${iv.toString("hex")}:${encryptedData.toString("hex")}`;
};

export const decrypt = (data: string) => {
    const splittedData = data.split(":") as [string, string];
    const iv = Buffer.from(splittedData[0], "hex");
    splittedData.shift();
    const encryptedData = Buffer.from(splittedData.join(":"), "hex");
    const decipher = createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decryptedData = decipher.update(encryptedData);
    decryptedData = Buffer.concat([decryptedData, decipher.final()]);
    return decryptedData.toString();
}