"use client";

import {
  Bean as BeanIcon,
  CalendarDays,
  ChevronRight,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createBean, withUpdatedTimestamp } from "@/lib/domain/factories";
import {
  beanBrewProfileStore,
  beanStore,
  brewSessionStore,
  initializeCoffeeStorage,
} from "@/lib/storage/coffeeData";
import type {
  Bean,
  OriginCountry,
  OriginGroup,
  ProcessMethod,
  RoastLevel,
} from "@/lib/types/coffee";

type BeanFormState = {
  name: string;
  roaster: string;
  originCountry: OriginCountry;
  roastLevel: RoastLevel;
  process: ProcessMethod;
  roastDate: string;
  openedDate: string;
  variety: string;
  flavorNotes: string;
  memo: string;
};

const emptyForm: BeanFormState = {
  name: "",
  roaster: "",
  originCountry: "unknown",
  roastLevel: "unknown",
  process: "unknown",
  roastDate: "",
  openedDate: "",
  variety: "",
  flavorNotes: "",
  memo: "",
};

const originOptions: Array<{ value: OriginCountry; label: string }> = [
  { value: "ethiopia", label: "에티오피아" },
  { value: "kenya", label: "케냐" },
  { value: "rwanda-burundi", label: "르완다·부룬디" },
  { value: "colombia", label: "콜롬비아" },
  { value: "central-america", label: "과테말라·중미" },
  { value: "brazil", label: "브라질" },
  { value: "asia", label: "인도네시아·아시아" },
  { value: "blend", label: "블렌드" },
  { value: "other", label: "기타" },
  { value: "unknown", label: "잘 모름" },
];

const roastOptions: Array<{ value: RoastLevel; label: string }> = [
  { value: "light", label: "약배전" },
  { value: "medium-light", label: "중약배전" },
  { value: "medium", label: "중배전" },
  { value: "medium-dark", label: "중강배전" },
  { value: "dark", label: "강배전" },
  { value: "unknown", label: "잘 모름" },
];

const processOptions: Array<{ value: ProcessMethod; label: string }> = [
  { value: "washed", label: "워시드" },
  { value: "natural", label: "내추럴" },
  { value: "honey", label: "허니" },
  { value: "fermented", label: "무산소·발효 가공" },
  { value: "unknown", label: "잘 모름" },
];

const originLabels = Object.fromEntries(
  originOptions.map((option) => [option.value, option.label]),
) as Record<OriginCountry, string>;

const roastLabels = Object.fromEntries(
  roastOptions.map((option) => [option.value, option.label]),
) as Record<RoastLevel, string>;

const processLabels = Object.fromEntries(
  processOptions.map((option) => [option.value, option.label]),
) as Record<ProcessMethod, string>;

function getOriginGroup(origin: OriginCountry): OriginGroup {
  switch (origin) {
    case "ethiopia":
    case "kenya":
    case "rwanda-burundi":
      return "east-africa";
    case "colombia":
    case "central-america":
      return "latin-america";
    case "brazil":
      return "brazil";
    case "asia":
      return "asia";
    case "blend":
      return "blend";
    case "other":
      return "other";
    default:
      return "unknown";
  }
}

function beanToForm(bean: Bean): BeanFormState {
  return {
    name: bean.name,
    roaster: bean.roaster ?? "",
    originCountry: bean.originCountry,
    roastLevel: bean.roastLevel,
    process: bean.process,
    roastDate: bean.roastDate ?? "",
    openedDate: bean.openedDate ?? "",
    variety: bean.variety ?? "",
    flavorNotes: bean.flavorNotes?.join(", ") ?? "",
    memo: bean.memo ?? "",
  };
}

function parseFlavorNotes(value: string): string[] | undefined {
  const notes = value
    .split(/[\n,]/)
    .map((note) => note.trim())
    .filter(Boolean);

  return notes.length > 0 ? notes : undefined;
}

