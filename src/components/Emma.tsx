import type { EmmaState } from '../types';
import emmaImg from '../assets/emma.png';
import './Emma.css';

interface Props {
  state: EmmaState;
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

export default function Emma({ state }: Props) {
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
      </div>
      <div className="emma-state-label">{stateLabel[state]}</div>
    </div>
  );
}
