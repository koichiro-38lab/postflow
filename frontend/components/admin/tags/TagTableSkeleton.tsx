import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface TagTableSkeletonProps {
    rowCount: number;
}

// スケルトン行コンポーネント
const SkeletonRow = () => (
    <TableRow className="h-12">
        <TableCell>
            <Skeleton className="h-4 w-2/3" />
        </TableCell>
        <TableCell>
            <Skeleton className="h-4 w-2/3" />
        </TableCell>
        <TableCell>
            <Skeleton className="h-4 w-2/3" />
        </TableCell>
        <TableCell>
            <Skeleton className="h-4 w-2/3" />
        </TableCell>
        <TableCell>
            <Skeleton className="h-4 w-2/3" />
        </TableCell>
    </TableRow>
);

/**
 * タグテーブルのスケルトンローダー
 */
export function TagTableSkeleton({ rowCount }: TagTableSkeletonProps) {
    return (
        <div className="rounded-md border">
            <Table className="min-w-[700px] table-auto">
                <TableHeader>
                    <TableRow>
                        <TableHead className="whitespace-nowrap min-w-[200px]">
                            タグ名
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
                    {Array.from({ length: Math.max(1, rowCount) }).map(
                        (_, index) => (
                            <SkeletonRow key={index} />
                        )
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
