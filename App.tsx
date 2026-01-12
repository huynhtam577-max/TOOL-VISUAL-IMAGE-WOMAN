import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, RefreshCw, Loader2 } from 'lucide-react';
import { Message, Sender, AppStep } from './types';
import { ChatMessage } from './components/ChatMessage';
import { generateVisualPrompt } from './services/geminiService';

const INITIAL_MESSAGE: Message = {
  id: 'init-1',
  sender: Sender.Bot,
  text: 'Chào bạn! Hãy úp hoặc dán cho tôi file "Script Nội Dung" (Không chứa tiêu đề) của bạn.',
  type: 'text'
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [step, setStep] = useState<AppStep>(AppStep.AskScript);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Data stores
  const [scriptContent, setScriptContent] = useState<string>('');
  const [templateContent, setTemplateContent] = useState<string>('');
  const [themeTitle, setThemeTitle] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (sender: Sender, text: string, type: Message['type'] = 'text', fileName?: string, outputContent?: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender,
      text,
      type,
      fileName,
      outputContent
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      handleInput(content, file.name);
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  const handleInput = async (content: string, fileName?: string) => {
    if (!content.trim()) return;

    // 1. Display User Message
    if (fileName) {
      addMessage(Sender.User, '', 'file_info', fileName);
    } else {
      addMessage(Sender.User, content, 'text');
    }

    setInputText('');
    setIsLoading(true);

    // 2. State Machine Logic
    try {
      if (step === AppStep.AskScript) {
        setScriptContent(content);
        setStep(AppStep.AskTemplate);
        setTimeout(() => {
          addMessage(Sender.Bot, 'Ok. Tiếp theo hãy úp hoặc dán file "Prompt Visual Image" cho tôi.');
          setIsLoading(false);
        }, 600);

      } else if (step === AppStep.AskTemplate) {
        setTemplateContent(content);
        setStep(AppStep.AskTheme);
        setTimeout(() => {
          addMessage(Sender.Bot, 'Ok. Tiếp theo hãy cho tôi biết tiêu đề "YYYYYYYYYY" để tôi điền vào phần [Theme: YYYYYYYYYY ] section trong "Prompt Visual Image".');
          setIsLoading(false);
        }, 600);

      } else if (step === AppStep.AskTheme) {
        const theme = content.trim();
        setThemeTitle(theme);
        setStep(AppStep.Processing);

        addMessage(Sender.Bot, `Ok, cảm ơn bạn, tôi đã nhận đủ "Script Nội Dung" và "Prompt Visual Image" và tiêu đề "${theme}". Bây giờ tôi sẽ tiến hành tạo PROMPT ẢNH & SOURCE CONTEXT...`);

        // Perform Generation
        const result = await generateVisualPrompt(scriptContent, templateContent, theme);
        
        addMessage(Sender.Bot, 'Dưới đây là kết quả của bạn:', 'output', undefined, result);
        setStep(AppStep.Finished);
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      addMessage(Sender.Bot, 'Đã xảy ra lỗi khi xử lý. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    handleInput(inputText);
  };

  const resetApp = () => {
    setMessages([INITIAL_MESSAGE]);
    setStep(AppStep.AskScript);
    setScriptContent('');
    setTemplateContent('');
    setThemeTitle('');
    setInputText('');
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            P
          </div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Prompt Visual Generator</h1>
        </div>
        {step === AppStep.Finished && (
          <button 
            onClick={resetApp}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            Bắt đầu lại
          </button>
        )}
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
        <div className="max-w-3xl mx-auto">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          
          {isLoading && (
            <div className="flex w-full mb-6 justify-start">
              <div className="flex items-center space-x-2 bg-white px-5 py-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                 <Loader2 className="animate-spin text-blue-600" size={20} />
                 <span className="text-gray-500 text-sm">Đang xử lý...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-gray-200 p-4 md:p-6 sticky bottom-0 z-10">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSendText} className="relative flex items-end gap-3 bg-white p-2 rounded-2xl border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all shadow-sm">
            
            {/* File Upload Button (Only for first two steps) */}
            {step !== AppStep.AskTheme && step !== AppStep.Finished && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.md"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="p-3 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                  title="Upload file text"
                >
                  <Paperclip size={20} />
                </button>
              </>
            )}

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (inputText.trim()) handleSendText(e);
                }
              }}
              placeholder={
                step === AppStep.AskScript ? "Dán nội dung script của bạn..." :
                step === AppStep.AskTemplate ? "Dán nội dung mẫu Prompt Visual..." :
                step === AppStep.AskTheme ? "Nhập tiêu đề (Theme)..." :
                "Hoàn thành."
              }
              disabled={isLoading || step === AppStep.Finished}
              className="flex-1 max-h-32 min-h-[50px] py-3 px-2 bg-transparent border-none focus:ring-0 resize-none outline-none text-gray-800 placeholder:text-gray-400"
              rows={1}
            />

            <button
              type="submit"
              disabled={isLoading || !inputText.trim() || step === AppStep.Finished}
              className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <Send size={20} />
            </button>
          </form>
          <div className="text-center mt-2">
             <p className="text-xs text-gray-400">
               {step === AppStep.AskScript && "Bước 1/3: Nhập Script"}
               {step === AppStep.AskTemplate && "Bước 2/3: Nhập Template"}
               {step === AppStep.AskTheme && "Bước 3/3: Nhập Theme"}
               {step === AppStep.Processing && "Đang tạo nội dung..."}
               {step === AppStep.Finished && "Hoàn tất"}
             </p>
          </div>
        </div>
      </footer>
    </div>
  );
}