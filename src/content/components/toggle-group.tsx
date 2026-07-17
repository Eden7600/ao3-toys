import type { ReadingSettingsGroup } from "@src/common/reading-settings";

const ToggleGroup = ({
  group,
  value,
  onChange,
}: {
  group: ReadingSettingsGroup;
  value: string;
  onChange: (value: string) => void;
}) => (
  <div class="rt-setting">
    <span class="rt-setting-label" id={`${group.key}-label`}>
      {group.label}
    </span>
    <div
      class="rt-segments"
      role="radiogroup"
      aria-labelledby={`${group.key}-label`}
    >
      {group.options.map((option) => (
        <span class="rt-segment" key={option.id}>
          <input
            class="rt-sr-only"
            type="radio"
            id={option.id}
            name={group.key}
            value={option.value}
            checked={value === option.value}
            onChange={() => {
              onChange(option.value);
            }}
          />
          <label for={option.id}>{option.label}</label>
        </span>
      ))}
    </div>
  </div>
);

export default ToggleGroup;
