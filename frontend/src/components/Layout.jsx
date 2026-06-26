import React, { useContext, useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { UserContext } from '../App';
import { Home, BookOpen, PlusCircle, ClipboardList, BarChart3, LogOut, ChevronDown, Bell } from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useContext(UserContext);
  const [showMenu, setShowMenu] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [bell, setBell] = useState(false);
  const menuRef = useRef(null);
  const isChef = user?.role === 'chef';

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const initial = (user?.nickname || user?.username || '?').charAt(0);

  return (
    <div style={{ backgroundImage: 'url(/bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', minHeight: '100vh' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>🍳 给你做顿饭</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }} ref={menuRef}>
            <div
              onClick={() => setShowMenu(!showMenu)}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'var(--primary)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              {initial}
            </div>
            {showMenu && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 4,
                background: '#fff', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                border: '1px solid var(--border)', minWidth: 140, zIndex: 999,
                padding: 4, overflow: 'hidden'
              }}>
                <div style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-light)', borderBottom: '1px solid var(--border)' }}>
                  {user?.nickname || user?.username}
                </div>
                <div
                  onClick={logout}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px', fontSize: 14, cursor: 'pointer',
                    color: 'var(--text)', borderRadius: 6
                  }}
                  onMouseEnter={e => e.target.style.background = 'var(--primary-light)'}
                  onMouseLeave={e => e.target.style.background = 'transparent'}
                >
                  <LogOut size={15} /> 退出登录
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="page">{children}</div>
      <nav className="nav">
        <NavLink to="/" end className={({ isActive }) => isActive ? "nav-item active" : "nav-item"
        }><img src="/home.png" className="nav-icon" /></NavLink>
        <NavLink
  to="/recipes"
  className={({ isActive }) => isActive ? 'active' : ''}
>
  <img src="/caidan.png" className="nav-icon" alt="菜谱" />
</NavLink>
        {isChef && <NavLink to="/add" className={({ isActive }) => isActive ? 'active' : ''}><PlusCircle size={22} /><span>上传</span></NavLink>}
        <NavLink to="/orders" className={({ isActive }) => isActive ? 'active' : ''} style={{ position: 'relative' }}>{isChef && pendingCount > 0 && <span style={{ position: 'absolute', top: 0, right: 2, background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pendingCount > 99 ? '...' : pendingCount}</span>}<ClipboardList size={22} /><span>点单</span></NavLink>
        <NavLink to="/stats" className={({ isActive }) => isActive ? 'active' : ''}><BarChart3 size={22} /><span>统计</span></NavLink>
      </nav>
    </div>
  );
}
