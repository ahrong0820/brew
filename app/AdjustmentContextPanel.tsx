import { Clock3, Coffee, Gauge } from "lucide-react";

interface AdjustmentContextPanelProps {
  recipeName: string;
  timerReference: string;
  brewPaceLabel: string;
  tastingLabel: string;
  stageLabel: string;
  stageMessage: string;
  successfulCount: number;
  totalCount: number;
  fixedConditions: readonly string[];
}

export default function AdjustmentContextPanel(props: AdjustmentContextPanelProps) {
  return (
    <div className="mt-5 space-y-3">
      <div className="rounded-xl border border-[#c9d7c7] bg-white p-4">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-[#2f6f5f]">
          <Coffee aria-hidden="true" size={14} /> 원본 레시피
        </p>
        <p className="mt-1 font-bold">{props.recipeName}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <span className="flex items-center gap-1 rounded-lg bg-[#fff3e6] px-3 py-2 font-bold text-[#6d492d]">
            <Gauge aria-hidden="true" size={13} /> 추출 속도 {props.brewPaceLabel}
          </span>
          <span className="rounded-lg bg-[#f8faf7] px-3 py-2">
            맛 {props.tastingLabel}
          </span>
          <span className="rounded-lg bg-[#f8faf7] px-3 py-2 text-[#687168]">
            <Clock3 aria-hidden="true" className="mr-1 inline" size={13} /> 타이머 참고 {props.timerReference}
          </span>
          <span className="rounded-lg bg-[#eef5ef] px-3 py-2 font-bold text-[#245647]">
            {props.stageLabel}
          </span>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-[#7a847a]">
          조정 진단은 타이머 숫자가 아니라 사용자가 선택한 추출 속도와 맛 평가를 사용합니다.
        </p>
        <p className="mt-3 text-xs leading-5 text-[#687168]">
          {props.stageMessage}
        </p>
        <p className="mt-1 text-[11px] text-[#7a847a]">
          전체 {props.totalCount}회 · 좋음 {props.successfulCount}회
        </p>
      </div>

      <div className="rounded-xl border border-[#d7ded4] bg-[#f8faf7] p-4">
        <p className="text-xs font-bold text-[#526055]">이번에 유지할 조건</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {props.fixedConditions.map((condition) => (
            <span
              key={condition}
              className="rounded-full bg-white px-2.5 py-1 text-xs text-[#607064]"
            >
              {condition}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
