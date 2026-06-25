import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext, ToastContext } from '../App';
import { getRecipes, createOrder, getOrders } from '../api';
import { Star, Heart, ChefHat, Utensils } from 'lucide-react';

const nutritionLabels = { light: '清淡', heavy: '重口味', protein: '高蛋白', lowcal: '低卡', soup: '汤类', quick: '快手菜' };

export default function Home() {
  const { user } = useContext(UserContext);
  const showToast = useContext(ToastContext);
  const [recipes, setRecipes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isFoodie = user?.role === 'foodie';

  useEffect(() => {
    Promise.all([getRecipes(), getOrders(isFoodie ? '' : 'chef')])
      .then(([r, o]) => { setRecipes(r.data); setOrders(o.data); setLoading(false); })
      .catch(() => setLoading(false));
    const iv = setInterval(() => {
      getOrders(isFoodie ? '' : 'chef').then(r => setOrders(r.data)).catch(() => {});
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  const recommend = recipes.length > 0 ? recipes.sort(() => Math.random() - 0.5).slice(0, 3) : [];

  const handleOrder = async (recipe) => {
    try {
      await createOrder({ recipe_id: recipe.id });
      showToast('点菜成功！' + recipe.name);
      const o = await getOrders('');
      setOrders(o.data);
    } catch (err) { showToast(err.response?.data?.error || '操作失败', 'error'); }
  };

  if (loading) return <p style={{ color: 'var(--text-light)' }}>加载中...</p>;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>Hi, {user?.nickname || user?.username}👋</h1>
        <p style={{ color: 'var(--text-light)', fontSize: 14 }}>{isFoodie ? '今天想吃什么呢？' : '看看你的拿手好菜吧'}</p>
      </div>

      {recommend.length > 0 && (
        <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, rgba(255,255,255,0), rgba(250,219,216,0.5))', backdropFilter: 'blur(4px)' }}>
          <h2 style={{ fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Heart size={18} color="var(--primary)" /> 今日推荐
          </h2>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
            {recommend.map(r => (
              <div key={r.id} style={{ minWidth: 160, flexShrink: 0, cursor: 'pointer' }} onClick={() => navigate('/recipes/' + r.id)}>
                <div style={{ width: '100%', height: 110, borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.5)' }}>
                  {r.cover ? <img src={r.cover} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🍕</div>}
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>{r.name}</p>
                <div className="meta" style={{ fontSize: 12, color: 'var(--text-light)' }}>
                  {r.nutrition && <span>{nutritionLabels[r.nutrition] || r.nutrition}</span>}
                  <span>⭐ {Number(r.avg_score).toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isFoodie && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => navigate('/recipes')}>
            <Utensils size={18} /> 看看吃什么
          </button>
        </div>
      )}
      {!isFoodie && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => navigate('/add')}>
            <ChefHat size={18} /> 上传新菜
          </button>
          <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => navigate('/recipes')}>
            <Utensils size={18} /> 管理菜谱
          </button>
        </div>
      )}

      {orders.length > 0 && (
        <div>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>📋 最近点单</h2>
          {orders.slice(0, 5).map(o => (
            <div key={o.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(2px)' }} onClick={() => navigate('/recipes/' + o.recipe_id)}>
              <div style={{ width: 50, height: 50, borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
                {o.recipe_cover ? <img src={o.recipe_cover} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🍕</div>}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 600 }}>{o.recipe_name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-light)' }}>{o.created_at?.slice(0, 10)} · {o.status === 'pending' ? '待做' : o.status === 'cooking' ? '制作中' : '已完成'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {orders.length === 0 && (
        <div className="empty-state">
          <div className="icon">🍳</div>
          <p>{isFoodie ? '还没有点过菜，快去看看今天吃什么吧！' : '还没有收到点单~'}</p>
        </div>
      )}
    </div>
  );
}
