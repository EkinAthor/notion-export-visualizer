export function PersonCell({ value }: { value: string }) {
  if (!value) return null;
  const people = value.split(',').map(p => p.trim()).filter(Boolean);

  return (
    <div className="cell-people">
      {people.map(person => (
        <span key={person} className="person-chip">
          <span className="person-avatar">{person.charAt(0).toUpperCase()}</span>
          {person}
        </span>
      ))}
    </div>
  );
}
