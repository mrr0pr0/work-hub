export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
    const initials = name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase())
        .join("");

    return (
        <div
            className="rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-xs font-semibold text-zinc-200"
            style={{ width: size, height: size }}
            aria-label={`Avatar for ${name}`}
            title={name}
        >
            {initials}
        </div>
    );
}