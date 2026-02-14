import { useRef, useEffect, useCallback, useState } from 'react';
import { useStore } from '../store';
import { useCanvasRenderer } from '../hooks/useCanvasRenderer';
import { screenToWorld, snapPoint, snap } from '../utils/geometry';
import type { Room } from '../types';
import styles from '../styles/Canvas.module.css';

const HANDLE_SIZE = 8;
const MIN_ROOM_SIZE = 20;

type ResizeHandle = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;

function getHandleAtPoint(
  screenX: number,
  screenY: number,
  room: Room,
  camera: { x: number; y: number; zoom: number }
): ResizeHandle {
  const corners = [
    { handle: 'top-left' as const, wx: room.x, wy: room.y },
    { handle: 'top-right' as const, wx: room.x + room.width, wy: room.y },
    { handle: 'bottom-left' as const, wx: room.x, wy: room.y + room.height },
    { handle: 'bottom-right' as const, wx: room.x + room.width, wy: room.y + room.height },
  ];

  for (const corner of corners) {
    const sx = corner.wx * camera.zoom + camera.x;
    const sy = corner.wy * camera.zoom + camera.y;
    if (
      Math.abs(screenX - sx) <= HANDLE_SIZE &&
      Math.abs(screenY - sy) <= HANDLE_SIZE
    ) {
      return corner.handle;
    }
  }
  return null;
}

function hitTestRoom(
  worldX: number,
  worldY: number,
  rooms: Room[]
): Room | null {
  // reverse order so top-most room wins
  for (let i = rooms.length - 1; i >= 0; i--) {
    const r = rooms[i];
    if (
      worldX >= r.x &&
      worldX <= r.x + r.width &&
      worldY >= r.y &&
      worldY <= r.y + r.height
    ) {
      return r;
    }
  }
  return null;
}

