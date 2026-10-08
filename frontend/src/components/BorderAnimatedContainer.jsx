// How to make animated gradient border 👇
// https://cruip-tutorials.vercel.app/animated-gradient-border/
function BorderAnimatedContainer({ children }) {
  return (
    <div className="w-full h-full relative rounded-2xl flex overflow-hidden">
      <div className="absolute inset-0 bg-[conic-gradient(from_var(--border-angle),theme(colors.base-300/.48)_80%,theme(colors.primary)_86%,theme(colors.secondary)_90%,theme(colors.primary)_94%,theme(colors.base-300/.48))] animate-border" />
      <div className="absolute inset-[1px] bg-base-200 rounded-2xl" />
      <div className="relative z-10 w-full h-full flex">
        {children}
      </div>
    </div>
  );
}
export default BorderAnimatedContainer;
