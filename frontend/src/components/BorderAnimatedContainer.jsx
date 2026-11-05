function BorderAnimatedContainer({ children }) {
  return (
    <div className="w-full h-full relative rounded-none md:rounded-3xl flex flex-col md:flex-row overflow-hidden border border-border/70 bg-card/85 shadow-glow backdrop-blur-2xl">
      {/* Animated Subtle Conic Edge Glow on Desktop */}
      <div className="pointer-events-none hidden md:block absolute -inset-px rounded-3xl bg-[conic-gradient(from_var(--border-angle),transparent_75%,var(--primary)_86%,var(--primary-glow)_92%,var(--primary)_96%,transparent_100%)] opacity-35 animate-border" />
      <div className="relative z-10 w-full h-full flex flex-col md:flex-row overflow-hidden bg-card/75 backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}
export default BorderAnimatedContainer;
