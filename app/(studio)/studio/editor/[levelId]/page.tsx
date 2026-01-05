"use client";

/**
 * Block42 Frontend - Edit level page
 */

import { useParams } from "next/navigation";
import { EditorPage } from "@/components/editor/editor-page";

export default function EditorDetailPage() {
  const params = useParams();
  const levelId = params.levelId as string;

  return <EditorPage levelId={levelId} />;
}
