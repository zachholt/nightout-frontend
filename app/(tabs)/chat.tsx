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
  Alert,
  ScrollViewProps,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '../config/api';
import * as Location from 'expo-location';

// Message type definition
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Quick suggestion buttons
const QUICK_SUGGESTIONS = [
  "🍸 Bar recommendations",
  "🍽️ Places to eat dinner",
  "☕ Coffee shops nearby",
  "👥 Where's everyone at",
  "🏙️ Rooftop bars"
];

// Location-aware typing phrases
const TYPING_PHRASES = [
  "Looking around your area...",
  "Checking what's open...",
  "Scouting nearby spots...",
  "Finding the best places...",
  "Searching your neighborhood...",
  "Checking local hotspots..."
];

// LangChain OpenAI API settings - updating to use our backend endpoint
const API_ENDPOINT = `${API_URL}/chat/chat`;

// Additional logging to help diagnose CORS issues
console.log('API Endpoint:', API_ENDPOINT);

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi there! I\'m your NightOut assistant. I can help you find great restaurants, bars, and entertainment based on your location. Ask me for recommendations or about specific places nearby!',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [sessionId, setSessionId] = useState(`session-${Date.now()}`);
  const [userLocation, setUserLocation] = useState<{
    latitude: number | null;
    longitude: number | null;
    locationName: string | null;
  }>({
    latitude: null,
    longitude: null,
    locationName: null
  });
  const [typingPhrase, setTypingPhrase] = useState(TYPING_PHRASES[0]);

  // Colors for the chat interface
  const colors = {
    background: isDark ? '#121214' : '#F7F7FC', // Slightly different background
    cardBackground: isDark ? '#2C2C2E' : '#F2F2F7',
    userBubble: '#4870FF', // Slightly more pleasant blue
    aiBubble: isDark ? '#2A2A2E' : '#FFFFFF', // White bubbles for AI in light mode
    text: isDark ? '#FFFFFF' : '#000000',
    userText: '#FFFFFF',
    aiText: isDark ? '#FFFFFF' : '#000000',
    inputBackground: isDark ? '#2A2A2E' : '#FFFFFF',
    inputBorder: isDark ? '#38383A' : '#E5E5EA',
    placeholderText: isDark ? '#8E8E93' : '#8E8E93',
    sendButton: '#4870FF',
    separator: isDark ? '#38383A' : '#E5E5EA',
    suggestionButton: isDark ? '#2A2A2E' : '#FFFFFF',
    suggestionText: isDark ? '#FFFFFF' : '#4870FF',
  };

  // Add user message to the chat
  const addUserMessage = (text: string) => {
    const newMessage: Message = {
      id: `user-${Date.now()}`,
      text,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);
  };

  // Add AI response to the chat
  const addAIMessage = (text: string) => {
    const newMessage: Message = {
      id: `ai-${Date.now()}`,
      text: text.trim(),
      isUser: false,
      timestamp: new Date(),
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);
  };

  // Get user location when component mounts
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          return;
        }
        
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        
        // Try to get readable location name (reverse geocoding)
        try {
          const [geocode] = await Location.reverseGeocodeAsync({
            latitude,
            longitude
          });
          
          let locationName = '';
          if (geocode) {
            const parts = [
              geocode.name,
              geocode.district,
              geocode.city,
              geocode.region
            ].filter(Boolean);
            locationName = parts.join(', ');
          }
          
          setUserLocation({
            latitude,
            longitude,
            locationName: locationName || null
          });
          
          console.log('User location set:', { latitude, longitude, locationName });
        } catch (error) {
          console.error('Error during reverse geocoding:', error);
          setUserLocation({
            latitude,
            longitude,
            locationName: null
          });
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }
    })();
  }, []);

  // Send message to the backend API
  const sendMessage = async (userMessage: string) => {
    setIsTyping(true);
    // Set a random location-aware typing phrase
    setTypingPhrase(TYPING_PHRASES[Math.floor(Math.random() * TYPING_PHRASES.length)]);
    
    try {
      // Add user message to chat
      addUserMessage(userMessage);
      
      // Format conversation history as a string for the content field
      let basePrompt = "The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know.";

      // Add location context if available and relevant to the query
      if (userLocation.latitude && userLocation.longitude) {
        // Basic check if the query seems location-related
        const locationKeywords = ['nearby', 'around here', 'close by', 'in this area', 'recommend', 'find', 'where is', 'places to'];
        const queryIncludesLocationKeyword = locationKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));

        if (queryIncludesLocationKeyword || userLocation.locationName) { // Include if keywords present or we have a name
          let locationInfo = `The user is currently located near ${userLocation.locationName || `coordinates ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`}.`;
          locationInfo += " Please prioritize providing recommendations and answers relevant to this specific location when asked about nearby places, restaurants, bars, or entertainment.";
          basePrompt += `

${locationInfo}`;
        }
      }
      
      let conversationString = `${basePrompt}

Current conversation:

`;
      
      // Add existing messages to the conversation string
      messages.forEach(msg => {
        if (msg.id !== '1') { // Skip the initial greeting if desired
          conversationString += `${msg.isUser ? 'User' : 'AI'}: ${msg.text}\n`;
        }
      });
      
      // Add the current user message
      conversationString += `User: ${userMessage}\nAI:`;
      
      // Prepare the request payload using the exact format that works
      const payload = {
        "model": "mistral-vllm",
        "temperature": null,
        "top_p": 0.01,
        "frequency_penalty": null,
        "presence_penalty": null,
        "max_tokens": null,
        "n": null,
        "stop": [
            "\nUser:",
            "\n User:",
            "User:",
            "User"
        ],
        "stream": false,
        "seed": null,
        "messages": [
            {
                "role": "user",
                "content": conversationString
            }
        ],
        // Add location information if available
        "latitude": userLocation.latitude,
        "longitude": userLocation.longitude,
        "locationName": userLocation.locationName
      };
      
      console.log('Sending request to:', API_ENDPOINT);
      console.log('Conversation string sample:', conversationString.substring(0, 100) + '...');
      
      // Make the API request using fetch
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      // Check if the response is ok
      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText);
        // Try to get response text even on error
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}. Body: ${errorText.substring(0, 100)}`);
      }
      
      // Get the response as text directly
      const responseText = await response.text();
      console.log('Response received successfully, first 100 chars:', responseText.substring(0, 100) + '...');
      
      // If the response is empty, throw an error
      if (!responseText) {
        throw new Error('Empty response from server');
      }
      
      // Add the AI response to the chat - trim the text before adding
      addAIMessage(responseText.trim());
      
    } catch (error: any) {
      console.error('Error in chat request:', error);
      
      // Log more details about the error
      if (error.name === 'TypeError' && error.message === 'Network request failed') {
        console.error('Network error details:', {
          url: API_ENDPOINT,
          error: error.toString(),
          stack: error.stack
        });
        
        // Show more specific network error message
        setMessages(prevMessages => [...prevMessages, {
          id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          text: `Network connection error: Please check that the backend server is running at ${API_ENDPOINT}`,
          isUser: false,
          timestamp: new Date(),
        }]);
        
        Alert.alert(
          'Network Error', 
          `Cannot connect to the server at ${API_ENDPOINT}. Please ensure the backend is running.`
        );
        
      } else {
        // For other types of errors
        setMessages(prevMessages => [...prevMessages, {
          id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          text: `Sorry, I encountered an error: ${error.message || 'Unknown error'}`,
          isUser: false,
          timestamp: new Date(),
        }]);
        
        Alert.alert('Error', `Failed to connect to the AI service: ${error.message || 'Unknown error'}`);
      }
      
    } finally {
      setIsTyping(false);
    }
  };

  // Handle sending a message
  const handleSend = () => {
    if (input.trim() === '') return;
    
    const userMessage = input.trim();
    setInput('');
    
    // Send message to backend
    sendMessage(userMessage);
    
    // Dismiss keyboard on send
    Keyboard.dismiss();
  };

  // Handle suggestion button press
  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
    sendMessage(suggestion);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

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
                : [
                    styles.aiBubble, 
                    { 
                      backgroundColor: colors.aiBubble,
                      borderWidth: isDark ? 0 : 1,
                      borderColor: isDark ? 'transparent' : '#E0E0E6',
                      shadowColor: isDark ? 'transparent' : '#00000020',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: isDark ? 0 : 2,
                    }
                  ],
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
          </View>
        ))}
        
        {isTyping && (
          <View style={[
            styles.typingIndicator, 
            { 
              backgroundColor: colors.aiBubble,
              borderWidth: isDark ? 0 : 1,
              borderColor: isDark ? 'transparent' : '#E0E0E6',
              shadowColor: isDark ? 'transparent' : '#00000020',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: isDark ? 0 : 2,
            }
          ]}>
            <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#4870FF'} />
            <Text style={{ marginLeft: 8, color: colors.aiText }}>{typingPhrase}</Text>
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
        {/* Quick suggestion buttons */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsContainer}
        >
          {QUICK_SUGGESTIONS.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.suggestionButton,
                {
                  backgroundColor: colors.suggestionButton,
                  borderColor: colors.separator,
                  shadowColor: isDark ? 'transparent' : '#00000020',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: isDark ? 0 : 2,
                }
              ]}
              onPress={() => handleSuggestion(suggestion)}
            >
              <Text style={[styles.suggestionText, { color: colors.suggestionText }]}>
                {suggestion}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              shadowColor: isDark ? 'transparent' : '#00000020',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: isDark ? 0 : 2,
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
    padding: 14,
    borderRadius: 20,
    marginBottom: 10,
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
  typingIndicator: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    marginBottom: 8,
  },
  suggestionsContainer: {
    paddingVertical: 10,
    paddingHorizontal: 32,
    flexDirection: 'row',
    gap: 8,
  },
  suggestionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    borderTopWidth: 0.5,
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingTop: 0,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 10,
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