import { mergeAttributes } from "@tiptap/core";
import Image from "@tiptap/extension-image";

export type ImageAlignment = "left" | "center" | "right";
export type ImageSize = "sm" | "md" | "lg" | "full";

interface ImageLink {
    href: string;
    target?: string;
    rel?: string;
}

export const MediaImage = Image.extend({
    name: "mediaImage",
    inline: false,
    group: "block",
    draggable: true,
    addCommands() {
        return {
            setMediaImage:
                (options: {
                    src: string;
                    alt?: string;
                    title?: string;
                    align?: ImageAlignment;
                    size?: ImageSize;
                    link?: ImageLink | null;
                    caption?: string | null;
                }) =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ({ commands }: any) => {
                    return commands.insertContent({
                        type: this.name,
                        attrs: {
                            src: options.src,
                            alt: options.alt || "",
                            title: options.title || "",
                            align: options.align || "center",
                            size: options.size || "lg",
                            link: options.link || null,
                            caption: options.caption || null,
                        },
                    });
                },
        };
    },
    addAttributes() {
        return {
            src: {
                default: null,
            },
            alt: {
                default: null,
            },
            title: {
                default: null,
            },
            align: {
                default: "center" satisfies ImageAlignment,
                parseHTML: (element: HTMLElement) =>
                    element.getAttribute("data-align") || "center",
            },
            size: {
                default: "lg" satisfies ImageSize,
                parseHTML: (element: HTMLElement) =>
                    element.getAttribute("data-size") || "lg",
            },
            link: {
                default: null,
                parseHTML: (element: HTMLElement) => {
                    const a = element.querySelector("a");
                    if (a) {
                        return {
                            href: a.getAttribute("href"),
                            target: a.getAttribute("target"),
                            rel: a.getAttribute("rel"),
                        };
                    }
                    return null;
                },
            },
            caption: {
                default: null,
                parseHTML: (element: HTMLElement) => {
                    const figcaption = element.querySelector("figcaption");
                    return figcaption ? figcaption.textContent : null;
                },
            },
        };
    },
    renderHTML({
        HTMLAttributes,
    }: {
        HTMLAttributes: Record<string, unknown>;
    }) {
        const {
            align = "center",
            size = "lg",
            link,
            caption,
            ...rest
        } = HTMLAttributes;
        const figureAttributes = mergeAttributes(
            {
                "data-align": align,
                "data-size": size,
                class: `tiptap-figure align-${align} size-${size}`,
            },
            HTMLAttributes.class ? { class: HTMLAttributes.class } : {}
        );

        const imageAttributes = mergeAttributes(rest);
        const children = [["img", imageAttributes]];

        // キャプションがある場合、figcaptionを追加
        if (caption) {
            children.push([
                "figcaption",
                { class: "tiptap-figcaption" },
                caption,
            ]);
        }

        if (link && typeof link === "object" && "href" in link && link.href) {
            const linkObj = link as ImageLink;
            const linkAttrs = {
                href: linkObj.href,
                ...(linkObj.target && { target: linkObj.target }),
                ...(linkObj.rel && { rel: linkObj.rel }),
            };
            return ["a", linkAttrs, ["figure", figureAttributes, ...children]];
        }

        return ["figure", figureAttributes, ...children];
    },
    parseHTML() {
        return [
            {
                tag: "figure",
                getAttrs: (element: HTMLElement) => {
                    if (!(element instanceof HTMLElement)) return false;
                    const img = element.querySelector("img");
                    if (!img) return false;

                    const attrs: Record<string, string> = {};
                    ["src", "alt", "title"].forEach((attr) => {
                        const value = img.getAttribute(attr);
                        if (value) {
                            attrs[attr] = value;
                        }
                    });

                    const align =
                        element.getAttribute("data-align") || "center";
                    const size = element.getAttribute("data-size") || "lg";

                    // リンクのチェック
                    const linkElement = element.closest("a");
                    const link = linkElement
                        ? {
                              href: linkElement.getAttribute("href"),
                              target: linkElement.getAttribute("target"),
                              rel: linkElement.getAttribute("rel"),
                          }
                        : null;

                    const figcaption = element.querySelector("figcaption");
                    const caption = figcaption ? figcaption.textContent : null;

                    return {
                        ...attrs,
                        align,
                        size,
                        link,
                        caption,
                    };
                },
            },
        ];
    },
});

export default MediaImage;
