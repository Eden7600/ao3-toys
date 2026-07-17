import type { ReadingSliderConfig } from "@src/common/reading-settings";

const SliderRow = ({
  config,
  value,
  onChange,
}: {
  config: ReadingSliderConfig;
  value: number | null;
  onChange: (value: number | null) => void;
}) => {
  const isDefault = value === config.defaultValue;
  const readout = value === null ? config.unsetLabel : config.format(value);

  return (
    <div class="rt-setting">
      <div class="rt-slider-head">
        <span class="rt-setting-label" id={`${config.key}-label`}>
          {config.label}
        </span>
        {!isDefault && (
          <button
            class="rt-slider-reset"
            aria-label={`Reset ${config.label} to default`}
            title="Reset to default"
            onClick={() => {
              onChange(config.defaultValue);
            }}
          >
            ↺
          </button>
        )}
        <span class="rt-slider-readout">{readout}</span>
      </div>
      <input
        class="rt-slider"
        type="range"
        min={config.min}
        max={config.max}
        step={config.step}
        value={value ?? config.unsetPosition}
        aria-labelledby={`${config.key}-label`}
        aria-valuetext={readout}
        onInput={(event) => {
          onChange(Number((event.target as HTMLInputElement).value));
        }}
      />
    </div>
  );
};

export default SliderRow;
