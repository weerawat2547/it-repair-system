import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { MessageSquare, Send, Bot, User } from 'lucide-react';
import { ChatMessage } from '../types';

export default function ChatBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      message:
        'สวัสดีครับ! ยินดีต้อนรับสู่ระบบแจ้งซ่อมอุปกรณ์ IT ผมคือบอท LINE OA ที่พร้อมให้ความช่วยเหลือคุณ มีอะไรให้ผมช่วยไหมครับ?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // FAQ responses
    if (lowerMessage.includes('แจ้งซ่อม') || lowerMessage.includes('รายงาน')) {
      return 'คุณสามารถแจ้งซ่อมได้โดยไปที่เมนู "แจ้งซ่อม" แล้วกรอกรายละเอียดอุปกรณ์และปัญหาที่พบครับ ระบบจะสร้างเลขที่คำขอให้คุณทันที';
    }

    if (lowerMessage.includes('สถานะ') || lowerMessage.includes('ตรวจสอบ')) {
      return 'คุณสามารถตรวจสอบสถานะการซ่อมได้ที่เมนู "ตรวจสอบสถานะ" โดยใช้เลขที่คำขอหรือค้นหาจากประเภทอุปกรณ์ครับ';
    }

    if (lowerMessage.includes('ระยะเวลา') || lowerMessage.includes('นานแค่ไหน')) {
      return 'ระยะเวลาในการซ่อมขึ้นอยู่กับความรุนแรงของปัญหาครับ โดยปกติ:\n• ปัญหาเล็กน้อย: 1-2 วัน\n• ปัญหาปานกลาง: 3-5 วัน\n• ปัญหาที่ต้องสั่งอะไหล่: 7-14 วัน';
    }

    if (lowerMessage.includes('ติดต่อ') || lowerMessage.includes('โทร')) {
      return 'คุณสามารถติดต่อ IT Support Center ได้ที่:\n• โทรศัพท์: 02-123-4567\n• อีเมล: support@university.ac.th\n• ไลน์ OA: @universityIT\n• เวลาทำการ: จันทร์-ศุกร์ 08:00-17:00 น.';
    }

    if (
      lowerMessage.includes('ประเภท') ||
      lowerMessage.includes('อุปกรณ์') ||
      lowerMessage.includes('ซ่อมอะไรได้บ้าง')
    ) {
      return 'เรารับซ่อมอุปกรณ์ IT ต่างๆ ได้แก่:\n• คอมพิวเตอร์ตั้งโต๊ะและโน้ตบุ๊ก\n• เครื่องพิมพ์และสแกนเนอร์\n• โปรเจคเตอร์และจอมอนิเตอร์\n• อุปกรณ์เครือข่าย (Router, Switch)\n• และอุปกรณ์ IT อื่นๆ';
    }

    if (
      lowerMessage.includes('สวัสดี') ||
      lowerMessage.includes('หวัดดี') ||
      lowerMessage.includes('ดีจ้า')
    ) {
      return 'สวัสดีครับ! ยินดีให้บริการครับ มีอะไรให้ช่วยไหมครับ?';
    }

    if (lowerMessage.includes('ขอบคุณ') || lowerMessage.includes('thank')) {
      return 'ยินดีครับ! หากมีข้อสงสัยเพิ่มเติม สามารถสอบถามได้ตลอดเวลาครับ 😊';
    }

    // Default response
    return 'ขอโทษครับ ผมไม่ค่อยเข้าใจคำถามของคุณ คุณสามารถถามเกี่ยวกับ:\n• วิธีแจ้งซ่อม\n• ตรวจสอบสถานะ\n• ระยะเวลาการซ่อม\n• ช่องทางติดต่อ\n• ประเภทอุปกรณ์ที่รับซ่อม\n\nหรือคุณสามารถใช้เมนูด้านข้างเพื่อเข้าถึงฟีเจอร์ต่างๆ ได้เลยครับ';
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      message: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');

    // Simulate bot response delay
    setTimeout(() => {
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        message: getBotResponse(inputMessage),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  const quickReplies = [
    'วิธีแจ้งซ่อม',
    'ตรวจสอบสถานะ',
    'ช่องทางติดต่อ',
    'ระยะเวลาการซ่อม',
  ];

  return (
    <Card className="h-[calc(100vh-200px)] flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-3 rounded-lg">
            <MessageSquare className="size-6 text-green-600" />
          </div>
          <div>
            <CardTitle>แชทบอท LINE OA</CardTitle>
            <CardDescription>
              สอบถามข้อมูลและรับความช่วยเหลือจากบอท
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`flex-shrink-0 size-10 rounded-full flex items-center justify-center ${
                  msg.sender === 'user' ? 'bg-blue-600' : 'bg-green-600'
                }`}
              >
                {msg.sender === 'user' ? (
                  <User className="size-5 text-white" />
                ) : (
                  <Bot className="size-5 text-white" />
                )}
              </div>
              <div
                className={`flex-1 max-w-[80%] ${
                  msg.sender === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block px-4 py-3 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{msg.message}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1 px-2">
                  {new Date(msg.timestamp).toLocaleTimeString('th-TH', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">คำถามที่ถามบ่อย:</p>
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply) => (
              <Button
                key={reply}
                variant="outline"
                size="sm"
                onClick={() => setInputMessage(reply)}
                className="text-xs"
              >
                {reply}
              </Button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="พิมพ์ข้อความ..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="size-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
