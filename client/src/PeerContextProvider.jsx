import React, { createContext, useRef, useContext } from 'react';

const PeerContext = createContext();

const PeerContextProvider = ({ children }) => {
    const peersRef = useRef([]);

  return (
    <PeerContext.Provider  value={{ peersRef }} >
      {children}
    </PeerContext.Provider>
  );
};

// Custom hook to access the context
const usePeerContext = () => {
  return useContext(PeerContext);
};

export { PeerContextProvider, usePeerContext };
