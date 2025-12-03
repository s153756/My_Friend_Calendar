import { Views, type View } from "react-big-calendar";

const cloneDate = (value: Date) => new Date(value.getTime());

const startOfDay = (value: Date) => {
  const date = cloneDate(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value: Date) => {
  const date = cloneDate(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

export const computeVisibleRange = (view: View, referenceDate: Date) => {
  const base = cloneDate(referenceDate);
  switch (view) {
    case Views.DAY: {
      return { start: startOfDay(base), end: endOfDay(base) };
    }
    case Views.WEEK: {
      const start = startOfDay(base);
      const dayIndex = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - dayIndex);
      const end = endOfDay(cloneDate(start));
      end.setDate(start.getDate() + 6);
      return { start, end };
    }
    case Views.AGENDA: {
      const start = startOfDay(base);
      const end = endOfDay(cloneDate(start));
      end.setDate(start.getDate() + 30);
      return { start, end };
    }
    default: {
      const start = startOfDay(new Date(base.getFullYear(), base.getMonth(), 1));
      const end = endOfDay(new Date(base.getFullYear(), base.getMonth() + 1, 0));
      return { start, end };
    }
  }
};

export const rangeHelpers = {
  startOfDay,
  endOfDay,
};
