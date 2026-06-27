import type { BrewPaceAssessment } from "@/lib/types/coffee";

interface BrewPaceSelectorProps {
  value: BrewPaceAssessment | null;
  onChange: (value: BrewPaceAssessment) => void;
}

const options: Array<{
  value: BrewPaceAssessment;
  label: string;
  description: string;
}> = [
  {
    value: "fast",
    label: "빠름",
    description: "평소나 레시피 의도보다 물이 빨리 빠짐",
  },
  {
    value: "in-range",
    label: "적정",
    description: "드로다운 흐름이 무리 없이 정상적으로 끝남",
  },
  {
    value: "slow",
    label: "느림",
    description: "막히거나 물이 오래 머물러 천천히 빠짐",
  },
];

export default function BrewPaceSelector({
  value,
  onChange,
}: BrewPaceSelectorProps) {
  return (
    <fieldset className="mt-5">
      <legend className="text-sm font-bold">추출 속도는 어땠나요?</legend>
      <p className="mt-1 text-xs leading-5 text-[#687168]">
        타이머 숫자가 아니라 실제 드로다운을 보고 판단해 주세요.
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={`rounded-xl border p-3 text-left transition ${
                selected
                  ? "border-[#8a623d] bg-[#fff3e6] text-[#5d4128]"
                  : "border-[#d7ded4] bg-white hover:bg-[#f8faf7]"
              }`}
            >
              <span className="block text-sm font-bold">{option.label}</span>
              <span className="mt-1 block text-xs leading-5 text-[#687168]">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
