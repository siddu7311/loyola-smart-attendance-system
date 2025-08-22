import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  MessageSquare, 
  Mail, 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle, 
  Reply, 
  Eye,
  Filter,
  Search,
  Calendar,
  Phone,
  MapPin
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type ContactMessage = Tables<'contact_messages'>;

interface ContactMessagesManagerProps {
  facultyId: string;
}

export const ContactMessagesManager = ({ facultyId }: ContactMessagesManagerProps) => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    filterMessages();
  }, [messages, activeTab, statusFilter, categoryFilter, searchTerm]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load contact messages",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterMessages = () => {
    let filtered = [...messages];

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(msg => msg.status === activeTab);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(msg => msg.status === statusFilter);
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(msg => msg.category === categoryFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(msg => 
        msg.name.toLowerCase().includes(term) ||
        msg.email.toLowerCase().includes(term) ||
        msg.subject.toLowerCase().includes(term) ||
        msg.message.toLowerCase().includes(term)
      );
    }

    setFilteredMessages(filtered);
  };

  const updateMessageStatus = async (messageId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status })
        .eq('id', messageId);

      if (error) {
        throw error;
      }

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status } : msg
      ));

      toast({
        title: "Status Updated",
        description: `Message marked as ${status}`,
      });
    } catch (error) {
      console.error('Error updating message status:', error);
      toast({
        title: "Error",
        description: "Failed to update message status",
        variant: "destructive"
      });
    }
  };

  const sendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    try {
      setIsReplying(true);
      const { error } = await supabase
        .from('contact_messages')
        .update({ 
          reply_message: replyText,
          replied_at: new Date().toISOString(),
          status: 'replied'
        })
        .eq('id', selectedMessage.id);

      if (error) {
        throw error;
      }

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === selectedMessage.id 
          ? { ...msg, reply_message: replyText, replied_at: new Date().toISOString(), status: 'replied' }
          : msg
      ));

      toast({
        title: "Reply Sent!",
        description: "Your reply has been sent successfully",
      });

      setReplyText('');
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive"
      });
    } finally {
      setIsReplying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'destructive';
      case 'read': return 'secondary';
      case 'replied': return 'accent';
      case 'resolved': return 'default';
      default: return 'outline';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'general': return <MessageSquare className="w-4 h-4" />;
      case 'technical': return <AlertCircle className="w-4 h-4" />;
      case 'faculty': return <User className="w-4 h-4" />;
      case 'student': return <User className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'normal': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUnreadCount = (status: string) => {
    return messages.filter(msg => msg.status === status).length;
  };

  if (isLoading) {
    return (
      <Card className="loyola-card">
        <CardContent className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="loyola-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            Contact Messages Management
          </CardTitle>
          <CardDescription>
            View and respond to contact form submissions from students and visitors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-destructive">{getUnreadCount('unread')}</div>
              <div className="text-sm text-muted-foreground">Unread</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-secondary">{getUnreadCount('read')}</div>
              <div className="text-sm text-muted-foreground">Read</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-accent">{getUnreadCount('replied')}</div>
              <div className="text-sm text-muted-foreground">Replied</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-primary">{getUnreadCount('resolved')}</div>
              <div className="text-sm text-muted-foreground">Resolved</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card className="loyola-card">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-background"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 max-w-2xl">
          <TabsTrigger value="all" className="flex items-center gap-2">
            All ({messages.length})
          </TabsTrigger>
          <TabsTrigger value="unread" className="flex items-center gap-2">
            Unread ({getUnreadCount('unread')})
          </TabsTrigger>
          <TabsTrigger value="read" className="flex items-center gap-2">
            Read ({getUnreadCount('read')})
          </TabsTrigger>
          <TabsTrigger value="replied" className="flex items-center gap-2">
            Replied ({getUnreadCount('replied')})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex items-center gap-2">
            Resolved ({getUnreadCount('resolved')})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredMessages.length === 0 ? (
            <Card className="loyola-card">
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No messages found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                    ? 'Try adjusting your filters or search terms'
                    : 'No contact messages have been submitted yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredMessages.map((message) => (
              <Card key={message.id} className="loyola-card hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        {getCategoryIcon(message.category)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{message.name}</h3>
                        <p className="text-sm text-muted-foreground">{message.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(message.status)}>
                        {message.status}
                      </Badge>
                      <Badge variant={getPriorityColor(message.priority)}>
                        {message.priority}
                      </Badge>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium mb-2">{message.subject}</h4>
                    <p className="text-muted-foreground text-sm mb-3">
                      {message.message.length > 150 
                        ? `${message.message.substring(0, 150)}...` 
                        : message.message
                      }
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(message.created_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        {getCategoryIcon(message.category)}
                        {message.category}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedMessage(message)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <MessageSquare className="w-5 h-5 text-primary" />
                              Contact Message Details
                            </DialogTitle>
                            <DialogDescription>
                              From: {message.name} ({message.email})
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Category:</span>
                                <Badge variant="outline" className="ml-2">
                                  {message.category}
                                </Badge>
                              </div>
                              <div>
                                <span className="font-medium">Priority:</span>
                                <Badge variant={getPriorityColor(message.priority)} className="ml-2">
                                  {message.priority}
                                </Badge>
                              </div>
                              <div>
                                <span className="font-medium">Status:</span>
                                <Badge variant={getStatusColor(message.status)} className="ml-2">
                                  {message.status}
                                </Badge>
                              </div>
                              <div>
                                <span className="font-medium">Date:</span>
                                <span className="ml-2">{formatDate(message.created_at)}</span>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">Subject</h4>
                              <p className="text-muted-foreground">{message.subject}</p>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">Message</h4>
                              <p className="text-muted-foreground whitespace-pre-wrap">{message.message}</p>
                            </div>

                            {message.reply_message && (
                              <div className="bg-muted/30 p-4 rounded-lg">
                                <h4 className="font-medium mb-2 text-primary">Your Reply</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{message.reply_message}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Replied on: {message.replied_at ? formatDate(message.replied_at) : 'Unknown'}
                                </p>
                              </div>
                            )}

                            {!message.reply_message && (
                              <div className="space-y-3">
                                <h4 className="font-medium">Send Reply</h4>
                                <Textarea
                                  placeholder="Type your reply here..."
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  rows={4}
                                />
                                <div className="flex items-center gap-2">
                                  <Button 
                                    onClick={sendReply}
                                    disabled={isReplying || !replyText.trim()}
                                    className="flex-1"
                                  >
                                    {isReplying ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        Sending...
                                      </>
                                    ) : (
                                      <>
                                        <Reply className="w-4 h-4 mr-2" />
                                        Send Reply
                                      </>
                                    )}
                                  </Button>
                                  <Button 
                                    variant="outline"
                                    onClick={() => updateMessageStatus(message.id, 'resolved')}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Mark Resolved
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>

                      {message.status === 'unread' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateMessageStatus(message.id, 'read')}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Mark Read
                        </Button>
                      )}

                      {message.status === 'read' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateMessageStatus(message.id, 'resolved')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

