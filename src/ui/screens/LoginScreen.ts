import { buttonStyle } from '../components/Button';
import { goldCardStyle, inputStyle, stopKeyPropagation } from '../theme';
import { Screen } from './Screen';

export type LoginMode = 'login' | 'register';

export class LoginScreen extends Screen {
  show(
    data: { mode?: LoginMode; errorMessage?: string; loading?: boolean } = {},
    callbacks: {
      onLogin: (email: string) => void;
      onRegister: (email: string, displayName: string) => void;
      onToggleMode: (mode: LoginMode) => void;
    },
  ): void {
    const mode = data.mode ?? 'register';
    const loading = data.loading ?? false;
    const isRegister = mode === 'register';

    this.container.innerHTML = `
      <form id="auth-form" style="${goldCardStyle}">
        <h1 style="font-size:clamp(38px,8vw,58px);margin:0 0 6px;font-weight:1000;">FarmQuest</h1>
        <p style="font-size:clamp(16px,3vw,19px);margin:0 0 18px;font-weight:800;color:#315033;">
          Event Edition — farm, compete, and claim your reward.
        </p>
        <div style="display:flex;gap:8px;margin-bottom:20px;background:rgba(25,54,32,0.12);border-radius:999px;padding:4px;">
          <button type="button" id="tab-login" style="${this.tabStyle(!isRegister)}">Login</button>
          <button type="button" id="tab-register" style="${this.tabStyle(isRegister)}">Register</button>
        </div>
        <label style="display:block;text-align:left;font-weight:1000;margin:0 0 8px;">Email Address</label>
        <input id="email-input" type="email" autocomplete="email" placeholder="player@example.com" style="${inputStyle}" />
        ${isRegister ? `
          <label style="display:block;text-align:left;font-weight:1000;margin:14px 0 8px;">Display Name</label>
          <input id="name-input" type="text" maxlength="40" placeholder="Your name" style="${inputStyle}" />
        ` : ''}
        ${data.errorMessage ? `<div style="margin-top:14px;color:#b52828;font-weight:900;">${data.errorMessage}</div>` : ''}
        <button id="auth-submit" type="submit" style="${buttonStyle('#2f8f3a')};margin-top:20px;width:100%;" ${loading ? 'disabled' : ''}>
          ${loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Login'}
        </button>
      </form>
    `;

    document.getElementById('tab-login')!.addEventListener('click', () => callbacks.onToggleMode('login'));
    document.getElementById('tab-register')!.addEventListener('click', () => callbacks.onToggleMode('register'));
    document.getElementById('auth-form')!.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = (document.getElementById('email-input') as HTMLInputElement).value;
      if (isRegister) {
        const displayName = (document.getElementById('name-input') as HTMLInputElement).value;
        callbacks.onRegister(email, displayName);
        return;
      }
      callbacks.onLogin(email);
    });

    for (const id of ['email-input', 'name-input']) {
      const input = document.getElementById(id);
      if (input) stopKeyPropagation(input);
    }

    this.reveal();
  }

  private tabStyle(active: boolean): string {
    return `
      flex:1;border:0;border-radius:999px;padding:10px 12px;min-height:44px;cursor:pointer;font-weight:1000;
      font-size:clamp(14px,2.8vw,16px);background:${active ? '#2f8f3a' : 'transparent'};color:${active ? 'white' : '#193620'};
    `;
  }
}
