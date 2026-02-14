import { useStore } from '../store';
import styles from '../styles/Toolbar.module.css';

export function Toolbar() {
  const activeTool = useStore((s) => s.activeTool);
  const setActiveTool = useStore((s) => s.setActiveTool);
  const planName = useStore((s) => s.planName);

  return (
    <div className={styles.toolbar}>
      <span className={styles.title}>{planName}</span>
      <div className={styles.tools}>
        <button
          className={`${styles.toolBtn} ${activeTool === 'select' ? styles.active : ''}`}
          onClick={() => setActiveTool('select')}
          title="Select tool (V)"
        >
          Select
        </button>
        <button
          className={`${styles.toolBtn} ${activeTool === 'draw-room' ? styles.active : ''}`}
          onClick={() => setActiveTool('draw-room')}
          title="Draw room (R)"
        >
          Draw Room
        </button>
      </div>
    </div>
  );
}
