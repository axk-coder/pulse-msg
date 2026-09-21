export const CLOAK_PRESETS = [
  { key: 'none', name: 'Default (Pulse)', title: 'Pulse', favicon: './favicon.ico' },
  { key: 'classroom', name: 'Google Classroom', title: 'Home', favicon: 'https://ssl.gstatic.com/classroom/favicon.png' },
  { key: 'drive', name: 'Google Drive', title: 'My Drive - Google Drive', favicon: 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png' },
  { key: 'docs', name: 'Google Docs', title: 'Google Docs', favicon: 'https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico' },
  { key: 'desmos', name: 'Desmos', title: 'Desmos | Graphing Calculator', favicon: 'https://www.desmos.com/favicon.ico' },
  { key: 'khan', name: 'Khan Academy', title: 'Dashboard | Khan Academy', favicon: 'https://www.khanacademy.org/favicon.ico' },
  { key: 'canvas', name: 'Canvas', title: 'Canvas LMS', favicon: 'https://du11hjcvx0uqb.cloudfront.net/dist/images/favicon-e10d657a73.ico' },
  { key: 'bing', name: 'Bing', title: 'Bing', favicon: 'https://www.bing.com/sa/simg/favicon-2x.ico' },
  { key: 'wikipedia', name: 'Wikipedia', title: 'Wikipedia, the free encyclopedia', favicon: 'https://en.wikipedia.org/static/favicon/wikipedia.ico' }
];

export function applyCloak(presetKey) {
  const preset = CLOAK_PRESETS.find(p => p.key === presetKey) || CLOAK_PRESETS[0];
  if (preset.key === 'none') {
    document.title = 'Pulse';
    let link = document.querySelector("link[rel*='icon']");
    if (link) link.href = './favicon.ico';
  } else {
    document.title = preset.title;
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = preset.favicon;
  }
}

export function openAboutBlank() {
  const url = window.location.href;
  const win = window.open('about:blank', '_blank');
  if (!win) return;
  const presetKey = localStorage.getItem('pulse_cloak_preset') || 'none';
  const preset = CLOAK_PRESETS.find(p => p.key === presetKey) || CLOAK_PRESETS[0];
  const doc = win.document;
  doc.open();
  doc.write(`<!DOCTYPE html><html><head><title>${preset.title}</title><link rel="icon" href="${preset.favicon}" /><style>html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000;}iframe{border:none;width:100%;height:100%;display:block;}</style></head><body><iframe src="${url}"></iframe></body></html>`);
  doc.close();
}
