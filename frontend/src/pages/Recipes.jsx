import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContext, UserContext } from '../App';
import { getRecipes, deleteRecipe, createOrder } from '../api';
import { Star, Trash2, Edit3 } from 'lucide-react';

export default function Recipes() {
  const { user } = useContext(UserContext);
  const showToast = useContext(ToastContext);
  const [recipes, setRecipes] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isChef = user?.role === 'chef';
  const isFoodie = user?.role === 'foodie';

  useEffect(() => { getRecipes().then(r => { setRecipes(r.data); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const filtered = filter === 'all' ? recipes : recipes.filter(r => r.nutrition === filter || r.tags?.includes(filter));

  const handleOrder = async (recipe, e) => {
    e.stopPropagation();
    try {
      await createOrder({ recipe_id: recipe.id });
      showToast('✅ 点单成功！等着吃' + recipe.name + '吧~');
    } catch (err) { showToast(err.response?.data?.error || '点单失败', 'error'); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('确定删除这道菜吗？')) return;
    try { await deleteRecipe(id); setRecipes(recipes.filter(r => r.id !== id)); showToast('已删除'); }
    catch (err) { showToast('删除失败', 'error'); }
  };

  const nutritionFilters = [
    { key: 'all', label: '全部' }, { key: 'light', label: '清淡' }, { key: 'heavy', label: '重口味' },
    { key: 'protein', label: '高蛋白' }, { key: 'lowcal', label: '低卡' }, { key: 'soup', label: '汤类' }, { key: 'quick', label: '快手菜' }
  ];

  if (loading) return <p style={{ color: 'var(--text-light)' }}>加载中...</p>;

  return (
    <div>
      <h1>🍽️ 全部菜谱</h1>
      <div className="tags" style={{ marginBottom: 16 }}>
        {nutritionFilters.map(f => (
          <span key={f.key} className="tag" style={{ cursor: 'pointer', background: filter === f.key ? 'var(--primary)' : 'var(--primary-light)', color: filter === f.key ? '#fff' : 'var(--primary)' }} onClick={() => setFilter(f.key)}>{f.label}</span>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🍳</div>
          <p>{isChef ? '还没有菜谱，快上传你的拿手菜吧！' : '还没有菜谱~等大厨上传吧'}</p>
          {isChef && <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/add')}>上传新菜</button>}
        </div>
      ) : (
        <div className="recipe-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
          {filtered.map(r => (
            <div key={r.id} className="recipe-card" onClick={() => navigate('/recipes/' + r.id)}>
              <div className="cover" style={{ height: 130, position: 'relative' }}>
                {r.cover ? <img src={r.cover} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, background: 'var(--primary-light)' }}>🍽️</div>}
                {isChef && (
                  <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 4 }}>
                    <button style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 6, padding: 4, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); navigate('/edit/' + r.id); }}><Edit3 size={14} /></button>
                    <button style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 6, padding: 4, cursor: 'pointer' }} onClick={(e) => handleDelete(r.id, e)}><Trash2 size={14} color="var(--primary)" /></button>
                  </div>
                )}
              </div>
              <div className="info">
                <h3 style={{ fontSize: 15 }}>{r.name}</h3>
                <div className="meta">
                  <span>{r.nutrition ? ({ light: '清淡', heavy: '重口味', protein: '高蛋白', lowcal: '低卡', soup: '汤类', quick: '快手菜' }[r.nutrition] || r.nutrition) : ''}</span>
                  <span><Star size={12} /> {Number(r.avg_score).toFixed(1)}</span>
                  <span>已做 {r.order_count || 0} 次</span>
                </div>
                {!isChef && <button className="btn btn-sm" style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 6, width: '100%', marginTop: 8, fontWeight: 600, cursor: 'pointer', fontSize: 12 }} onClick={(e) => handleOrder(r, e)}>点单</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
