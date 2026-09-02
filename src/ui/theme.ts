export const theme = {
  bgDark: '#142b1b',
  bgCard: 'rgba(20, 43, 27, 0.94)',
  accentGreen: '#52a447',
  accentGold: '#ffe36d',
  accentLime: '#bff28a',
  textWhite: '#ffffff',
  textDark: '#193620',
  cardBg: 'linear-gradient(145deg, #fdf8df, #ecd17a)',
  danger: '#e5534b',
  warning: '#e7a53b',
};

export const overlayScreenStyle = `
  position:absolute;inset:0;display:none;justify-content:center;align-items:center;
  background:radial-gradient(circle at 50% 30%,rgba(63,117,67,0.32),rgba(8,13,10,0.88));
  pointer-events:all;color:white;text-align:center;padding:20px;z-index:20;
  overflow:auto;
`;

export const goldCardStyle = `
  width:min(92vw,600px);background:linear-gradient(145deg,#fdf8df,#ecd17a);color:#193620;
  border-radius:24px;padding:28px;box-shadow:0 24px 60px rgba(0,0,0,0.3);
`;

export const darkCardStyle = `
  width:min(92vw,600px);background:rgba(18,38,24,0.95);border:2px solid rgba(255,227,109,0.55);
  border-radius:22px;padding:26px;box-shadow:0 24px 60px rgba(0,0,0,0.32);
`;

export const inputStyle = `
  width:100%;padding:14px 16px;border-radius:14px;border:2px solid rgba(49,80,51,0.25);
  font-size:clamp(16px,3vw,18px);font-weight:800;color:#193620;outline:none;background:#fffdf2;
  min-height:44px;box-sizing:border-box;
`;

export const stopKeyPropagation = (element: HTMLElement): void => {
  element.addEventListener('keydown', (event) => event.stopPropagation());
  element.addEventListener('keyup', (event) => event.stopPropagation());
};
