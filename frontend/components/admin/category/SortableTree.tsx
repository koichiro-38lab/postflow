"use client";
import React, { useMemo, useState, useCallback } from "react";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";
import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    DragMoveEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
} from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Folder, ChevronRight } from "lucide-react";

// ツリー構造の型
export type TreeItem = {
    id: string;
    name: string;
    children?: TreeItem[];
};

// フラット化したアイテム型
export type FlattenedItem = {
    id: string;
    name: string;
    parentId: string | null;
    depth: number;
};

// ドロップゾーンの種類
type DropPosition = "before" | "after" | "inside";

// ツリーをフラット化する関数
function flatten(
    items: TreeItem[],
    parentId: string | null = null,
    depth = 0
): FlattenedItem[] {
    return (items || []).reduce<FlattenedItem[]>(
        (acc, item) => [
            ...acc,
            { id: item.id, name: item.name, parentId, depth },
            ...(item.children
                ? flatten(item.children, item.id, depth + 1)
                : []),
        ],
        []
    );
}

// フラット配列からツリー構造に戻す関数
function buildTree(flatItems: FlattenedItem[]): TreeItem[] {
    // IDでマッピング
    const map = new Map<string, TreeItem>();
    flatItems.forEach((item) => {
        map.set(item.id, { id: item.id, name: item.name, children: [] });
    });

    // 親子関係を構築
    const roots: TreeItem[] = [];
    flatItems.forEach((item) => {
        const treeItem = map.get(item.id)!;
        if (item.parentId && map.has(item.parentId)) {
            map.get(item.parentId)!.children!.push(treeItem);
        } else {
            roots.push(treeItem);
        }
    });

    return roots;
}

// ドロップ位置を計算
function getDropPosition(event: DragMoveEvent, rect: DOMRect): DropPosition {
    const y = event.delta.y;
    const relativeY = y / rect.height;

    if (relativeY < -0.3) return "before";
    if (relativeY > 0.3) return "after";
    return "inside";
}

// 移動可能かチェック（循環参照の防止）
function canMoveItem(
    activeId: string,
    targetId: string,
    flatItems: FlattenedItem[]
): boolean {
    // 自分自身への移動は不可
    if (activeId === targetId) return false;

    // activeIdの子孫にtargetIdが含まれていないかチェック
    const isDescendant = (parentId: string, childId: string): boolean => {
        const children = flatItems.filter((item) => item.parentId === parentId);
        return children.some(
            (child) => child.id === childId || isDescendant(child.id, childId)
        );
    };

    return !isDescendant(activeId, targetId);
}

// アイテム移動の実装
function moveItem(
    flatItems: FlattenedItem[],
    activeId: string,
    targetId: string,
    position: DropPosition
): FlattenedItem[] {
    // 移動可能かチェック
    if (!canMoveItem(activeId, targetId, flatItems)) {
        return flatItems;
    }

    const activeItem = flatItems.find((item) => item.id === activeId)!;
    const targetItem = flatItems.find((item) => item.id === targetId)!;

    // 新しいparentIdとdepthを決定
    let newParentId: string | null;
    let newDepth: number;

    if (position === "inside") {
        newParentId = targetId;
        newDepth = targetItem.depth + 1;
    } else {
        newParentId = targetItem.parentId;
        newDepth = targetItem.depth;
    }

    // 全ての子孫アイテムを取得する関数（再帰的に取得）
    const getAllDescendants = (parentId: string): string[] => {
        const descendants: string[] = [];
        const directChildren = flatItems.filter(
            (item) => item.parentId === parentId
        );

        for (const child of directChildren) {
            descendants.push(child.id);
            descendants.push(...getAllDescendants(child.id));
        }

        return descendants;
    };

    // activeIdの全ての子孫を取得
    const allDescendants = getAllDescendants(activeId);

    // 深度の差分を計算
    const depthDiff = newDepth - activeItem.depth;

    // まず親子関係と深度を更新
    let updatedItems = flatItems.map((item) => {
        if (item.id === activeId) {
            // activeItem自体を更新
            return { ...item, parentId: newParentId, depth: newDepth };
        } else if (allDescendants.includes(item.id)) {
            // activeIdの子孫の深度を調整
            return { ...item, depth: item.depth + depthDiff };
        }
        return item;
    });

    // before/afterの場合は位置も調整
    if (position !== "inside") {
        // アクティブアイテムとその子孫をすべて取得
        const itemsToMove = [activeId, ...allDescendants];
        const itemsToMoveObjects = updatedItems.filter((item) =>
            itemsToMove.includes(item.id)
        );

        // 移動対象以外のアイテムを取得
        const remainingItems = updatedItems.filter(
            (item) => !itemsToMove.includes(item.id)
        );

        // ターゲットの位置を見つける
        const targetIndex = remainingItems.findIndex(
            (item) => item.id === targetId
        );
        const insertIndex =
            position === "before" ? targetIndex : targetIndex + 1;

        // 新しい配列を構築
        updatedItems = [
            ...remainingItems.slice(0, insertIndex),
            ...itemsToMoveObjects,
            ...remainingItems.slice(insertIndex),
        ];
    }

    return updatedItems;
}

