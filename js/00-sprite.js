/* Injects the SVG sprite synchronously so <use href="#id"> works. */
document.currentScript.insertAdjacentHTML('afterend', `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <symbol id="eye-wdjat" viewBox="0 0 100 60">
      <path d="M4 30C15 16 29 10 50 10C71 10 85 16 96 30C85 44 71 50 50 50C29 50 15 44 4 30Z" fill="currentColor" opacity="0.18"/>
      <circle cx="50" cy="30" r="12" fill="currentColor"/>
      <circle cx="50" cy="30" r="4" fill="#0f172a"/>
      <path d="M8 30H92" stroke="currentColor" stroke-width="2" opacity="0.5"/>
      <path d="M16 14C28 20 38 23 50 23C62 23 72 20 84 14" fill="none" stroke="currentColor" stroke-width="2" opacity="0.6"/>
      <path d="M16 46C28 40 38 37 50 37C62 37 72 40 84 46" fill="none" stroke="currentColor" stroke-width="2" opacity="0.6"/>
    </symbol>
    <symbol id="ankh" viewBox="0 0 40 60">
      <path d="M20 6C14 6 9 11 9 17C9 22 12 25 15 28L16 53H24L25 28C28 25 31 22 31 17C31 11 26 6 20 6Z" fill="currentColor" opacity="0.9"/>
      <path d="M12 35H28V54H12Z" fill="currentColor"/>
      <path d="M8 54H32" stroke="currentColor" stroke-width="2"/>
    </symbol>
    <symbol id="sword" viewBox="0 0 24 24">
      <path d="M6 2L14 10L18 6L20 8L16 12L22 18L20 20L14 14L10 18L8 16L12 12L2 2Z" fill="currentColor"/>
      <path d="M4 20L10 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </symbol>
    <symbol id="shield" viewBox="0 0 24 24">
      <path d="M12 2L19 5V11C19 16 15.8 19.7 12 22C8.2 19.7 5 16 5 11V5L12 2Z" fill="currentColor"/>
      <path d="M12 7V15M9 11H15" stroke="#0b1020" stroke-width="1.5" stroke-linecap="round"/>
    </symbol>
    <symbol id="tomb" viewBox="0 0 24 24">
      <path d="M5 8h14v3h-2v9H7v-9H5V8zm3-4h8v3H8V4zm1 6h8v2H9v-2z" fill="currentColor"/>
      <path d="M10 16h4v4h-4z" fill="#0b1020" opacity="0.75"/>
    </symbol>
    <symbol id="deck" viewBox="0 0 24 24">
      <path d="M5 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm0 3h12" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M8 10h8M8 14h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </symbol>
    <symbol id="cards" viewBox="0 0 24 24">
      <path d="M5 6h9a2 2 0 0 1 2 2v9H7a2 2 0 0 1-2-2V6zm9 0l5 3v9a2 2 0 0 1-2 2H9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M8 10h6M8 14h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    </symbol>
    <symbol id="skull" viewBox="0 0 24 24">
      <path d="M12 3a7 7 0 0 0-7 7c0 2.5 1.1 4.4 2.8 5.8L8 20h8l.2-4.2A7.2 7.2 0 0 0 19 10a7 7 0 0 0-7-7zm-3 12h6M10 17v2m4-2v2" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/>
      <circle cx="9.5" cy="10.5" r="1.1" fill="currentColor"/><circle cx="14.5" cy="10.5" r="1.1" fill="currentColor"/>
      <path d="M10.5 13.5c1 .9 2 .9 3 0" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    </symbol>
    <symbol id="star" viewBox="0 0 24 24">
      <path d="M12 2.5l2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.8-5.4 2.8 1-6.1L3.2 8.9l6.1-.9L12 2.5z" fill="currentColor"/>
    </symbol>
    <symbol id="priest" viewBox="0 0 60 60">
      <path d="M12,22 Q30,8 48,22 L50,48 L10,48 Z" fill="#1a3a6a"/>
      <path d="M14,24 Q30,12 46,24 L47,29 L13,29 Z" fill="#c9a227"/>
      <path d="M13,31 Q30,22 47,31 L48,36 L12,36 Z" fill="#1a3a6a"/>
      <path d="M12,38 Q30,31 48,38 L49,43 L11,43 Z" fill="#c9a227"/>
      <path d="M10,42 Q8,50 10,54 L14,54 Q12,48 13,44 Z" fill="#1a3a6a"/>
      <path d="M50,42 Q52,50 50,54 L46,54 Q48,48 47,44 Z" fill="#1a3a6a"/>
      <ellipse cx="30" cy="33" rx="12" ry="13" fill="#8a5a2a"/>
      <ellipse cx="30" cy="33" rx="12" ry="13" fill="#a06832" opacity="0.5"/>
      <path d="M21,30 L27,30" stroke="#0a0510" stroke-width="1" stroke-linecap="round"/>
      <path d="M33,30 L39,30" stroke="#0a0510" stroke-width="1" stroke-linecap="round"/>
      <ellipse cx="25" cy="30.5" rx="2.2" ry="1.6" fill="#0a0510"/>
      <ellipse cx="35" cy="30.5" rx="2.2" ry="1.6" fill="#0a0510"/>
      <circle cx="25.5" cy="30.5" r="0.7" fill="#ffe08a"/>
      <circle cx="35.5" cy="30.5" r="0.7" fill="#ffe08a"/>
      <path d="M28,20 Q30,15 32,20 Q30,19 28,20 Z" fill="#c9a227"/>
      <circle cx="30" cy="17.5" r="1.6" fill="#e8c86a"/>
      <circle cx="30" cy="17.5" r="0.6" fill="#a83a2c"/>
      <path d="M27,39 Q30,40.5 33,39" stroke="#3a1a10" stroke-width="0.8" fill="none"/>
      <path d="M13,44 Q30,51 47,44 L48,53 L12,53 Z" fill="#c9a227"/>
      <path d="M14,46 Q30,52 46,46" stroke="#8a6f2a" stroke-width="0.5" fill="none"/>
      <path d="M14,48 Q30,54 46,48" stroke="#8a6f2a" stroke-width="0.5" fill="none"/>
      <path d="M15,50 Q30,55 45,50" stroke="#8a6f2a" stroke-width="0.5" fill="none"/>
      <circle cx="30" cy="50" r="2.2" fill="#a83a2c"/>
      <circle cx="30" cy="50" r="0.8" fill="#ffdca0"/>
    </symbol>
    <symbol id="anubis" viewBox="0 0 60 60">
      <path d="M8,26 Q30,4 52,26 L54,52 L6,52 Z" fill="#1a0612"/>
      <polygon points="15,22 11,2 22,15" fill="#1a0612"/>
      <polygon points="45,22 49,2 38,15" fill="#1a0612"/>
      <polygon points="16.5,20 14,6 21,16" fill="#5a1030"/>
      <polygon points="43.5,20 46,6 39,16" fill="#5a1030"/>
      <path d="M14,22 Q30,14 46,22 L47,26 L13,26 Z" fill="#c9a227" opacity="0.85"/>
      <path d="M20,26 L40,26 L43,40 L38,44 L22,44 L17,40 Z" fill="#0a0206"/>
      <path d="M22,28 L38,28 L40,38 L30,42 L20,38 Z" fill="#150308"/>
      <ellipse cx="24" cy="33" rx="3" ry="2" fill="#ff3050"/>
      <ellipse cx="36" cy="33" rx="3" ry="2" fill="#ff3050"/>
      <ellipse cx="24" cy="33" rx="1.2" ry="0.8" fill="#ffe0a0"/>
      <ellipse cx="36" cy="33" rx="1.2" ry="0.8" fill="#ffe0a0"/>
      <circle cx="24" cy="33" r="5.5" fill="#ff3050" opacity="0.28"/>
      <circle cx="36" cy="33" r="5.5" fill="#ff3050" opacity="0.28"/>
      <ellipse cx="30" cy="41" rx="3" ry="2" fill="#000000"/>
      <path d="M25,44 Q30,45 35,44" stroke="#3a0518" stroke-width="0.6" fill="none"/>
      <path d="M11,50 Q30,56 49,50 L50,57 L10,57 Z" fill="#4a1030"/>
      <path d="M13,51 Q30,56 47,51" stroke="#c9a227" stroke-width="0.7" fill="none"/>
      <path d="M14,54 Q30,58 46,54" stroke="#c9a227" stroke-width="0.5" fill="none"/>
      <ellipse cx="30" cy="53" rx="1.8" ry="2.2" fill="none" stroke="#c9a227" stroke-width="0.7"/>
      <line x1="30" y1="55" x2="30" y2="58" stroke="#c9a227" stroke-width="0.7"/>
      <line x1="27.5" y1="56.5" x2="32.5" y2="56.5" stroke="#c9a227" stroke-width="0.7"/>
    </symbol>
    <symbol id="summon-circle" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="78" fill="none" stroke="currentColor" stroke-width="8" opacity="0.4"/>
      <circle cx="100" cy="100" r="52" fill="none" stroke="currentColor" stroke-width="4" opacity="0.7"/>
      <path d="M100 16v168M16 100h168M42 42l116 116M158 42L42 158" stroke="currentColor" stroke-width="2" opacity="0.55"/>
      <circle cx="100" cy="100" r="18" fill="none" stroke="currentColor" stroke-width="5"/>
    </symbol>
  </defs>
</svg>
`);