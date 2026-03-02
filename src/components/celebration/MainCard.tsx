"use client";

function CardBow() {
  return (
    <svg width="120" height="60" viewBox="0 0 120 60" fill="none"
      style={{ position:"absolute", top:-44, left:"50%", transform:"translateX(-50%)", pointerEvents:"none" }}>
      <path d="M60 44 C44 34 6 32 8 12 C10 -2 32 2 46 20 C52 28 57 37 60 44Z"
        fill="#FFB3C6" stroke="#d05070" strokeWidth="1" strokeOpacity="0.5"/>
      <path d="M60 44 C50 36 18 36 16 22 C14 12 32 10 46 20"
        fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.4"/>
      <path d="M60 44 C76 34 114 32 112 12 C110 -2 88 2 74 20 C68 28 63 37 60 44Z"
        fill="#EDD6FF" stroke="#7a2eb3" strokeWidth="1" strokeOpacity="0.5"/>
      <path d="M60 44 C70 36 102 36 104 22 C106 12 88 10 74 20"
        fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.4"/>
      <ellipse cx="60" cy="44" rx="10" ry="8" fill="#FFD6E0" stroke="#c94a6a" strokeWidth="1" strokeOpacity="0.5"/>
      <ellipse cx="60" cy="44" rx="5" ry="4" fill="white" fillOpacity="0.5"/>
      <path d="M54 50 C50 56 44 62 46 66" stroke="#FFB3C6" strokeWidth="3" strokeLinecap="round"/>
      <path d="M66 50 C70 56 76 62 74 66" stroke="#EDD6FF" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

export default function MainCard() {
  return (
    <div className="main-card">
      <CardBow />
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", borderRadius:"inherit", pointerEvents:"none", opacity:0.4 }}>
        <defs>
          <pattern id="dots" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.2" fill="#c94a6a" fillOpacity="0.25"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)"/>
      </svg>
      <div style={{ position:"absolute", inset:10, borderRadius:"inherit", border:"1.5px dashed #FFB3C655", pointerEvents:"none" }}/>
      <span style={{ position:"absolute", top:18, left:18,  fontSize:14, opacity:0.35, color:"#c94a6a", lineHeight:1 }}>✿</span>
      <span style={{ position:"absolute", top:18, right:18, fontSize:14, opacity:0.35, color:"#7a2eb3", lineHeight:1 }}>✿</span>
      <span style={{ position:"absolute", bottom:18, left:18,  fontSize:12, opacity:0.25, color:"#7a2eb3", lineHeight:1 }}>✿</span>
      <span style={{ position:"absolute", bottom:18, right:18, fontSize:12, opacity:0.25, color:"#c94a6a", lineHeight:1 }}>✿</span>
      <div className="card-eyebrow">✨ hoy es tu día mi amor ✨</div>
      <div className="card-name">Agostina</div>
      <div className="card-divider">
        <div className="card-divider-line"/>
        <div className="card-divider-dot"/>
        <div className="card-divider-dot"/>
        <div className="card-divider-dot"/>
        <div className="card-divider-line"/>
      </div>
      <div className="card-feliz">¡Feliz Cumple<br/>Cosita Linda!</div>
      <div className="card-seal">
        <svg width="90" height="90" viewBox="0 0 90 90" style={{ position:"absolute", inset:0 }}>
          {Array.from({length:16}).map((_,i) => {
            const a = (i/16)*Math.PI*2;
            const r1 = 44, r2 = 36;
            const x1 = 45 + Math.cos(a)*r1, y1 = 45 + Math.sin(a)*r1;
            const a2 = a + Math.PI/16;
            const x2 = 45 + Math.cos(a2)*r2, y2 = 45 + Math.sin(a2)*r2;
            return <line key={i} x1="45" y1="45" x2={(x1+x2)/2} y2={(y1+y2)/2} stroke="#c94a6a" strokeWidth="0.8" strokeOpacity="0.3"/>;
          })}
          <circle cx="45" cy="45" r="38" fill="#FFD6E0" stroke="#c94a6a" strokeWidth="1.5" strokeOpacity="0.4"/>
          <circle cx="45" cy="45" r="32" fill="none" stroke="#c94a6a" strokeWidth="0.8" strokeOpacity="0.25" strokeDasharray="3 3"/>
        </svg>
        <div className="card-seal-inner">
          <span className="card-age-number">16</span>
          <span className="card-age-label">añitos</span>
        </div>
      </div>
      <div className="card-stars">🎉 🥳 🎈</div>
    </div>
  );
}