import "server-only";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env";
import { contentDisposition } from "./access";

let client: S3Client | null = null;

function r2(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${env.r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.r2AccessKeyId,
        secretAccessKey: env.r2SecretAccessKey,
      },
    });
  }
  return client;
}

export const UPLOAD_URL_TTL_SEC = 60 * 30;
export const STREAM_URL_TTL_SEC = 60 * 60 * 6;
export const DOWNLOAD_URL_TTL_SEC = 60 * 10;

export function signUploadUrl(key: string, contentType: string): Promise<string> {
  return getSignedUrl(
    r2(),
    new PutObjectCommand({ Bucket: env.r2Bucket, Key: key, ContentType: contentType }),
    { expiresIn: UPLOAD_URL_TTL_SEC },
  );
}

export function signStreamUrl(key: string): Promise<string> {
  return getSignedUrl(r2(), new GetObjectCommand({ Bucket: env.r2Bucket, Key: key }), {
    expiresIn: STREAM_URL_TTL_SEC,
  });
}

export function signDownloadUrl(key: string, fileName: string): Promise<string> {
  return getSignedUrl(
    r2(),
    new GetObjectCommand({
      Bucket: env.r2Bucket,
      Key: key,
      ResponseContentDisposition: contentDisposition(fileName),
    }),
    { expiresIn: DOWNLOAD_URL_TTL_SEC },
  );
}

export async function deleteObjects(keys: string[]): Promise<void> {
  const unique = [...new Set(keys.filter(Boolean))];
  for (let i = 0; i < unique.length; i += 1000) {
    const chunk = unique.slice(i, i + 1000);
    await r2().send(
      new DeleteObjectsCommand({
        Bucket: env.r2Bucket,
        Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
      }),
    );
  }
}
