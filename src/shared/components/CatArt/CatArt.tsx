import { useTheme } from '@mui/material/styles';
import { useId } from 'react';

type CatArtVariant = 'content' | 'confused' | 'sleeping';

interface CatArtProps {
  variant: CatArtVariant;
  size?: number;
  title?: string;
}

const EARS = (
  <>
    <polygon points="55,55 75,15 90,60" />
    <polygon points="145,55 125,15 110,60" />
  </>
);

const FACE = <circle cx="100" cy="105" r="65" />;

const CatArt = ({ variant, size = 96, title }: CatArtProps) => {
  const theme = useTheme();
  const titleId = useId();
  const featureColor = theme.palette.background.paper;

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      {...(title
        ? { role: 'img', 'aria-labelledby': titleId }
        : { 'aria-hidden': true })}
      color="currentColor"
    >
      {title ? <title id={titleId}>{title}</title> : null}
      <g fill="currentColor">
        {EARS}
        {FACE}
      </g>
      {variant === 'content' ? (
        <>
          <circle cx="80" cy="95" r="6" fill={featureColor} />
          <circle cx="120" cy="95" r="6" fill={featureColor} />
          <path
            d="M 80 120 Q 100 135 120 120"
            fill="none"
            stroke={featureColor}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      ) : null}
      {variant === 'confused' ? (
        <>
          <circle cx="80" cy="95" r="6" fill={featureColor} />
          <line
            x1="113"
            y1="95"
            x2="127"
            y2="95"
            stroke={featureColor}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 82 122 Q 92 116 102 122 T 122 122"
            fill="none"
            stroke={featureColor}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      ) : null}
      {variant === 'sleeping' ? (
        <>
          <path
            d="M 72 95 Q 80 101 88 95"
            fill="none"
            stroke={featureColor}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 112 95 Q 120 101 128 95"
            fill="none"
            stroke={featureColor}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <line
            x1="94"
            y1="120"
            x2="106"
            y2="120"
            stroke={featureColor}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <text x="132" y="75" fontSize="18" fill="currentColor">
            z
          </text>
        </>
      ) : null}
    </svg>
  );
};

export { CatArt };
export type { CatArtProps, CatArtVariant };
