export function DemoAccountsHint() {
  return (
    <div className="mt-7 rounded-[var(--radius-field)] border border-[var(--tn-border)] bg-[color-mix(in_srgb,var(--page-bg)_55%,white)] px-4 py-3.5 text-sm text-[var(--tn-muted)]">
      <p className="mb-2 text-[0.8rem] font-semibold text-foreground">Demo accounts</p>
      <ul className="space-y-1.5 text-[0.82rem]">
        <li>Platform: admin / demo1234</li>
        <li>Operator: ritcoadmin / demo1234</li>
        <li>Customer: customer / demo1234</li>
      </ul>
    </div>
  );
}
