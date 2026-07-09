import { useId } from 'react';

type CatArtVariant = 'idle' | 'empty' | 'sleeping' | 'confused' | 'logo';

interface CatArtProps {
  variant: CatArtVariant;
  size?: number;
  title?: string;
}

const IdleArt = () => (
  <>
    <path d="M150 176 C188 172 194 138 166 130" fill="none" stroke="#F7A8C6" strokeWidth="13" strokeLinecap="round" />
    <path d="M64 188 C58 140 74 122 110 122 C146 122 162 140 156 188 Z" fill="#FBD5E5" />
    <ellipse cx="92" cy="186" rx="14" ry="9" fill="#FFE7F0" />
    <ellipse cx="128" cy="186" rx="14" ry="9" fill="#FFE7F0" />
    <polygon points="70,52 84,14 106,46" fill="#FBD5E5" />
    <polygon points="150,52 136,14 114,46" fill="#FBD5E5" />
    <polygon points="78,46 87,25 100,44" fill="#FFD9C2" />
    <polygon points="142,46 133,25 120,44" fill="#FFD9C2" />
    <circle cx="110" cy="84" r="46" fill="#FFF1F6" />
    <circle cx="84" cy="98" r="8" fill="#FFB3C7" opacity={0.8} />
    <circle cx="136" cy="98" r="8" fill="#FFB3C7" opacity={0.8} />
    <path d="M84 84 Q94 94 104 84" fill="none" stroke="#7A4A5E" strokeWidth="5" strokeLinecap="round" />
    <path d="M116 84 Q126 94 136 84" fill="none" stroke="#7A4A5E" strokeWidth="5" strokeLinecap="round" />
    <polygon points="105,92 115,92 110,99" fill="#E36397" />
    <path d="M110 99 Q104 105 98 101" fill="none" stroke="#7A4A5E" strokeWidth="3" strokeLinecap="round" />
    <path d="M110 99 Q116 105 122 101" fill="none" stroke="#7A4A5E" strokeWidth="3" strokeLinecap="round" />
    <g stroke="#F2A0BE" strokeWidth="2.5" strokeLinecap="round">
      <path d="M74 90 L44 86" />
      <path d="M74 97 L42 97" />
      <path d="M74 104 L44 108" />
      <path d="M146 90 L176 86" />
      <path d="M146 97 L178 97" />
      <path d="M146 104 L176 108" />
    </g>
  </>
);

const EmptyArt = () => (
  <>
    <path d="M62 150 C56 108 72 92 110 92 C148 92 164 108 158 150 Z" fill="#FBD5E5" />
    <polygon points="68,44 82,10 104,40" fill="#FBD5E5" />
    <polygon points="152,44 138,10 116,40" fill="#FBD5E5" />
    <polygon points="76,38 85,19 98,38" fill="#FFD9C2" />
    <polygon points="144,38 135,19 122,38" fill="#FFD9C2" />
    <circle cx="110" cy="74" r="46" fill="#FFF1F6" />
    <ellipse cx="94" cy="74" rx="4.5" ry="6" fill="#7A4A5E" />
    <ellipse cx="126" cy="74" rx="4.5" ry="6" fill="#7A4A5E" />
    <circle cx="84" cy="88" r="7" fill="#FFB3C7" opacity={0.75} />
    <circle cx="136" cy="88" r="7" fill="#FFB3C7" opacity={0.75} />
    <polygon points="105,82 115,82 110,89" fill="#E36397" />
    <path d="M100 96 Q110 90 120 96" fill="none" stroke="#7A4A5E" strokeWidth="3" strokeLinecap="round" />
    <ellipse cx="110" cy="176" rx="46" ry="11" fill="#C9BEF0" />
    <path d="M66 172 Q110 200 154 172 Z" fill="#9B8CDB" />
    <ellipse cx="110" cy="171" rx="42" ry="8" fill="#B7A9EC" />
  </>
);

