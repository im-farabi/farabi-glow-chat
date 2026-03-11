import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import TTSPlayer from '@/components/TTSPlayer';
import AdvancedTTSPlayer from '@/components/AdvancedTTSPlayer';
import PremiumBackground from '@/components/PremiumBackground';
import { sendFast, sendNormal, sendSuper, sendCoder, sendThink, generateImage, sendGiyaat, sendGPT52, sendStep } from '@/lib/api';
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
  mcqData?: { question: string; options: string[]; correctAnswer: number }[];
  flashcardData?: { question: string; answer: string }[];
  audioUrl?: string;
  audioBlob?: Blob;
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
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [messageSuggestions, setMessageSuggestions] = useState<Map<number, string[]>>(new Map());
  
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
      } else {
        // Invalid chat ID, redirect to home
        navigate('/', { replace: true });
      }
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
      
      // Swipe right detected (and mostly horizontal) - open sidebar
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
    setAiMessageCount(0);
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

  const generateSuggestions = async (messageIndex: number, aiResponse: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-suggestions', {
        body: { aiResponse }
      });

      if (error) throw error;

      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setMessageSuggestions(prev => {
          const updated = new Map(prev);
          updated.set(messageIndex, data.suggestions);
          return updated;
        });
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      // Silently fail - suggestions are optional
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion, currentMode);
  };

  const handleSendMessage = async (
    message: string, 
    mode: 'chat' | 'fast' | 'normal' | 'super' | 'imageGen' | 'coder' | 'think' | 'giyaatFast' | 'giyaatMid' | 'giyaatLarge' | 'gpt52' | 'step',
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
    if (mode === 'fast' || mode === 'normal' || mode === 'super' || mode === 'coder') {
      setCurrentMode(mode as 'fast' | 'normal' | 'super');
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
    let updateInterval: ReturnType<typeof setTimeout> | null = null;
    if (mode !== 'imageGen') {
      const giyaatStages = [
        { time: 500, text: 'Connecting to GIYAAT...' },
        { time: 1500, text: 'Processing with GIYAAT AI...' },
        { time: Infinity, text: 'Generating response...' }
      ];

      const gpt52Stages = [
        { time: 500, text: 'Connecting to GPT-5.2...' },
        { time: 1500, text: 'Processing with GPT-5.2...' },
        { time: 3000, text: 'Generating response...' },
        { time: Infinity, text: 'Thinking deeply...' }
      ];
      
      const stages = mode === 'fast' 
        ? [{ time: 500, text: 'Sending...' }, { time: 1000, text: 'Reading Instructions...' }, { time: 1500, text: 'Searching Web...' }, { time: Infinity, text: 'Thinking...' }]
        : mode === 'normal'
        ? [{ time: 500, text: 'Sending...' }, { time: 1500, text: 'Reading Instructions...' }, { time: 2000, text: 'Searching Web...' }, { time: Infinity, text: 'Thinking...' }]
        : mode === 'coder'
        ? [{ time: 500, text: 'Sending...' }, { time: 1000, text: 'Reading Instructions...' }, { time: 1500, text: 'Analyzing Code Requirements...' }, { time: Infinity, text: 'Generating Code...' }]
        : mode === 'think'
        ? [{ time: 500, text: 'Sending...' }, { time: 1000, text: 'Deep Reasoning...' }, { time: 2000, text: 'Analyzing Multiple Angles...' }, { time: Infinity, text: image ? 'Analyzing image deeply...' : 'Thinking critically...' }]
        : mode === 'gpt52'
        ? gpt52Stages
        : mode === 'step'
        ? [{ time: 500, text: 'Connecting to Step 3.5...' }, { time: 1500, text: 'Processing with Step Flash...' }, { time: Infinity, text: 'Generating response...' }]
        : mode.startsWith('giyaat')
        ? giyaatStages
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
        case 'coder':
          response = await sendCoder(message, messages, image);
          break;
        case 'think':
          response = await sendThink(message, messages, image);
          break;
        case 'giyaatFast':
          response = await sendGiyaat(message, 'fast');
          break;
        case 'giyaatMid':
          response = await sendGiyaat(message, 'mid');
          break;
        case 'giyaatLarge':
          response = await sendGiyaat(message, 'large');
          break;
        case 'step':
          response = await sendStep(message, messages, image);
          break;
        case 'gpt52':
          response = await sendGPT52(message, messages, (chunk) => {
            setMessages(prev => {
              const updated = [...prev];
              const lastIndex = updated.length - 1;
              const lastMsg = updated[lastIndex];
              if (lastMsg) {
                // Create NEW object to trigger React re-render
                updated[lastIndex] = {
                  ...lastMsg,
                  isLoading: false,
                  content: (lastMsg.content || '') + chunk
                };
              }
              return updated;
            });
          });
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

      // Check for {mcq:topic} syntax
      const mcqRegex = /\{mcq:(.+?)\}$/;
      const mcqMatch = response.match(mcqRegex);

      // Check for {flashcard:topic} syntax
      const flashcardRegex = /\{flashcard:(.+?)\}$/;
      const flashcardMatch = response.match(flashcardRegex);

      // Check for {voice:text} syntax
      const voiceRegex = /\{voice:(.+?)\}$/;
      const voiceMatch = response.match(voiceRegex);

      let mcqData: { question: string; options: string[]; correctAnswer: number }[] | undefined;
      let flashcardData: { question: string; answer: string }[] | undefined;
      let audioUrl: string | undefined;
      let audioBlob: Blob | undefined;

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

      if (mcqMatch) {
        const topic = mcqMatch[1].trim();
        const cleanedResponse = response.replace(mcqRegex, '').trim();
        
        setMessages(prev => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg?.isLoading) {
            lastMsg.loadingText = 'Generating MCQ Quiz...';
          }
          return updated;
        });
        
        try {
          const mcqPrompt = `Generate exactly 5 multiple choice questions about: "${topic}"
    
Difficulty Level: Medium

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON - NO markdown, NO backticks, NO explanatory text
2. Do NOT add phrases like "Here are the questions" or "Hope this helps"
3. Do NOT wrap in code blocks or use \`\`\`json
4. Return the raw JSON array directly

Format: [{"question":"...","options":["A","B","C","D"],"correctAnswer":0}]`;
          
          const mcqResponse = await sendNormal(mcqPrompt);
          const cleanJson = mcqResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          mcqData = JSON.parse(cleanJson);
          response = cleanedResponse;
        } catch (error) {
          console.error('Failed to generate MCQ:', error);
          response = cleanedResponse;
        }
      }

      if (flashcardMatch) {
        const topic = flashcardMatch[1].trim();
        const cleanedResponse = response.replace(flashcardRegex, '').trim();
        
        setMessages(prev => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg?.isLoading) {
            lastMsg.loadingText = 'Generating Flashcards...';
          }
          return updated;
        });
        
        try {
          const flashcardPrompt = `Generate exactly 4 educational flashcards about: "${topic}"

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON - NO markdown, NO backticks, NO explanatory text
2. Do NOT add phrases like "Here are the flashcards" or "Hope this helps"
3. Do NOT wrap in code blocks or use \`\`\`json
4. Return the raw JSON array directly

Format: [{"question":"...","answer":"..."}]`;
          
          const flashcardResponse = await sendNormal(flashcardPrompt);
          const cleanJson = flashcardResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          flashcardData = JSON.parse(cleanJson);
          response = cleanedResponse;
        } catch (error) {
          console.error('Failed to generate flashcards:', error);
          response = cleanedResponse;
        }
      }

      if (voiceMatch) {
        const textToSpeak = voiceMatch[1].trim();
        const cleanedResponse = response.replace(voiceRegex, '').trim();
        
        setMessages(prev => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg?.isLoading) {
            lastMsg.loadingText = 'Generating Voice...';
          }
          return updated;
        });
        
        try {
          const { data, error } = await supabase.functions.invoke('pollinations-tts', {
            body: {
              text: textToSpeak,
              voice: 'nova',
              model: 'openai-audio'
            }
          });
          
          if (!error && data) {
            const blob = new Blob([data], { type: 'audio/mpeg' });
            audioUrl = URL.createObjectURL(blob);
            audioBlob = blob;
          }
          response = cleanedResponse;
        } catch (error) {
          console.error('Failed to generate voice:', error);
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
      responseTime: responseTime,
      mcqData,
      flashcardData,
      audioUrl,
      audioBlob
    };

      // Check for coding keywords and suggest Coder mode
      const codingKeywords = ['program', 'code', 'coding', 'javascript', 'python', 'website', 'html', 'css', 'react', 'function', 'variable', 'array', 'object', 'class', 'method', 'api', 'database', 'sql', 'nodejs', 'typescript', 'java', 'c++', 'php', 'ruby', 'swift', 'kotlin'];
      const messageContainsCoding = codingKeywords.some(keyword => 
        message.toLowerCase().includes(keyword.toLowerCase())
      );

      if (messageContainsCoding && mode !== 'coder') {
        assistantMessage.content += '\n\n💡 **Tip:** Choose **Coder** in the Toolbox to generate optimized code!';
      }

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      // Generate suggestions for this assistant message
      const messageIndex = finalMessages.length - 1;
      generateSuggestions(messageIndex, response);

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

      // Update AI message count
      const newAiCount = aiMessageCount + 1;
      setAiMessageCount(newAiCount);

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
      
      // Specific error messages based on mode
      let errorTitle = 'Failed to send message';
      let errorDescription = 'An error occurred. Please try again later.';
      
      if (mode.startsWith('giyaat')) {
        errorTitle = 'GIYAAT Error';
        if (error instanceof Error) {
          if (error.message.includes('timeout') || error.message.includes('timed out')) {
            errorDescription = 'GIYAAT is taking too long to respond. Try a shorter prompt or different mode.';
          } else if (error.message.includes('connection') || error.message.includes('reach')) {
            errorDescription = 'Could not reach GIYAAT server. The service may be temporarily unavailable.';
          } else {
            errorDescription = error.message;
          }
        }
      } else {
        errorDescription = `Possible reasons:
1. Server / API is Down
2. Prompt is Inappropriate
Check other services and try again. Contact support@farabi.me if issue persists.`;
      }
      
      toast.error(errorTitle, {
        description: errorDescription,
        duration: 6000,
      });
      
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
    <>
      <PremiumBackground />
      <div className="flex h-screen flex-col bg-transparent relative" style={{ height: '100dvh' }}>
        {/* Content Overlay */}
        <div className="relative z-10 flex h-full flex-col">
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
            onExplain={handleExplain}
            messageSuggestions={messageSuggestions}
            onSuggestionClick={handleSuggestionClick}
          />
        </div>
      </div>
      </div>
      </div>
    </>
  );
};

export default Index;
