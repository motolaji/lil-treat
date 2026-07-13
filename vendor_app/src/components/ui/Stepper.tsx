import { color, radius } from '../../styles/tokens';

interface HorizontalStepperProps {
  orientation: 'horizontal';
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  decrementDisabled?: boolean;
  incrementDisabled?: boolean;
}

interface VerticalStepperProps {
  orientation: 'vertical';
  onUp: () => void;
  onDown: () => void;
  upDisabled?: boolean;
  downDisabled?: boolean;
}

type StepperProps = HorizontalStepperProps | VerticalStepperProps;

const buttonBaseStyle = (disabled: boolean) => ({
  width: 44,
  height: 44,
  borderRadius: radius.sm,
  background: color.bg,
  border: `1px solid ${color.border}`,
  color: disabled ? color.border : color.text,
  fontSize: 18,
  lineHeight: 1,
  fontWeight: 600,
  cursor: disabled ? 'default' as const : 'pointer' as const,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  touchAction: 'manipulation' as const,
  WebkitTapHighlightColor: 'transparent',
  padding: 0,
});

export default function Stepper(props: StepperProps) {
  if (props.orientation === 'horizontal') {
    const { value, onDecrement, onIncrement, decrementDisabled, incrementDisabled } = props;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          aria-label="Decrease"
          onClick={onDecrement}
          disabled={decrementDisabled}
          style={buttonBaseStyle(!!decrementDisabled)}
        >
          −
        </button>
        <span style={{ color: color.text, fontSize: 15, fontWeight: 600, minWidth: 20, textAlign: 'center' }}>
          {value}
        </span>
        <button
          type="button"
          aria-label="Increase"
          onClick={onIncrement}
          disabled={incrementDisabled}
          style={buttonBaseStyle(!!incrementDisabled)}
        >
          +
        </button>
      </div>
    );
  }

  const { onUp, onDown, upDisabled, downDisabled } = props;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
      <button
        type="button"
        aria-label="Move up"
        onClick={onUp}
        disabled={upDisabled}
        style={{ ...buttonBaseStyle(!!upDisabled), fontSize: 14 }}
      >
        ▲
      </button>
      <button
        type="button"
        aria-label="Move down"
        onClick={onDown}
        disabled={downDisabled}
        style={{ ...buttonBaseStyle(!!downDisabled), fontSize: 14 }}
      >
        ▼
      </button>
    </div>
  );
}
