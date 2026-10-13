import mongoose from "mongoose";

const messageschema = new mongoose.Schema(
    {
        SenderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        ReceiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
        },
        image: {
            type: String,
        },
        isDelivered: {
            type: Boolean,
            default: true,
        },
        isSeen: {
            type: Boolean,
            default: false,
        },
        seenAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

const Message = mongoose.model("Message", messageschema);
export default Message;
