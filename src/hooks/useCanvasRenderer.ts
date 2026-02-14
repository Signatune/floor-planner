import { useCallback } from 'react';
import type { Room, Camera } from '../types';
import { worldToScreen } from '../utils/geometry';

interface RenderOptions {
  rooms: Room[];
  camera: Camera;
  gridSize: number;
  selectedRoomId: string | null;
  drawPreview: { x: number; y: number; width: number; height: number } | null;
}

export function useCanvasRenderer() {
  const render = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, opts: RenderOptions) => {
      const { rooms, camera, gridSize, selectedRoomId, drawPreview } = opts;
      const dpr = window.devicePixelRatio || 1;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Draw grid
      drawGrid(ctx, width, height, camera, gridSize);

      // Draw rooms
      for (const room of rooms) {
        drawRoom(ctx, room, camera, room.id === selectedRoomId);
      }

      // Draw in-progress room preview
      if (drawPreview) {
        drawRoomPreview(ctx, drawPreview, camera);
      }

      // Draw selection handles
      if (selectedRoomId) {
        const selected = rooms.find((r) => r.id === selectedRoomId);
        if (selected) {
          drawSelectionHandles(ctx, selected, camera);
        }
      }
    },
    []
  );

  return render;
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  camera: Camera,
  gridSize: number
) {
  const scaledGrid = gridSize * camera.zoom;
  if (scaledGrid < 4) return; // too small to render

  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 0.5;

  const offsetX = camera.x % scaledGrid;
  const offsetY = camera.y % scaledGrid;

  ctx.beginPath();
  for (let x = offsetX; x <= width; x += scaledGrid) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = offsetY; y <= height; y += scaledGrid) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();
}

function drawRoom(
  ctx: CanvasRenderingContext2D,
  room: Room,
  camera: Camera,
  isSelected: boolean
) {
  const tl = worldToScreen(room.x, room.y, camera);
  const w = room.width * camera.zoom;
  const h = room.height * camera.zoom;

  // Fill
  ctx.fillStyle = room.color;
  ctx.fillRect(tl.x, tl.y, w, h);

  // Border
  ctx.strokeStyle = isSelected ? '#1a73e8' : '#666';
  ctx.lineWidth = isSelected ? 2 : 1;
  ctx.strokeRect(tl.x, tl.y, w, h);

  // Label
  const fontSize = Math.max(10, 14 * camera.zoom);
  ctx.fillStyle = '#333';
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const label = room.label;
  const maxWidth = w - 8;
  if (maxWidth > 20) {
    ctx.fillText(label, tl.x + w / 2, tl.y + h / 2, maxWidth);
  }
}

function drawRoomPreview(
  ctx: CanvasRenderingContext2D,
  rect: { x: number; y: number; width: number; height: number },
  camera: Camera
) {
  const tl = worldToScreen(rect.x, rect.y, camera);
  const w = rect.width * camera.zoom;
  const h = rect.height * camera.zoom;

  ctx.fillStyle = 'rgba(26, 115, 232, 0.15)';
  ctx.fillRect(tl.x, tl.y, w, h);
  ctx.strokeStyle = '#1a73e8';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 3]);
  ctx.strokeRect(tl.x, tl.y, w, h);
  ctx.setLineDash([]);

  // Dimension label
  const dimText = `${Math.abs(rect.width)}×${Math.abs(rect.height)}`;
  ctx.fillStyle = '#1a73e8';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(dimText, tl.x + w / 2, tl.y - 4);
}

function drawSelectionHandles(
  ctx: CanvasRenderingContext2D,
  room: Room,
  camera: Camera
) {
  const tl = worldToScreen(room.x, room.y, camera);
  const w = room.width * camera.zoom;
  const h = room.height * camera.zoom;
  const handleSize = 8;
  const half = handleSize / 2;

  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#1a73e8';
  ctx.lineWidth = 2;

  const handles = [
    { x: tl.x, y: tl.y },                     // top-left
    { x: tl.x + w, y: tl.y },                 // top-right
    { x: tl.x, y: tl.y + h },                 // bottom-left
    { x: tl.x + w, y: tl.y + h },             // bottom-right
  ];

  for (const handle of handles) {
    ctx.fillRect(handle.x - half, handle.y - half, handleSize, handleSize);
    ctx.strokeRect(handle.x - half, handle.y - half, handleSize, handleSize);
  }
}
