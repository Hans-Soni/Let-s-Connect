function BorderAnimatedContainer({ children }) {
  return (
    <div className="w-full h-full relative rounded-none md:rounded-3xl flex flex-col md:flex-row overflow-hidden border border-border bg-card shadow-2xl">
      <div className="relative z-10 w-full h-full flex flex-col md:flex-row overflow-hidden">
        {children}
      </div>
    </div>
  );
}
export default BorderAnimatedContainer;
