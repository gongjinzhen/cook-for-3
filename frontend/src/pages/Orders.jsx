import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContext, UserContext } from '../App';
import { getOrders, updateOrderStatus, createRating } from '../api';
import { Star } from 'lucide-react';

export default function Orders() {
  const { user } = useContext(UserContext);
  const showToast = useContext(ToastContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingOrder, setRatingOrder] = useState(null);
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const isChef = user?.role === 'chef';

  const statusOrder = { pending: 0, cooking: 1, completed: 2 };

  const fetchOrders = () => {
    getOrders(isChef ? 'chef' : '').then(r => {
      const sorted = r.data.sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || new Date(b.created_at) - new Date(a.created_at));
      setOrders(sorted); setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(() => { fetchOrders(); const iv = setInterval(fetchOrders, 5000); return () => clearInterval(iv); }, []);

  const handleStatus = async (id, status) => {
    try { await updateOrderStatus(id, status); showToast('已更新'); fetchOrders(); }
    catch (err) { showToast('操作失败', 'error'); }
  };

  const handleRating = async () => {
    if (!score) return showToast('请评分', 'error');
    try {
      await createRating({ order_id: ratingOrder.id, recipe_id: ratingOrder.recipe_id, score, comment });
      showToast('评价成功');
      setRatingOrder(null); setScore(0); setComment('');
      fetchOrders();
    } catch (err) { showToast(err.response?.data?.error || '评价失败', 'error'); }
  };

  const statusText = { pending: '待做', cooking: '制作中', completed: '已完成' };
  const statusColor = { pending: 'var(--secondary)', cooking: '#3498db', completed: '#27ae60' };

  // Group orders by status
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const cookingOrders = orders.filter(o => o.status === 'cooking');
  const completedOrders = orders.filter(o => o.status === 'completed');

  const renderOrderCard = (o) => (
    <div key={o.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, borderLeft: o.status === 'pending' ? '3px solid var(--secondary)' : '1px solid var(--border)' }}>
      <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', background: 'var(--primary-light)', flexShrink: 0, cursor: 'pointer' }} onClick={() => navigate('/recipes/' + o.recipe_id)}>
        {o.recipe_cover ? <img src={o.recipe_cover} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🍽️</div>}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 15, fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/recipes/' + o.recipe_id)}>{o.recipe_name}</p>
        {!isChef && <p style={{ fontSize: 12, color: 'var(--text-light)' }}>给 {o.orderer_name || '大厨'}</p>}
        <p style={{ fontSize: 12, color: 'var(--text-light)' }}>{o.created_at?.slice(0, 16)}</p>
        <span style={{ fontSize: 12, color: statusColor[o.status] || 'var(--text-light)', fontWeight: 600 }}>{statusText[o.status] || o.status}</span>
      </div>
      <div style={{ display: 'flex', gap: 4, flexDirection: 'column', alignItems: 'flex-end' }}>
        {isChef && o.status === 'pending' && <button className="btn btn-sm btn-primary" onClick={() => handleStatus(o.id, 'cooking')}>开始做</button>}
        {isChef && o.status === 'cooking' && <button className="btn btn-sm" style={{ background: '#27ae60', color: '#fff', border: 'none', borderRadius: 10, padding: '6px 14px', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleStatus(o.id, 'completed')}>做好了</button>}
        {!isChef && o.status === 'completed' && !o.rated && (
          <button className="btn btn-sm btn-secondary" onClick={() => setRatingOrder(o)}>评价</button>
        )}
      </div>
    </div>
  );

  if (loading) return <p style={{ color: 'var(--text-light)' }}>加载中...</p>;

  const groupIcon = { pending: '🔔', cooking: '🍳', completed: '✅' };
  const groupLabel = { pending: '待处理', cooking: '制作中', completed: '已完成' };

  return (
    <div>
      <h1>📋 点单记录</h1>
      {orders.length === 0 ? (
        <div className="empty-state"><div className="icon">📭</div><p>还没有点单记录</p></div>
      ) : (
        <>
          {pendingOrders.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 0, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>{groupIcon.pending}</span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{groupLabel.pending}</span>
                <span style={{ fontSize: 12, color: 'var(--text-light)', background: 'var(--primary-light)', borderRadius: 10, padding: '2px 8px' }}>{pendingOrders.length}</span>
              </div>
              {pendingOrders.map(o => renderOrderCard(o))}
            </>
          )}
          {cookingOrders.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>{groupIcon.cooking}</span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{groupLabel.cooking}</span>
                <span style={{ fontSize: 12, color: 'var(--text-light)', background: 'var(--primary-light)', borderRadius: 10, padding: '2px 8px' }}>{cookingOrders.length}</span>
              </div>
              {cookingOrders.map(o => renderOrderCard(o))}
            </>
          )}
          {completedOrders.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>{groupIcon.completed}</span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{groupLabel.completed}</span>
                <span style={{ fontSize: 12, color: 'var(--text-light)', background: 'var(--primary-light)', borderRadius: 10, padding: '2px 8px' }}>{completedOrders.length}</span>
              </div>
              {completedOrders.map(o => renderOrderCard(o))}
            </>
          )}
        </>
      )}

      {ratingOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }} onClick={() => setRatingOrder(null)}>
          <div className="card" style={{ width: '100%', maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>评价 {ratingOrder.recipe_name}</h3>
            <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
              {[1,2,3,4,5].map(i => (
                <span key={i} style={{ fontSize: 28, cursor: 'pointer', color: i <= score ? '#f1c40f' : '#ddd' }} onClick={() => setScore(i)}>★</span>
              ))}
            </div>
            <div className="form-group"><textarea className="input" value={comment} onChange={e => setComment(e.target.value)} placeholder="写点评价吧（可选）" style={{ minHeight: 60 }} /></div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleRating}>提交评价</button>
          </div>
        </div>
      )}
    </div>
  );
}