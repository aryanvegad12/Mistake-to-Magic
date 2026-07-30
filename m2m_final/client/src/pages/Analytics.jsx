import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { useTheme } from '../context/ThemeContext';
import { subjectMeta, SEVERITY_COLORS } from '../utils/subjects';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Tooltip, Legend, Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler);

const TYPE_COLORS = ['#8b5cf6', '#22d3ee', '#fbbf24', '#ff6b6b', '#34d399', '#f472b6', '#6366f1', '#a0522d'];
const HEATMAP_DAYS = 91;

const dayKey = (d) => d.toLocaleDateString('en-CA');

export default function Analytics() {
  const [data, setData] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/analytics/summary'),
      api.get('/analytics/heatmap').catch(() => ({ data: { heatmap: [] } })),
    ])
      .then(([summaryRes, heatRes]) => {
        setData(summaryRes.data);
        setHeatmap(heatRes.data.heatmap || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Charts must pick up the new palette whenever the theme flips
  const chartTheme = useMemo(() => {
    const dark = theme === 'dark';
    return {
      tick: dark ? '#7d7da3' : '#8a8aab',
      grid: dark ? 'rgba(255,255,255,0.07)' : 'rgba(20,20,43,0.07)',
      tooltipBg: dark ? '#12121f' : '#ffffff',
      tooltipText: dark ? '#f4f4fb' : '#14142b',
      border: dark ? 'rgba(255,255,255,0.12)' : '#e4e7f5',
    };
  }, [theme]);

  const baseOpts = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: chartTheme.tooltipBg,
        titleColor: chartTheme.tooltipText,
        bodyColor: chartTheme.tooltipText,
        borderColor: chartTheme.border,
        borderWidth: 1,
        padding: 11,
        cornerRadius: 10,
        titleFont: { family: 'Poppins', weight: '700', size: 12 },
        bodyFont: { family: 'Poppins', size: 12 },
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: chartTheme.tick, font: { family: 'Poppins', size: 11 } },
        grid: { color: chartTheme.grid, drawBorder: false },
      },
      x: {
        ticks: { color: chartTheme.tick, font: { family: 'Poppins', size: 11 } },
        grid: { display: false, drawBorder: false },
      },
    },
  }), [chartTheme]);

  const doughnutOpts = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 14, boxWidth: 10, usePointStyle: true, pointStyle: 'circle', color: chartTheme.tick, font: { family: 'Poppins', size: 11 } },
      },
      tooltip: baseOpts.plugins.tooltip,
    },
  }), [chartTheme, baseOpts]);

  // 13 weeks × 7 days activity grid
  const heatCells = useMemo(() => {
    const counts = new Map(heatmap.map(d => [d._id, d.count]));
    const cells = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      cells.push({ key, count: counts.get(key) || 0, date: d });
    }
    return cells;
  }, [heatmap]);

  const heatMax = useMemo(() => Math.max(1, ...heatCells.map(c => c.count)), [heatCells]);

  if (loading) {
    return (
      <div className="screen">
        <Navbar />
        <div className="page">
          <div className="grid grid-4" style={{ marginBottom: 20 }}>
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 118 }} />)}
          </div>
          <div className="grid grid-2">
            {Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 330 }} />)}
          </div>
        </div>
      </div>
    );
  }

  const s = data?.summary || {};
  const hasData = (s.total || 0) > 0;
  const topSub = data?.bySubject?.[0]?._id;
  const topType = data?.byType?.[0]?._id;

  const sev = data?.bySeverity || [];
  const sevCount = (name) => sev.find(x => x._id === name)?.count || 0;
  const sevTotal = Math.max(1, sevCount('High') + sevCount('Medium') + sevCount('Low'));

  return (
    <div className="screen">
      <Navbar />
      <div className="page">

        <div className="page-head">
          <div>
            <h1 className="page-title">📊 Analytics</h1>
            <p className="page-sub">Your learning pattern, at a glance</p>
          </div>
          {hasData && (
            <div className="row" style={{ gap: 8 }}>
              <span className="pill-stat">📚 {s.total} total</span>
              <span className="pill-stat">📅 {s.thisMonth} this month</span>
            </div>
          )}
        </div>

        {!hasData ? (
          <div className="empty">
            <div className="empty-emoji">📊</div>
            <p className="empty-title">No data to analyse yet</p>
            <p style={{ fontSize: '0.86rem', marginBottom: 22 }}>Log a few mistakes and your patterns will show up here.</p>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              <i className="fas fa-bolt" /> Log a mistake
            </button>
          </div>
        ) : (
          <>
            {/* Summary tiles */}
            <div className="grid grid-4 animate-rise" style={{ marginBottom: 20 }}>
              {[
                { icon: '📚', val: s.total, label: 'Total mistakes', grad: 'var(--grad-brand)' },
                { icon: '📅', val: s.thisWeek, label: 'This week', grad: 'var(--grad-cool)' },
                { icon: '⚠️', val: topSub || '—', label: 'Weakest subject', grad: 'var(--grad-hot)' },
                { icon: '🎯', val: topType || '—', label: 'Top mistake type', grad: 'var(--grad-green)' },
              ].map(({ icon, val, label, grad }) => (
                <div key={label} className="stat" style={{ background: grad }}>
                  <div className="stat-icon">{icon}</div>
                  <div className="stat-value" style={{ fontSize: typeof val === 'string' && val.length > 6 ? '1.25rem' : undefined }}>{val}</div>
                  <div className="stat-label">{label}</div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-2 animate-rise d1" style={{ marginBottom: 20 }}>
              <div className="card card-pad">
                <h2 className="chart-title"><i className="fas fa-book" style={{ color: 'var(--brand)' }} /> Mistakes by subject</h2>
                <div style={{ height: 265 }}>
                  <Bar
                    data={{
                      labels: data.bySubject.map(d => d._id),
                      datasets: [{
                        data: data.bySubject.map(d => d.count),
                        backgroundColor: data.bySubject.map(d => subjectMeta(d._id).color),
                        borderRadius: 8,
                        borderSkipped: false,
                        maxBarThickness: 46,
                      }],
                    }}
                    options={baseOpts}
                  />
                </div>
              </div>

              <div className="card card-pad">
                <h2 className="chart-title"><i className="fas fa-tags" style={{ color: 'var(--coral)' }} /> Mistakes by type</h2>
                <div style={{ height: 265 }}>
                  <Doughnut
                    data={{
                      labels: data.byType.map(d => d._id),
                      datasets: [{
                        data: data.byType.map(d => d.count),
                        backgroundColor: TYPE_COLORS,
                        hoverOffset: 10,
                        borderWidth: 0,
                      }],
                    }}
                    options={doughnutOpts}
                  />
                </div>
              </div>
            </div>

            {/* Trend */}
            <div className="card card-pad animate-rise d2" style={{ marginBottom: 20 }}>
              <h2 className="chart-title"><i className="fas fa-chart-line" style={{ color: 'var(--green)' }} /> Last 7 days</h2>
              <div style={{ height: 210 }}>
                <Line
                  data={{
                    labels: data.last7Days.map(d => d.date),
                    datasets: [{
                      data: data.last7Days.map(d => d.count),
                      borderColor: '#8b5cf6',
                      backgroundColor: (ctx) => {
                        const { chart } = ctx;
                        if (!chart.chartArea) return 'rgba(139,92,246,0.14)';
                        const g = chart.ctx.createLinearGradient(0, chart.chartArea.top, 0, chart.chartArea.bottom);
                        g.addColorStop(0, 'rgba(139,92,246,0.32)');
                        g.addColorStop(1, 'rgba(139,92,246,0)');
                        return g;
                      },
                      borderWidth: 3,
                      pointRadius: 5,
                      pointHoverRadius: 7,
                      pointBackgroundColor: '#8b5cf6',
                      pointBorderColor: chartTheme.tooltipBg,
                      pointBorderWidth: 2,
                      fill: true,
                      tension: 0.4,
                    }],
                  }}
                  options={baseOpts}
                />
              </div>
            </div>

            {/* Severity + heatmap */}
            <div className="grid grid-2 animate-rise d3" style={{ marginBottom: 20 }}>
              <div className="card card-pad">
                <h2 className="chart-title"><i className="fas fa-gauge-high" style={{ color: 'var(--amber)' }} /> Severity split</h2>
                <div className="stack" style={{ gap: 15, marginTop: 6 }}>
                  {['High', 'Medium', 'Low'].map(name => {
                    const count = sevCount(name);
                    return (
                      <div key={name}>
                        <div className="row-between" style={{ marginBottom: 7 }}>
                          <span style={{ fontSize: '0.83rem', fontWeight: 600 }}>
                            {name}{name === 'High' && <span style={{ color: 'var(--text-3)', fontWeight: 500 }}> — fix these first</span>}
                          </span>
                          <button onClick={() => navigate(`/journal?severity=${name}`)}
                            style={{ color: SEVERITY_COLORS[name], fontSize: '0.83rem', fontWeight: 800 }}>
                            {count} →
                          </button>
                        </div>
                        <div className="progress">
                          <div className="progress-bar" style={{ width: `${(count / sevTotal) * 100}%`, background: SEVERITY_COLORS[name] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card card-pad">
                <h2 className="chart-title"><i className="fas fa-calendar-days" style={{ color: 'var(--cyan)' }} /> Last 90 days</h2>
                <div className="heatmap">
                  {heatCells.map(c => {
                    const level = c.count === 0 ? 0 : Math.ceil((c.count / heatMax) * 4);
                    return (
                      <span key={c.key} className="heat-cell" data-level={level}
                        title={`${c.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — ${c.count} mistake${c.count === 1 ? '' : 's'}`} />
                    );
                  })}
                </div>
                <div className="row" style={{ gap: 6, marginTop: 14, justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>Less</span>
                  {[0, 1, 2, 3, 4].map(l => <span key={l} className="heat-cell" data-level={l} />)}
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>More</span>
                </div>
              </div>
            </div>

            {/* Focus areas */}
            {data?.weakestSubjects?.length > 0 && (
              <div className="card card-pad animate-rise d4">
                <h2 className="chart-title"><i className="fas fa-crosshairs" style={{ color: 'var(--coral)' }} /> Focus areas this month</h2>
                <div className="grid grid-3">
                  {data.weakestSubjects.map((w, i) => {
                    const { color, icon } = subjectMeta(w._id);
                    return (
                      <button key={w._id} onClick={() => navigate(`/journal?subject=${w._id}`)}
                        className="focus-card" style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}>
                        <span className="focus-rank">#{i + 1} weakest</span>
                        <span className="focus-name">{icon} {w._id}</span>
                        <span className="focus-count">{w.count} mistake{w.count === 1 ? '' : 's'} this month →</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
  .chart-title { font-size: 0.95rem; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 9px; }

  .heatmap { display: grid; grid-template-rows: repeat(7, 1fr); grid-auto-flow: column; gap: 4px; overflow-x: auto; padding-bottom: 4px; }
  .heat-cell { width: 13px; height: 13px; border-radius: 3px; background: var(--surface-3); display: inline-block; flex-shrink: 0; }
  .heat-cell[data-level="1"] { background: color-mix(in srgb, var(--brand) 32%, transparent); }
  .heat-cell[data-level="2"] { background: color-mix(in srgb, var(--brand) 55%, transparent); }
  .heat-cell[data-level="3"] { background: color-mix(in srgb, var(--brand) 78%, transparent); }
  .heat-cell[data-level="4"] { background: var(--brand); box-shadow: 0 0 9px color-mix(in srgb, var(--brand) 60%, transparent); }

  .focus-card { display: flex; flex-direction: column; gap: 5px; text-align: left; padding: 18px;
    border-radius: var(--r-md); color: #fff; box-shadow: var(--shadow-sm); transition: transform 0.25s var(--ease), box-shadow 0.25s; }
  .focus-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
  .focus-rank { font-size: 0.66rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.85; }
  .focus-name { font-family: var(--font-display); font-size: 1.15rem; font-weight: 800; }
  .focus-count { font-size: 0.78rem; opacity: 0.9; }
`;
