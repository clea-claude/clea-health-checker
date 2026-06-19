import type { EmmaState, EmmaLevel } from '../types';
import emmaImg from '../assets/emma.png';
import './Emma.css';

interface Props {
  state: EmmaState;
  level: EmmaLevel;
}

const stateFilter: Record<EmmaState, string> = {
  happy:    'brightness(1.05) saturate(1.1)',
  normal:   'none',
  sleepy:   'brightness(0.82) saturate(0.6)',
  deadEyes: 'grayscale(0.9) brightness(0.75)',
};

const stateLabel: Record<EmmaState, string> = {
  happy:    '😊 ごきげん',
  normal:   '😐 ふつう',
  sleepy:   '😪 ねむい…',
  deadEyes: '😵 限界…',
};

export default function Emma({ state, level }: Props) {
  const levelLabel = ['', '子犬', '元気な子犬', '成犬', 'プリンセス成犬'];

  return (
    <div className={`emma-wrap ${state === 'happy' ? 'emma-happy' : ''}`}>
      <div className="emma-img-wrap">
        <img
          src={emmaImg}
          alt="エマ"
          className="emma-img"
          style={{ filter: stateFilter[state] }}
        />
        {(state === 'sleepy' || state === 'deadEyes') && (
          <div className="emma-overlay-text">
            {state === 'sleepy' ? '💤' : '💫'}
          </div>
        )}
        {level === 4 && <div className="emma-crown">👑</div>}
      </div>

      <div className="emma-state-label">{stateLabel[state]}</div>
      <div className="emma-level-badge">
        {level === 1 ? '🐾' : level === 2 ? '⭐' : level === 3 ? '⭐⭐' : '⭐⭐⭐'}
        <span className="emma-level-name"> Lv.{level} {levelLabel[level]}</span>
      </div>
    </div>
  );
}
