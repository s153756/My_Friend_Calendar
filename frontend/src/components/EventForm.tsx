import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { CalendarEventInput } from "../types/calendar";

const repeatRuleValues = ["none", "daily", "weekly", "monthly"] as const;
const statusValues = ["planned", "in_progress", "completed", "cancelled"] as const;
const reminderValues = ["none", "hour_before", "day_before", "week_before"] as const;

const formSchema = z
  .object({
    title: z.string().min(1, "Tytuł jest wymagany"),
    description: z.string().optional(),
    location: z.string().optional(),
    color: z.string().optional(),
    allDay: z.boolean().optional(),
    start: z
      .string()
      .min(1, "Data rozpoczęcia jest wymagana")
      .refine((value) => !Number.isNaN(Date.parse(value)), "Podaj poprawną datę"),
    end: z
      .string()
      .min(1, "Data zakończenia jest wymagana")
      .refine((value) => !Number.isNaN(Date.parse(value)), "Podaj poprawną datę"),
    participants: z.string().optional(),
    repeatRule: z
      .string()
      .refine((value): value is (typeof repeatRuleValues)[number] => repeatRuleValues.includes(value as never), {
        message: "Nieprawidłowa reguła powtarzania",
      }),
    category: z.string().optional(),
    status: z
      .string()
      .refine((value): value is (typeof statusValues)[number] => statusValues.includes(value as never), {
        message: "Nieprawidłowy status",
      }),
    reminder: z
      .string()
      .refine((value): value is (typeof reminderValues)[number] => reminderValues.includes(value as never), {
        message: "Nieprawidłowe przypomnienie",
      }),
    tag: z.string().optional(),
    isCancelled: z.boolean().optional(),
  })
  .refine(
    (data) => new Date(data.end).getTime() > new Date(data.start).getTime(),
    {
      message: "Data zakończenia musi być późniejsza niż rozpoczęcia",
      path: ["end"],
    }
  );

export type CreateEventFormValues = z.infer<typeof formSchema>;

const buildBaseDefaults = (): CreateEventFormValues => {
  const now = new Date();
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000);

  return {
    title: "",
    description: "",
    location: "",
    color: "#3174ad",
    allDay: false,
    start: formatDateForInput(now),
    end: formatDateForInput(nextHour),
    participants: "",
    repeatRule: "none",
    category: "",
    status: "planned",
    reminder: "none",
    tag: "",
    isCancelled: false,
  };
};

