import { useApp } from '../../context/AppContext.jsx';
import './Toast.scss';

export default function Toast() {
  const { toast } = useApp();
  return (
    <div className={`toast ${toast ? 'visible' : ''}`} role="status">
      {toast}
    </div>
  );
}
