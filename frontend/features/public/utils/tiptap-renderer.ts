/**
 * TipTap JSON を HTML に変換するユーティリティ
 */

import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import MediaImage from "@/lib/tiptap/extensions/media-image";

// TipTap拡張機能の設定(管理画面と完全に同じ拡張を使用)
// StarterKit に含まれる Link を無効化してカスタム Link を使用
const extensions = [
    StarterKit.configure({
        link: false, // StarterKit の Link を無効化
    }),
    MediaImage.configure({
        allowBase64: false,
    }),
    Link.configure({
        openOnClick: false,
        HTMLAttributes: {
            class: "text-blue-600 hover:text-blue-800 underline dark:text-blue-400 dark:hover:text-blue-300",
        },
    }),
    Table.configure({
        resizable: false,
    }),
    TableRow,
    TableHeader,
    TableCell,
];

/**
 * TipTap JSON を HTML 文字列に変換
 * @param contentJson - TipTap JSON 文字列
 * @returns HTML 文字列
 */
export function renderTipTapContent(contentJson: string): string {
    try {
        // 空文字列チェック
        if (!contentJson || contentJson.trim() === "") {
            return "<p>コンテンツがありません。</p>";
        }

        const json = JSON.parse(contentJson);

        // JSONの形式チェック
        if (!json || typeof json !== "object") {
            console.error("Invalid TipTap JSON format:", json);
            return "<p>コンテンツの形式が正しくありません。</p>";
        }

        // docノードがない場合は包む
        const content =
            json.type === "doc" ? json : { type: "doc", content: [json] };

        // 各ノードタイプを確認
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const checkNodeTypes = (node: any, path = "root"): void => {
            if (node.type) {
                console.log(`[TipTap] Node at ${path}: type="${node.type}"`);
            }
            if (node.content && Array.isArray(node.content)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                node.content.forEach((child: any, index: number) => {
                    checkNodeTypes(child, `${path}.content[${index}]`);
                });
            }
        };

        if (process.env.NODE_ENV === "development") {
            checkNodeTypes(content);
            console.log(
                "[TipTap] Available extensions:",
                extensions.map((e) => e.name).join(", ")
            );
        }

        return generateHTML(content, extensions);
    } catch (error) {
        console.error("Failed to render TipTap content:", error);
        if (process.env.NODE_ENV === "development") {
            return `<p>コンテンツの読み込みに失敗しました。</p><pre class="p-4 rounded overflow-auto">${
                error instanceof Error ? error.message : String(error)
            }</pre>`;
        }
        return "<p>コンテンツの読み込みに失敗しました。</p>";
    }
}

/**
 * TipTap JSON から抜粋テキストを生成
 * @param contentJson - TipTap JSON 文字列
 * @param maxLength - 最大文字数（デフォルト: 160）
 * @returns 抜粋テキスト
 */
export function generateExcerpt(contentJson: string, maxLength = 160): string {
    try {
        const json = JSON.parse(contentJson);

        // テキストノードからプレーンテキストを抽出
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const extractText = (node: any): string => {
            if (node.type === "text") {
                return node.text || "";
            }
            if (node.content && Array.isArray(node.content)) {
                return node.content.map(extractText).join("");
            }
            return "";
        };

        const text = extractText(json);
        const trimmed = text.trim();

        if (trimmed.length <= maxLength) {
            return trimmed;
        }

        return trimmed.substring(0, maxLength).trim() + "...";
    } catch (error) {
        console.error("Failed to generate excerpt:", error);
        return "";
    }
}
