import { toast } from "react-hot-toast";

export const showInAppNotification = ({
  sender,
  senderName,
  senderPic,
  messageSnippet,
  id,
  onSelect,
}) => {
  toast.custom(
    (t) => (
      <div
        onClick={() => {
          if (onSelect) onSelect(sender);
          toast.dismiss(t.id);
        }}
        className={`${
          t.visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        } max-w-sm w-full bg-base-100/95 backdrop-blur-md shadow-2xl rounded-2xl pointer-events-auto flex items-center p-3 cursor-pointer hover:bg-base-200 transition-all border border-primary/40 gap-3 z-50`}
      >
        <div className="avatar online shrink-0">
          <div className="size-11 rounded-full ring-2 ring-primary/40">
            <img src={senderPic} alt={senderName} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-base-content truncate">{senderName}</p>
            <span className="text-[10px] text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded-full">New</span>
          </div>
          <p className="text-xs text-base-content/70 truncate mt-0.5">{messageSnippet}</p>
        </div>
      </div>
    ),
    { duration: 4500, id }
  );
};
