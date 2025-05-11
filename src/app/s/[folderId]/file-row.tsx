import { Folder as FolderIcon, FileIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { deleteFile, deleteFolder } from "~/server/actions";
import type { folders_table, files_table } from "~/server/db/schema";

export function FileRow(props: { 
  file: typeof files_table.$inferSelect;
  isDeleting: boolean;
  onDeleteStart: () => void;
  onDeleteEnd: () => void;
}) {
  const { file, isDeleting, onDeleteStart, onDeleteEnd } = props;

  const handleDelete = async () => {
    onDeleteStart();
    try {
      await deleteFile(file.id);
    } finally {
      onDeleteEnd();
    }
  };

  return (
    <li
      key={file.id}
      className={`hover:bg-gray-750 border-b border-gray-700 px-6 py-4 transition-opacity duration-200 ${
        isDeleting ? "opacity-50" : "opacity-100"
      }`}
    >
      <div className="grid grid-cols-12 items-center gap-4">
        <div className="col-span-6 flex items-center">
          <a
            href={file.url}
            className="flex items-center text-gray-100 hover:text-blue-400"
            target="_blank"
          >
            <FileIcon className="mr-3" size={20} />
            {file.name}
          </a>
        </div>
        <div className="col-span-2 text-gray-400">
          {file.createdAt.toLocaleDateString()}
        </div>
        <div className="col-span-3 text-gray-400">{file.size}</div>
        <div className="col-span-1 text-gray-400">
          <Button
            variant="ghost"
            onClick={handleDelete}
            aria-label="Delete file"
            className="cursor-pointer"
            disabled={isDeleting}
          >
            <Trash2Icon size={20} />
          </Button>
        </div>
      </div>
    </li>
  );
}

export function FolderRow(props: {
  folder: typeof folders_table.$inferSelect;
  isDeleting: boolean;
  onDeleteStart: () => void;
  onDeleteEnd: () => void;
}) {
  const { folder, isDeleting, onDeleteStart, onDeleteEnd } = props;

  const handleDelete = async () => {
    onDeleteStart();
    try {
      await deleteFolder(folder.id);
    } finally {
      onDeleteEnd();
    }
  };

  const FolderContent = () => (
    <div className="flex items-center text-gray-100 hover:text-blue-400">
      <FolderIcon className="mr-3" size={20} />
      {folder.name}
    </div>
  );

  return (
    <li
      key={folder.id}
      className={`hover:bg-gray-750 border-b border-gray-700 px-6 py-4 transition-opacity duration-200 ${
        isDeleting ? "opacity-50" : "opacity-100"
      }`}
    >
      <div className="grid grid-cols-12 items-center gap-4">
        <div className="col-span-6 flex items-center space-x-2">
          {isDeleting ? (
            <FolderContent />
          ) : (
            <Link href={`/s/${folder.id}`}>
              <FolderContent />
            </Link>
          )}
          <Button
            variant="ghost"
            onClick={handleDelete}
            aria-label="Delete folder"
            className="hover:bg-gray-750 cursor-pointer hover:text-red-500/60"
            disabled={isDeleting}
          >
            <Trash2Icon size={20} />
          </Button>
        </div>
        <div className="col-span-3 text-gray-400">
          {folder.createdAt.toLocaleDateString()}
        </div>
      </div>
    </li>
  );
}
