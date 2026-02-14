import { useStore } from '../store';
import { snap } from '../utils/geometry';
import styles from '../styles/PropertiesPanel.module.css';

export function PropertiesPanel() {
  const rooms = useStore((s) => s.rooms);
  const selectedRoomId = useStore((s) => s.selectedRoomId);
  const updateRoom = useStore((s) => s.updateRoom);
  const deleteRoom = useStore((s) => s.deleteRoom);
  const gridSize = useStore((s) => s.gridSize);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  if (!selectedRoom) {
    return (
      <div className={styles.panel}>
        <p className={styles.emptyHint}>Select a room to edit its properties.</p>
      </div>
    );
  }

  const handleChange = (field: string, value: string) => {
    if (field === 'label') {
      updateRoom(selectedRoom.id, { label: value });
      return;
    }
    if (field === 'color') {
      updateRoom(selectedRoom.id, { color: value });
      return;
    }

    const num = parseInt(value, 10);
    if (isNaN(num) || num < 20) return;
    const snapped = snap(num, gridSize);

    switch (field) {
      case 'x':
        updateRoom(selectedRoom.id, { x: snapped });
        break;
      case 'y':
        updateRoom(selectedRoom.id, { y: snapped });
        break;
      case 'width':
        updateRoom(selectedRoom.id, { width: snapped });
        break;
      case 'height':
        updateRoom(selectedRoom.id, { height: snapped });
        break;
    }
  };

  return (
    <div className={styles.panel}>
      <h3 className={styles.heading}>Room Properties</h3>

      <label className={styles.field}>
        <span>Label</span>
        <input
          type="text"
          value={selectedRoom.label}
          onChange={(e) => handleChange('label', e.target.value)}
        />
      </label>

      <label className={styles.field}>
        <span>Color</span>
        <input
          type="color"
          value={selectedRoom.color}
          onChange={(e) => handleChange('color', e.target.value)}
        />
      </label>

      <div className={styles.row}>
        <label className={styles.field}>
          <span>X</span>
          <input
            type="number"
            step={gridSize}
            value={selectedRoom.x}
            onChange={(e) => handleChange('x', e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span>Y</span>
          <input
            type="number"
            step={gridSize}
            value={selectedRoom.y}
            onChange={(e) => handleChange('y', e.target.value)}
          />
        </label>
      </div>

      <div className={styles.row}>
        <label className={styles.field}>
          <span>Width</span>
          <input
            type="number"
            step={gridSize}
            min={20}
            value={selectedRoom.width}
            onChange={(e) => handleChange('width', e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span>Height</span>
          <input
            type="number"
            step={gridSize}
            min={20}
            value={selectedRoom.height}
            onChange={(e) => handleChange('height', e.target.value)}
          />
        </label>
      </div>

      <button
        className={styles.deleteBtn}
        onClick={() => deleteRoom(selectedRoom.id)}
      >
        Delete Room
      </button>
    </div>
  );
}
