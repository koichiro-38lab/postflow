"use client";

import { useEffect, useRef } from "react";

type VantaEffect = { destroy: () => void };

type VantaWindow = typeof window & {
    VANTA?: {
        NET?: (options: Record<string, unknown>) => VantaEffect;
    };
};

const THREE_CDN =
    "https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js";
const VANTA_NET_CDN =
    "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js";

function loadScript(src: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const existing = document.getElementById(
            id
        ) as HTMLScriptElement | null;
        if (existing) {
            if (existing.dataset.loaded === "true") {
                resolve();
                return;
            }
            existing.addEventListener("load", () => resolve(), { once: true });
            existing.addEventListener(
                "error",
                () => reject(new Error(`Failed to load script: ${src}`)),
                { once: true }
            );
            return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.id = id;
        script.async = true;
        script.crossOrigin = "anonymous";
        script.dataset.loaded = "false";
        script.onload = () => {
            script.dataset.loaded = "true";
            resolve();
        };
        script.onerror = () =>
            reject(new Error(`Failed to load script: ${src}`));
        document.body.appendChild(script);
    });
}

export default function Background() {
    const vantaRef = useRef<HTMLDivElement>(null);
    const vantaEffectRef = useRef<VantaEffect | null>(null);

    useEffect(() => {
        if (!vantaRef.current) return;
        let isUnmounted = false;

        const setupVanta = async () => {
            try {
                await loadScript(THREE_CDN, "three-cdn");
                await loadScript(VANTA_NET_CDN, "vanta-net-cdn");

                if (
                    isUnmounted ||
                    !vantaRef.current ||
                    vantaEffectRef.current
                ) {
                    return;
                }

                const maybeVanta = (window as VantaWindow).VANTA;

                if (!maybeVanta?.NET) {
                    throw new Error(
                        "VANTA.NET is not available after loading scripts."
                    );
                }

                // 解像度に応じた設定を計算
                const isMobile = window.innerWidth < 768;
                const isHighRes = window.devicePixelRatio > 1;

                // より暗い青色と背景色に調整
                const vantaSettings = {
                    el: vantaRef.current,
                    mouseControls: false,
                    touchControls: false,
                    gyroControls: false,
                    // 解像度に応じてポイント数を調整
                    points: isMobile ? 18.0 : isHighRes ? 25.0 : 18.0,
                    minHeight: isMobile ? 100.0 : 300.0,
                    minWidth: isMobile ? 100.0 : 300.0,
                    maxDistance: isMobile ? 15.0 : 30.0,
                    color: "#2C3550",
                    backgroundColor: "#0a0e27",
                };

                vantaEffectRef.current = maybeVanta.NET(vantaSettings);
            } catch (error) {
                console.error("Vanta.NET setup error:", error);
            }
        };

        setupVanta();

        return () => {
            isUnmounted = true;
            if (vantaEffectRef.current) {
                vantaEffectRef.current.destroy();
                vantaEffectRef.current = null;
            }
        };
    }, []);

    return (
        <div
            ref={vantaRef}
            className="absolute inset-0 w-full h-full"
            style={{ backgroundColor: "#0a0e27" }}
        />
    );
}