const SleepingArt = () => (
  <>
    <path
      d="M40 170 C40 132 74 120 110 120 C150 120 186 132 186 168 C186 182 150 186 110 186 C74 186 40 184 40 170 Z"
      fill="#FBD5E5"
    />
    <path d="M170 150 C192 150 196 128 176 122" fill="none" stroke="#F7A8C6" strokeWidth="12" strokeLinecap="round" />
    <circle cx="74" cy="132" r="40" fill="#FFF1F6" />
    <polygon points="46,112 52,84 72,106" fill="#FBD5E5" />
    <polygon points="100,112 94,84 76,106" fill="#FBD5E5" />
    <polygon points="52,104 57,88 68,102" fill="#FFD9C2" />
    <path d="M56 132 Q66 140 76 132" fill="none" stroke="#7A4A5E" strokeWidth="4" strokeLinecap="round" />
    <path d="M84 130 Q92 136 100 130" fill="none" stroke="#7A4A5E" strokeWidth="4" strokeLinecap="round" />
    <circle cx="60" cy="142" r="6" fill="#FFB3C7" opacity={0.75} />
    <polygon points="84,138 92,138 88,144" fill="#E36397" />
    <g stroke="#9B8CDB" strokeWidth="4" strokeLinecap="round" fill="none">
      <polyline points="118,96 132,96 118,110 132,110" />
      <polyline points="140,74 150,74 140,84 150,84" />
      <polyline points="158,58 165,58 158,65 165,65" />
    </g>
  </>
);

const ConfusedArt = () => (
  <>
    <path d="M64 188 C58 140 74 122 110 122 C146 122 162 140 156 188 Z" fill="#FBD5E5" />
    <ellipse cx="92" cy="186" rx="14" ry="9" fill="#FFE7F0" />
    <ellipse cx="128" cy="186" rx="14" ry="9" fill="#FFE7F0" />
    <polygon points="70,54 84,16 106,48" fill="#FBD5E5" />
    <polygon points="150,60 138,30 116,48" fill="#FBD5E5" />
    <polygon points="78,48 87,27 100,46" fill="#FFD9C2" />
    <circle cx="110" cy="86" r="46" fill="#FFF1F6" />
    <circle cx="94" cy="86" r="6" fill="#7A4A5E" />
    <circle cx="126" cy="86" r="4" fill="#7A4A5E" />
    <circle cx="84" cy="100" r="7" fill="#FFB3C7" opacity={0.75} />
    <circle cx="136" cy="100" r="7" fill="#FFB3C7" opacity={0.75} />
    <polygon points="105,94 115,94 110,101" fill="#E36397" />
    <path
      d="M100 110 Q108 104 114 110 Q120 116 126 110"
      fill="none"
      stroke="#7A4A5E"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="M150 40 Q168 28 172 44 Q174 56 160 58"
      fill="none"
      stroke="#9B8CDB"
      strokeWidth="5"
      strokeLinecap="round"
    />
    <circle cx="159" cy="70" r="3.2" fill="#9B8CDB" />
  </>
);

const LogoArt = () => (
  <>
    <polygon points="9,6 21,17 10,23" fill="currentColor" />
    <polygon points="39,6 27,17 38,23" fill="currentColor" />
    <circle cx="24" cy="27" r="15" fill="currentColor" />
    <circle cx="18" cy="26" r="2.4" fill="#FFF1F6" />
    <circle cx="30" cy="26" r="2.4" fill="#FFF1F6" />
    <path d="M21 33 Q24 36 27 33" fill="none" stroke="#FFF1F6" strokeWidth="2" strokeLinecap="round" />
  </>
);

const VIEW_BOX_BY_VARIANT: Record<CatArtVariant, string> = {
  idle: '0 0 220 200',
  empty: '0 0 220 200',
  sleeping: '0 0 220 200',
  confused: '0 0 220 200',
  logo: '0 0 48 48',
};

const CatArt = ({ variant, size = 96, title }: CatArtProps) => {
  const titleId = useId();

  return (
    <svg
      viewBox={VIEW_BOX_BY_VARIANT[variant]}
      width={size}
      height={size}
      {...(title ? { role: 'img', 'aria-labelledby': titleId } : { 'aria-hidden': true })}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      {variant === 'idle' ? <IdleArt /> : null}
      {variant === 'empty' ? <EmptyArt /> : null}
      {variant === 'sleeping' ? <SleepingArt /> : null}
      {variant === 'confused' ? <ConfusedArt /> : null}
      {variant === 'logo' ? <LogoArt /> : null}
    </svg>
  );
};

export { CatArt };
export type { CatArtProps, CatArtVariant };
