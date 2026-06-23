import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContext, UserContext } from '../App';
import { getRecipe, createOrder, createRating } from '../api';
import { Star, ArrowLeft, ShoppingCart, ChefHat } from 'lucide-react';

export default function RecipeDetail() {
  const { id } = useParams();
  const { user } = useContext(UserContext);
  const showToast = useContext(ToastContext);
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(null);
  const isFoodie = user?.role === 'foodie';
  const isChef = user?.role === 'chef';

  useEffect(() => {
    getRecipe(id).then(r => { setRecipe(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  const handleOrder = async () => {
    setOrdering(true);
    try {
      await createOrder({ recipe_id: recipe.id });
      showToast('点菜成功！等着吃' + recipe.name + '吧~');
      setOrdering(false);
      setTimeout(() => navigate('/orders'), 800);
    } catch (err) { showToast(err.response?.data?.error || '点菜失败', 'error'); setOrdering(false); }
  };

  const handleRating = async () => {
    if (!score) return showToast('请先评分', 'error');
    try {
      const res = await createRating({ order_id: rating.order_id, recipe_id: recipe.id, score, comment });
      showToast(res.data.message);
      getRecipe(id).then(r => setRecipe(r.data));
      setRating(null); setScore(0); setComment('');
    } catch (err) { showToast(err.response?.data?.error || '评价失败', 'error'); }
  };

  if (loading) return <p>加载中...</p>;
  if (!recipe) return <div className="empty-state"><div className="icon">😅</div><p>菜谱不存在</p></div>;

  const steps = recipe.steps ? recipe.steps.split('\\n').filter(s => s.trim()) : [];
  const ingredients = recipe.ingredients ? recipe.ingredients.split('\\n').filter(s => s.trim()) : [];
  const ratings = recipe.ratings || [];

  return (
    <div>
      <button className="btn btn-sm btn-secondary" style={{ marginBottom: 12 }} onClick={() => navigate(-1)}><ArrowLeft size={16} /> 返回</button>
      {recipe.cover && <img src={recipe.cover} alt={recipe.name} style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 'var(--radius)', marginBottom: 16 }} />}
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>{recipe.name}</h1>
      <div className="meta" style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--text-light)', marginBottom: 16 }}>
        <span>⭐ {Number(recipe.avg_score).toFixed(1)}</span>
        <span>已做 {recipe.order_count || 0} 次</span>
        {recipe.nutrition && <span>{({ light: '清淡', heavy: '重口味', protein: '高蛋白', lowcal: '低卡', soup: '汤类', quick: '快手菜' }[recipe.nutrition] || recipe.nutrition)}</span>}
      </div>

      {isFoodie && (
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }} onClick={handleOrder} disabled={ordering}>
          <ShoppingCart size={18} /> {ordering ? '点菜中...' : '我想吃这个！'}
        </button>
      )}

      {ingredients.length > 0 && (
        <div className="card" style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 16, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><ChefHat size={18} /> 食材清单</h3>
          <ul style={{ paddingLeft: 20, fontSize: 14, lineHeight: 1.8 }}>{ingredients.map((item, i) => <li key={i}>{item}</li>)}</ul>
        </div>
      )}

      {steps.length > 0 && (
        <div className="card" style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 16, marginBottom: 10 }}>📝 烹饪步骤</h3>
          <ol style={{ paddingLeft: 20, fontSize: 14, lineHeight: 1.8 }}>{steps.map((step, i) => <li key={i} style={{ marginBottom: 6 }}>{step}</li>)}</ol>
        </div>
      )}

      {!isFoodie && (
        <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={() => navigate('/edit/' + recipe.id)}>
          <ChefHat size={18} /> 编辑菜谱
        </button>
      )}

      {ratings.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>💬 评价 ({ratings.length})</h3>
          {ratings.map(r => (
            <div key={r.id} className="card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {[1,2,3,4,5].map(i => <span key={i} className={i <= r.score ? 'star' : 'star-empty'}>★</span>)}
              </div>
              {r.comment && <p style={{ fontSize: 14 }}>{r.comment}</p>}
              <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>{r.created_at?.slice(0, 10)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