// Drag overlay用のコンポーネント
function OverlayItem({ item }: { item: FlattenedItem }) {
    return (
        <div
            className="flex items-center p-2 shadow-lg bg-background border rounded-md"
            style={{ paddingLeft: `${item.depth * 24}px` }}
        >
            <GripVertical className="h-4 w-4 text-muted-foreground mr-2" />
            <Folder className="h-4 w-4 text-muted-foreground mr-2" />
            <span>{item.name}</span>
        </div>
    );
}

// メインツリーコンポーネント
export function SortableTree({
    items,
    onChange,
    onInvalidMove,
    renderItem,
}: {
    items: TreeItem[];
    onChange?: (newItems: TreeItem[]) => void;
    onInvalidMove?: (reason: string) => void;
    renderItem?: (
        item: FlattenedItem,
        listeners?: ReturnType<typeof useSortable>["listeners"],
        attributes?: ReturnType<typeof useSortable>["attributes"]
    ) => React.ReactNode;
}) {
    // ドラッグ状態とドロップ位置の管理
    const [activeId, setActiveId] = useState<string | null>(null);
    const [dropPosition, setDropPosition] = useState<DropPosition | null>(null);
    const [overId, setOverId] = useState<string | null>(null);

    // フラット化されたアイテム
    const flattenedItems = useMemo(() => flatten(items), [items]);

    // ソート可能なアイテムのID一覧
    const ids = useMemo(
        () => flattenedItems.map((item) => item.id),
        [flattenedItems]
    );

    // センサー設定
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

    // ドラッグ開始
    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(String(event.active.id));
    }, []);

    // ドラッグ中の処理
    const handleDragMove = useCallback((event: DragMoveEvent) => {
        if (!event.over) {
            setDropPosition(null);
            setOverId(null);
            return;
        }

        const targetId = String(event.over.id);
        setOverId(targetId);

        // ドロップ位置を計算
        const rect = event.over.rect;
        if (rect) {
            // ClientRect を DOMRect に変換
            const domRect = new DOMRect(
                rect.left,
                rect.top,
                rect.width,
                rect.height
            );
            const position = getDropPosition(event, domRect);
            setDropPosition(position);
        }
    }, []);

    // ドラッグ終了
    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;

            setActiveId(null);
            setDropPosition(null);
            setOverId(null);

            if (!over || !dropPosition) return;

            const activeIdStr = String(active.id);
            const overIdStr = String(over.id);

            // アクティブアイテムとターゲットアイテムを取得
            const activeItem = flattenedItems.find(
                (item) => item.id === activeIdStr
            );
            const targetItem = flattenedItems.find(
                (item) => item.id === overIdStr
            );

            if (!activeItem || !targetItem) return;

            // 子カテゴリ（depth > 0）の親変更を検知
            if (activeItem.depth > 0) {
                let newParentId: string | null;

                if (dropPosition === "inside") {
                    newParentId = targetItem.id;
                } else {
                    newParentId = targetItem.parentId;
                }

                // 親が変わる場合は移動を拒否
                if (activeItem.parentId !== newParentId) {
                    onInvalidMove?.("子カテゴリの移動はできません。");
                    return;
                }
            }

            // 移動処理
            const newFlatItems = moveItem(
                flattenedItems,
                activeIdStr,
                overIdStr,
                dropPosition
            );

            // ツリー構造に戻して更新
            const newTree = buildTree(newFlatItems);
            onChange?.(newTree);
        },
        [flattenedItems, dropPosition, onChange, onInvalidMove]
    );

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                <Table className="min-w-[700px] table-auto">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="whitespace-nowrap min-w-[220px]">
                                カテゴリー名
                            </TableHead>
                            <TableHead className="whitespace-nowrap min-w-[140px]">
                                スラッグ
                            </TableHead>
                            <TableHead className="whitespace-nowrap min-w-[80px]">
                                投稿数
                            </TableHead>
                            <TableHead className="whitespace-nowrap min-w-[160px]">
                                作成日
                            </TableHead>
                            <TableHead className="whitespace-nowrap min-w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {flattenedItems.map((item) => (
                            <SortableTreeRow
                                key={item.id}
                                item={item}
                                renderItem={renderItem}
                                isOver={overId === item.id}
                                dropPosition={
                                    overId === item.id ? dropPosition : null
                                }
                            />
                        ))}
                    </TableBody>
                </Table>
            </SortableContext>
            <DragOverlay>
                {activeId &&
                    (() => {
                        // ドラッグ中のアイテムを取得して表示
                        const activeItem = flattenedItems.find(
                            (i) => i.id === activeId
                        );
                        return activeItem ? (
                            <div className="pointer-events-none z-50">
                                <OverlayItem item={activeItem} />
                            </div>
                        ) : null;
                    })()}
            </DragOverlay>
        </DndContext>
    );
}

