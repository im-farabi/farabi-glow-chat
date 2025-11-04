import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
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
    mode: 'chat' | 'webSearch' | 'reasoning' | 'imageGen',
    image?: File
  ) => {
    if (!message.trim() && !image) return;

    let imagePreview: string | undefined;
    if (image) {
      imagePreview = URL.createObjectURL(image);
    }

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: message,
      image: imagePreview
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
          response = await sendWebSearch(message, image);
          break;
        case 'reasoning':
          response = await sendReasoning(message, image);
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
          response = await sendChat(message, image);
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
        currentChat.title = generateTitle(message);
      }

      // Save to storage
      currentChat.messages = finalMessages;
      currentChat.timestamp = Date.now();
      saveChat(currentChat);

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      
      // Remove loading message on error
      setMessages(newMessages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          currentChatId={currentChat.id}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        
        <ChatArea
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default Index;
