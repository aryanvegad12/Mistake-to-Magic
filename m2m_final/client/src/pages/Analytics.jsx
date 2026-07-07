import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler);

const SUB_COLORS_ARR = ['#ff6b6b','#c39bd3','#5dade2','#6bcb77','#f0a85a','#48c9b0','#e74c3c','#2471a3','#7f8c8d'];
const TYPE_COLORS = ['#a78bfa','#ffd93d','#ff6b6b','#6bcb77','#5dade2','#f0a85a','#48c9b0','#e74c3c'];

const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Poppins' } } }, x: { grid: { display: false }, ticks: { font: { family: 'Poppins', size: 11 } } } } };
const doughnutOpts = { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { padding: 14, font: { family: 'Poppins', size: 11 } } } } };

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/summary').then(res => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ background:'#f0f2ff', minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <Navbar /><div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}><div className="spinner" /></div>
    </div>
  );

  const sumCard = (num, label, color, icon) => (
    <div style={{ background:'#fff', borderRadius:16, padding:'20px 16px', textAlign:'center', boxShadow:'0 4px 12px rgba(0,0,0,0.05)', borderBottom:`4px solid ${color}` }}>
      <div style={{ fontSize:'1.8rem', marginBottom:6 }}>{icon}</div>
      <div style={{ fontSize:'2rem', fontWeight:900, color:'#1a1a2e' }}>{num ?? '—'}</div>
      <div style={{ fontSize:'0.75rem', color:'#8080a0', fontWeight:500, marginTop:4 }}>{label}</div>
    </div>
  );

  const topSub = data?.bySubject?.[0]?._id || '—';
  const topType = data?.byType?.[0]?._id || '—';

  return (
    <div style={{ background:'#f0f2ff', minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <Navbar />
      <div className="page-wrap">
        <div style={{ marginBottom:24 }}>
          <h2 style={{ fontSize:'1.5rem', fontWeight:900, color:'#1a1a2e' }}>📊 Analytics</h2>
          <p style={{ color:'#8080a0', fontSize:'0.85rem', marginTop:2 }}>Your learning pattern at a glance</p>
        </div>

        {/* Summary row */}
        <div className="analytics-summary">
          {sumCard(data?.summary?.total, 'Total Mistakes', '#ff6b6b', '📚')}
          {sumCard(data?.summary?.thisWeek, 'This Week', '#ffd93d', '📅')}
          {sumCard(topSub, 'Weakest Subject', '#a78bfa', '⚠️')}
          {sumCard(topType, 'Top Mistake Type', '#6bcb77', '🎯')}
        </div>

        {/* Charts grid */}
        <div className="analytics-grid" style={{ marginBottom:22 }}>
          {/* By Subject bar */}
          <div style={{ background:'#fff', borderRadius:18, padding:22, boxShadow:'0 4px 14px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize:'0.95rem', fontWeight:700, color:'#1a1a2e', marginBottom:18, display:'flex', alignItems:'center', gap:6 }}>
              <i className="fas fa-book" style={{ color:'#a78bfa' }} /> Mistakes by Subject
            </h3>
            <div style={{ height:260 }}>
              {data?.bySubject?.length > 0 ? (
                <Bar data={{
                  labels: data.bySubject.map(d => d._id),
                  datasets: [{ data: data.bySubject.map(d => d.count), backgroundColor: SUB_COLORS_ARR, borderRadius: 8, borderSkipped: false }]
                }} options={chartOpts} />
              ) : <p style={{ color:'#c0c0d8', textAlign:'center', paddingTop:80 }}>No data yet</p>}
            </div>
          </div>

          {/* By Type doughnut */}
          <div style={{ background:'#fff', borderRadius:18, padding:22, boxShadow:'0 4px 14px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize:'0.95rem', fontWeight:700, color:'#1a1a2e', marginBottom:18, display:'flex', alignItems:'center', gap:6 }}>
              <i className="fas fa-tags" style={{ color:'#ff6b6b' }} /> Mistakes by Type
            </h3>
            <div style={{ height:260 }}>
              {data?.byType?.length > 0 ? (
                <Doughnut data={{
                  labels: data.byType.map(d => d._id),
                  datasets: [{ data: data.byType.map(d => d.count), backgroundColor: TYPE_COLORS, hoverOffset: 8, borderWidth: 0 }]
                }} options={doughnutOpts} />
              ) : <p style={{ color:'#c0c0d8', textAlign:'center', paddingTop:80 }}>No data yet</p>}
            </div>
          </div>
        </div>

        {/* 7-day line chart */}
        <div style={{ background:'#fff', borderRadius:18, padding:22, boxShadow:'0 4px 14px rgba(0,0,0,0.06)', marginBottom:22 }}>
          <h3 style={{ fontSize:'0.95rem', fontWeight:700, color:'#1a1a2e', marginBottom:18, display:'flex', alignItems:'center', gap:6 }}>
            <i className="fas fa-calendar" style={{ color:'#6bcb77' }} /> Mistakes — Last 7 Days
          </h3>
          <div style={{ height:200 }}>
            {data?.last7Days ? (
              <Line data={{
                labels: data.last7Days.map(d => d.date),
                datasets: [{ data: data.last7Days.map(d => d.count), borderColor:'#a78bfa', backgroundColor:'rgba(167,139,250,0.12)', borderWidth:3, pointRadius:6, pointBackgroundColor:'#a78bfa', fill:true, tension:0.4 }]
              }} options={{ ...chartOpts, plugins: { legend: { display: false } } }} />
            ) : <p style={{ color:'#c0c0d8', textAlign:'center', paddingTop:60 }}>No data yet</p>}
          </div>
        </div>

        {/* Weakest subjects this month */}
        {data?.weakestSubjects?.length > 0 && (
          <div style={{ background:'linear-gradient(135deg,#fff8e6,#fff)', borderRadius:18, padding:22, boxShadow:'0 4px 14px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize:'0.95rem', fontWeight:700, color:'#1a1a2e', marginBottom:16 }}>⚠️ Focus Areas This Month</h3>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              {data.weakestSubjects.map((s, i) => (
                <div key={s._id} style={{ background: i === 0 ? 'linear-gradient(135deg,#ff6b6b,#ee5a24)' : i === 1 ? 'linear-gradient(135deg,#ffd93d,#f0a85a)' : 'linear-gradient(135deg,#a78bfa,#7c3aed)', borderRadius:14, padding:'14px 22px', color:'#fff' }}>
                  <div style={{ fontSize:'0.7rem', opacity:0.8, fontWeight:600 }}>#{i+1} Weakest</div>
                  <div style={{ fontSize:'1.1rem', fontWeight:800 }}>{s._id}</div>
                  <div style={{ fontSize:'0.8rem', opacity:0.85 }}>{s.count} mistakes this month</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
