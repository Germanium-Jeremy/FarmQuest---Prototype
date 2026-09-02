export const buttonStyle = (color: string): string => `
  padding:15px 36px;font-size:clamp(16px,3.2vw,20px);font-weight:1000;background:${color};color:white;
  border:0;border-radius:999px;cursor:pointer;pointer-events:all;box-shadow:0 8px 22px rgba(0,0,0,0.24);
  min-height:44px;min-width:44px;
`;

export const createButton = (label: string, color: string, onClick: () => void): HTMLButtonElement => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.style.cssText = buttonStyle(color);
  button.addEventListener('click', onClick);
  return button;
};