// Sortableな1行のコンポーネント
function SortableTreeRow({
    item,
    renderItem,
}: {
    item: FlattenedItem;
    renderItem?: (
        item: FlattenedItem,
        listeners?: ReturnType<typeof useSortable>["listeners"],
        attributes?: ReturnType<typeof useSortable>["attributes"]
    ) => React.ReactNode;
    isOver: boolean;
    dropPosition: DropPosition | null;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    // スタイル適用
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    } as React.CSSProperties;

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            className={`${isDragging ? "opacity-50" : ""}`}
        >
            {renderItem ? (
                renderItem(item, listeners, attributes)
            ) : (
                <>
                    <TableCell
                        style={{ paddingLeft: `${item.depth * 24}px` }}
                        className="whitespace-nowrap min-w-[220px]"
                    >
                        <div className="flex items-center">
                            <div
                                {...attributes}
                                {...listeners}
                                className="cursor-grab inline-block mr-2 p-1 hover:bg-gray-100 rounded"
                                style={{ touchAction: "none" }}
                            >
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                            {item.depth > 0 && (
                                <ChevronRight className="h-4 w-4 text-muted-foreground mr-1" />
                            )}
                            <Folder className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{item.name}</span>
                        </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap min-w-[140px]">
                        {item.id}
                    </TableCell>
                    <TableCell className="whitespace-nowrap min-w-[80px]">
                        0
                    </TableCell>
                    <TableCell className="whitespace-nowrap min-w-[160px]">
                        -
                    </TableCell>
                    <TableCell className="whitespace-nowrap min-w-[80px]">
                        編集
                    </TableCell>
                </>
            )}
        </TableRow>
    );
}
