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
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { fetchNearbyPlaces } from '../utils/apiUtils';
import { getLocationIcon, getLocationTypeName, getDistanceInMiles } from '../utils/locationUtils';
import { NearbyLocation } from '../types/location';

// Message type definition
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  locations?: NearbyLocation[];
}

// LangChain OpenAI API settings - updating to use our backend endpoint
const API_ENDPOINT = 'http://44.203.161.109:8080/api/chat/chat';

// Additional logging to help diagnose CORS issues
console.log('API Endpoint:', API_ENDPOINT);

export default function ChatScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi there! I\'m your NightOut assistant. I can help you find bars, restaurants, and entertainment venues nearby. Try asking me about places around you!',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [sessionId, setSessionId] = useState(`session-${Date.now()}`);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Colors for the chat interface
  const colors = {
    background: isDark ? '#121214' : '#F7F7F9',
    cardBackground: isDark ? '#2C2C2E' : '#FFFFFF',
    userBubble: '#0A84FF',
    aiBubble: isDark ? '#2C2C30' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    userText: '#FFFFFF',
    aiText: isDark ? '#FFFFFF' : '#000000',
    inputBackground: isDark ? '#2C2C30' : '#FFFFFF',
    inputBorder: isDark ? '#38383A' : '#E5E5EA',
    placeholderText: isDark ? '#8E8E93' : '#8E8E93',
    sendButton: '#0A84FF',
    separator: isDark ? '#38383A' : '#E5E5EA',
    locationCard: isDark ? '#2C2C30' : '#FFFFFF',
    locationCardText: isDark ? '#FFFFFF' : '#000000',
    locationCardSubtext: isDark ? '#ADADAD' : '#6E6E6E',
    accent: '#0A84FF',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
  };

  // Get user location on component mount
  useEffect(() => {
    getUserLocation();
    
    // Fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Get the user's current location
  const getUserLocation = async () => {
    try {
      setIsLoadingLocation(true);
      setLocationError(null);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Failed to get your location');
    } finally {
      setIsLoadingLocation(false);
    }
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
  const addAIMessage = (text: string, locations?: NearbyLocation[]) => {
    const newMessage: Message = {
      id: `ai-${Date.now()}`,
      text,
      isUser: false,
      timestamp: new Date(),
      locations,
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);
  };

  // Format AI response text for better readability
  const formatResponseText = (text: string) => {
    // Add line breaks after periods followed by a space and uppercase letter (likely new sentences)
    let formattedText = text.replace(/\.\s+([A-Z])/g, '.\n\n$1');
    
    // Format lists with bullets
    formattedText = formattedText.replace(/(\d+\.\s+)/g, '\n$1');
    
    // Highlight venue names with bold styling (text in quotes or with specific patterns)
    formattedText = formattedText.replace(/"([^"]+)"/g, '"$1"');
    
    // Add emphasis to rating mentions
    formattedText = formattedText.replace(/(\d+(\.\d+)?\s*(star|stars|★))/gi, '$1');
    
    return formattedText;
  };

  // Parse and display formatted AI response
  const renderFormattedText = (text: string, textColor: string) => {
    const formattedText = formatResponseText(text);
    const paragraphs = formattedText.split('\n\n');
    
    return (
      <>
        {paragraphs.map((paragraph, index) => {
          // Check if this is a list item (starts with number + period)
          const isListItem = /^\d+\.\s/.test(paragraph);
          
          // Check if this might be a venue name (surrounded by quotes)
          const hasVenueName = /"([^"]+)"/.test(paragraph);
          
          return (
            <Text
              key={index}
              style={[
                styles.messageText,
                { color: textColor },
                isListItem && styles.listItem,
                hasVenueName && styles.paragraphWithVenue,
                index < paragraphs.length - 1 && styles.paragraphWithMargin
              ]}
            >
              {paragraph}
            </Text>
          );
        })}
      </>
    );
  };

  // Check if the message is asking about locations or places
  const isLocationQuestion = (message: string): boolean => {
    const locationKeywords = [
      'bar', 'bars', 'restaurant', 'restaurants', 'cafe', 'cafes', 'club', 'clubs',
      'place', 'places', 'venue', 'venues', 'nearby', 'close', 'around', 'near',
      'where', 'location', 'entertainment', 'nightlife', 'food', 'drink', 'eat', 'go'
    ];
    
    const lowerMessage = message.toLowerCase();
    return locationKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  // Find nearby places based on the user's query
  const findNearbyPlaces = async (query: string) => {
    if (!userLocation) {
      console.log('No user location available');
      return null;
    }
    
    try {
      // Extract relevant types from the query
      const types: string[] = [];
      if (query.toLowerCase().includes('bar') || query.toLowerCase().includes('drink')) {
        types.push('bar');
      }
      if (query.toLowerCase().includes('restaurant') || query.toLowerCase().includes('food') || query.toLowerCase().includes('eat')) {
        types.push('restaurant');
      }
      if (query.toLowerCase().includes('club') || query.toLowerCase().includes('dance')) {
        types.push('night_club');
      }
      if (query.toLowerCase().includes('cafe') || query.toLowerCase().includes('coffee')) {
        types.push('cafe');
      }
      
      // If no specific types were mentioned, search for all nightlife types
      if (types.length === 0) {
        types.push('bar', 'restaurant', 'night_club');
      }
      
      // Fetch nearby places
      const places = await fetchNearbyPlaces(
        types,
        5000, // 5 km radius
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        setIsTyping,
        setLocationError
      );
      
      // Sort by distance
      const placesWithDistance = places.map(place => ({
        ...place,
        distance: getDistanceInMiles(
          userLocation.coords.latitude,
          userLocation.coords.longitude,
          place.location.latitude,
          place.location.longitude
        ),
      }));
      
      placesWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      return placesWithDistance.slice(0, 5); // Return top 5 results
    } catch (error) {
      console.error('Error finding nearby places:', error);
      return null;
    }
  };

  // Navigate to a location on the map
  const navigateToLocation = (location: NearbyLocation) => {
    router.push({
      pathname: '/(tabs)',
      params: { 
        locationId: location.id,
        lat: location.location.latitude.toString(),
        lng: location.location.longitude.toString()
      },
    });
  };

  // Send message to the backend API
  const sendMessage = async (userMessage: string) => {
    setIsTyping(true);
    
    try {
      // Add user message to chat
      addUserMessage(userMessage);
      
      // If this is a location question, find nearby places
      let nearbyLocations: NearbyLocation[] | undefined = undefined;
      if (isLocationQuestion(userMessage)) {
        const places = await findNearbyPlaces(userMessage);
        nearbyLocations = places || undefined;
      }
      
      // Format conversation history as a string for the content field
      let conversationString = "The following is a friendly conversation between a human and an AI assistant that helps users find bars, restaurants, and entertainment venues. The assistant is knowledgeable about helping users find places for nightlife, dining, and entertainment. The assistant is talkative and provides specific details. If the AI does not know the answer to a question, it truthfully says it does not know.\n\nCurrent conversation:\n\n";
      
      // Add existing messages to the conversation string
      messages.forEach(msg => {
        if (msg.id !== '1') { // Skip the initial greeting if desired
          conversationString += `${msg.isUser ? 'User' : 'AI'}: ${msg.text}\n`;
        }
      });
      
      // Add the current user message
      conversationString += `User: ${userMessage}\nAI:`;
      
      // Add special context about the user's location if asking about places
      if (nearbyLocations && userLocation) {
        conversationString = `The following is a friendly conversation between a human and an AI assistant that helps users find bars, restaurants, and entertainment venues. The assistant is knowledgeable about helping users find places for nightlife, dining, and entertainment. The assistant is talkative and provides specific details. The AI has access to the user's current location and nearby venues.

Current user location: Latitude ${userLocation.coords.latitude}, Longitude ${userLocation.coords.longitude}

Nearby places: 
${nearbyLocations.map((place, index) => 
  `${index + 1}. ${place.name} (${getLocationTypeName(place.type)}) - ${place.distance?.toFixed(1)} miles away - ${place.address} - Rating: ${place.rating || 'N/A'}`
).join('\n')}

The AI should recommend these specific places in its response when asked about places nearby. When listing places, include the place name in quotes, rating, and distance.

Current conversation:\n\n`;

        // Add conversation history
        messages.forEach(msg => {
          if (msg.id !== '1') {
            conversationString += `${msg.isUser ? 'User' : 'AI'}: ${msg.text}\n`;
          }
        });
        
        // Add the current user message
        conversationString += `User: ${userMessage}\nAI:`;
      }
      
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
        ]
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
      
      // Add the AI response to the chat - using the text response directly
      addAIMessage(responseText, nearbyLocations);
      
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
    
    // If user is asking about places but we don't have their location, get it first
    if (isLocationQuestion(userMessage) && !userLocation && !isLoadingLocation) {
      getUserLocation();
    }
    
    // Send message to backend
    sendMessage(userMessage);
    
    // Dismiss keyboard on send
    Keyboard.dismiss();
  };

  // Render a location card
  const renderLocationCard = (location: NearbyLocation) => {
    return (
      <TouchableOpacity
        key={location.id}
        style={[styles.locationCard, { backgroundColor: colors.locationCard }]}
        onPress={() => navigateToLocation(location)}
        activeOpacity={0.8}
      >
        <View style={styles.locationIconContainer}>
          <Ionicons name={getLocationIcon(location.type)} size={24} color={colors.accent} />
        </View>
        <View style={styles.locationContent}>
          <Text style={[styles.locationName, { color: colors.locationCardText }]}>
            {location.name}
          </Text>
          <View style={styles.locationMetaContainer}>
            <Text style={[styles.locationDetails, { color: colors.locationCardSubtext }]}>
              {getLocationTypeName(location.type)} • {location.distance?.toFixed(1)} mi
            </Text>
            {location.rating && (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={[styles.ratingText, { color: colors.locationCardText }]}>
                  {location.rating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.locationAddress, { color: colors.locationCardSubtext }]} numberOfLines={1}>
            {location.address}
          </Text>
        </View>
        <View style={styles.locationArrow}>
          <Ionicons name="chevron-forward" size={18} color={colors.locationCardSubtext} />
        </View>
      </TouchableOpacity>
    );
  };

  // Render a message bubble, potentially with location cards
  const renderMessage = (message: Message) => {
    const isUserMessage = message.isUser;
    
    return (
      <Animated.View
        key={message.id}
        style={[
          styles.messageBubble,
          isUserMessage
            ? [styles.userBubble, { backgroundColor: colors.userBubble }]
            : [styles.aiBubble, { backgroundColor: colors.aiBubble, borderColor: isDark ? '#3A3A3C' : '#E5E5EA' }],
          { opacity: fadeAnim }
        ]}
      >
        {isUserMessage ? (
          <Text style={[styles.messageText, { color: colors.userText }]}>
            {message.text}
          </Text>
        ) : (
          renderFormattedText(message.text, colors.aiText)
        )}
        
        {!isUserMessage && message.locations && message.locations.length > 0 && (
          <View style={styles.locationsContainer}>
            {message.locations.map(location => renderLocationCard(location))}
          </View>
        )}
      </Animated.View>
    );
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
        showsVerticalScrollIndicator={false}
      >
        {messages.map(renderMessage)}
        
        {isTyping && (
          <Animated.View 
            style={[
              styles.typingIndicator, 
              { backgroundColor: colors.aiBubble, borderColor: isDark ? '#3A3A3C' : '#E5E5EA' },
              { opacity: fadeAnim }
            ]}
          >
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={{ marginLeft: 8, color: colors.aiText }}>Typing...</Text>
          </Animated.View>
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
            placeholder="Ask about bars, restaurants & more nearby..."
            placeholderTextColor={colors.placeholderText}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: input.trim() ? colors.accent : 'transparent' }]}
            onPress={handleSend}
            disabled={!input.trim()}
            activeOpacity={0.7}
          >
            <Ionicons name="send" size={18} color={input.trim() ? '#FFFFFF' : colors.placeholderText} />
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
    paddingTop: 20,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
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
  paragraphWithMargin: {
    marginBottom: 10,
  },
  paragraphWithVenue: {
    fontWeight: '500',
  },
  listItem: {
    marginLeft: 5,
    marginBottom: 5,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    marginBottom: 8,
    borderWidth: 1,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  locationsContainer: {
    marginTop: 12,
    width: '100%',
  },
  locationCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    marginVertical: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationContent: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  locationMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  locationDetails: {
    fontSize: 13,
  },
  locationAddress: {
    fontSize: 13,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    marginLeft: 4,
    fontWeight: '500',
  },
  locationArrow: {
    width: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});