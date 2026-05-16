import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Paperclip, FileBox, Loader2, CheckCheck, Check, User, X, Download, Upload } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useAuthStore } from '@/store/authStore';
import { getAccessToken } from '@/lib/auth';
import { CaseMessage } from '@/types';
import { format, isToday, isYesterday } from 'date-fns';
import { it, enUS, fr, he, Locale } from 'date-fns/locale';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ChatWindowProps {
  caseId: string;
  caseName?: string;
}

interface SelectedFile {
  file: File;
  preview?: string;
  isImage: boolean;
}

const locales: Record<string, Locale> = {
  it,
  en: enUS,
  fr,
  he,
};

export function ChatWindow({ caseId, caseName }: ChatWindowProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const { messages, isLoading, isConnected, sendMessage, markAsRead } = useChat({ caseId });
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const locale = locales[i18n.language] || it;

  // Scroll to bottom when new messages arrive (only scroll within the chat container, not the whole page)
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (messages.length > 0) {
      markAsRead();
    }
  }, [messages, markAsRead]);

  // Process a file (used by both file input and drag & drop)
  const processFile = (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'];
    const validExtensions = ['.stl', '.ply'];
    const fileName = file.name.toLowerCase();
    const isValidType = validTypes.includes(file.type) ||
      validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidType) {
      alert(t('chat.unsupportedFileType'));
      return;
    }

    // Validate file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      alert(t('chat.fileSizeExceeded'));
      return;
    }

    const isImage = file.type.startsWith('image/');
    const newSelectedFile: SelectedFile = {
      file,
      isImage,
    };

    // Create preview for images
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        newSelectedFile.preview = e.target?.result as string;
        setSelectedFile({ ...newSelectedFile });
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(newSelectedFile);
    }
  };

  // Handle file selection from input
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag & Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
      e.dataTransfer.clearData();
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  // Upload file to server
  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            resolve(response.id);
          } else {
            reject(new Error('Upload failed'));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));

        xhr.open('POST', `${API_URL}/api/files/upload/${caseId}`);
        xhr.setRequestHeader('Authorization', `Bearer ${getAccessToken()}`);
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !selectedFile) || isSending) return;

    setIsSending(true);
    try {
      let fileId: string | undefined;

      // Upload file if selected
      if (selectedFile) {
        const uploadedFileId = await uploadFile(selectedFile.file);
        if (uploadedFileId) {
          fileId = uploadedFileId;
        }
      }

      // Send message with optional fileId
      const messageText = newMessage.trim() || (selectedFile ? `📎 ${selectedFile.file.name}` : '');
      await sendMessage({ messageText, fileId });

      setNewMessage('');
      setSelectedFile(null);
      setUploadProgress(0);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    }
    if (isYesterday(date)) {
      return `${t('chat.yesterday')} ${format(date, 'HH:mm')}`;
    }
    return format(date, 'dd/MM HH:mm');
  };

  const groupMessagesByDate = (msgs: CaseMessage[]) => {
    const groups: { date: string; messages: CaseMessage[] }[] = [];
    let currentDate = '';

    msgs.forEach((msg) => {
      const msgDate = format(new Date(msg.createdAt), 'yyyy-MM-dd');
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return t('chat.today');
    if (isYesterday(date)) return t('chat.yesterday');
    return format(date, 'dd MMMM yyyy', { locale });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileExtension = (fileName: string) => {
    return fileName.split('.').pop()?.toUpperCase() || 'FILE';
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div
      className="flex flex-col h-full bg-white rounded-2xl shadow-soft overflow-hidden relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-brand-primary/90 flex flex-col items-center justify-center rounded-2xl">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-4 animate-pulse">
            <Upload size={40} className="text-white" />
          </div>
          <p className="text-white text-lg font-semibold">{t('chat.dropFileHere')}</p>
          <p className="text-white/70 text-sm mt-1">{t('chat.supportedFileTypesShort')}</p>
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-100 bg-surface-secondary/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-neutral-800">{t('chat.caseChat')}</h3>
            {caseName && (
              <p className="text-xs text-neutral-500">{caseName}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-neutral-300'
              }`}
            />
            <span className="text-xs text-neutral-500">
              {isConnected ? t('chat.online') : t('chat.offline')}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-400">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
              <Send size={24} className="text-neutral-300" />
            </div>
            <p className="text-sm">{t('chat.noMessages')}</p>
            <p className="text-xs">{t('chat.startConversation')}</p>
          </div>
        ) : (
          messageGroups.map((group) => (
            <div key={group.date}>
              {/* Date Separator */}
              <div className="flex items-center justify-center my-4">
                <span className="px-3 py-1 bg-white rounded-full text-xs text-neutral-500 shadow-sm">
                  {getDateLabel(group.date)}
                </span>
              </div>

              {/* Messages */}
              <div className="space-y-3">
                {group.messages.map((message) => {
                  const isOwn = message.senderId === user?.id;
                  const isLab = message.sender?.role === 'admin' || message.sender?.role === 'operator';

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`flex items-end gap-2 max-w-[80%] ${
                          isOwn ? 'flex-row-reverse' : ''
                        }`}
                      >
                        {/* Avatar */}
                        {!isOwn && (
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 ${
                              isLab ? 'bg-brand-primary' : 'bg-card-teal'
                            }`}
                          >
                            {message.sender?.name?.charAt(0).toUpperCase() || <User size={14} />}
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div
                          className={`rounded-2xl px-4 py-2.5 ${
                            isOwn
                              ? 'bg-brand-primary text-white rounded-br-md'
                              : 'bg-white shadow-sm rounded-bl-md'
                          }`}
                        >
                          {/* Sender Name (for others) */}
                          {!isOwn && (
                            <p
                              className={`text-xs font-medium mb-1 ${
                                isLab ? 'text-brand-primary' : 'text-card-teal'
                              }`}
                            >
                              {message.sender?.name || t('chat.userLabel')}
                              {isLab && (
                                <span className="ml-1 text-neutral-400 font-normal">
                                  · {t('chat.laboratory')}
                                </span>
                              )}
                            </p>
                          )}

                          {/* Message Text */}
                          <p
                            className={`text-sm whitespace-pre-wrap ${
                              isOwn ? 'text-white' : 'text-neutral-700'
                            }`}
                          >
                            {message.messageText}
                          </p>

                          {/* File attachment */}
                          {message.fileId && message.file && (
                            <div className="mt-2">
                              {message.file.fileType === 'image' ? (
                                // Image preview
                                <div className="relative group">
                                  <img
                                    src={`${API_URL}/api/files/${message.file.id}/download`}
                                    alt={message.file.fileName}
                                    className="max-w-[200px] max-h-[150px] rounded-lg object-cover cursor-pointer"
                                    onClick={() => window.open(`${API_URL}/api/files/${message.file!.id}/download`, '_blank')}
                                  />
                                  <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a
                                      href={`${API_URL}/api/files/${message.file.id}/download`}
                                      download={message.file.fileName}
                                      className={`p-1 rounded ${isOwn ? 'bg-black/30' : 'bg-white/80'}`}
                                    >
                                      <Download size={14} />
                                    </a>
                                  </div>
                                </div>
                              ) : (
                                // File preview (STL, PLY, etc.)
                                <a
                                  href={`${API_URL}/api/files/${message.file.id}/download`}
                                  download={message.file.fileName}
                                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                    isOwn
                                      ? 'bg-white/10 hover:bg-white/20'
                                      : 'bg-neutral-50 hover:bg-neutral-100'
                                  }`}
                                >
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    isOwn ? 'bg-white/20' : 'bg-violet-100'
                                  }`}>
                                    <FileBox size={20} className={isOwn ? 'text-white' : 'text-violet-600'} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${isOwn ? 'text-white' : 'text-neutral-700'}`}>
                                      {message.file.fileName}
                                    </p>
                                    <p className={`text-xs ${isOwn ? 'text-white/60' : 'text-neutral-400'}`}>
                                      {getFileExtension(message.file.fileName)} · {formatFileSize(message.file.fileSize)}
                                    </p>
                                  </div>
                                  <Download size={16} className={isOwn ? 'text-white/60' : 'text-neutral-400'} />
                                </a>
                              )}
                            </div>
                          )}

                          {/* Time and Read Status */}
                          <div
                            className={`flex items-center gap-1 mt-1 ${
                              isOwn ? 'justify-end' : ''
                            }`}
                          >
                            <span
                              className={`text-[10px] ${
                                isOwn ? 'text-white/70' : 'text-neutral-400'
                              }`}
                            >
                              {formatMessageDate(message.createdAt)}
                            </span>
                            {isOwn && (
                              <span className="text-white/70">
                                {message.isRead ? (
                                  <CheckCheck size={12} />
                                ) : (
                                  <Check size={12} />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-neutral-100 bg-white">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept="image/*,.stl,.ply"
          className="hidden"
        />

        {/* File Preview */}
        {selectedFile && (
          <div className="mb-3 p-3 bg-neutral-50 rounded-xl">
            <div className="flex items-center gap-3">
              {selectedFile.isImage && selectedFile.preview ? (
                <img
                  src={selectedFile.preview}
                  alt="Preview"
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-violet-100 flex items-center justify-center">
                  <FileBox size={24} className="text-violet-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-700 truncate">
                  {selectedFile.file.name}
                </p>
                <p className="text-xs text-neutral-400">
                  {formatFileSize(selectedFile.file.size)}
                </p>
                {/* Upload progress */}
                {isSending && uploadProgress > 0 && (
                  <div className="mt-2 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                disabled={isSending}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors disabled:opacity-50"
            title={t('chat.attachTooltip')}
          >
            <Paperclip size={20} />
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedFile ? t('chat.addMessage') : t('chat.typeMessage')}
              rows={1}
              disabled={isSending}
              className="w-full px-4 py-2.5 bg-neutral-100 rounded-2xl resize-none text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:bg-white
                       placeholder:text-neutral-400 max-h-32 disabled:opacity-50"
              style={{
                minHeight: '44px',
                height: 'auto',
              }}
            />
          </div>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={(!newMessage.trim() && !selectedFile) || isSending}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              (newMessage.trim() || selectedFile) && !isSending
                ? 'bg-brand-primary text-white hover:bg-brand-primary/90'
                : 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
            }`}
          >
            {isSending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>

        {/* Upload hint */}
        <div className="h-4 mt-1 text-[10px] text-neutral-400">
          {selectedFile ? (
            <span>{t('chat.pressToSend')}</span>
          ) : (
            <span>{t('chat.supportedFormatsInfo')}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
