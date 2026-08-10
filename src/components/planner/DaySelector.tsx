import { toLocalISODate } from '../../lib/date';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - (day === 0 ? 6 : day - 1);
  date.setDate(diff);
  return date;
}

interface DaySelectorProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
}

export function DaySelector({ selectedDate, onSelect }: DaySelectorProps) {
  const monday = getMonday(new Date());
  const selectedISO = toLocalISODate(selectedDate);

  return (
    <div className="day-selector">
      {DAY_NAMES.map((name, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const iso = toLocalISODate(d);
        return (
          <div
            key={iso}
            className={`day-cell${iso === selectedISO ? ' selected' : ''}`}
            onClick={() => onSelect(d)}
          >
            <div className="day-name">{name}</div>
            <div className="day-num">{d.getDate()}</div>
          </div>
        );
      })}
    </div>
  );
}
