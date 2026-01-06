"use client";

/**
 * Block42 Frontend - Admin dashboard
 */

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  getReviewQueue,
  approveLevel,
  rejectLevel,
  getAllLevels,
  updateAdminLevel,
  deleteAdminLevel,
} from "@/lib/api/admin";
import type { AdminLevelListItem, AdminLevelUpdate } from "@/types/api";
import { ReviewQueue } from "@/components/admin/review-queue";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminDashboardPage() {
  const queueQuery = useQuery({
    queryKey: ["admin", "queue"],
    queryFn: getReviewQueue,
  });
  const levelsQuery = useQuery({
    queryKey: ["admin", "levels"],
    queryFn: getAllLevels,
  });
  const [drafts, setDrafts] = useState<Record<string, AdminLevelUpdate>>({});

  const approveMutation = useMutation({
    mutationFn: (payload: { levelId: string; asOfficial: boolean; officialOrder?: number }) =>
      approveLevel(payload.levelId, {
        as_official: payload.asOfficial,
        official_order: payload.officialOrder,
      }),
    onSuccess: () => {
      toast.success("已通過關卡");
      queueQuery.refetch();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "操作失敗");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (payload: { levelId: string; reason: string }) =>
      rejectLevel(payload.levelId, { reason: payload.reason }),
    onSuccess: () => {
      toast.success("已駁回關卡");
      queueQuery.refetch();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "操作失敗");
    },
  });

  const updateLevelMutation = useMutation({
    mutationFn: (payload: { levelId: string; data: AdminLevelUpdate }) =>
      updateAdminLevel(payload.levelId, payload.data),
    onSuccess: () => {
      toast.success("已更新關卡");
      levelsQuery.refetch();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "更新失敗");
    },
  });

  const deleteLevelMutation = useMutation({
    mutationFn: deleteAdminLevel,
    onSuccess: () => {
      toast.success("已刪除關卡");
      levelsQuery.refetch();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "刪除失敗");
    },
  });

  const updateDraft = (levelId: string, patch: AdminLevelUpdate) => {
    setDrafts((prev) => ({
      ...prev,
      [levelId]: {
        ...(prev[levelId] ?? {}),
        ...patch,
      },
    }));
  };

  const clearDraft = (levelId: string) => {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[levelId];
      return next;
    });
  };

  const getDraftValue = <K extends keyof AdminLevelUpdate>(
    level: AdminLevelListItem,
    key: K
  ) => {
    const draft = drafts[level.id];
    if (!draft || draft[key] === undefined) {
      return level[key as keyof AdminLevelListItem];
    }
    return draft[key] as AdminLevelUpdate[K];
  };

  return (
    <div className="min-h-screen bg-red-50 px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">審核隊列</h1>
          <p className="text-gray-600">管理待審核與全部關卡。</p>
        </div>

        <Tabs defaultValue="queue">
          <TabsList className="bg-white/80">
            <TabsTrigger value="queue">待審核</TabsTrigger>
            <TabsTrigger value="levels">關卡管理</TabsTrigger>
          </TabsList>
          <TabsContent value="queue">
            {queueQuery.isLoading && <div>載入中...</div>}
            {queueQuery.isError && <div className="text-red-500">載入失敗</div>}
            {queueQuery.data && queueQuery.data.length === 0 && (
              <div className="text-gray-500">目前沒有待審核關卡</div>
            )}
            {queueQuery.data && queueQuery.data.length > 0 && (
              <ReviewQueue
                levels={queueQuery.data}
                onApprove={(payload) => approveMutation.mutate(payload)}
                onReject={(payload) => rejectMutation.mutate(payload)}
              />
            )}
          </TabsContent>
          <TabsContent value="levels">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.4)] backdrop-blur">
              {levelsQuery.isLoading && <div>載入中...</div>}
              {levelsQuery.isError && <div className="text-red-500">載入失敗</div>}
              {levelsQuery.data && levelsQuery.data.length === 0 && (
                <div className="text-gray-500">目前沒有關卡</div>
              )}
              {levelsQuery.data && levelsQuery.data.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>名稱</TableHead>
                      <TableHead>作者</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead>官方</TableHead>
                      <TableHead>順序</TableHead>
                      <TableHead>更新時間</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {levelsQuery.data.map((level) => {
                      const draft = drafts[level.id];
                      const hasDraft = draft && Object.keys(draft).length > 0;
                      return (
                        <TableRow key={level.id}>
                          <TableCell className="font-mono text-xs text-slate-500">
                            {level.id}
                          </TableCell>
                          <TableCell>
                            <Input
                              value={(getDraftValue(level, "title") as string) ?? ""}
                              onChange={(event) =>
                                updateDraft(level.id, { title: event.target.value })
                              }
                              className="h-9 w-48"
                            />
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            #{level.author_id}
                          </TableCell>
                          <TableCell>
                            <select
                              className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700"
                              value={getDraftValue(level, "status") as string}
                              onChange={(event) =>
                                updateDraft(level.id, {
                                  status: event.target.value as AdminLevelUpdate["status"],
                                })
                              }
                            >
                              <option value="draft">draft</option>
                              <option value="pending">pending</option>
                              <option value="published">published</option>
                              <option value="rejected">rejected</option>
                            </select>
                          </TableCell>
                          <TableCell>
                            <label className="flex items-center gap-2 text-sm text-slate-600">
                              <input
                                type="checkbox"
                                checked={Boolean(getDraftValue(level, "is_official"))}
                                onChange={(event) =>
                                  updateDraft(level.id, { is_official: event.target.checked })
                                }
                              />
                              官方
                            </label>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              value={String(getDraftValue(level, "official_order") ?? 0)}
                              onChange={(event) =>
                                updateDraft(level.id, {
                                  official_order: Number(event.target.value),
                                })
                              }
                              className="h-9 w-24"
                            />
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {new Date(level.updated_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (!draft || Object.keys(draft).length === 0) return;
                                  updateLevelMutation.mutate(
                                    {
                                      levelId: level.id,
                                      data: draft,
                                    },
                                    {
                                      onSuccess: () => clearDraft(level.id),
                                    }
                                  );
                                }}
                                disabled={!hasDraft}
                              >
                                儲存
                              </Button>
                              <Button size="sm" variant="secondary" asChild>
                                <Link href={`/admin/levels/${level.id}`}>編輯關卡</Link>
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (!confirm("確定要刪除這個關卡嗎？")) return;
                                  deleteLevelMutation.mutate(level.id);
                                }}
                              >
                                刪除
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
