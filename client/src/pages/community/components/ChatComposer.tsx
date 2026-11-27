import React, { type ChangeEvent, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Megaphone, X, RefreshCw, Image as ImageIcon } from 'lucide-react';
import type { User } from '../../../types';
import type { ChatMessage } from '../types';

interface ChatComposerProps {
    activeChannel: string;
    user: User | null | undefined;
    newMessage: string;
    setNewMessage: (val: string) => void;
    replyingTo: ChatMessage | null;
    setReplyingTo: (val: ChatMessage | null) => void;
    chatImage: File | null;
    chatImagePreview: string | null;
    isUploadingImage: boolean;
    onImageSelect: (e: ChangeEvent<HTMLInputElement>) => void;
    onClearImage: () => void;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

const ChatComposer: React.FC<ChatComposerProps> = ({
    activeChannel,
    user,
    newMessage,
    setNewMessage,
    replyingTo,
    setReplyingTo,
    chatImage,
    chatImagePreview,
    isUploadingImage,
    onImageSelect,
    onClearImage,
    onSubmit
}) => {
    return (
        <div className="p-4 bg-white border-t border-border/50 shrink-0">
            {user ? (
                activeChannel === 'announcements' && user.role !== 'Authority' ? (
                    <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 font-bold text-sm">
                        <Megaphone size={16} className="inline-block mr-2 text-slate-400" />
                        This channel is read-only for official announcements.
                    </div>
                ) : (
                    <form onSubmit={onSubmit} className="relative flex flex-col">
                        <AnimatePresence>
                            {replyingTo && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: 10, height: 0 }}
                                    className="bg-surface rounded-t-xl px-4 py-2 flex items-center justify-between text-xs text-text/60 border-t border-l border-r border-border/50"
                                >
                                    <div className="flex items-center gap-2">
                                        <MessageSquare size={12} />
                                        <span>Replying to <strong>{replyingTo.sender}</strong></span>
                                    </div>
                                    <button type="button" onClick={() => setReplyingTo(null)} className="hover:text-red-500">
                                        <X size={14} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {chatImagePreview && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: 10, height: 0 }}
                                    className={`bg-surface px-4 py-3 flex items-start gap-3 border-t border-l border-r border-border/50 ${replyingTo ? '' : 'rounded-t-xl'}`}
                                >
                                    <div className="relative">
                                        <img src={chatImagePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-slate-200 shadow-sm" />
                                        <button
                                            type="button"
                                            onClick={onClearImage}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="relative flex items-center">
                            <div className="absolute left-2 z-10">
                                <label className={`p-2 rounded-lg cursor-pointer transition-colors ${chatImage ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
                                    <ImageIcon size={20} />
                                    <input type="file" accept="image/*" onChange={onImageSelect} className="hidden" />
                                </label>
                            </div>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={`Message #${activeChannel}...`}
                                className={`w-full bg-slate-50/80 backdrop-blur-md border border-slate-200 pl-12 pr-14 py-4 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white transition-all text-sm shadow-inner ${(replyingTo || chatImagePreview) ? 'rounded-b-2xl border-t-0' : 'rounded-2xl'}`}
                            />
                            <button
                                type="submit"
                                disabled={(!newMessage.trim() && !chatImage) || isUploadingImage}
                                className="absolute right-2 p-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-primary flex items-center justify-center min-w-[36px] min-h-[36px]"
                            >
                                {isUploadingImage ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                            </button>
                        </div>
                    </form>
                )
            ) : (
                <div className="text-center py-3 text-sm text-text/50 border border-border/50 rounded-xl bg-surface">
                    Please <span className="font-bold text-primary">log in</span> to chat in this channel.
                </div>
            )}
        </div>
    );
};

export default ChatComposer;
