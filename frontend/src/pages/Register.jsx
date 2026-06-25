import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserContext, ToastContext } from '../App';
import { register } from '../api';
import { ChefHat, User, Lock, Smile } from 'lucide-react';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [role, setRole] = useState('foodie');
  const [loading, setLoading] = useState(false);
  const { setUser } = useContext(UserContext);
  const showToast = useContext(ToastContext);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username || !password) return showToast('请填写用户名和密码', 'error');
    if (password.length < 4) return showToast('密码至少4个字符', 'error');
    setLoading(true);
    try {
      const response = await register({
    username,
    password,
    nickname: nickname || username,
    role
  });

  const data = response.data;

  localStorage.setItem('token', data.token);
  setUser(data.user);

  showToast('注册成功，' + data.user.nickname + '！');

  navigate('/');
    } catch (err) { showToast('注册失败', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <ChefHat size={48} color="var(--primary)" />
        <h1 style={{ fontSize: 24, marginTop: 12 }}>注册账号</h1>
        <p style={{ color: 'var(--text-light)', fontSize: 14, marginTop: 4 }}>加入 Cook for U，开始美食之旅</p>
      </div>

      <form onSubmit={handleRegister}>
        <div className="form-group">
          <label><User size={14} /> 用户名</label>
          <input className="input" value={username} onChange={e => setUsername(e.target.value)} placeholder="输入用户名" />
        </div>
        <div className="form-group">
          <label><Lock size={14} /> 密码</label>
          <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="至少4位密码" />
        </div>
        <div className="form-group">
          <label><Smile size={14} /> 昵称（选填）</label>
          <input className="input" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="不填则使用用户名" />
        </div>
        <div className="form-group">
          <label>角色</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <div onClick={() => setRole('foodie')} style={{ flex: 1, padding: '12px 14px', borderRadius: 10, border: role === 'foodie' ? '2px solid var(--primary)' : '1px solid var(--border)', background: role === 'foodie' ? 'var(--primary-light)' : 'var(--card)', cursor: 'pointer', textAlign: 'center' }}>
              <p style={{ fontSize: 24, marginBottom: 4 }}>🍽️</p>
              <p style={{ fontSize: 14, fontWeight: role === 'foodie' ? 600 : 400 }}>吃货</p>
              <p style={{ fontSize: 12, color: 'var(--text-light)' }}>点菜吃</p>
            </div>
            <div onClick={() => setRole('chef')} style={{ flex: 1, padding: '12px 14px', borderRadius: 10, border: role === 'chef' ? '2px solid var(--primary)' : '1px solid var(--border)', background: role === 'chef' ? 'var(--primary-light)' : 'var(--card)', cursor: 'pointer', textAlign: 'center' }}>
              <p style={{ fontSize: 24, marginBottom: 4 }}>👨‍🍳</p>
              <p style={{ fontSize: 14, fontWeight: role === 'chef' ? 600 : 400 }}>厨师</p>
              <p style={{ fontSize: 12, color: 'var(--text-light)' }}>做菜给别人吃</p>
            </div>
          </div>
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
          {loading ? '注册中...' : '注册'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-light)' }}>
        已有账号？<Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>去登录</Link>
      </p>
    </div>
  );
}
