import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Target, TrendingUp, AlertTriangle } from 'lucide-react';

export default function Dashboard({ userId }: { userId: number }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/api/progress?user_id=${userId}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load progress", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="loader-container fade-in">
        <div className="spinner"></div>
        <p>Loading your progress...</p>
      </div>
    );
  }

  if (!data || data.history.length === 0) {
    return (
      <div className="empty-state card">
        <Target className="icon-huge text-muted" />
        <h2>No Data Yet</h2>
        <p className="text-muted text-med">Complete a practice exercise to see your progress dashboard!</p>
      </div>
    );
  }

  const avgAcc = Math.round(data.history.reduce((acc: any, curr: any) => acc + curr.accuracy, 0) / data.history.length);
  const avgPro = Math.round(data.history.reduce((acc: any, curr: any) => acc + curr.pronunciation, 0) / data.history.length);

  return (
    <div className="dashboard-container fade-in">
      <div className="stat-grid">
        <div className="stat-card card">
          <div className="icon-box primary-light">
            <TrendingUp />
          </div>
          <div className="stat-info">
            <p className="label">Average Accuracy</p>
            <h3>{avgAcc}%</h3>
          </div>
        </div>
        
        <div className="stat-card card">
          <div className="icon-box success-light">
            <Target />
          </div>
          <div className="stat-info">
            <p className="label">Avg Pronunciation</p>
            <h3>{avgPro}%</h3>
          </div>
        </div>
      </div>

      <div className="chart-card card">
        <div className="card-header">
          <TrendingUp className="icon-primary" />
          <h2>Performance History</h2>
        </div>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.history} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="id" stroke="#64748b" tickFormatter={(id) => `Sess. ${id}`}/>
              <YAxis stroke="#64748b" domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#0f172a' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }}/>
              <Line type="monotone" dataKey="accuracy" name="Accuracy" stroke="#6366f1" strokeWidth={3} dot={{r: 4}} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="fluency" name="Fluency" stroke="#10b981" strokeWidth={3} dot={{r: 4}} />
              <Line type="monotone" dataKey="pronunciation" name="Pronunciation" stroke="#f43f5e" strokeWidth={3} dot={{r: 4}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {data.weak_spots.length > 0 && (
        <div className="alert-card card">
          <div className="card-header alert-text">
            <AlertTriangle />
            <h2>Recommended Focus Areas</h2>
          </div>
          <p className="text-muted mb-4">These are the words our AI noted that you struggled with historically:</p>
          <div className="bad-words-list">
            {data.weak_spots.map((ws: any, idx: number) => (
              <div key={idx} className="bad-word-badge">
                <span className="bad-word-text">{ws.word}</span>
                <span className="bad-word-count">Flagged {ws.error_count} times</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
