import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';

export default function Profile({ userId, onLogout, onUpdateUser }: { userId: number, onLogout: () => void, onUpdateUser: (u: any) => void }) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [originalProfile, setOriginalProfile] = useState<any>(null);

  useEffect(() => {
    fetch(`http://localhost:8000/api/profile?user_id=${userId}`)
      .then(res => res.json())
      .then(data => {
        setOriginalProfile({ username: data.username, email: data.email });
        setEditUsername(data.username);
        setEditEmail(data.email);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load profile", err);
        setLoading(false);
      });
  }, [userId]);

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setSaving(true);
    
    const formData = new FormData();
    formData.append("user_id", userId.toString());
    formData.append("username", editUsername);
    formData.append("email", editEmail);
    formData.append("password", editPassword);

    try {
      const res = await fetch(`http://localhost:8000/api/profile`, {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail || "Failed to update profile");
      
      setOriginalProfile({ username: editUsername, email: editEmail });
      onUpdateUser({ username: editUsername });
      setEditPassword(""); 
      setSuccess("Changes saved successfully.");
      setSaving(false);
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalProfile) {
      setEditUsername(originalProfile.username);
      setEditEmail(originalProfile.email);
    }
    setEditPassword("");
    setError("");
    setSuccess("");
  };

  if (loading) {
    return (
      <div className="loader-container fade-in">
        <div className="spinner"></div>
        <p>Loading Profile...</p>
      </div>
    );
  }

  const getTabClassName = (tabName: 'profile' | 'password') =>
    `profile-tab-button ${activeTab === tabName ? 'active' : ''}`;

  return (
    <div className="profile-container fade-in max-w-2xl mx-auto mt-12 w-full">
      <div className="card glass-card p-0 overflow-hidden w-full" style={{ textAlign: 'left', padding: 0, overflow: 'visible' }}>
        
        {/* TOP TAB BAR */}
        <div className="profile-tabbar">
          <button onClick={() => setActiveTab('profile')} className={getTabClassName('profile')}>Account Information</button>
          <button onClick={() => setActiveTab('password')} className={getTabClassName('password')}>Password & Security</button>
        </div>
 
        <div className="profile-content">
          
          {error && <div className="auth-error mb-4">{error}</div>}
          {success && <div style={{ backgroundColor: 'var(--success-light)', color: 'var(--success-text)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid #10b981', textAlign: 'center', fontWeight: '500' }}>{success}</div>}

          {/* TAB: PROFILE */}
          {activeTab === 'profile' && (
            <div className="page-enter">
              <h3 style={{ color: 'var(--success-primary)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'inline-block', borderBottom: '2px solid var(--brand-primary)', paddingBottom: '0.25rem' }}>
                Account Information
              </h3>
              
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editUsername} 
                  onChange={e => setEditUsername(e.target.value)} 
                  placeholder="Your name"
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>Email</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={editEmail} 
                  onChange={e => setEditEmail(e.target.value)} 
                  placeholder="name@example.com"
                />
              </div>
            </div>
          )}

          {/* TAB: PASSWORD */}
          {activeTab === 'password' && (
            <div className="page-enter">
              <h3 style={{ color: 'var(--success-primary)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'inline-block', borderBottom: '2px solid var(--brand-primary)', paddingBottom: '0.25rem' }}>
                Update Password
              </h3>
              
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>New Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={editPassword} 
                  onChange={e => setEditPassword(e.target.value)} 
                  placeholder="Enter new password"
                />
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Leaving this field blank will keep your current password.
              </p>
            </div>
          )}

          {/* FOOTER ACTIONS - ONLY VISIBLE ON FORMS */}
          <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <button 
              onClick={onLogout} 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}
              className="hover:underline"
            >
              <LogOut size={16} /> Logout
            </button>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={handleCancel}
                className="btn-primary"
                style={{
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'none'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="btn-primary"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
