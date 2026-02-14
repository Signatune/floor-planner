import { create } from 'zustand';
import type { Room, Camera, Tool } from '../types';
import { generateId } from '../utils/id';
import { nextRoomColor } from '../utils/colors';

interface FloorPlanState {
  // Plan metadata
  planName: string;
  gridSize: number;

  // Camera
  camera: Camera;
  setCamera: (camera: Camera) => void;

  // Active tool
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;

  // Rooms
  rooms: Room[];
  selectedRoomId: string | null;
  addRoom: (room: Omit<Room, 'id' | 'color'>) => Room;
  updateRoom: (id: string, updates: Partial<Omit<Room, 'id'>>) => void;
  deleteRoom: (id: string) => void;
  selectRoom: (id: string | null) => void;

  // Drawing state
  isDrawing: boolean;
  drawStart: { x: number; y: number } | null;
  setDrawing: (isDrawing: boolean, start?: { x: number; y: number } | null) => void;
}

export const useStore = create<FloorPlanState>((set) => ({
  planName: 'Untitled Plan',
  gridSize: 20,

  camera: { x: 0, y: 0, zoom: 1 },
  setCamera: (camera) => set({ camera }),

  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool, selectedRoomId: null }),

  rooms: [],
  selectedRoomId: null,

  addRoom: (roomData) => {
    const room: Room = {
      ...roomData,
      id: generateId(),
      color: nextRoomColor(),
    };
    set((state) => ({ rooms: [...state.rooms, room] }));
    return room;
  },

  updateRoom: (id, updates) =>
    set((state) => ({
      rooms: state.rooms.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })),

  deleteRoom: (id) =>
    set((state) => ({
      rooms: state.rooms.filter((r) => r.id !== id),
      selectedRoomId: state.selectedRoomId === id ? null : state.selectedRoomId,
    })),

  selectRoom: (id) => set({ selectedRoomId: id }),

  isDrawing: false,
  drawStart: null,
  setDrawing: (isDrawing, start = null) =>
    set({ isDrawing, drawStart: start }),
}));
