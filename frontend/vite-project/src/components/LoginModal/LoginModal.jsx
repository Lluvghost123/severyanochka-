import { useState } from 'react';
import { maskPhone } from '../../utils/format.js';
import { IconClose } from '../Icons/Icons.jsx';
import './LoginModal.scss';

export default function LoginModal({ onClose, onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState('+7 ');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const phoneReady = phone.replace(/\D/g, '').length === 11;
  const canSubmit = phoneReady && (!isRegister || name.trim().length >= 2);

  const submit = (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    // телефон отправляем в виде +79123456789
    const body = isRegister
      ? { phone: '+' + phone.replace(/\D/g, ''), name: name.trim() }
      : { phone: '+' + phone.replace(/\D/g, '') };

    fetch(`http://localhost:3000/api/${isRegister ? 'register' : 'login'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          onLogin(data);
        }
      })
      .catch(() => setError('Нет связи с сервером'));
  };

  return (
    <div className="login_overlay" onClick={onClose}>
      <div className="login_modal" onClick={(e) => e.stopPropagation()}>
        <button className="login_close" onClick={onClose} aria-label="Закрыть">
          <IconClose size={24} />
        </button>

        <form className="login_form" onSubmit={submit}>
          <h2 className="login_title">{isRegister ? 'Регистрация' : 'Вход'}</h2>

          {isRegister && (
            <label className="login_field">
              <span className="login_label">Имя</span>
              <input
                className="login_input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Как к вам обращаться"
              />
            </label>
          )}

          <label className="login_field">
            <span className="login_label">Телефон</span>
            <input
              className="login_input"
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
            />
          </label>

          {error && <div className="login_error">{error}</div>}

          <button className={`login_submit ${canSubmit ? 'active' : ''}`} type="submit" disabled={!canSubmit}>
            {isRegister ? 'Зарегистрироваться' : 'Вход'}
          </button>

          <div className="login_links">
            <button type="button" className="login_register" onClick={() => { setIsRegister(!isRegister); setError(''); }}>
              {isRegister ? 'Уже есть аккаунт' : 'Регистрация'}
            </button>
            {!isRegister && <button type="button" className="login_forgot">Забыли пароль?</button>}
          </div>

          {!isRegister && (
            <button type="button" className="login_demo" onClick={() => setPhone('+7 912 345-67-89')}>
              Демо-вход: +7 912 345-67-89
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
