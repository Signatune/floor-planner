import { useStore } from '../store';
import styles from '../styles/Sidebar.module.css';

export function Sidebar() {
  const rooms = useStore((s) => s.rooms);
  const selectedRoomId = useStore((s) => s.selectedRoomId);
  const selectRoom = useStore((s) => s.selectRoom);
  const setActiveTool = useStore((s) => s.setActiveTool);

  return (
    <div className={styles.sidebar}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Rooms</h3>
          <button
            className={styles.addBtn}
            onClick={() => setActiveTool('draw-room')}
            title="Draw a new room on the canvas"
          >
            + Add
          </button>
        </div>
        {rooms.length === 0 ? (
          <p className={styles.emptyHint}>
            Click "Add" or press R to draw a room on the canvas.
          </p>
        ) : (
          <ul className={styles.list}>
            {rooms.map((room) => (
              <li
                key={room.id}
                className={`${styles.listItem} ${room.id === selectedRoomId ? styles.selected : ''}`}
                onClick={() => selectRoom(room.id)}
              >
                <span
                  className={styles.colorDot}
                  style={{ backgroundColor: room.color }}
                />
                <span className={styles.roomLabel}>{room.label}</span>
                <span className={styles.roomDims}>
                  {room.width}×{room.height}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
