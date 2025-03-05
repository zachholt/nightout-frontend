import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Message type definition
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi there! I\'m your NightOut assistant. How can I help you plan your night out today?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Colors for the chat interface
  const colors = {
    background: isDark ? '#1C1C1E' : '#FFFFFF',
    cardBackground: isDark ? '#2C2C2E' : '#F2F2F7',
    userBubble: '#007AFF',
    aiBubble: isDark ? '#3A3A3C' : '#E5E5EA',
    text: isDark ? '#FFFFFF' : '#000000',
    userText: '#FFFFFF',
    aiText: isDark ? '#FFFFFF' : '#000000',
    inputBackground: isDark ? '#1C1C1E' : '#F2F2F7',
    inputBorder: isDark ? '#38383A' : '#E5E5EA',
    placeholderText: isDark ? '#8E8E93' : '#8E8E93',
    sendButton: '#007AFF',
    separator: isDark ? '#38383A' : '#E5E5EA',
  };

  // Simulate AI response
  const simulateResponse = (userMessage: string) => {
    setIsTyping(true);
    
    // Simulate typing delay
    setTimeout(() => {
      const responses = [
        "I can help you find great bars and clubs in your area!",
        "Looking for a specific type of venue? Let me know what you're in the mood for.",
        "I can suggest popular routes that include multiple stops.",
        "Would you like me to recommend places based on your current location?",
        "I can help you plan a route with the best-rated venues in town."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const newMessage: Message = {
        id: Date.now().toString(),
        text: randomResponse,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prevMessages => [...prevMessages, newMessage]);
      setIsTyping(false);
    }, 1500);
  };

  // Handle sending a message
  const handleSend = () => {
    if (input.trim() === '') return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      isUser: true,
      timestamp: new Date(),
    };
    
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setInput('');
    
    // Simulate AI response
    simulateResponse(input);
    
    // Dismiss keyboard on send
    Keyboard.dismiss();
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.isUser
                ? [styles.userBubble, { backgroundColor: colors.userBubble }]
                : [styles.aiBubble, { backgroundColor: colors.aiBubble }],
            ]}
          >
            <Text
              style={[
                styles.messageText,
                { color: message.isUser ? colors.userText : colors.aiText },
              ]}
            >
              {message.text}
            </Text>
            <Text
              style={[
                styles.timestamp,
                { color: message.isUser ? 'rgba(255, 255, 255, 0.7)' : isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' },
              ]}
            >
              {formatTime(message.timestamp)}
            </Text>
          </View>
        ))}
        
        {isTyping && (
          <View style={[styles.typingIndicator, { backgroundColor: colors.aiBubble }]}>
            <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#007AFF'} />
            <Text style={{ marginLeft: 8, color: colors.aiText }}>Typing...</Text>
          </View>
        )}
        
        <View style={{ height: 16 }} />
      </ScrollView>

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.separator,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
            },
          ]}
        >
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Message NightOut Assistant..."
            placeholderTextColor={colors.placeholderText}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, { opacity: input.trim() ? 1 : 0.5 }]}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Ionicons name="send" size={24} color={colors.sendButton} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    marginBottom: 8,
  },
  inputContainer: {
    borderTopWidth: 1,
    padding: 16,
    paddingTop: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendButton: {
    marginLeft: 8,
    padding: 4,
  },
}); 