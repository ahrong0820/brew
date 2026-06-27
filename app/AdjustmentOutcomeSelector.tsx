import type { BrewAdjustmentOutcome } from "@/lib/types/coffee";

interface Props {
  value: BrewAdjustmentOutcome | null;
  onChange: (value: BrewAdjustmentOutcome) => void;
}

const options: Array<{ value: BrewAdjustmentOutcome; label: string }> = [
  { value: "improved", label: "개선됨" },
  { value: "same", label: "차이 없음" },
  { value: "worse", label: "나빠짐" },
];

export default function AdjustmentOutcomeSelector({ value, onChange }: Props) {
  return (
    <fieldset className="mt-5 rounded-xl border border-[#dccbb8] bg-[#fff8ee] p-4">
      <legend className="px-1 text-sm font-bold text-[#6d492d]">
        직전 조정 결과는 어땠나요?
      </legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`rounded-lg border p-3 text-left ${
              value === option.value
                ? "border-[#8a623d] bg-white text-[#5d4128]"
                : "border-[#e5d4c1] bg-[#fffdf9]"
            }`}
          >
            <span className="block text-sm font-bold">{option.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
