import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
}

export function Avatar({ name, className, ...props }: AvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground",
        className,
      )}
      {...props}
    >
      {initial}
    </div>
  );
}
