import { Outlet } from 'react-router-dom';
import MerchantNav from '../MerchantNav/MerchantNav';
import './MerchantShell.css';

export default function MerchantShell() {
  return (
    <div className="shell">
      <div className="shell__body">
        <MerchantNav />
        <main className="shell__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
