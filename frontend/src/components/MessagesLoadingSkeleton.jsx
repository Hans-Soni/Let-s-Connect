function MessagesLoadingSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {[
        { align: "start", width: "w-48" },
        { align: "end", width: "w-64" },
        { align: "start", width: "w-56" },
        { align: "end", width: "w-40" },
      ].map((item, index) => (
        <div
          key={index}
          className={`flex ${item.align === "end" ? "justify-end" : "justify-start"} animate-pulse`}
        >
          <div
            className={`h-12 ${item.width} rounded-2xl ${
              item.align === "end"
                ? "bg-primary/20 rounded-br-xs"
                : "bg-secondary/70 border border-border/50 rounded-bl-xs"
            }`}
          />
        </div>
      ))}
    </div>
  );
}
export default MessagesLoadingSkeleton;
