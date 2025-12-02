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
    <form onSubmit={onInternalSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {createdByEmail && (
        <div style={{ fontSize: "0.9rem", color: "#555" }}>Utworzone przez: {createdByEmail}</div>
      )}
      <label>
        Tytuł
        <input type="text" {...register("title")} />
        {errors.title && <span style={{ color: "red" }}>{errors.title.message}</span>}
      </label>

      <label>
        Opis
        <textarea rows={3} {...register("description")} />
      </label>

      <label>
        Lokalizacja
        <input type="text" {...register("location")} />
      </label>

      <label>
        Kolor
        <input type="color" {...register("color")} />
      </label>

      <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <input type="checkbox" {...register("allDay")} /> Wydarzenie całodniowe
      </label>

      <label>
        Start
        <input type="datetime-local" {...register("start")} />
        {errors.start && <span style={{ color: "red" }}>{errors.start.message}</span>}
      </label>

      <label>
        Koniec
        <input type="datetime-local" {...register("end")} />
        {errors.end && <span style={{ color: "red" }}>{errors.end.message}</span>}
      </label>

      <label>
        Uczestnicy (lista emaili)
        <textarea rows={3} placeholder="np. alice@example.com, bob@example.com" {...register("participants")} />
      </label>

      <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <input type="checkbox" {...register("isCancelled")} /> Oznacz jako anulowane
      </label>

      <label>
        Powtarzanie
        <select {...register("repeatRule")}>
          <option value="none">Brak</option>
          <option value="daily">Codziennie</option>
          <option value="weekly">Co tydzień</option>
          <option value="monthly">Co miesiąc</option>
        </select>
      </label>

      <label>
        Kategoria
        <input type="text" {...register("category")} />
      </label>

      <label>
        Status wydarzenia
        <select {...register("status")}>
          <option value="planned">Planowane</option>
          <option value="in_progress">W trakcie</option>
          <option value="completed">Zakończone</option>
          <option value="cancelled">Anulowane</option>
        </select>
      </label>

      <label>
        Przypomnienie
        <select {...register("reminder")}>
          <option value="none">Brak</option>
          <option value="hour_before">Godzinę przed</option>
          <option value="day_before">Dzień przed</option>
          <option value="week_before">Tydzień przed</option>
        </select>
      </label>

      <label>
        Tag wydarzenia
        <input type="text" {...register("tag")} />
      </label>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {onDelete && (
          <button type="button" onClick={onDelete} style={{ color: "#b00020" }}>
            Usuń
          </button>
        )}
        <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
          <button type="button" onClick={onCancel} disabled={isSubmitting}>
            Anuluj
          </button>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Zapisywanie..." : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
