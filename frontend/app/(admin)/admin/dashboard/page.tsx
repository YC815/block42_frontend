"use client";

/**
 * Block42 Frontend - Admin dashboard
 */

import { useState, useMemo, useRef, type ChangeEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  getReviewQueue,
  approveLevel,
  rejectLevel,
  getAllLevels,
  getAdminLevelById,
  updateAdminLevel,
  deleteAdminLevel,
  getAllUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  transferAdminLevels,
} from "@/lib/api/admin";
import type {
  AdminLevelListItem,
  AdminLevelUpdate,
  AdminUserCreate,
  AdminUserUpdate,
  LevelConfig,
  LevelStatus,
  MapData,
  User,
} from "@/types/api";
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
import { useAuth } from "@/lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_PADDING, ensureStartFloor } from "@/lib/map-utils";

const LEVEL_BATCH_VERSION = 1;
const VALID_STATUSES: LevelStatus[] = ["draft", "pending", "published", "rejected"];

type ExportScope = "all" | "official" | "community";

interface ExportLevelEntry {
  id: string;
  title: string;
  map: MapData;
  config: LevelConfig;
  status: LevelStatus;
  is_official: boolean;
  official_order: number;
  author_id: number;
  author_name?: string | null;
}

interface BatchExportPayload {
  version: number;
  exported_at: string;
  scope: ExportScope;
  levels: ExportLevelEntry[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toInteger(value: unknown): number | null {
  const parsed = toNumber(value);
  if (parsed === null) return null;
  return Number.isInteger(parsed) ? parsed : null;
}

function isTileColor(value: unknown): value is "R" | "G" | "B" {
  return value === "R" || value === "G" || value === "B";
}

function isLevelStatus(value: unknown): value is LevelStatus {
  return VALID_STATUSES.includes(value as LevelStatus);
}

function normalizeMapData(mapData: MapData): MapData {
  return ensureStartFloor({
    ...mapData,
    padding: mapData.padding ?? DEFAULT_PADDING,
    tiles: mapData.tiles ?? [],
    stars: mapData.stars ?? [],
    start: {
      ...mapData.start,
      dir: mapData.start.dir ?? 1,
    },
  });
}

function coerceMapData(value: unknown): MapData | null {
  if (!isRecord(value)) return null;
  const startRaw = value.start;
  if (!isRecord(startRaw)) return null;
  const startX = toInteger(startRaw.x);
  const startY = toInteger(startRaw.y);
  if (startX === null || startY === null) return null;
  const dirRaw = toInteger(startRaw.dir);
  const dir = dirRaw !== null && [0, 1, 2, 3].includes(dirRaw)
    ? (dirRaw as 0 | 1 | 2 | 3)
    : (1 as 0 | 1 | 2 | 3);

  const tilesRaw = Array.isArray(value.tiles) ? value.tiles : [];
  const tiles: MapData["tiles"] = [];
  for (const tile of tilesRaw) {
    if (!isRecord(tile)) return null;
    const x = toInteger(tile.x);
    const y = toInteger(tile.y);
    if (x === null || y === null || !isTileColor(tile.color)) return null;
    tiles.push({ x, y, color: tile.color });
  }

  const starsRaw = Array.isArray(value.stars) ? value.stars : [];
  const stars: MapData["stars"] = [];
  for (const star of starsRaw) {
    if (!isRecord(star)) return null;
    const x = toInteger(star.x);
    const y = toInteger(star.y);
    if (x === null || y === null) return null;
    stars.push({ x, y });
  }

  const padding = toInteger(value.padding);
  const mapData: MapData = {
    start: { x: startX, y: startY, dir },
    tiles,
    stars,
  };

  if (padding !== null) {
    mapData.padding = padding;
  }

  return normalizeMapData(mapData);
}

function coerceLevelConfig(value: unknown): LevelConfig | null {
  if (!isRecord(value)) return null;
  const f0 = toInteger(value.f0);
  const f1 = toInteger(value.f1);
  const f2 = toInteger(value.f2);
  if (f0 === null || f1 === null || f2 === null) return null;
  if (!isRecord(value.tools)) return null;
  const { paint_red, paint_green, paint_blue } = value.tools;
  if (
    typeof paint_red !== "boolean" ||
    typeof paint_green !== "boolean" ||
    typeof paint_blue !== "boolean"
  ) {
    return null;
  }
  return {
    f0,
    f1,
    f2,
    tools: {
      paint_red,
      paint_green,
      paint_blue,
    },
  };
}

function downloadJson(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildExportFilename(scope: ExportScope) {
  const date = new Date().toISOString().slice(0, 10);
  return `levels-${scope}-${date}.json`;
}

function extractLevelId(entry: Record<string, unknown>): string | null {
  const direct = entry.id ?? entry.level_id ?? entry.levelId;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  if (typeof direct === "number") return String(direct);
  const meta = entry.meta;
  if (isRecord(meta)) {
    const metaId = meta.level_id ?? meta.levelId;
    if (typeof metaId === "string" && metaId.trim()) return metaId.trim();
    if (typeof metaId === "number") return String(metaId);
  }
  return null;
}

function extractImportItems(raw: unknown): unknown[] | null {
  if (Array.isArray(raw)) return raw;
  if (!isRecord(raw)) return null;
  if (Array.isArray(raw.levels)) return raw.levels;
  if (Array.isArray(raw.items)) return raw.items;
  if (isRecord(raw.level)) return [raw.level];
  if (raw.map && raw.config) return [raw];
  return null;
}

function parseImportEntry(entry: unknown): { id: string; data: AdminLevelUpdate } | null {
  if (!isRecord(entry)) return null;
  const normalized = isRecord(entry.level) ? entry.level : entry;
  const id = extractLevelId(normalized) ?? extractLevelId(entry);
  if (!id) return null;
  const mapValue = normalized.map ?? normalized.map_data ?? normalized.mapData;
  const configValue = normalized.config ?? normalized.level_config ?? normalized.levelConfig;
  if (!mapValue || !configValue) return null;
  const map = coerceMapData(mapValue);
  const config = coerceLevelConfig(configValue);
  if (!map || !config) return null;

  const payload: AdminLevelUpdate = { map, config };
  if (typeof normalized.title === "string" && normalized.title.trim()) {
    payload.title = normalized.title.trim();
  }
  if (isLevelStatus(normalized.status)) {
    payload.status = normalized.status;
  }
  const isOfficial = normalized.is_official ?? normalized.isOfficial;
  if (typeof isOfficial === "boolean") {
    payload.is_official = isOfficial;
  }
  const officialOrderValue = normalized.official_order ?? normalized.officialOrder;
  const officialOrder = toInteger(officialOrderValue);
  if (officialOrder !== null) {
    payload.official_order = officialOrder;
  }

  return { id, data: payload };
}

export default function AdminDashboardPage() {
  const { user: currentUser } = useAuth();
  const queueQuery = useQuery({
    queryKey: ["admin", "queue"],
    queryFn: getReviewQueue,
    refetchOnMount: "always",
  });
  const levelsQuery = useQuery({
    queryKey: ["admin", "levels"],
    queryFn: getAllLevels,
    refetchOnMount: "always",
  });
  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: getAllUsers,
    refetchOnMount: "always",
  });
  const [drafts, setDrafts] = useState<Record<string, AdminLevelUpdate>>({});
  const [userDrafts, setUserDrafts] = useState<Record<number, AdminUserUpdate>>({});
  const [newUser, setNewUser] = useState<AdminUserCreate>({
    username: "",
    password: "",
    is_superuser: false,
  });
  const [batchExporting, setBatchExporting] = useState(false);
  const [batchImporting, setBatchImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferUser, setTransferUser] = useState<User | null>(null);
  const [transferLevels, setTransferLevels] = useState<AdminLevelListItem[]>([]);
  const [transferAssignments, setTransferAssignments] = useState<Record<string, number>>({});
  const [bulkAssignee, setBulkAssignee] = useState<string>("");

  // 排序與過濾邏輯
  const allLevels = useMemo(() => {
    if (!levelsQuery.data) return [];
    return [...levelsQuery.data].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [levelsQuery.data]);

  const officialLevels = useMemo(() => {
    if (!levelsQuery.data) return [];
    return [...levelsQuery.data]
      .filter(level => level.is_official)
      .sort((a, b) => a.official_order - b.official_order);
  }, [levelsQuery.data]);

  const communityLevels = useMemo(() => {
    if (!levelsQuery.data) return [];
    return [...levelsQuery.data]
      .filter(level => !level.is_official)
      .sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [levelsQuery.data]);

  const nextOfficialOrder = useMemo(() => {
    if (!officialLevels.length) return 1;
    return Math.max(...officialLevels.map(l => l.official_order)) + 1;
  }, [officialLevels]);

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

  const createUserMutation = useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => {
      toast.success("已建立使用者");
      usersQuery.refetch();
      setNewUser({ username: "", password: "", is_superuser: false });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "建立失敗");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (payload: { userId: number; data: AdminUserUpdate }) =>
      updateAdminUser(payload.userId, payload.data),
    onSuccess: () => {
      toast.success("已更新使用者");
      usersQuery.refetch();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "更新失敗");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => {
      toast.success("已刪除使用者");
      usersQuery.refetch();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "刪除失敗");
    },
  });