function formatDate(value?: string): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function BeanLibraryPanel() {
  const [beans, setBeans] = useState<Bean[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingForm, setIsEditingForm] = useState(false);
  const [editingBeanId, setEditingBeanId] = useState<string | null>(null);
  const [form, setForm] = useState<BeanFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const sortedBeans = useMemo(
    () =>
      [...beans].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt, "ko"),
      ),
    [beans],
  );

  function refreshBeans() {
    setBeans(beanStore.list());
  }

  useEffect(() => {
    initializeCoffeeStorage();
    refreshBeans();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  function startCreate() {
    setEditingBeanId(null);
    setForm(emptyForm);
    setError(null);
    setIsEditingForm(true);
  }

  function startEdit(bean: Bean) {
    setEditingBeanId(bean.id);
    setForm(beanToForm(bean));
    setError(null);
    setIsEditingForm(true);
  }

  function closeForm() {
    setEditingBeanId(null);
    setForm(emptyForm);
    setError(null);
    setIsEditingForm(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setError("원두 이름을 입력해 주세요.");
      return;
    }

    const timestamp = new Date().toISOString();
    const commonValues = {
      name: trimmedName,
      roaster: form.roaster.trim() || undefined,
      originCountry: form.originCountry,
      originGroup: getOriginGroup(form.originCountry),
      roastLevel: form.roastLevel,
      process: form.process,
      roastDate: form.roastDate || undefined,
      openedDate: form.openedDate || undefined,
      variety: form.variety.trim() || undefined,
      flavorNotes: parseFlavorNotes(form.flavorNotes),
      memo: form.memo.trim() || undefined,
    } satisfies Omit<Bean, "id" | "createdAt" | "updatedAt">;

    let saved = false;

    if (editingBeanId) {
      const existing = beanStore.getById(editingBeanId);
      if (!existing) {
        setError("수정할 원두를 찾을 수 없습니다. 목록을 새로 열어 주세요.");
        refreshBeans();
        return;
      }

      saved = beanStore.upsert(
        withUpdatedTimestamp({ ...existing, ...commonValues }, timestamp),
      );
    } else {
      saved = beanStore.upsert(createBean(commonValues, timestamp));
    }

    if (!saved) {
      setError("브라우저 저장소에 원두를 저장하지 못했습니다.");
      return;
    }

    refreshBeans();
    closeForm();
  }

  function handleDelete(bean: Bean) {
    const confirmed = window.confirm(
      `“${bean.name}” 원두와 연결된 추출 기록을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`,
    );

    if (!confirmed) {
      return;
    }

    const remainingProfiles = beanBrewProfileStore
      .list()
      .filter((profile) => profile.beanId !== bean.id);
    const remainingSessions = brewSessionStore
      .list()
      .filter((session) => session.beanId !== bean.id);

    const removed = beanStore.remove(bean.id);
    const profilesSaved = beanBrewProfileStore.replaceAll(remainingProfiles);
    const sessionsSaved = brewSessionStore.replaceAll(remainingSessions);

    if (!removed || !profilesSaved || !sessionsSaved) {
      window.alert("일부 데이터를 삭제하지 못했습니다. 다시 시도해 주세요.");
    }

    if (editingBeanId === bean.id) {
      closeForm();
    }

    refreshBeans();
  }

  function updateForm<K extends keyof BeanFormState>(
    key: K,
    value: BeanFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex h-12 items-center gap-2 rounded-full border border-[#2f6f5f] bg-[#2f6f5f] px-4 text-sm font-semibold text-white shadow-lg transition hover:bg-[#25594c] focus:outline-none focus:ring-2 focus:ring-[#2f6f5f] focus:ring-offset-2"
        aria-label={`내 원두 열기, 저장된 원두 ${beans.length}개`}
      >
        <BeanIcon aria-hidden="true" size={18} />
        <span>내 원두</span>
        {beans.length > 0 && (
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
            {beans.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="bean-library-title"
            className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-[#f4f6f1] shadow-2xl sm:max-w-3xl sm:rounded-2xl"
          >
            <header className="flex items-center justify-between border-b border-[#d7ded4] bg-white px-4 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2f6f5f]">
                  Bean library
                </p>
                <h2
                  id="bean-library-title"
                  className="mt-1 text-xl font-bold text-[#1d211c]"
                >
                  내 원두
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-[#4d574d] transition hover:bg-[#edf1ea] focus:outline-none focus:ring-2 focus:ring-[#2f6f5f]"
                aria-label="내 원두 닫기"
              >
                <X aria-hidden="true" size={21} />
              </button>
            </header>

            <div className="overflow-y-auto px-4 py-5 sm:px-6">
              {!isEditingForm && (
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#333a33]">
                      이름별로 원두와 로스팅 배치를 관리합니다.
                    </p>
                    <p className="mt-1 text-xs text-[#687168]">
                      추천 기능은 산지·배전도·가공 방식 정보를 사용합니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={startCreate}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#2f6f5f] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#25594c] focus:outline-none focus:ring-2 focus:ring-[#2f6f5f] focus:ring-offset-2"
                  >
                    <Plus aria-hidden="true" size={17} />
                    원두 등록
                  </button>
                </div>
              )}

              {isEditingForm ? (
                <form
                  onSubmit={handleSubmit}
                  className="rounded-xl border border-[#d7ded4] bg-white p-4 sm:p-5"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[#2f6f5f]">
                        {editingBeanId ? "원두 수정" : "새 원두"}
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-[#1d211c]">
                        {editingBeanId
                          ? "저장된 정보를 수정합니다"
                          : "추천에 사용할 원두를 등록합니다"}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={closeForm}
                      className="rounded-full p-2 text-[#687168] hover:bg-[#edf1ea]"
                      aria-label="원두 입력 취소"
                    >
                      <X aria-hidden="true" size={19} />
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className="mb-1.5 block text-sm font-semibold text-[#333a33]">
                        원두 이름 <span className="text-[#b3483d]">*</span>
                      </span>
                      <input
                        value={form.name}
                        onChange={(event) => updateForm("name", event.target.value)}
                        placeholder="예: 에티오피아 트와콕 셀렉션 내추럴"
                        autoFocus
                        className="w-full rounded-lg border border-[#c8d0c5] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold text-[#333a33]">
                        로스터
                      </span>
                      <input
                        value={form.roaster}
                        onChange={(event) =>
                          updateForm("roaster", event.target.value)
                        }
                        placeholder="선택 입력"
                        className="w-full rounded-lg border border-[#c8d0c5] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold text-[#333a33]">
                        산지
                      </span>
                      <select
                        value={form.originCountry}
                        onChange={(event) =>
                          updateForm(
                            "originCountry",
                            event.target.value as OriginCountry,
                          )
                        }
                        className="w-full rounded-lg border border-[#c8d0c5] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
                      >
                        {originOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold text-[#333a33]">
                        배전도
                      </span>
                      <select
                        value={form.roastLevel}
                        onChange={(event) =>
                          updateForm(
                            "roastLevel",
                            event.target.value as RoastLevel,
                          )
                        }
                        className="w-full rounded-lg border border-[#c8d0c5] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
                      >
                        {roastOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold text-[#333a33]">
                        가공 방식
                      </span>
                      <select
                        value={form.process}
                        onChange={(event) =>
                          updateForm(
                            "process",
                            event.target.value as ProcessMethod,
                          )
                        }
                        className="w-full rounded-lg border border-[#c8d0c5] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
                      >
                        {processOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold text-[#333a33]">
                        로스팅 날짜
                      </span>
                      <input
                        type="date"
                        value={form.roastDate}
                        onChange={(event) =>
                          updateForm("roastDate", event.target.value)
                        }
                        className="w-full rounded-lg border border-[#c8d0c5] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold text-[#333a33]">
                        개봉일
                      </span>
                      <input
                        type="date"
                        value={form.openedDate}
                        onChange={(event) =>
                          updateForm("openedDate", event.target.value)
                        }
                        className="w-full rounded-lg border border-[#c8d0c5] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold text-[#333a33]">
                        품종
                      </span>
                      <input
                        value={form.variety}
                        onChange={(event) =>
                          updateForm("variety", event.target.value)
                        }
                        placeholder="예: Heirloom, Geisha"
                        className="w-full rounded-lg border border-[#c8d0c5] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
                      />
                    </label>

                    <label className="sm:col-span-2">
                      <span className="mb-1.5 block text-sm font-semibold text-[#333a33]">
                        향미 노트
                      </span>
                      <input
                        value={form.flavorNotes}
                        onChange={(event) =>
                          updateForm("flavorNotes", event.target.value)
                        }
                        placeholder="쉼표로 구분: 딸기, 자스민, 밀크초콜릿"
                        className="w-full rounded-lg border border-[#c8d0c5] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
                      />
                    </label>

                    <label className="sm:col-span-2">
                      <span className="mb-1.5 block text-sm font-semibold text-[#333a33]">
                        메모
                      </span>
                      <textarea
                        value={form.memo}
                        onChange={(event) => updateForm("memo", event.target.value)}
                        placeholder="구매처나 원두 상태 등 자유롭게 기록"
                        rows={3}
                        className="w-full resize-y rounded-lg border border-[#c8d0c5] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20"
                      />
                    </label>
                  </div>

                  {error && (
                    <p
                      role="alert"
                      className="mt-4 rounded-lg bg-[#fff0ed] px-3 py-2 text-sm font-medium text-[#9b3d34]"
                    >
                      {error}
                    </p>
                  )}

                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={closeForm}
                      className="rounded-lg border border-[#c8d0c5] bg-white px-4 py-2.5 text-sm font-semibold text-[#465046] transition hover:bg-[#f4f6f1]"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 rounded-lg bg-[#2f6f5f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#25594c] focus:outline-none focus:ring-2 focus:ring-[#2f6f5f] focus:ring-offset-2"
                    >
                      <Save aria-hidden="true" size={17} />
                      {editingBeanId ? "수정 저장" : "원두 저장"}
                    </button>
                  </div>
                </form>
              ) : sortedBeans.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#aeb9ab] bg-white px-5 py-12 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef5ef] text-[#2f6f5f]">
                    <BeanIcon aria-hidden="true" size={24} />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-[#1d211c]">
                    저장된 원두가 없습니다
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#687168]">
                    원두 이름과 배전도, 가공 방식을 등록하면 다음 단계에서
                    맞춤 레시피 추천에 사용할 수 있습니다.
                  </p>
                  <button
                    type="button"
                    onClick={startCreate}
                    className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-[#2f6f5f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#25594c]"
                  >
                    <Plus aria-hidden="true" size={17} />
                    첫 원두 등록
                  </button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {sortedBeans.map((bean) => {
                    const roastDate = formatDate(bean.roastDate);
                    return (
                      <li
                        key={bean.id}
                        className="rounded-xl border border-[#d7ded4] bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef5ef] text-[#2f6f5f]">
                            <BeanIcon aria-hidden="true" size={20} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="truncate text-base font-bold text-[#1d211c]">
                                  {bean.name}
                                </h3>
                                {bean.roaster && (
                                  <p className="mt-0.5 truncate text-xs text-[#687168]">
                                    {bean.roaster}
                                  </p>
                                )}
                              </div>
                              <ChevronRight
                                aria-hidden="true"
                                className="mt-1 shrink-0 text-[#9ba69a]"
                                size={18}
                              />
                            </div>

                            <div className="mt-3 flex flex-wrap gap-1.5">
                              <span className="rounded-full bg-[#edf1ea] px-2.5 py-1 text-xs font-medium text-[#465046]">
                                {originLabels[bean.originCountry]}
                              </span>
                              <span className="rounded-full bg-[#f5eee5] px-2.5 py-1 text-xs font-medium text-[#695641]">
                                {roastLabels[bean.roastLevel]}
                              </span>
                              <span className="rounded-full bg-[#eef3f5] px-2.5 py-1 text-xs font-medium text-[#465c65]">
                                {processLabels[bean.process]}
                              </span>
                            </div>

                            {roastDate && (
                              <p className="mt-3 flex items-center gap-1.5 text-xs text-[#687168]">
                                <CalendarDays aria-hidden="true" size={14} />
                                로스팅 {roastDate}
                              </p>
                            )}

                            {bean.flavorNotes && bean.flavorNotes.length > 0 && (
                              <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#687168]">
                                향미: {bean.flavorNotes.join(" · ")}
                              </p>
                            )}

                            <div className="mt-4 flex justify-end gap-2 border-t border-[#edf1ea] pt-3">
                              <button
                                type="button"
                                onClick={() => startEdit(bean)}
                                className="flex items-center gap-1.5 rounded-lg border border-[#c8d0c5] px-3 py-2 text-xs font-semibold text-[#465046] transition hover:bg-[#f4f6f1]"
                              >
                                <Pencil aria-hidden="true" size={14} />
                                수정
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(bean)}
                                className="flex items-center gap-1.5 rounded-lg border border-[#e0c5c0] px-3 py-2 text-xs font-semibold text-[#9b3d34] transition hover:bg-[#fff0ed]"
                              >
                                <Trash2 aria-hidden="true" size={14} />
                                삭제
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
