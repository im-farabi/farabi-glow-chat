import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import Footer from '@/components/Footer';
import TTSPlayer from '@/components/TTSPlayer';
import { sendChat, sendWebSearch, sendReasoning, generateImage } from '@/lib/api';
import { 
  createNewChat, 
  saveChat, 
  getChat, 
  generateTitle,
  type ChatSession 
} from '@/lib/storage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  imageBlob?: Blob;
  isLoading?: boolean;
  loadingText?: string;
}

const Index = () => {
  const [currentChat, setCurrentChat] = useState<ChatSession>(createNewChat());
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [ttsText, setTtsText] = useState<string | null>(null);

  // Swipe gesture to open sidebar
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchStartX - touchEndX;
      const deltaY = Math.abs(touchStartY - touchEndY);
      
      // Swipe left detected (and mostly horizontal)
      if (deltaX > 50 && deltaY < 50) {
        setIsSidebarOpen(true);
      }
    };
    
    const chatArea = document.querySelector('.chat-main-area');
    if (chatArea) {
      chatArea.addEventListener('touchstart', handleTouchStart);
      chatArea.addEventListener('touchend', handleTouchEnd);
    }
    
    return () => {
      if (chatArea) {
        chatArea.removeEventListener('touchstart', handleTouchStart);
        chatArea.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, []);

  const handleNewChat = () => {
    const newChat = createNewChat();
    setCurrentChat(newChat);
    setMessages([]);
  };

  const handleSelectChat = (chatId: string) => {
    const chat = getChat(chatId);
    if (chat) {
      setCurrentChat(chat);
      setMessages(chat.messages);
    }
  };

  const getLoadingText = (mode: 'chat' | 'webSearch' | 'reasoning' | 'imageGen'): string => {
    switch (mode) {
      case 'webSearch':
        return 'Searching the Web';
      case 'reasoning':
        return 'Reasoning';
      case 'imageGen':
        return 'Generating Image';
      default:
        return 'Thinking...';
    }
  };

  const handleSendMessage = async (
    message: string, 
    mode: 'chat' | 'webSearch' | 'reasoning' | 'imageGen'
  ) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: message
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    // Add loading message
    const loadingMessage: Message = {
      role: 'assistant',
      content: '',
      isLoading: true,
      loadingText: getLoadingText(mode)
    };
    setMessages([...newMessages, loadingMessage]);

    try {
      let response: string;
      let generatedImageUrl: string | undefined;
      let generatedImageBlob: Blob | undefined;

      switch (mode) {
        case 'webSearch':
          response = await sendWebSearch(message, messages);
          break;
        case 'reasoning':
          response = await sendReasoning(message, messages);
          break;
      case 'imageGen':
        const { imageUrl, imageBlob } = await generateImage(message, (status) => {
          setMessages(prev => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg?.isLoading) {
              lastMsg.loadingText = status;
            }
            return updated;
          });
        });
        generatedImageUrl = imageUrl;
        generatedImageBlob = imageBlob;
        response = 'Successfully created image. Click here to download';
        break;
        default:
          response = await sendChat(message, messages);
      }

      // Replace loading message with actual response
    const assistantMessage: Message = {
      role: 'assistant',
      content: response,
      image: generatedImageUrl,
      imageBlob: generatedImageBlob
    };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      // Update chat title if this is the first message
      if (currentChat.messages.length === 0 && message.trim()) {
        currentChat.title = await generateTitle(message);
      }

      // Save to storage
      currentChat.messages = finalMessages;
      currentChat.timestamp = Date.now();
      saveChat(currentChat);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show specific error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('Content filtered')) {
        toast.error('Message was filtered by content policy. Please rephrase and try again.');
      } else if (errorMessage.includes('All AI models')) {
        toast.error('All AI models are currently unavailable. Please try again later.');
      } else {
        toast.error('Failed to send message. Please try again.');
      }
      
      // Remove loading message on error
      setMessages(newMessages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {ttsText && (
        <TTSPlayer 
          text={ttsText} 
          onClose={() => setTtsText(null)} 
        />
      )}
      
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          currentChatId={currentChat.id}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        
        <div className="flex flex-col flex-1 chat-main-area">
          <ChatArea
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onRead={(text) => setTtsText(text)}
          />
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Index;