const formatDateForInput = (date: Date): string => {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

const parseParticipants = (value?: string): string[] | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = value
    .split(/[\n,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  return parsed.length ? parsed : undefined;
};

interface EventFormProps {
  defaultValues?: Partial<CreateEventFormValues>;
  onSubmit: (values: CalendarEventInput) => void;
  onCancel: () => void;
  submitLabel?: string;
  createdByEmail?: string | null;
  onDelete?: () => void;
}

export function EventForm({ defaultValues, onSubmit, onCancel, submitLabel = "Zapisz", createdByEmail, onDelete }: EventFormProps) {
  const mergedDefaults = useMemo(
    () => ({
      ...buildBaseDefaults(),
      ...defaultValues,
    }),
    [defaultValues]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateEventFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: mergedDefaults,
  });

  useEffect(() => {
    reset(mergedDefaults);
  }, [mergedDefaults, reset]);

  const onInternalSubmit = handleSubmit((values) => {
    const normalizedStart = new Date(values.start);
    const normalizedEnd = new Date(values.end);
    const isAllDay = Boolean(values.allDay);

    if (isAllDay) {
      normalizedStart.setHours(0, 0, 0, 0);
      normalizedEnd.setHours(23, 59, 59, 999);
    }

    const payload: CalendarEventInput = {
      title: values.title,
      description: values.description?.trim() || undefined,
      location: values.location?.trim() || undefined,
      color: values.color?.trim() || undefined,
      allDay: isAllDay,
      start: normalizedStart,
      end: normalizedEnd,
      isCancelled: Boolean(values.isCancelled),
      participants: parseParticipants(values.participants),
      repeatRule: values.repeatRule as (typeof repeatRuleValues)[number],
      category: values.category?.trim() || undefined,
      status: values.status as (typeof statusValues)[number],
      reminder: values.reminder as (typeof reminderValues)[number],
      tag: values.tag?.trim() || undefined,
    };

    onSubmit(payload);
  });

  return (
    <form onSubmit={onInternalSubmit}>
      {createdByEmail && (
        <div className="text-muted small mb-2">Utworzone przez: {createdByEmail}</div>
      )}

      <div className="mb-3">
        <label htmlFor="title" className="form-label">Tytuł</label>
        <input type="text" id="title" className={`form-control ${errors.title ? "is-invalid" : ""}`} {...register("title")} />
        {errors.title && <div className="invalid-feedback">{errors.title.message}</div>}
      </div>

      <div className="mb-3">
        <label htmlFor="description" className="form-label">Opis</label>
        <textarea id="description" rows={2} className="form-control" {...register("description")} />
      </div>

      <div className="row mb-3">
        <div className="col-8">
          <label htmlFor="location" className="form-label">Lokalizacja</label>
          <input type="text" id="location" className="form-control" {...register("location")} />
        </div>
        <div className="col-4">
          <label htmlFor="color" className="form-label">Kolor</label>
          <input type="color" id="color" className="form-control form-control-color w-100" {...register("color")} />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-6">
          <label htmlFor="start" className="form-label">Start</label>
          <input type="datetime-local" id="start" className={`form-control ${errors.start ? "is-invalid" : ""}`} {...register("start")} />
          {errors.start && <div className="invalid-feedback">{errors.start.message}</div>}
        </div>
        <div className="col-6">
          <label htmlFor="end" className="form-label">Koniec</label>
          <input type="datetime-local" id="end" className={`form-control ${errors.end ? "is-invalid" : ""}`} {...register("end")} />
          {errors.end && <div className="invalid-feedback">{errors.end.message}</div>}
        </div>
      </div>

      <div className="mb-3">
        <div className="form-check">
          <input type="checkbox" id="allDay" className="form-check-input" {...register("allDay")} />
          <label htmlFor="allDay" className="form-check-label">Wydarzenie całodniowe</label>
        </div>
      </div>

      <div className="mb-3">
        <label htmlFor="participants" className="form-label">Uczestnicy (emaile)</label>
        <textarea id="participants" rows={2} className="form-control" placeholder="alice@example.com, bob@example.com" {...register("participants")} />
      </div>

      <div className="row mb-3">
        <div className="col-6">
          <label htmlFor="repeatRule" className="form-label">Powtarzanie</label>
          <select id="repeatRule" className="form-select" {...register("repeatRule")}>
            <option value="none">Brak</option>
            <option value="daily">Codziennie</option>
            <option value="weekly">Co tydzień</option>
            <option value="monthly">Co miesiąc</option>
          </select>
        </div>
        <div className="col-6">
          <label htmlFor="status" className="form-label">Status</label>
          <select id="status" className="form-select" {...register("status")}>
            <option value="planned">Planowane</option>
            <option value="in_progress">W trakcie</option>
            <option value="completed">Zakończone</option>
            <option value="cancelled">Anulowane</option>
          </select>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-6">
          <label htmlFor="reminder" className="form-label">Przypomnienie</label>
          <select id="reminder" className="form-select" {...register("reminder")}>
            <option value="none">Brak</option>
            <option value="hour_before">Godzinę przed</option>
            <option value="day_before">Dzień przed</option>
            <option value="week_before">Tydzień przed</option>
          </select>
        </div>
        <div className="col-6">
          <label htmlFor="category" className="form-label">Kategoria</label>
          <input type="text" id="category" className="form-control" {...register("category")} />
        </div>
      </div>

      <div className="mb-3">
        <label htmlFor="tag" className="form-label">Tag</label>
        <input type="text" id="tag" className="form-control" {...register("tag")} />
      </div>

      <div className="mb-3">
        <div className="form-check">
          <input type="checkbox" id="isCancelled" className="form-check-input" {...register("isCancelled")} />
          <label htmlFor="isCancelled" className="form-check-label">Oznacz jako anulowane</label>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center pt-2">
        {onDelete ? (
          <button type="button" className="btn btn-outline-danger" onClick={onDelete}>Usuń</button>
        ) : (
          <div />
        )}
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSubmitting}>Anuluj</button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Zapisywanie..." : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
