import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send } from 'lucide-react';
import { useSendPortalMessage } from '@/hooks/useSendPortalMessage';
import { useToast } from '@/hooks/use-toast';

interface ContactFormProps {
  portalToken: string;
}

export function ContactForm({ portalToken }: ContactFormProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const sendMessage = useSendPortalMessage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject || !message.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    sendMessage.mutate(
      { portalToken, subject, message },
      {
        onSuccess: () => {
          toast({
            title: 'Message Sent',
            description: 'Your message has been sent. We\'ll get back to you soon!',
          });
          setSubject('');
          setMessage('');
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to send message',
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Send us a message
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger id="subject">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quote_inquiry">Quote Inquiry</SelectItem>
                <SelectItem value="invoice_question">Invoice Question</SelectItem>
                <SelectItem value="payment_issue">Payment Issue</SelectItem>
                <SelectItem value="project_update">Project Update</SelectItem>
                <SelectItem value="general">General Question</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={6}
              className="resize-none"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={sendMessage.isPending}
          >
            <Send className="h-4 w-4 mr-2" />
            {sendMessage.isPending ? 'Sending...' : 'Send Message'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
