import { ChangeEvent, memo } from "react";
import { View, Views } from "react-big-calendar";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type CalendarNavigationProps = {
  view: View;
  date: Date;
  onChangeView: (view: View) => void;
  onGoToToday: () => void;
  onChangeDate: (date: Date) => void;
  onChangeMonth: (year: number, monthIndex: number) => void;
  onChangeYear: (year: number) => void;
};

const viewOptions: Array<{ label: string; value: View }> = [
  { label: "Day", value: Views.DAY },
  { label: "Week", value: Views.WEEK },
  { label: "Month", value: Views.MONTH },
  { label: "Agenda", value: Views.AGENDA },
];

const formatDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateInputValue = (value: string): Date | null => {
  if (!value) {
    return null;
  }

  const [yearStr, monthStr, dayStr] = value.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
};

function CalendarNavigationComponent({
  view,
  date,
  onChangeView,
  onGoToToday,
  onChangeDate,
  onChangeMonth,
  onChangeYear,
}: CalendarNavigationProps) {
  const currentYear = date.getFullYear();
  const years: number[] = [];
  for (let offset = -5; offset <= 5; offset += 1) {
    years.push(currentYear + offset);
  }

  const viewSelectId = "calendar-view-select";
  const monthSelectId = "calendar-month-select";
  const yearSelectId = "calendar-year-select";
  const dateInputId = "calendar-date-input";

  const handleViewChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedView = event.target.value as View;
    onChangeView(selectedView);
  };

  const handleMonthChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const monthIndex = Number(event.target.value);
    if (Number.isNaN(monthIndex)) {
      return;
    }
    onChangeMonth(currentYear, monthIndex);
  };

  const handleYearChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const yearValue = Number(event.target.value);
    if (Number.isNaN(yearValue)) {
      return;
    }
    onChangeYear(yearValue);
  };

  const handleDateInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = parseDateInputValue(event.target.value);
    if (!parsed) {
      return;
    }
    onChangeDate(parsed);
  };

  return (
    <nav className="d-flex flex-wrap align-items-center gap-3 p-3 bg-white border rounded mb-3" aria-label="Calendar navigation">
      <div>
        <button type="button" className="btn btn-primary" onClick={onGoToToday}>
          Today
        </button>
      </div>
      <div className="d-flex align-items-center gap-2">
        <label htmlFor={viewSelectId} className="form-label mb-0 text-muted small">View</label>
        <select id={viewSelectId} className="form-select form-select-sm" style={{ minWidth: '100px' }} value={view} onChange={handleViewChange}>
          {viewOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="d-flex align-items-center gap-2">
        <label htmlFor={monthSelectId} className="form-label mb-0 text-muted small">Month</label>
        <select id={monthSelectId} className="form-select form-select-sm" style={{ minWidth: '120px' }} value={date.getMonth()} onChange={handleMonthChange}>
          {monthNames.map((monthName, index) => (
            <option key={monthName} value={index}>
              {monthName}
            </option>
          ))}
        </select>
      </div>
      <div className="d-flex align-items-center gap-2">
        <label htmlFor={yearSelectId} className="form-label mb-0 text-muted small">Year</label>
        <select id={yearSelectId} className="form-select form-select-sm" style={{ minWidth: '90px' }} value={currentYear} onChange={handleYearChange}>
          {years.map((yearOption) => (
            <option key={yearOption} value={yearOption}>
              {yearOption}
            </option>
          ))}
        </select>
      </div>
      <div className="d-flex align-items-center gap-2">
        <label htmlFor={dateInputId} className="form-label mb-0 text-muted small text-nowrap">Go to date</label>
        <input
          id={dateInputId}
          type="date"
          className="form-control form-control-sm"
          value={formatDateInputValue(date)}
          onChange={handleDateInputChange}
        />
      </div>
    </nav>
  );
}

export default memo(CalendarNavigationComponent);
