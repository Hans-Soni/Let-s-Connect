// How to make animated gradient border 👇
// https://cruip-tutorials.vercel.app/animated-gradient-border/
function BorderAnimatedContainer({ children }) {
  return (
    <div className="w-full h-full min-h-fit relative rounded-none md:rounded-2xl flex flex-col md:flex-row overflow-hidden shadow-2xl">
      <div className="hidden md:block absolute inset-0 bg-[conic-gradient(from_var(--border-angle),theme(colors.base-300/.48)_80%,theme(colors.primary)_86%,theme(colors.secondary)_90%,theme(colors.primary)_94%,theme(colors.base-300/.48))] animate-border" />
      <div className="absolute inset-0 md:inset-[1px] bg-base-200 rounded-none md:rounded-2xl" />
      <div className="relative z-10 w-full h-full min-h-fit flex flex-col md:flex-row overflow-hidden">
        {children}
      </div>
    </div>
  );
}
export default BorderAnimatedContainer;
