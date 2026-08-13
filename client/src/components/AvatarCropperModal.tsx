import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RotateCw, ZoomIn, Check, X } from "lucide-react";

interface AvatarCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
}

export function AvatarCropperModal({ isOpen, imageSrc, onClose, onCropComplete }: AvatarCropperModalProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    const img = imgRef.current;
    if (!img) return;

    const canvas = document.createElement("canvas");
    const outputSize = 400; // Format carré net 400x400
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, outputSize, outputSize);
    ctx.save();
    
    // Centrer et appliquer transformations
    ctx.translate(outputSize / 2, outputSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.translate(offset.x, offset.y);

    const aspect = img.width / img.height;
    let drawWidth = outputSize;
    let drawHeight = outputSize;
    if (aspect > 1) {
      drawWidth = outputSize * aspect;
    } else {
      drawHeight = outputSize / aspect;
    }

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    canvas.toBlob((blob) => {
      if (!blob) return;
      const croppedFile = new File([blob], "avatar_cropped.webp", { type: "image/webp" });
      onCropComplete(croppedFile);
      onClose();
    }, "image/webp", 0.92);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 text-center">
            Ajuster votre photo de profil
          </DialogTitle>
          <p className="text-xs text-gray-500 text-center mt-1">
            Glissez pour positionner, zoomez et pivotez pour centrer votre visage dans le cadre rond.
          </p>
        </DialogHeader>

        <div className="flex flex-col items-center my-4">
          {/* Zone de recadrage visuel */}
          <div
            className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-blue-600 shadow-lg bg-gray-900 cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Source avatar"
              className="absolute max-w-none pointer-events-none"
              style={{
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom}) rotate(${rotation}deg)`,
                top: "50%",
                left: "50%",
              }}
              crossOrigin="anonymous"
            />
            {/* Grille de centrage subtile */}
            <div className="absolute inset-0 rounded-full border border-white/30 pointer-events-none flex items-center justify-center">
              <div className="w-4 h-4 border border-white/50 rounded-full" />
            </div>
          </div>

          {/* Contrôles de zoom et rotation */}
          <div className="w-full space-y-4 mt-6">
            <div className="flex items-center gap-3">
              <ZoomIn className="w-5 h-5 text-gray-500" />
              <span className="text-xs font-medium text-gray-700 w-12">Zoom</span>
              <Slider
                value={[zoom]}
                min={0.5}
                max={3}
                step={0.05}
                onValueChange={(val) => setZoom(val[0])}
                className="flex-1"
              />
              <span className="text-xs font-mono text-gray-500 w-10 text-right">{Math.round(zoom * 100)}%</span>
            </div>

            <div className="flex items-center gap-3">
              <RotateCw className="w-5 h-5 text-gray-500" />
              <span className="text-xs font-medium text-gray-700 w-12">Pivoter</span>
              <Slider
                value={[rotation]}
                min={-180}
                max={180}
                step={1}
                onValueChange={(val) => setRotation(val[0])}
                className="flex-1"
              />
              <span className="text-xs font-mono text-gray-500 w-10 text-right">{rotation}°</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-3 sm:justify-between mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-xl py-2"
          >
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 font-semibold shadow-md"
          >
            <Check className="w-4 h-4 mr-2" />
            Valider le portrait
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
