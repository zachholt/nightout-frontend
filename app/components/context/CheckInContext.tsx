import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { NearbyLocation } from '@/app/types/location';

type CheckIn = {
  id: string;
  userId: string;
  location: NearbyLocation; // Store the entire location object
  timestamp: number;
};

type CheckInState = {
  checkIns: CheckIn[];
};

type CheckInAction =
  | { type: 'ADD_CHECK_IN'; payload: CheckIn }
  | { type: 'REMOVE_CHECK_IN'; payload: { locationId: string } };

type CheckInContextType = {
  state: CheckInState;
  dispatch: React.Dispatch<CheckInAction>;
};

const CheckInContext = createContext<CheckInContextType | undefined>(undefined);

const checkInReducer = (state: CheckInState, action: CheckInAction): CheckInState => {
  switch (action.type) {
    case 'ADD_CHECK_IN':
      return {
        ...state,
        checkIns: [...state.checkIns, action.payload],
      };
    case 'REMOVE_CHECK_IN':
      return {
        ...state,
        checkIns: state.checkIns.filter(
          (checkIn) => checkIn.location.id !== action.payload.locationId
        ),
      };
    default:
      return state;
  }
};

interface CheckInProviderProps {
  children: ReactNode;
}

export const CheckInProvider: React.FC<CheckInProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(checkInReducer, { checkIns: [] });

  // Log the check-ins whenever the state changes
  React.useEffect(() => {
    console.log('Current Check-Ins:', state.checkIns);
  }, [state.checkIns]);

  return (
    <CheckInContext.Provider value={{ state, dispatch }}>
      {children}
    </CheckInContext.Provider>
  );
};

export const useCheckIn = () => {
  const context = useContext(CheckInContext);
  if (context === undefined) {
    throw new Error('useCheckIn must be used within a CheckInProvider');
  }
  return context;
};