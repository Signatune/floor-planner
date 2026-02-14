const ROOM_COLORS = [
  '#e8f0fe', // light blue
  '#fce8e6', // light red
  '#e6f4ea', // light green
  '#fef7e0', // light yellow
  '#f3e8fd', // light purple
  '#fde7ed', // light pink
  '#e0f7fa', // light cyan
  '#fff3e0', // light orange
];

let colorIndex = 0;

export function nextRoomColor(): string {
  const color = ROOM_COLORS[colorIndex % ROOM_COLORS.length];
  colorIndex++;
  return color;
}

export function resetColorIndex(): void {
  colorIndex = 0;
}
