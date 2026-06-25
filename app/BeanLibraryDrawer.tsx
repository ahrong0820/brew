"use client";

import {
  CalendarDays,
  Coffee,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
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

type FormState = {
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

type Option<T extends string> = {
  value: T;
  label: string;
};

const emptyForm: FormState = {
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

const originOptions: Option<OriginCountry>[] = [
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

const roastOptions: Option<RoastLevel>[] = [
  { value: "light", label: "약배전" },
  { value: "medium-light", label: "중약배전" },
  { value: "medium", label: "중배전" },
  { value: "medium-dark", label: "중강배전" },
  { value: "dark", label: "강배전" },
  { value: "unknown", label: "잘 모름" },
];

const processOptions: Option<ProcessMethod>[] = [
  { value: "washed", label: "워시드" },
  { value: "natural", label: "내추럴" },
  { value: "honey", label: "허니" },
  { value: "fermented", label: "무산소·발효 가공" },
  { value: "unknown", label: "잘 모름" },
];

function optionLabel<T extends string>(options: Option<T>[], value: T) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function originGroupFor(origin: OriginCountry): OriginGroup {
  if (["ethiopia", "kenya", "rwanda-burundi"].includes(origin)) {
    return "east-africa";
  }

  if (["colombia", "central-america"].includes(origin)) {
    return "latin-america";
  }

  if (origin === "brazil" || origin === "asia" || origin === "blend") {
    return origin;
  }

  return origin === "other" ? "other" : "unknown";
}

function formFromBean(bean: Bean): FormState {
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

function parsedFlavorNotes(value: string) {
  const notes = value
    .split(/[\n,]/)
    .map((note) => note.trim())
    .filter(Boolean);

  return notes.length > 0 ? notes : undefined;
}

function displayDate(value?: string) {
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

const inputClass =
  "w-full rounded-lg border border-[#c8d0c5] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#2f6f5f] focus:ring-2 focus:ring-[#2f6f5f]/20";

export default function BeanLibraryDrawer() {
  const [beans, setBeans] = useState<Bean[]>([]);
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const sortedBeans = useMemo(
    () => [...beans].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [beans],
  );

  function reloadBeans() {
    setBeans(beanStore.list());
  }

  useEffect(() => {
    initializeCoffeeStorage();
    const timer = window.setTimeout(reloadBeans, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
    setShowForm(false);
  }

  function beginCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
    setShowForm(true);
  }

  function beginEdit(bean: Bean) {
    setForm(formFromBean(bean));
    setEditingId(bean.id);
    setError(null);
    setShowForm(true);
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  function submitBean(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    if (!name) {
      setError("원두 이름을 입력해 주세요.");
      return;
    }

    const timestamp = new Date().toISOString();
    const values = {
      name,
      roaster: form.roaster.trim() || undefined,
      originCountry: form.originCountry,
      originGroup: originGroupFor(form.originCountry),
      roastLevel: form.roastLevel,
      process: form.process,
      roastDate: form.roastDate || undefined,
      openedDate: form.openedDate || undefined,
      variety: form.variety.trim() || undefined,
      flavorNotes: parsedFlavorNotes(form.flavorNotes),
      memo: form.memo.trim() || undefined,
    } satisfies Omit<Bean, "id" | "createdAt" | "updatedAt">;

    let saved: boolean;

    if (editingId) {
      const existing = beanStore.getById(editingId);
      if (!existing) {
        setError("수정할 원두를 찾지 못했습니다.");
        reloadBeans();
        return;
      }

      saved = beanStore.upsert(
        withUpdatedTimestamp({ ...existing, ...values }, timestamp),
      );
    } else {
      saved = beanStore.upsert(createBean(values, timestamp));
    }

    if (!saved) {
      setError("브라우저 저장소에 저장하지 못했습니다.");
      return;
    }

    reloadBeans();
    resetForm();
  }

  function deleteBean(bean: Bean) {
    const confirmed = window.confirm(
      `“${bean.name}” 원두와 연결된 기록을 삭제할까요?`,
    );

    if (!confirmed) {
      return;
    }

    const profilesSaved = beanBrewProfileStore.replaceAll(
      beanBrewProfileStore.list().filter((profile) => profile.beanId !== bean.id),
    );
    const sessionsSaved = brewSessionStore.replaceAll(
      brewSessionStore.list().filter((session) => session.beanId !== bean.id),
    );
    const beanRemoved = beanStore.remove(bean.id);

    if (!profilesSaved || !sessionsSaved || !beanRemoved) {
      window.alert("일부 데이터를 삭제하지 못했습니다. 다시 시도해 주세요.");
    }

    if (editingId === bean.id) {
      resetForm();
    }

    reloadBeans();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex h-12 items-center gap-2 rounded-full border border-[#2f6f5f] bg-[#2f6f5f] px-4 text-sm font-semibold text-white shadow-lg transition hover:bg-[#25594c] focus:outline-none focus:ring-2 focus:ring-[#2f6f5f] focus:ring-offset-2"
        aria-label={`내 원두 열기, 저장된 원두 ${beans.length}개`}
      >
        <Coffee aria-hidden="true" size={18} />
        내 원두
        {beans.length > 0 && (
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
            {beans.length}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6">
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
                <h2 id="bean-library-title" className="mt-1 text-xl font-bold">
                  내 원두
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-[#4d574d] hover:bg-[#edf1ea] focus:outline-none focus:ring-2 focus:ring-[#2f6f5f]"
                aria-label="내 원두 닫기"
              >
                <X aria-hidden="true" size={21} />
              </button>
            </header>

            <div className="overflow-y-auto px-4 py-5 sm:px-6">
              {!showForm && (
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#333a33]">
                      이름과 로스팅 배치별로 원두를 관리합니다.
                    </p>
                    <p className="mt-1 text-xs text-[#687168]">
                      산지·배전도·가공 방식은 맞춤 추천에 사용됩니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={beginCreate}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#2f6f5f] px-3 py-2 text-sm font-semibold text-white hover:bg-[#25594c]"
                  >
                    <Plus aria-hidden="true" size={17} />
                    원두 등록
                  </button>
                </div>
              )}

              {showForm ? (
                <form
                  onSubmit={submitBean}
                  className="rounded-xl border border-[#d7ded4] bg-white p-4 sm:p-5"
                >
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-[#2f6f5f]">
                        {editingId ? "원두 수정" : "새 원두"}
                      </p>
                      <h3 className="mt-1 text-lg font-bold">
                        {editingId
                          ? "저장된 원두 정보를 수정합니다"
                          : "추천에 사용할 원두를 등록합니다"}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-full p-2 text-[#687168] hover:bg-[#edf1ea]"
                      aria-label="원두 입력 취소"
                    >
                      <X aria-hidden="true" size={19} />
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className="mb-1.5 block text-sm font-semibold">
                        원두 이름 <span className="text-[#b3483d]">*</span>
                      </span>
                      <input
                        value={form.name}
                        onChange={(event) => setField("name", event.target.value)}
                        placeholder="예: 에티오피아 트와콕 셀렉션 내추럴"
                        className={inputClass}
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        로스터
                      </span>
                      <input
                        value={form.roaster}
                        onChange={(event) =>
                          setField("roaster", event.target.value)
                        }
                        placeholder="선택 입력"
                        className={inputClass}
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        산지
                      </span>
                      <select
                        value={form.originCountry}
                        onChange={(event) =>
                          setField(
                            "originCountry",
                            event.target.value as OriginCountry,
                          )
                        }
                        className={inputClass}
                      >
                        {originOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        배전도
                      </span>
                      <select
                        value={form.roastLevel}
                        onChange={(event) =>
                          setField(
                            "roastLevel",
                            event.target.value as RoastLevel,
                          )
                        }
                        className={inputClass}
                      >
                        {roastOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        가공 방식
                      </span>
                      <select
                        value={form.process}
                        onChange={(event) =>
                          setField(
                            "process",
                            event.target.value as ProcessMethod,
                          )
                        }
                        className={inputClass}
                      >
                        {processOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        로스팅 날짜
                      </span>
                      <input
                        type="date"
                        value={form.roastDate}
                        onChange={(event) =>
                          setField("roastDate", event.target.value)
                        }
                        className={inputClass}
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        개봉일
                      </span>
                      <input
                        type="date"
                        value={form.openedDate}
                        onChange={(event) =>
                          setField("openedDate", event.target.value)
                        }
                        className={inputClass}
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        품종
                      </span>
                      <input
                        value={form.variety}
                        onChange={(event) =>
                          setField("variety", event.target.value)
                        }
                        placeholder="예: Heirloom, Geisha"
                        className={inputClass}
                      />
                    </label>

                    <label className="sm:col-span-2">
                      <span className="mb-1.5 block text-sm font-semibold">
                        향미 노트
                      </span>
                      <input
                        value={form.flavorNotes}
                        onChange={(event) =>
                          setField("flavorNotes", event.target.value)
                        }
                        placeholder="쉼표로 구분: 딸기, 자스민, 밀크초콜릿"
                        className={inputClass}
                      />
                    </label>

                    <label className="sm:col-span-2">
                      <span className="mb-1.5 block text-sm font-semibold">
                        메모
                      </span>
                      <textarea
                        value={form.memo}
                        onChange={(event) => setField("memo", event.target.value)}
                        rows={3}
                        placeholder="구매처나 원두 상태 등 자유롭게 기록"
                        className={`${inputClass} resize-y`}
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
                      onClick={resetForm}
                      className="rounded-lg border border-[#c8d0c5] px-4 py-2.5 text-sm font-semibold text-[#465046] hover:bg-[#f4f6f1]"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 rounded-lg bg-[#2f6f5f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#25594c]"
                    >
                      <Save aria-hidden="true" size={17} />
                      {editingId ? "수정 저장" : "원두 저장"}
                    </button>
                  </div>
                </form>
              ) : sortedBeans.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#aeb9ab] bg-white px-5 py-12 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef5ef] text-[#2f6f5f]">
                    <Coffee aria-hidden="true" size={24} />
                  </span>
                  <h3 className="mt-4 font-bold">저장된 원두가 없습니다</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#687168]">
                    원두를 등록하면 다음 단계에서 맞춤 레시피 추천에 사용할 수
                    있습니다.
                  </p>
                  <button
                    type="button"
                    onClick={beginCreate}
                    className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-[#2f6f5f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#25594c]"
                  >
                    <Plus aria-hidden="true" size={17} />
                    첫 원두 등록
                  </button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {sortedBeans.map((bean) => {
                    const roastDate = displayDate(bean.roastDate);

                    return (
                      <li
                        key={bean.id}
                        className="rounded-xl border border-[#d7ded4] bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef5ef] text-[#2f6f5f]">
                            <Coffee aria-hidden="true" size={20} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-bold">{bean.name}</h3>
                            {bean.roaster && (
                              <p className="mt-0.5 truncate text-xs text-[#687168]">
                                {bean.roaster}
                              </p>
                            )}

                            <div className="mt-3 flex flex-wrap gap-1.5">
                              <span className="rounded-full bg-[#edf1ea] px-2.5 py-1 text-xs font-medium">
                                {optionLabel(originOptions, bean.originCountry)}
                              </span>
                              <span className="rounded-full bg-[#f5eee5] px-2.5 py-1 text-xs font-medium text-[#695641]">
                                {optionLabel(roastOptions, bean.roastLevel)}
                              </span>
                              <span className="rounded-full bg-[#eef3f5] px-2.5 py-1 text-xs font-medium text-[#465c65]">
                                {optionLabel(processOptions, bean.process)}
                              </span>
                            </div>

                            {roastDate && (
                              <p className="mt-3 flex items-center gap-1.5 text-xs text-[#687168]">
                                <CalendarDays aria-hidden="true" size={14} />
                                로스팅 {roastDate}
                              </p>
                            )}

                            {bean.flavorNotes && bean.flavorNotes.length > 0 && (
                              <p className="mt-2 text-xs leading-5 text-[#687168]">
                                향미: {bean.flavorNotes.join(" · ")}
                              </p>
                            )}

                            <div className="mt-4 flex justify-end gap-2 border-t border-[#edf1ea] pt-3">
                              <button
                                type="button"
                                onClick={() => beginEdit(bean)}
                                className="flex items-center gap-1.5 rounded-lg border border-[#c8d0c5] px-3 py-2 text-xs font-semibold text-[#465046] hover:bg-[#f4f6f1]"
                              >
                                <Pencil aria-hidden="true" size={14} />
                                수정
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteBean(bean)}
                                className="flex items-center gap-1.5 rounded-lg border border-[#e0c5c0] px-3 py-2 text-xs font-semibold text-[#9b3d34] hover:bg-[#fff0ed]"
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
