import React from 'react';
import { Message, Sender } from '../types';
import { FileText, Bot, User, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.sender === Sender.Bot;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (message.outputContent) {
      navigator.clipboard.writeText(message.outputContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`flex w-full mb-6 ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isBot ? 'bg-blue-100 text-blue-600 mr-3' : 'bg-gray-200 text-gray-600 ml-3'}`}>
          {isBot ? <Bot size={20} /> : <User size={20} />}
        </div>

        {/* Message Bubble */}
        <div className={`relative px-5 py-4 rounded-2xl text-sm md:text-base shadow-sm ${
          isBot 
            ? 'bg-white border border-gray-100 text-gray-800 rounded-tl-none' 
            : 'bg-blue-600 text-white rounded-tr-none'
        }`}>
          
          {/* Normal Text */}
          {message.type === 'text' && (
            <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
          )}

          {/* File Info */}
          {message.type === 'file_info' && (
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded">
                <FileText size={24} />
              </div>
              <div>
                <p className="font-semibold">Đã nhận file</p>
                <p className="text-xs opacity-90 truncate max-w-[200px]">{message.fileName}</p>
              </div>
            </div>
          )}

          {/* Output Display */}
          {message.type === 'output' && message.outputContent && (
            <div className="w-full">
              <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                <span className="font-bold text-gray-700">Kết quả (Result)</span>
                <button 
                  onClick={handleCopy}
                  className="p-1.5 hover:bg-gray-100 rounded text-gray-500 transition-colors flex items-center gap-1 text-xs"
                  title="Copy result"
                >
                  {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto max-h-[500px] overflow-y-auto">
                {message.outputContent}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