function findSnapEdges(
  room: Room,
  allRooms: Room[],
  gridSize: number
): { dx: number; dy: number } {
  const threshold = gridSize / 2;
  let dx = 0;
  let dy = 0;

  const edges = {
    left: room.x,
    right: room.x + room.width,
    top: room.y,
    bottom: room.y + room.height,
  };

  for (const other of allRooms) {
    if (other.id === room.id) continue;

    const otherEdges = {
      left: other.x,
      right: other.x + other.width,
      top: other.y,
      bottom: other.y + other.height,
    };

    // Horizontal snapping
    if (dx === 0) {
      if (Math.abs(edges.left - otherEdges.right) < threshold) dx = otherEdges.right - edges.left;
      else if (Math.abs(edges.right - otherEdges.left) < threshold) dx = otherEdges.left - edges.right;
      else if (Math.abs(edges.left - otherEdges.left) < threshold) dx = otherEdges.left - edges.left;
      else if (Math.abs(edges.right - otherEdges.right) < threshold) dx = otherEdges.right - edges.right;
    }

    // Vertical snapping
    if (dy === 0) {
      if (Math.abs(edges.top - otherEdges.bottom) < threshold) dy = otherEdges.bottom - edges.top;
      else if (Math.abs(edges.bottom - otherEdges.top) < threshold) dy = otherEdges.top - edges.bottom;
      else if (Math.abs(edges.top - otherEdges.top) < threshold) dy = otherEdges.top - edges.top;
      else if (Math.abs(edges.bottom - otherEdges.bottom) < threshold) dy = otherEdges.bottom - edges.bottom;
    }
  }

  return { dx, dy };
}

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const render = useCanvasRenderer();

  const camera = useStore((s) => s.camera);
  const setCamera = useStore((s) => s.setCamera);
  const rooms = useStore((s) => s.rooms);
  const activeTool = useStore((s) => s.activeTool);
  const selectedRoomId = useStore((s) => s.selectedRoomId);
  const gridSize = useStore((s) => s.gridSize);
  const addRoom = useStore((s) => s.addRoom);
  const updateRoom = useStore((s) => s.updateRoom);
  const selectRoom = useStore((s) => s.selectRoom);
  const setActiveTool = useStore((s) => s.setActiveTool);

  // Draw preview state (for draw-room tool)
  const [drawPreview, setDrawPreview] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Drag state
  const dragState = useRef<{
    type: 'pan' | 'move-room' | 'resize-room' | 'draw-room';
    startScreenX: number;
    startScreenY: number;
    startCameraX: number;
    startCameraY: number;
    roomId?: string;
    roomStartX?: number;
    roomStartY?: number;
    roomStartW?: number;
    roomStartH?: number;
    handle?: ResizeHandle;
    drawStartWorld?: { x: number; y: number };
  } | null>(null);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;

    render(ctx, size.width, size.height, {
      rooms,
      camera,
      gridSize,
      selectedRoomId,
      drawPreview,
    });
  }, [rooms, camera, gridSize, selectedRoomId, drawPreview, size, render]);

  // Mouse down
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = screenToWorld(sx, sy, camera);

      // Middle-click or Space → pan
      if (e.button === 1) {
        dragState.current = {
          type: 'pan',
          startScreenX: e.clientX,
          startScreenY: e.clientY,
          startCameraX: camera.x,
          startCameraY: camera.y,
        };
        e.preventDefault();
        return;
      }

      if (e.button !== 0) return;

      if (activeTool === 'draw-room') {
        const snapped = snapPoint(world, gridSize);
        dragState.current = {
          type: 'draw-room',
          startScreenX: sx,
          startScreenY: sy,
          startCameraX: camera.x,
          startCameraY: camera.y,
          drawStartWorld: snapped,
        };
        return;
      }

      // Select tool
      // Check resize handle first
      if (selectedRoomId) {
        const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
        if (selectedRoom) {
          const handle = getHandleAtPoint(sx, sy, selectedRoom, camera);
          if (handle) {
            dragState.current = {
              type: 'resize-room',
              startScreenX: sx,
              startScreenY: sy,
              startCameraX: camera.x,
              startCameraY: camera.y,
              roomId: selectedRoom.id,
              roomStartX: selectedRoom.x,
              roomStartY: selectedRoom.y,
              roomStartW: selectedRoom.width,
              roomStartH: selectedRoom.height,
              handle,
            };
            return;
          }
        }
      }

      // Hit test rooms
      const hitRoom = hitTestRoom(world.x, world.y, rooms);
      if (hitRoom) {
        selectRoom(hitRoom.id);
        dragState.current = {
          type: 'move-room',
          startScreenX: sx,
          startScreenY: sy,
          startCameraX: camera.x,
          startCameraY: camera.y,
          roomId: hitRoom.id,
          roomStartX: hitRoom.x,
          roomStartY: hitRoom.y,
        };
      } else {
        selectRoom(null);
      }
    },
    [camera, activeTool, rooms, selectedRoomId, gridSize, selectRoom]
  );

  // Mouse move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const drag = dragState.current;
      if (!drag) return;

      const rect = canvasRef.current!.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      if (drag.type === 'pan') {
        const dx = e.clientX - drag.startScreenX;
        const dy = e.clientY - drag.startScreenY;
        setCamera({
          ...camera,
          x: drag.startCameraX + dx,
          y: drag.startCameraY + dy,
        });
        return;
      }

      if (drag.type === 'draw-room' && drag.drawStartWorld) {
        const world = screenToWorld(sx, sy, camera);
        const snapped = snapPoint(world, gridSize);
        const x = Math.min(drag.drawStartWorld.x, snapped.x);
        const y = Math.min(drag.drawStartWorld.y, snapped.y);
        const w = Math.abs(snapped.x - drag.drawStartWorld.x);
        const h = Math.abs(snapped.y - drag.drawStartWorld.y);
        setDrawPreview({ x, y, width: w, height: h });
        return;
      }

      if (drag.type === 'move-room' && drag.roomId != null) {
        const dx = (sx - drag.startScreenX) / camera.zoom;
        const dy = (sy - drag.startScreenY) / camera.zoom;
        const rawX = drag.roomStartX! + dx;
        const rawY = drag.roomStartY! + dy;
        const snapped = snapPoint({ x: rawX, y: rawY }, gridSize);

        const room = rooms.find((r) => r.id === drag.roomId);
        if (!room) return;
        const tentative = { ...room, x: snapped.x, y: snapped.y };
        const edgeSnap = findSnapEdges(tentative, rooms, gridSize);

        updateRoom(drag.roomId, {
          x: snapped.x + edgeSnap.dx,
          y: snapped.y + edgeSnap.dy,
        });
        return;
      }

      if (drag.type === 'resize-room' && drag.roomId != null && drag.handle) {
        const dx = (sx - drag.startScreenX) / camera.zoom;
        const dy = (sy - drag.startScreenY) / camera.zoom;
        const handle = drag.handle;
        let x = drag.roomStartX!;
        let y = drag.roomStartY!;
        let w = drag.roomStartW!;
        let h = drag.roomStartH!;

        if (handle.includes('right')) {
          w = Math.max(MIN_ROOM_SIZE, snap(w + dx, gridSize));
        }
        if (handle.includes('left')) {
          const newX = snap(x + dx, gridSize);
          w = Math.max(MIN_ROOM_SIZE, w + (x - newX));
          x = w > MIN_ROOM_SIZE ? newX : x;
        }
        if (handle.includes('bottom')) {
          h = Math.max(MIN_ROOM_SIZE, snap(h + dy, gridSize));
        }
        if (handle.includes('top')) {
          const newY = snap(y + dy, gridSize);
          h = Math.max(MIN_ROOM_SIZE, h + (y - newY));
          y = h > MIN_ROOM_SIZE ? newY : y;
        }

        updateRoom(drag.roomId, { x, y, width: w, height: h });
      }
    },
    [camera, gridSize, rooms, setCamera, updateRoom]
  );

  // Mouse up
  const handleMouseUp = useCallback(() => {
    const drag = dragState.current;
    if (drag?.type === 'draw-room' && drawPreview) {
      if (drawPreview.width >= MIN_ROOM_SIZE && drawPreview.height >= MIN_ROOM_SIZE) {
        const room = addRoom({
          label: `Room ${rooms.length + 1}`,
          x: drawPreview.x,
          y: drawPreview.y,
          width: drawPreview.width,
          height: drawPreview.height,
        });
        selectRoom(room.id);
        setActiveTool('select');
      }
      setDrawPreview(null);
    }
    dragState.current = null;
  }, [drawPreview, addRoom, rooms.length, selectRoom, setActiveTool]);

  // Scroll → zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const rect = canvasRef.current!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.min(5, Math.max(0.1, camera.zoom * zoomFactor));

      // Zoom towards mouse position
      const wx = (mx - camera.x) / camera.zoom;
      const wy = (my - camera.y) / camera.zoom;

      setCamera({
        x: mx - wx * newZoom,
        y: my - wy * newZoom,
        zoom: newZoom,
      });
    },
    [camera, setCamera]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedRoomId) {
          useStore.getState().deleteRoom(selectedRoomId);
        }
      }
      if (e.key === 'Escape') {
        if (activeTool === 'draw-room') {
          setActiveTool('select');
          setDrawPreview(null);
          dragState.current = null;
        } else {
          selectRoom(null);
        }
      }
      if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      }
      if (e.key === 'r' || e.key === 'R') {
        setActiveTool('draw-room');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRoomId, activeTool, selectRoom, setActiveTool]);

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        style={{ width: size.width, height: size.height }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
