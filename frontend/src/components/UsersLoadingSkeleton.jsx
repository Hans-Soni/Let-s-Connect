function UsersLoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="p-3 rounded-2xl border border-border/40 bg-secondary/30 animate-pulse flex items-center gap-3"
        >
          <div className="h-11 w-11 rounded-full bg-secondary/80 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-secondary/90 rounded-md w-2/3" />
            <div className="h-3 bg-secondary/60 rounded-md w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
export default UsersLoadingSkeleton;
