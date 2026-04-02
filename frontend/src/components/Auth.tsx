import { useState } from 'react';

export default function Auth({ onLogin }: { onLogin: (user: { id: number, username: string }) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isLogin ? "/api/login" : "/api/signup";
    const formData = new FormData();
    
    if (isLogin) {
      formData.append("username_or_email", username);
    } else {
      formData.append("username", username);
      formData.append("email", email);
    }
    formData.append("password", password);

    try {
      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail || "Authentication error");
      onLogin({ id: data.user_id, username: data.username });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split fade-in">
      <div className="auth-hero">
        <div className="auth-blob-1"></div>
        <div className="auth-blob-2"></div>
        <div className="logo-icon small-logo" style={{width: '4rem', height: '4rem', marginBottom: '2rem', marginLeft: 0}}>
           <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
           </svg>
        </div>
        <h1 className="auth-hero-title">Elevate Your Voice with AI Therapy</h1>
        <p className="auth-hero-subtitle">
          Experience the world's most advanced speech companion. Harness real-time pronunciation analysis and deeply adaptive learning to build your vocal confidence.
        </p>
      </div>
      
      <div className="auth-form-side">
        {/* Simplified toggle structure as requested */}
        <div key={isLogin ? 'login' : 'signup'} className="auth-card glass-card page-enter auth-swap">
          <div className="auth-header" style={{textAlign: 'left'}}>
             <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
             <p className="text-muted" style={{fontSize: '1.1rem'}}>{isLogin ? "Enter your details to access your dashboard" : "Register today to start your speech therapy journey"}</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Username {isLogin && "or Email"}</label>
              <input 
                type="text" 
                required 
                className="form-input"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={isLogin ? "johndoe or john@example.com" : "johndoe"}
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  required 
                  className="form-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
            )}

            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                required 
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-4" style={{padding: '1rem'}}>
              {loading ? "Please wait..." : (isLogin ? "Log In" : "Sign Up")}
            </button>
          </form>

          <div className="auth-footer" style={{textAlign: 'left'}}>
            <p className="text-muted">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button type="button" onClick={() => { setIsLogin(!isLogin); setError(""); }} className="text-brand ml-2 bg-transparent border-none cursor-pointer hover:underline font-semibold" style={{fontSize: '1rem'}}>
                {isLogin ? "Create one here for free." : "Log in here."}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
