export function SelectCell({ value }: { value: string }) {
  if (!value) return null;

  return (
    <span className="cell-select">
      {value}
    </span>
  );
}
