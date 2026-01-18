import { useEffect } from "react";
import { useForm } from "react-hook-form";


export function EventForm({ defaultValues, onSubmit, onCancel, submitLabel = "Save", onDelete }: any) {
  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatDateOnly = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      title: "",
      start: formatDateTimeLocal(new Date()),
      end: formatDateTimeLocal(new Date(Date.now() + 3600000)),
      description: "",
      location: "",
      color: "#3174ad",
      status: "planned",
      repeatRule: "none",
      reminder: "none",
      allDay: false,
      ...defaultValues
    }
  });

  useEffect(() => { if (defaultValues) reset(defaultValues); }, [defaultValues, reset]);

  const startDate = watch("start");
  const endDate = watch("end");
  const isAllDay = watch("allDay");

  useEffect(() => {
    if (isAllDay && startDate) {
      const startDateOnly = formatDateOnly(new Date(startDate));
      setValue("start", startDateOnly);
      setValue("end", startDateOnly);
    } else if (!isAllDay && startDate && !startDate.includes("T")) {
      const baseDate = new Date(startDate);
      setValue("start", formatDateTimeLocal(baseDate));
      const endDateTime = new Date(baseDate);
      endDateTime.setHours(baseDate.getHours() + 1);
      setValue("end", formatDateTimeLocal(endDateTime));
    }
  }, [isAllDay, setValue]);

  const handleFormSubmit = (data: any) => {
    const start = new Date(data.start);
    const end = new Date(data.end);

    if (data.allDay) {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    onSubmit({
      title: data.title,
      description: data.description || undefined,
      location: data.location || undefined,
      color: data.color || undefined,
      start,
      end,
      allDay: data.allDay,
      status: data.status,
      repeatRule: data.repeatRule,
      reminder: data.reminder,
      participants: data.participants ? data.participants.split(",").map((e: string) => e.trim()).filter((e: string) => e) : undefined
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="mb-3">
        <label className="form-label">Title</label>
        <input 
          {...register("title", { required: "Title is required" })} 
          className={`form-control ${errors.title ? "is-invalid" : ""}`} 
        />
        {errors.title && <div className="invalid-feedback">{errors.title.message as string}</div>}
      </div>

      <div className="mb-3">
        <label>Description</label>
        <textarea 
          {...register("description")} 
          className="form-control" 
          rows={3}
          placeholder="Optional event description"
        />
      </div>

      <div className="mb-3">
        <label>Location</label>
        <input 
          {...register("location")} 
          className="form-control" 
          placeholder="Optional event location"
        />
      </div>

      <div className="mb-3">
        <label>Color</label>
        <input 
          type="color"
          {...register("color")}
          className="form-control form-control-color"
        />
      </div>

      <div className="mb-3 form-check">
        <input type="checkbox" {...register("allDay")} className="form-check-input" id="allDay" />
        <label htmlFor="allDay" className="form-check-label">All day</label>
      </div>

      <div className="row mb-3">
        <div className="col">
          <label>Start</label>
          <input 
            type={isAllDay ? "date" : "datetime-local"}
            {...register("start", { required: true })} 
            className="form-control"
          />
        </div>
        <div className="col">
          <label className="form-label">End</label>
          <input 
            type={isAllDay ? "date" : "datetime-local"}
            {...register("end", { 
              required: true,
              validate: (value) => {
                const start = new Date(startDate);
                const end = new Date(value);
                if (isAllDay) {
                  return end >= start || "End date must be on or after start date";
                }
                return end > start || "End date must be after start date";
              }
            })} 
            className={`form-control ${errors.end ? "is-invalid" : ""}`}
          />
          {errors.end && <div className="invalid-feedback">{errors.end.message as string}</div>}
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">Status</label>
        <select {...register("status")} className="form-select">
          <option value="planned">Planned</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Finished</option>
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">Participants (use comma to separate)</label>
        <input {...register("participants")} className="form-control" placeholder="a@b.pl, c@d.pl" />
      </div>

      <div className="d-flex justify-content-between mt-4">
        {onDelete && (
          <button type="button" onClick={onDelete} className="btn btn-outline-danger">Delete</button>
        )}
        <div className="d-flex gap-2 ms-auto">
          <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}