  const transferLevelsMutation = useMutation({
    mutationFn: (payload: { userId: number; transfers: { level_id: string; new_author_id: number }[] }) =>
      transferAdminLevels(payload.userId, { transfers: payload.transfers }),
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "轉移失敗");
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

  const updateUserDraft = (userId: number, patch: AdminUserUpdate) => {
    setUserDrafts((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] ?? {}),
        ...patch,
      },
    }));
  };

  const clearUserDraft = (userId: number) => {
    setUserDrafts((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };

  const getUserDraftValue = <K extends keyof AdminUserUpdate>(
    user: User,
    key: K
  ) => {
    const draft = userDrafts[user.id];
    if (!draft || draft[key] === undefined) {
      return user[key as keyof User];
    }
    return draft[key] as AdminUserUpdate[K];
  };

  const openTransferDialog = (account: User, levels: AdminLevelListItem[]) => {
    setTransferUser(account);
    setTransferLevels(levels);
    setTransferAssignments({});
    setBulkAssignee("");
    setTransferDialogOpen(true);
  };

  const handleBatchExport = async (scope: ExportScope) => {
    const sourceLevels =
      scope === "official" ? officialLevels : scope === "community" ? communityLevels : allLevels;
    if (!sourceLevels.length) {
      toast.error("沒有可匯出的關卡");
      return;
    }

    setBatchExporting(true);
    try {
      const results = await Promise.allSettled(
        sourceLevels.map((level) => getAdminLevelById(level.id))
      );
      const successes = results
        .filter(
          (result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof getAdminLevelById>>> =>
            result.status === "fulfilled"
        )
        .map((result) => result.value);
      const failedCount = results.length - successes.length;

      if (!successes.length) {
        toast.error("匯出失敗");
        return;
      }

      const payload: BatchExportPayload = {
        version: LEVEL_BATCH_VERSION,
        exported_at: new Date().toISOString(),
        scope,
        levels: successes.map((level) => ({
          id: level.id,
          title: level.title,
          map: level.map,
          config: level.config,
          status: level.status,
          is_official: level.is_official,
          official_order: level.official_order,
          author_id: level.author_id,
          author_name: level.author_name ?? null,
        })),
      };

      downloadJson(buildExportFilename(scope), JSON.stringify(payload, null, 2));
      if (failedCount > 0) {
        toast.error(`匯出完成，但有 ${failedCount} 個關卡失敗`);
      } else {
        toast.success(`已匯出 ${successes.length} 個關卡`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "匯出失敗");
    } finally {
      setBatchExporting(false);
    }
  };

  const handleBatchImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setBatchImporting(true);
    try {
      const text = await file.text();
      const raw = JSON.parse(text) as unknown;
      const items = extractImportItems(raw);
      if (!items || items.length === 0) {
        toast.error("JSON 內沒有可匯入的關卡");
        return;
      }

      const parsed = items
        .map(parseImportEntry)
        .filter((item): item is { id: string; data: AdminLevelUpdate } => item !== null);
      const skipped = items.length - parsed.length;

      if (!parsed.length) {
        toast.error("沒有有效的關卡資料");
        return;
      }

      const confirmMessage = [
        `即將更新 ${parsed.length} 個關卡`,
        skipped > 0 ? `略過 ${skipped} 個項目` : null,
      ]
        .filter(Boolean)
        .join("，");

      if (!confirm(`${confirmMessage}。是否繼續？`)) return;

      const results = await Promise.allSettled(
        parsed.map((item) => updateAdminLevel(item.id, item.data))
      );
      const successCount = results.filter((result) => result.status === "fulfilled").length;
      const failedCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`已更新 ${successCount} 個關卡`);
        levelsQuery.refetch();
      }
      if (failedCount > 0) {
        toast.error(`有 ${failedCount} 個關卡更新失敗`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "匯入失敗");
    } finally {
      setBatchImporting(false);
    }
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

  const renderLevelTable = (levels: AdminLevelListItem[]) => (
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
        {levels.map((level) => {
          const draft = drafts[level.id];
          const hasDraft = draft && Object.keys(draft).length > 0;
          const authorLabel = level.author_name ?? `#${level.author_id}`;
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
                {authorLabel}
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
  );

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
            <TabsTrigger value="users">帳號管理</TabsTrigger>
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
              {levelsQuery.data && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                    <div>
                      <div className="text-sm font-semibold text-slate-700">
                        批量匯入 / 匯出
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        匯出包含 map/config，匯入會直接覆蓋關卡內容。
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={batchExporting || batchImporting}
                        onClick={() => handleBatchExport("all")}
                      >
                        匯出全部
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={batchExporting || batchImporting}
                        onClick={() => handleBatchExport("official")}
                      >
                        匯出官方
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={batchExporting || batchImporting}
                        onClick={() => handleBatchExport("community")}
                      >
                        匯出社群
                      </Button>
                      <Button
                        size="sm"
                        disabled={batchExporting || batchImporting}
                        onClick={() => importInputRef.current?.click()}
                      >
                        匯入 JSON
                      </Button>
                      <input
                        ref={importInputRef}
                        type="file"
                        accept="application/json,.json"
                        onChange={handleBatchImport}
                        className="hidden"
                      />
                    </div>
                  </div>
                  {levelsQuery.data.length === 0 && (
                    <div className="text-gray-500">目前沒有關卡</div>
                  )}
                  {levelsQuery.data.length > 0 && (
                    <Tabs defaultValue="all" className="space-y-4">
                      <TabsList className="bg-white/80">
                        <TabsTrigger value="all">全部</TabsTrigger>
                        <TabsTrigger value="official">官方</TabsTrigger>
                        <TabsTrigger value="community">社群</TabsTrigger>
                      </TabsList>

                      <TabsContent value="all">
                        {renderLevelTable(allLevels)}
                      </TabsContent>

                      <TabsContent value="official">
                        <div className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
                          目前官方關卡數：<span className="font-semibold">{officialLevels.length}</span>
                          {" "}• 下一個順序：<span className="font-semibold">{nextOfficialOrder}</span>
                        </div>
                        {renderLevelTable(officialLevels)}
                      </TabsContent>

                      <TabsContent value="community">
                        {renderLevelTable(communityLevels)}
                      </TabsContent>
                    </Tabs>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="users">
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.4)] backdrop-blur">
                <div className="text-sm font-semibold text-slate-700">建立新帳號</div>
                <div className="mt-3 grid gap-3 md:grid-cols-[1.4fr_1fr_auto]">
                  <Input
                    placeholder="使用者名稱"
                    value={newUser.username}
                    onChange={(event) =>
                      setNewUser((prev) => ({ ...prev, username: event.target.value }))
                    }
                  />
                  <Input
                    type="password"
                    placeholder="初始密碼"
                    value={newUser.password}
                    onChange={(event) =>
                      setNewUser((prev) => ({ ...prev, password: event.target.value }))
                    }
                  />
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={newUser.is_superuser}
                      onChange={(event) =>
                        setNewUser((prev) => ({ ...prev, is_superuser: event.target.checked }))
                      }
                    />
                    管理員
                  </label>
                </div>
                <div className="mt-3">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!newUser.username.trim() || !newUser.password.trim()) {
                        toast.error("請填寫使用者名稱與密碼");
                        return;
                      }
                      createUserMutation.mutate(newUser);
                    }}
                  >
                    建立帳號
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.4)] backdrop-blur">
                {usersQuery.isLoading && <div>載入中...</div>}
                {usersQuery.isError && <div className="text-red-500">載入失敗</div>}
                {usersQuery.data && usersQuery.data.length === 0 && (
                  <div className="text-gray-500">目前沒有使用者</div>
                )}
                {usersQuery.data && usersQuery.data.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>帳號</TableHead>
                        <TableHead>角色</TableHead>
                        <TableHead>關卡數</TableHead>
                        <TableHead>新密碼</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersQuery.data.map((account) => {
                        const draft = userDrafts[account.id];
                        const hasDraft = draft && Object.keys(draft).length > 0;
                        const isSelf = account.id === currentUser?.id;
                        const authoredLevels =
                          levelsQuery.data?.filter((level) => level.author_id === account.id) ?? [];
                        return (
                          <TableRow key={account.id}>
                            <TableCell className="font-mono text-xs text-slate-500">
                              {account.id}
                            </TableCell>
                            <TableCell>
                              <Input
                                value={(getUserDraftValue(account, "username") as string) ?? ""}
                                onChange={(event) =>
                                  updateUserDraft(account.id, { username: event.target.value })
                                }
                                className="h-9 w-48"
                              />
                            </TableCell>
                            <TableCell>
                              <label className="flex items-center gap-2 text-sm text-slate-600">
                                <input
                                  type="checkbox"
                                  checked={Boolean(getUserDraftValue(account, "is_superuser"))}
                                  onChange={(event) =>
                                    updateUserDraft(account.id, {
                                      is_superuser: event.target.checked,
                                    })
                                  }
                                />
                                管理員
                              </label>
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                              {authoredLevels.length}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="password"
                                placeholder="重設密碼"
                                value={(draft?.password as string) ?? ""}
                                onChange={(event) =>
                                  updateUserDraft(account.id, { password: event.target.value })
                                }
                                className="h-9 w-40"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (!draft || Object.keys(draft).length === 0) return;
                                    const payload = { ...draft };
                                    if (!payload.password) delete payload.password;
                                    updateUserMutation.mutate(
                                      { userId: account.id, data: payload },
                                      {
                                        onSuccess: () => clearUserDraft(account.id),
                                      }
                                    );
                                  }}
                                  disabled={!hasDraft}
                                >
                                  儲存
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={isSelf}
                                  onClick={() => {
                                    if (isSelf) return;
                                    if (authoredLevels.length > 0) {
                                      openTransferDialog(account, authoredLevels);
                                      return;
                                    }
                                    if (!confirm("確定要刪除這個帳號嗎？")) return;
                                    deleteUserMutation.mutate(account.id);
                                  }}
                                >
                                  刪除
                                </Button>
                              </div>
                              {isSelf && (
                                <div className="mt-1 text-xs text-slate-400">
                                  無法刪除自己
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>轉移關卡後刪除帳號</DialogTitle>
            <DialogDescription>
              此帳號仍有 {transferLevels.length} 個關卡，請指定新的擁有者。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <span className="text-slate-600">批次指定：</span>
              <Select
                value={bulkAssignee}
                onValueChange={(value) => setBulkAssignee(value)}
              >
                <SelectTrigger className="w-[200px]" size="sm">
                  <SelectValue placeholder="選擇使用者" />
                </SelectTrigger>
                <SelectContent>
                  {(usersQuery.data ?? [])
                    .filter((user) => user.id !== transferUser?.id)
                    .map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {user.username} #{user.id}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  if (!bulkAssignee) return;
                  const targetId = Number(bulkAssignee);
                  const nextAssignments = { ...transferAssignments };
                  transferLevels.forEach((level) => {
                    nextAssignments[level.id] = targetId;
                  });
                  setTransferAssignments(nextAssignments);
                }}
              >
                套用到全部
              </Button>
            </div>
            <div className="max-h-[320px] space-y-3 overflow-auto pr-2">
              {transferLevels.map((level) => (
                <div
                  key={level.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      {level.title}
                    </div>
                    <div className="text-xs text-slate-400">{level.id}</div>
                  </div>
                  <Select
                    value={transferAssignments[level.id]?.toString() ?? ""}
                    onValueChange={(value) =>
                      setTransferAssignments((prev) => ({
                        ...prev,
                        [level.id]: Number(value),
                      }))
                    }
                  >
                    <SelectTrigger className="w-[200px]" size="sm">
                      <SelectValue placeholder="指定新擁有者" />
                    </SelectTrigger>
                    <SelectContent>
                      {(usersQuery.data ?? [])
                        .filter((user) => user.id !== transferUser?.id)
                        .map((user) => (
                          <SelectItem key={user.id} value={String(user.id)}>
                            {user.username} #{user.id}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setTransferDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!transferUser) return;
                const missing = transferLevels.filter(
                  (level) => !transferAssignments[level.id]
                );
                if (missing.length > 0) {
                  toast.error("請為所有關卡指定新擁有者");
                  return;
                }
                const transfers = transferLevels.map((level) => ({
                  level_id: level.id,
                  new_author_id: transferAssignments[level.id],
                }));
                try {
                  await transferLevelsMutation.mutateAsync({
                    userId: transferUser.id,
                    transfers,
                  });
                  await deleteUserMutation.mutateAsync(transferUser.id);
                  setTransferDialogOpen(false);
                } catch {
                  // errors handled in mutations
                }
              }}
            >
              轉移並刪除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
