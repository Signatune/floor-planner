export interface Point {
  x: number;
  y: number;
}

export interface Room {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface FurnitureTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  color: string;
}

export interface PlacedFurniture {
  id: string;
  templateId: string;
  x: number;
  y: number;
  rotation: number;
}

export interface FloorPlan {
  id: string;
  name: string;
  rooms: Room[];
  furnitureLibrary: FurnitureTemplate[];
  placedFurniture: PlacedFurniture[];
  gridSize: number;
}

export type Tool = 'select' | 'draw-room';

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}
