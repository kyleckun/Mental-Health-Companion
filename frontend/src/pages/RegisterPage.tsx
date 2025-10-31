import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { RegisterData, ValidationErrors, UserType } from '../types/auth.types';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    user_type: 'general',
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
      general: undefined,
    }));

    if (name === 'password' && value) {
      const strength = authService.validatePassword(value);
      setPasswordStrength(strength);
    } else if (name === 'password' && !value) {
      setPasswordStrength(null);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Please enter a username';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 30) {
      newErrors.username = 'Username must not exceed 30 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Please enter an email address';
    } else if (!authService.validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Please enter a password';
    } else {
      const passwordValidation = authService.validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.message;
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await authService.register(formData);
      alert('Registration successful! Please log in');
      navigate('/login');
    } catch (err: any) {
      setErrors({ general: err.message || 'Registration failed. Please try again later' });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (!passwordStrength) return '#cbd5e0';
    return passwordStrength.isValid ? '#48bb78' : '#f56565';
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconWrapper}>
            <span style={styles.icon}></span>
          </div>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>Join Mental Health Companion</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {errors.general && (
            <div style={styles.errorBox}>
              <span style={styles.errorIcon}></span>
              <span style={styles.errorText}>{errors.general}</span>
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="username">
              Username
            </label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}></span>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Letters, numbers, or underscores, 3-30 characters"
                style={{
                  ...styles.input,
                  ...(errors.username ? styles.inputError : {}),
                }}
                disabled={isLoading}
              />
            </div>
            {errors.username && (
              <span style={styles.fieldError}>{errors.username}</span>
            )}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="email">
              Email Address
            </label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}></span>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
                style={{
                  ...styles.input,
                  ...(errors.email ? styles.inputError : {}),
                }}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <span style={styles.fieldError}>{errors.email}</span>
            )}
          </div>

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
                value={formData.password}
                onChange={handleInputChange}
                placeholder="At least 6 characters, including letters and numbers"
                style={{
                  ...styles.input,
                  ...(errors.password ? styles.inputError : {}),
                }}
                disabled={isLoading}
              />
            </div>
            {passwordStrength && (
              <div style={styles.strengthIndicator}>
                <div
                  style={{
                    ...styles.strengthBar,
                    width: passwordStrength.isValid ? '100%' : '50%',
                    background: getPasswordStrengthColor(),
                  }}
                />
                <span
                  style={{
                    ...styles.strengthText,
                    color: getPasswordStrengthColor(),
                  }}
                >
                  {passwordStrength.message}
                </span>
              </div>
            )}
            {errors.password && (
              <span style={styles.fieldError}>{errors.password}</span>
            )}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}></span>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Enter password again"
                style={{
                  ...styles.input,
                  ...(errors.confirmPassword ? styles.inputError : {}),
                }}
                disabled={isLoading}
              />
            </div>
            {errors.confirmPassword && (
              <span style={styles.fieldError}>{errors.confirmPassword}</span>
            )}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="user_type">
              I am a...
            </label>
            <select
              id="user_type"
              name="user_type"
              value={formData.user_type}
              onChange={handleInputChange}
              style={styles.select}
              disabled={isLoading}
            >
              <option value="general">General User</option>
              <option value="student">Student</option>
              <option value="young_professional">Young Professional</option>
              <option value="pregnant_woman">Pregnant Woman</option>
            </select>
            <p style={styles.helpText}>
              This helps us provide personalized mental health suggestions tailored to your needs.
            </p>
          </div>

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
                Registering...
              </span>
            ) : (
              'Register'
            )}
          </button>

          <div style={styles.footer}>
            <span style={styles.footerText}>Already have an account?</span>
            <Link to="/login" style={styles.link}>
              Log in now
            </Link>
          </div>
        </form>
      </div>

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
    gap: '20px',
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
  inputError: {
    borderColor: '#fc8181',
  },
  fieldError: {
    fontSize: '12px',
    color: '#e53e3e',
    fontWeight: '500',
    marginTop: '-4px',
  },
  strengthIndicator: {
    marginTop: '8px',
  },
  strengthBar: {
    height: '4px',
    borderRadius: '2px',
    transition: 'all 0.3s ease',
    marginBottom: '6px',
  },
  strengthText: {
    fontSize: '12px',
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
  select: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '15px',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.3s ease',
    background: 'white',
    color: '#2d3748',
    fontFamily: 'inherit',
    cursor: 'pointer',
  } as React.CSSProperties,
  helpText: {
    fontSize: '12px',
    color: '#718096',
    margin: '6px 0 0 0',
    lineHeight: '1.5',
  },
};

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

export default RegisterPage;
