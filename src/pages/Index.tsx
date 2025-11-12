import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import TTSPlayer from '@/components/TTSPlayer';
import AdvancedTTSPlayer from '@/components/AdvancedTTSPlayer';
import { sendFast, sendNormal, sendSuper, generateImage } from '@/lib/api';
import { 
  createNewChat, 
  saveChat, 
  getChat, 
  generateTitle,
  getOrCreateAnonymousUserId,
  getSessionId,
  type ChatSession 
} from '@/lib/storage';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  imageBlob?: Blob;
  isLoading?: boolean;
  loadingText?: string;
  responseTime?: number;
}

const Index = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [currentChat, setCurrentChat] = useState<ChatSession>(createNewChat());
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<'fast' | 'normal' | 'super'>('normal');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [ttsText, setTtsText] = useState<string | null>(null);
  const [isAdvancedTTS, setIsAdvancedTTS] = useState(false);
  const [aiMessageCount, setAiMessageCount] = useState(0);
  const [showAdBanner, setShowAdBanner] = useState(false);
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  
  // Track time for cost deduction
  useTimeTracking();

  // Initialize anonymous tracking and track session
  useEffect(() => {
    const anonymousUserId = getOrCreateAnonymousUserId();
    const sessionId = getSessionId();
    
    // Track session start with country detection
    const initSession = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('track-session', {
          body: { 
            anonymousUserId, 
            sessionId, 
            userAgent: navigator.userAgent 
          }
        });
        
        if (data?.countryName) {
          console.log(`Session tracked from: ${data.countryName}`);
        }
      } catch (error) {
        console.error('Session tracking error:', error);
      }
    };
    
    initSession();
    
    // Update activity every 30 seconds
    const activityInterval = setInterval(() => {
      supabase.functions.invoke('update-session-activity', {
        body: { sessionId }
      }).catch(err => console.error('Activity update error:', err));
    }, 30000);
    
    return () => clearInterval(activityInterval);
  }, []);

  // Load chat from URL on mount
  useEffect(() => {
    if (chatId) {
      const chat = getChat(chatId);
      if (chat) {
        setCurrentChat(chat);
        setMessages(chat.messages);
        const aiMsgs = chat.messages.filter(m => m.role === 'assistant').length;
        setAiMessageCount(aiMsgs);
        setShowAdBanner(aiMsgs > 0 && aiMsgs % 2 === 0);
      } else {
        // Invalid chat ID, redirect to /c
        navigate('/c', { replace: true });
      }
    } else {
      // No chatId means we're starting fresh from /c
      setCurrentChat(createNewChat());
      setMessages([]);
      setIsTemporaryChat(true);
    }
  }, [chatId, navigate]);

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
      const deltaX = touchEndX - touchStartX;
      const deltaY = Math.abs(touchStartY - touchEndY);
      
      // Swipe left detected (and mostly horizontal)
      if (deltaX < -50 && deltaY < 50) {
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
    setAiMessageCount(0);
    setShowAdBanner(false);
    navigate(`/c/${newChat.id}`);
    
    if (!isTemporaryChat) {
      saveChat(newChat);
    }
  };

  const handleSelectChat = (selectedChatId: string) => {
    const chat = getChat(selectedChatId);
    if (chat) {
      setCurrentChat(chat);
      setMessages(chat.messages);
      const aiMsgs = chat.messages.filter(m => m.role === 'assistant').length;
      setAiMessageCount(aiMsgs);
      setShowAdBanner(aiMsgs > 0 && aiMsgs % 2 === 0);
      navigate(`/c/${selectedChatId}`);
    }
  };


  const handleRead = (text: string, advanced: boolean = false) => {
    setTtsText(text);
    setIsAdvancedTTS(advanced);
  };

  const handleExplain = (messageContent: string, type: 'shorter' | 'easy' | 'longer') => {
    const suffix = type === 'shorter' 
      ? ' Explain in shorter way' 
      : type === 'easy'
      ? ' Explain in easy way'
      : ' Explain more longer';
    handleSendMessage(messageContent + suffix, currentMode);
  };

  const handleSendMessage = async (
    message: string, 
    mode: 'chat' | 'fast' | 'normal' | 'super' | 'imageGen',
    image?: File
  ) => {
    if (!message.trim() && !image) return;

    // Convert image to preview URL if present
    let imagePreviewUrl: string | undefined;
    if (image) {
      imagePreviewUrl = URL.createObjectURL(image);
    }

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: message || '🖼️ [Image uploaded]',
      image: imagePreviewUrl
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    
    // Log user message to database
    supabase.functions.invoke('log-message', {
      body: {
        anonymousUserId: getOrCreateAnonymousUserId(),
        sessionId: getSessionId(),
        role: 'user',
        content: message || '🖼️ [Image uploaded]',
        mode,
        hasImage: !!image
      }
    }).catch(err => console.error('Message logging error:', err));
    
    // Set mode for loading stages
    if (mode === 'fast' || mode === 'normal' || mode === 'super') {
      setCurrentMode(mode);
    }
    
    setIsLoading(true);

    const startTime = performance.now();

    // Add loading message placeholder
    const loadingMessage: Message = {
      role: 'assistant',
      content: '',
      isLoading: true,
      loadingText: image ? 'Analyzing image...' : mode === 'imageGen' ? 'Generating Image' : 'Sending...'
    };
    setMessages([...newMessages, loadingMessage]);
    
    // Update loading text dynamically for non-imageGen modes
    let updateInterval: NodeJS.Timeout | null = null;
    if (mode !== 'imageGen' && (mode === 'fast' || mode === 'normal' || mode === 'super')) {
      const stages = mode === 'fast' 
        ? [{ time: 500, text: 'Sending...' }, { time: 1000, text: 'Reading Instructions...' }, { time: 1500, text: 'Searching Web...' }, { time: Infinity, text: 'Thinking...' }]
        : mode === 'normal'
        ? [{ time: 500, text: 'Sending...' }, { time: 1500, text: 'Reading Instructions...' }, { time: 2000, text: 'Searching Web...' }, { time: Infinity, text: 'Thinking...' }]
        : [{ time: 500, text: 'Sending...' }, { time: 2000, text: 'Reading Instructions...' }, { time: 2500, text: 'Searching Web...' }, { time: Infinity, text: 'Thinking...' }];
      
      const startTime = Date.now();
      updateInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const currentStage = stages.find(stage => elapsed < stage.time);
        if (currentStage) {
          setMessages(prev => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg?.isLoading) {
              lastMsg.loadingText = currentStage.text;
            }
            return updated;
          });
        }
      }, 100);
    }

    try {
      let response: string;
      let generatedImageUrl: string | undefined;
      let generatedImageBlob: Blob | undefined;

      switch (mode) {
        case 'fast':
          response = await sendFast(message, messages, image);
          break;
        case 'normal':
          response = await sendNormal(message, messages, image);
          break;
        case 'super':
          response = await sendSuper(message, messages, image);
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
          response = await sendNormal(message, messages);
      }

      // Check for {image:prompt} syntax at the end
      const imageRegex = /\{image:(.+?)\}$/;
      const imageMatch = response.match(imageRegex);

      if (imageMatch) {
        // Extract prompt and clean response
        const imagePrompt = imageMatch[1].trim();
        const cleanedResponse = response.replace(imageRegex, '').trim();
        
        // Update loading message for image generation
        setMessages(prev => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg?.isLoading) {
            lastMsg.loadingText = 'Generating Image...';
          }
          return updated;
        });
        
        // Generate image
        try {
          const { imageUrl, imageBlob } = await generateImage(imagePrompt, (status) => {
            setMessages(prev => {
              const updated = [...prev];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg?.isLoading) {
                lastMsg.loadingText = status;
              }
              return updated;
            });
          });
          
          // Update response with cleaned text and generated image
          response = cleanedResponse;
          generatedImageUrl = imageUrl;
          generatedImageBlob = imageBlob;
        } catch (error) {
          console.error('Failed to generate image from AI prompt:', error);
          // Continue with cleaned response even if image fails
          response = cleanedResponse;
        }
      }

      // Replace loading message with actual response
      const endTime = performance.now();
      const responseTime = (endTime - startTime) / 1000;

    const assistantMessage: Message = {
      role: 'assistant',
      content: response,
      image: generatedImageUrl,
      imageBlob: generatedImageBlob,
      responseTime: responseTime
    };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      // Log AI response to database
      supabase.functions.invoke('log-message', {
        body: {
          anonymousUserId: getOrCreateAnonymousUserId(),
          sessionId: getSessionId(),
          role: 'assistant',
          content: response,
          mode,
          hasImage: !!generatedImageUrl
        }
      }).catch(err => console.error('Message logging error:', err));

      // Update AI message count and show banner: first at 3 messages, then every 2 messages
      const newAiCount = aiMessageCount + 1;
      console.log('🎯 AI Response Count:', newAiCount);
      setAiMessageCount(newAiCount);
      if (newAiCount === 3 || (newAiCount > 3 && (newAiCount - 3) % 2 === 0)) {
        console.log('✅ Banner should now appear!');
        setShowAdBanner(true);
      }

      // Update chat title if this is the first message
      if (currentChat.messages.length === 0 && message.trim()) {
        currentChat.title = await generateTitle(message);
      }

      // Save to storage and ensure URL is correct
      currentChat.messages = finalMessages;
      currentChat.timestamp = Date.now();
      
      if (!isTemporaryChat) {
        saveChat(currentChat);
      }
      
      // Update URL if not already set
      if (!chatId || chatId !== currentChat.id) {
        navigate(`/c/${currentChat.id}`, { replace: true });
      }

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
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background relative">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-background via-muted/10 to-accent/5 animate-gradient" />
      
      {/* Content Overlay */}
      <div className="relative z-10 flex h-screen flex-col">
        {ttsText && (
        isAdvancedTTS ? (
          <AdvancedTTSPlayer 
            text={ttsText} 
            onClose={() => {
              setTtsText(null);
              setIsAdvancedTTS(false);
            }} 
          />
        ) : (
          <TTSPlayer 
            text={ttsText} 
            onClose={() => setTtsText(null)} 
          />
        )
      )}
      
      <Header 
        onMenuClick={() => setIsSidebarOpen(true)} 
        isTemporaryChat={isTemporaryChat}
        onToggleTemporaryChat={() => setIsTemporaryChat(!isTemporaryChat)}
      />
      
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
            onRead={handleRead}
            showAdBanner={showAdBanner}
            onCloseAdBanner={() => setShowAdBanner(false)}
            onExplain={handleExplain}
          />
        </div>
      </div>
      </div>
    </div>
  );
};

export default Index;
