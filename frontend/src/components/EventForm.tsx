import { useEffect } from "react";
import { useForm } from "react-hook-form";


export function EventForm({ defaultValues, onSubmit, onCancel, submitLabel = "Save", onDelete }: any) {
  const toDateTimeLocal = (date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      title: "",
      start: toDateTimeLocal(new Date()),
      end: toDateTimeLocal(new Date(Date.now() + 3600000)),
      status: "planned",
      repeatRule: "none",
      reminder: "none",
      ...defaultValues
    }
  });

  useEffect(() => { if (defaultValues) reset(defaultValues); }, [defaultValues, reset]);

  
  const startDate = watch("start");

  const handleFormSubmit = (data: any) => {
    const start = new Date(data.start);
    const end = new Date(data.end);

    if (data.allDay) {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    onSubmit({
      ...data,
      start,
      end,
      participants: data.participants ? data.participants.split(",").map((e: string) => e.trim()) : undefined
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

      <div className="row mb-3">
        <div className="col">
          <label className="form-label">Start</label>
          <input type="datetime-local" {...register("start", { required: true })} className="form-control" />
        </div>
        <div className="col">
          <label className="form-label">End</label>
          <input 
            type="datetime-local" 
            {...register("end", { 
              required: true,
              validate: (value) => new Date(value) > new Date(startDate) || "End date must be after start date"
            })} 
            className={`form-control ${errors.end ? "is-invalid" : ""}`} 
          />
          {errors.end && <div className="invalid-feedback">{errors.end.message as string}</div>}
        </div>
      </div>

      <div className="mb-3 form-check">
        <input type="checkbox" {...register("allDay")} className="form-check-input" id="allDay" />
        <label htmlFor="allDay" className="form-check-label">All day</label>
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