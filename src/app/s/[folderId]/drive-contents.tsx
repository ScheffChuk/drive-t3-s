"use client";

import { ChevronRight, FolderUp } from "lucide-react";
import "@uploadthing/react/styles.css";

import type { files_table, folders_table } from "~/server/db/schema";
import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { UploadButton } from "~/components/uploadthing";
import { useRouter } from "next/navigation";
import { FileRow, FolderRow } from "./file-row";
import { Button } from "~/components/ui/button";
import { createFolder } from "~/server/actions";
import { useState } from "react";

export default function DriveContents(props: {
  files: (typeof files_table.$inferSelect)[];
  folders: (typeof folders_table.$inferSelect)[];
  parents: (typeof folders_table.$inferSelect)[];
  currentFolderId: number;
}) {
  const navigate = useRouter();
  const [deletingItems, setDeletingItems] = useState<Set<number>>(new Set());

  const handleCreateFolder = async () => {
    const folderName = prompt("Enter folder name:");
    if (!folderName) return;
    await createFolder(folderName, props.currentFolderId);
    navigate.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-gray-100">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/"
              className="mr-2 text-gray-300 hover:text-white"
            ></Link>
            {props.parents.map((folder, index) => (
              <div key={folder.id} className="flex items-center">
                <ChevronRight className="mx-2 text-gray-500" size={16} />
                <Link
                  href={`/s/${folder.id}`}
                  className="text-gray-300 hover:text-white"
                >
                  {folder.name}
                </Link>
              </div>
            ))}
          </div>
          <div className="flex flex-row items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => handleCreateFolder()}
            >
              <FolderUp className="text-gray-500" size={24} />
              <span className="text-gray-900">Create Folder</span>
            </Button>
            <SignedOut>
              <SignInButton />
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
        <div className="rounded-lg bg-gray-800 shadow-xl">
          <div className="border-b border-gray-700 px-6 py-4">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-400">
              <div className="col-span-6">Name</div>
              <div className="col-span-2">Created at</div>
              <div className="col-span-3">Size</div>
              <div className="col-span-1"></div>
            </div>
          </div>
          <ul>
            {props.folders.map((folder) => (
              <FolderRow
                key={folder.id}
                folder={folder}
                isDeleting={deletingItems.has(folder.id)}
                onDeleteStart={() => {
                  setDeletingItems((prev) => new Set([...prev, folder.id]));
                }}
                onDeleteEnd={() => {
                  setDeletingItems((prev) => {
                    const next = new Set(prev);
                    next.delete(folder.id);
                    return next;
                  });
                }}
              />
            ))}
            {props.files.map((file) => (
              <FileRow
                key={file.id}
                file={file}
                isDeleting={deletingItems.has(file.id)}
                onDeleteStart={() => {
                  setDeletingItems((prev) => new Set([...prev, file.id]));
                }}
                onDeleteEnd={() => {
                  setDeletingItems((prev) => {
                    const next = new Set(prev);
                    next.delete(file.id);
                    return next;
                  });
                }}
              />
            ))}
          </ul>
        </div>
        <UploadButton
          endpoint="driveUploader"
          onBeforeUploadBegin={(files) => {
            return files;
          }}
          onClientUploadComplete={() => {
            navigate.refresh();
          }}
          input={{
            folderId: props.currentFolderId,
          }}
        />
      </div>
    </div>
  );
}
