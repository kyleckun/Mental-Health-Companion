import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { LoginCredentials } from '../types/auth.types';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
    rememberMe: false,
  });
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // DEBUG: Check if already authenticated on page load
  React.useEffect(() => {
    console.log('[LoginPage] Page loaded');
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    console.log('[LoginPage] Token check:', token ? 'exists' : 'not found');

    if (token) {
      console.log('[LoginPage] Already logged in, redirecting to /app');
      navigate('/app', { replace: true });
    } else {
      console.log('[LoginPage] Showing login form');
    }
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!credentials.username.trim()) {
      setError('Please enter username or email');
      return;
    }
    if (!credentials.password) {
      setError('Please enter password');
      return;
    }

    setIsLoading(true);

    try {
      console.log('[LoginPage] Attempting login...');
      await authService.login(credentials);
      console.log('[LoginPage] Login successful, redirecting to /app');
      navigate('/app', { replace: true }); // Redirect to app after successful login
    } catch (err: any) {
      console.error('[LoginPage] Login failed:', err);
      setError(err.message || 'Login failed, please try again later');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo/Title */}
        <div style={styles.header}>
          <div style={styles.iconWrapper}>
            <span style={styles.icon}></span>
          </div>
          <h1 style={styles.title}>Welcome Back</h1>
          <p style={styles.subtitle}>Sign in to Mental Health Companion</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Error Message */}
          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorIcon}></span>
              <span style={styles.errorText}>{error}</span>
            </div>
          )}

          {/* Username Input */}
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="username">
              Username or Email
            </label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}></span>
              <input
                type="text"
                id="username"
                name="username"
                value={credentials.username}
                onChange={handleInputChange}
                placeholder="Enter username or email"
                style={styles.input}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="password">
              Password
            </label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}></span>
              <input
                type="password"
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleInputChange}
                placeholder="Enter password"
                style={styles.input}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div style={styles.rememberRow}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="rememberMe"
                checked={credentials.rememberMe}
                onChange={handleInputChange}
                style={styles.checkbox}
                disabled={isLoading}
              />
              <span style={styles.checkboxText}>Remember me</span>
            </label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            style={{
              ...styles.button,
              ...(isLoading ? styles.buttonDisabled : {}),
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <span style={styles.buttonContent}>
                <span style={styles.spinner}></span>
                Logging in...
              </span>
            ) : (
              'Login'
            )}
          </button>

          {/* Register Link */}
          <div style={styles.footer}>
            <span style={styles.footerText}>Don't have an account?</span>
            <Link to="/register" style={styles.link}>
              Sign up now
            </Link>
          </div>
        </form>
      </div>

      {/* Background Decorations */}
      <div style={styles.bgCircle1}></div>
      <div style={styles.bgCircle2}></div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    position: 'relative',
    zIndex: 1,
    animation: 'fadeInUp 0.6s ease-out',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  iconWrapper: {
    marginBottom: '16px',
  },
  icon: {
    fontSize: '56px',
    display: 'inline-block',
    animation: 'bounce 2s ease-in-out infinite',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1a202c',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#718096',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  errorBox: {
    background: 'linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)',
    border: '1px solid #fc8181',
    borderRadius: '12px',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    animation: 'shake 0.5s ease-in-out',
  },
  errorIcon: {
    fontSize: '18px',
  },
  errorText: {
    color: '#c53030',
    fontSize: '14px',
    fontWeight: '500',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2d3748',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    fontSize: '18px',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '14px 16px 14px 48px',
    fontSize: '15px',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.3s ease',
    background: 'white',
    color: '#2d3748',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  rememberRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '-8px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: '#667eea',
  },
  checkboxText: {
    fontSize: '14px',
    color: '#4a5568',
    fontWeight: '500',
  },
  button: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
    marginTop: '8px',
  } as React.CSSProperties,
  buttonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  buttonContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '3px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block',
  },
  footer: {
    textAlign: 'center',
    marginTop: '8px',
  },
  footerText: {
    fontSize: '14px',
    color: '#718096',
    marginRight: '6px',
  },
  link: {
    fontSize: '14px',
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'color 0.3s ease',
  },
  bgCircle1: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.1)',
    top: '-100px',
    right: '-100px',
    animation: 'float 6s ease-in-out infinite',
  },
  bgCircle2: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.1)',
    bottom: '-50px',
    left: '-50px',
    animation: 'float 8s ease-in-out infinite reverse',
  },
};

// Add CSS animations via a style tag
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-20px);
    }
  }

  input:focus {
    border-color: #667eea !important;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
  }

  button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5) !important;
  }

  button:active:not(:disabled) {
    transform: translateY(0);
  }

  a:hover {
    color: #764ba2 !important;
    text-decoration: underline !important;
  }

  @media (max-width: 480px) {
    .card {
      padding: 32px 24px !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default LoginPage;
