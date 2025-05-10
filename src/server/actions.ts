"use server";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { files_table, folders_table } from "./db/schema";
import { auth } from "@clerk/nextjs/server";
import { UTApi } from "uploadthing/server";
import { cookies } from "next/headers";

const utApi = new UTApi();

export async function deleteFile(fileId: number) {
  const session = await auth();
  if (!session.userId) {
    return { error: "Unauthorized" };
  }

  const [file] = await db
    .select()
    .from(files_table)
    .where(
      and(eq(files_table.id, fileId), eq(files_table.ownerId, session.userId)),
    );

  if (!file) {
    return { error: "File not found" };
  }

  const utapiResult = await utApi.deleteFiles([
    file.url.replace("https://utfs.io/f/", ""),
  ]);

  console.log(utapiResult);

  const dbDeleteResult = await db
    .delete(files_table)
    .where(eq(files_table.id, fileId));

  console.log(dbDeleteResult);

  const c = await cookies();

  c.set("force-refresh", JSON.stringify(Math.random()));

  return { success: true };
}

export async function deleteFolder(folderId: number) {
  const session = await auth();
  if (!session.userId) {
    return { error: "Unauthorized" };
  }

  // First verify the folder exists and user has permission
  const [folder] = await db
    .select()
    .from(folders_table)
    .where(
      and(
        eq(folders_table.id, folderId),
        eq(folders_table.ownerId, session.userId),
      ),
    );

  if (!folder) {
    return { error: "Folder not found" };
  }

  // Get all subfolders recursively
  const getAllSubfolders = async (parentId: number): Promise<number[]> => {
    const subfolders = await db
      .select({ id: folders_table.id })
      .from(folders_table)
      .where(
        and(
          eq(folders_table.parent, parentId),
          eq(folders_table.ownerId, session.userId),
        ),
      );

    const subfolderIds = subfolders.map((f) => f.id);
    const childSubfolders = await Promise.all(
      subfolderIds.map((id) => getAllSubfolders(id)),
    );

    return [...subfolderIds, ...childSubfolders.flat()];
  };

  // Get all files in the folder and its subfolders
  const getAllFiles = async (folderIds: number[]) => {
    return db
      .select()
      .from(files_table)
      .where(
        and(
          inArray(files_table.parent, folderIds),
          eq(files_table.ownerId, session.userId),
        ),
      );
  };

  // Get all subfolder IDs including the target folder
  const allFolderIds = [folderId, ...(await getAllSubfolders(folderId))];

  // Get and delete all files
  const files = await getAllFiles(allFolderIds);
  for (const file of files) {
    await utApi.deleteFiles([file.url.replace("https://utfs.io/f/", "")]);
    await db.delete(files_table).where(eq(files_table.id, file.id));
  }

  // Delete all folders in reverse order (children first)
  for (const id of allFolderIds.reverse()) {
    await db
      .delete(folders_table)
      .where(
        and(
          eq(folders_table.id, id),
          eq(folders_table.ownerId, session.userId),
        ),
      );
  }

  const c = await cookies();
  c.set("force-refresh", JSON.stringify(Math.random()));

  return { success: true };
}

export async function createFolder(name: string, parentId: number) {
  const session = await auth();
  if (!session.userId) {
    return { error: "Unauthorized" };
  }

  const dbInsertResult = await db.insert(folders_table).values({
    name,
    ownerId: session.userId,
    parent: parentId,
  });

  console.log(dbInsertResult);

  const c = await cookies();

  c.set("force-refresh", JSON.stringify(Math.random()));

  return { success: true };
}