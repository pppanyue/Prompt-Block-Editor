export function downloadJson(value: unknown, name: string, suffix: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name.replace(/[^a-z0-9-_]/gi, '-').slice(0, 80) || 'prompt'}.${suffix}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
