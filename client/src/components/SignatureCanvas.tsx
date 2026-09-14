import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";

interface Props {
  onSignatureChange: (dataUrl: string | null) => void;
}

/**
 * Zone de dessin pour signature électronique — souris, doigt ou stylet.
 * Les événements Pointer unifient les appareils et évitent les courses entre
 * les événements tactiles et souris qui pouvaient laisser le bouton de
 * signature désactivé après un trait rapide.
 */
export default function SignatureCanvas({ onSignatureChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const hasDrawnRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e3a8a";
  }, []);

  const getPosition = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { x, y } = getPosition(event);
    canvas.setPointerCapture?.(event.pointerId);
    activePointerIdRef.current = event.pointerId;
    ctx.beginPath();
    ctx.moveTo(x, y);
    // Un premier point rend le geste observable même si le navigateur perd
    // immédiatement pointermove/pointerup. Le candidat peut toujours effacer
    // ce point avec « Effacer et recommencer ».
    ctx.lineTo(x + 0.5, y + 0.5);
    ctx.stroke();
    isDrawingRef.current = true;
    if (!hasDrawnRef.current) {
      hasDrawnRef.current = true;
      setHasDrawn(true);
      onSignatureChange(canvas.toDataURL("image/png"));
    }
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || activePointerIdRef.current !== event.pointerId) return;
    event.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPosition(event);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasDrawnRef.current) {
      hasDrawnRef.current = true;
      setHasDrawn(true);
      // Publier immédiatement une première image : si le navigateur perd
      // pointerup après un geste rapide, le parent dispose tout de même d’une
      // signature et le bouton ne reste pas bloqué à tort.
      onSignatureChange(canvasRef.current?.toDataURL("image/png") ?? null);
    }
  };

  const stopDrawing = (event?: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    if (event && activePointerIdRef.current !== event.pointerId) return;
    isDrawingRef.current = false;
    activePointerIdRef.current = null;
    if (event) {
      try {
        canvasRef.current?.releasePointerCapture?.(event.pointerId);
      } catch {
        // Le navigateur peut déjà avoir libéré la capture après pointercancel.
      }
    }
    const canvas = canvasRef.current;
    if (canvas && hasDrawnRef.current) onSignatureChange(canvas.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawnRef.current = false;
    setHasDrawn(false);
    onSignatureChange(null);
  };

  return (
    <div>
      <div className="relative rounded-lg border-2 border-dashed border-gray-300 bg-white">
        <canvas
          ref={canvasRef}
          width={500}
          height={160}
          className="h-40 w-full touch-none cursor-crosshair rounded-lg"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          onPointerLeave={stopDrawing}
          aria-label="Zone de signature manuscrite"
        />
        {!hasDrawn && <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-gray-300">Signez ici avec la souris ou le doigt</p>}
      </div>
      <Button type="button" variant="ghost" onClick={clear} className="mt-2 h-auto px-0 text-xs text-gray-500 hover:text-red-600">
        <Eraser className="mr-1 h-3 w-3" /> Effacer et recommencer
      </Button>
    </div>
  );
}
