import { useEffect, useState } from 'react';
import { api } from '../../api/api.js';
import { useApp } from '../../context/AppContext.jsx';
import { maskPhone } from '../../utils/format.js';
import { IconClose } from '../Icons/Icons.jsx';
import './LoginModal.scss';

const DEMO_PHONE = '+7 912 345-67-89';

export default function LoginModal() {
  const { loginOpen, setLoginOpen, signIn } = useApp();
  const [mode, setMode] = useState('login'); // login | register | forgot
  const [phone, setPhone] = useState('+7 ');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loginOpen) {
      setMode('login');
      setError('');
      setLoading(false);
    }
  }, [loginOpen]);

  useEffect(() => {
    if (!loginOpen) return undefined;
    const onKey = (event) => event.key === 'Escape' && setLoginOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [loginOpen, setLoginOpen]);

  if (!loginOpen) return null;

  const phoneReady = phone.replace(/\D/g, '').length === 11;
  const canSubmit = phoneReady && (mode === 'login' || name.trim().length >= 2) && !loading;

  const submit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const data = mode === 'login'
        ? await api.post('/auth/login', { phone })
        : await api.post('/auth/register', { phone, name });
      await signIn(data);
    } catch (e) {
      setError(e.message === 'Failed to fetch' ? 'Нет связи с сервером' : e.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setError('');
  };

  return (
    <div className="login_overlay" onMouseDown={(e) => e.target === e.currentTarget && setLoginOpen(false)}>
      <div className="login_modal" role="dialog" aria-modal="true">
        <button className="login_close" onClick={() => setLoginOpen(false)} aria-label="Закрыть">
          <IconClose size={24} />
        </button>

        {mode === 'forgot' ? (
          <div className="login_form">
            <h2 className="login_title">Забыли пароль?</h2>
            <p className="login_text">
              Пароль не нужен: для входа достаточно номера телефона, указанного при регистрации.
            </p>
            <button className="login_submit active" type="button" onClick={() => switchMode('login')}>
              Ко входу
            </button>
          </div>
        ) : (
          <form className="login_form" onSubmit={submit}>
            <h2 className="login_title">{mode === 'login' ? 'Вход' : 'Регистрация'}</h2>

            {mode === 'register' && (
              <label className="login_field">
                <span className="login_label">Имя</span>
                <input
                  className="login_input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Как к вам обращаться"
                  maxLength={60}
                  autoFocus
                />
              </label>
            )}

            <label className="login_field">
              <span className="login_label">Телефон</span>
              <input
                className="login_input"
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                inputMode="tel"
                autoFocus={mode === 'login'}
              />
            </label>

            {error && <div className="login_error">{error}</div>}

            <button className={`login_submit ${canSubmit ? 'active' : ''}`} type="submit" disabled={!canSubmit}>
              {mode === 'login' ? 'Вход' : 'Зарегистрироваться'}
            </button>

            <div className="login_links">
              {mode === 'login' ? (
                <>
                  <button type="button" className="login_register" onClick={() => switchMode('register')}>Регистрация</button>
                  <button type="button" className="login_forgot" onClick={() => switchMode('forgot')}>Забыли пароль?</button>
                </>
              ) : (
                <button type="button" className="login_register" onClick={() => switchMode('login')}>Уже есть аккаунт</button>
              )}
            </div>

            {mode === 'login' && (
              <button type="button" className="login_demo" onClick={() => setPhone(DEMO_PHONE)}>
                Демо-вход: {DEMO_PHONE}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
