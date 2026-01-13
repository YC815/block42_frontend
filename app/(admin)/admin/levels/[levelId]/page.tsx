"use client";

/**
 * Block42 Frontend - Admin level editor page
 */

import { useParams } from "next/navigation";
import { EditorPage } from "@/components/editor/editor-page";

export default function AdminLevelEditorPage() {
  const params = useParams();
  const levelId = params?.levelId as string;

  return <EditorPage levelId={levelId} mode="admin" />;
}
