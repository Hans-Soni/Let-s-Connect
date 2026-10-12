import { useRef, useState } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import { ImageIcon, SendIcon, XIcon } from "lucide-react";

function MessageInput() {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const fileInputRef = useRef(null);

  const { sendMessage, isSoundEnabled } = useChatStore();

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (isSoundEnabled) playRandomKeyStrokeSound();

    sendMessage({
      text: text.trim(),
      image: imagePreview,
    });
    setText("");
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="p-2.5 sm:p-4 border-t border-base-100/50 bg-base-200/80 backdrop-blur-md shrink-0 w-full">
      {imagePreview && (
        <div className="max-w-3xl mx-auto mb-2 sm:mb-3 flex items-center">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="size-16 sm:size-20 object-cover rounded-xl border border-base-100 shadow-sm"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 size-6 rounded-full bg-base-300 border border-base-content/20 flex items-center justify-center text-base-content hover:bg-base-100 shadow-sm"
              type="button"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex items-center gap-1.5 sm:gap-2">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`btn btn-ghost btn-circle btn-sm sm:btn-md shrink-0 text-base-content/70 hover:text-base-content ${
            imagePreview ? "text-primary" : ""
          }`}
          title="Attach image"
        >
          <ImageIcon className="size-5" />
        </button>

        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            isSoundEnabled && playRandomKeyStrokeSound();
          }}
          className="flex-1 bg-base-100 border border-base-content/15 rounded-full py-2.5 px-4 text-sm sm:text-base text-base-content placeholder-base-content/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all shadow-inner"
          placeholder="Type a message..."
        />

        <button
          type="submit"
          disabled={!text.trim() && !imagePreview}
          className="btn btn-primary btn-circle btn-sm sm:btn-md shrink-0 text-white shadow-md disabled:opacity-40 transition-transform active:scale-95"
          title="Send message"
        >
          <SendIcon className="size-4 sm:size-5" />
        </button>
      </form>
    </div>
  );
}
export default MessageInput;
