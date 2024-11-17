import React from "react";
import { StoreProvider } from "@stores/stores";
import { MainView } from "@views/mainview";
import { Auth0Provider } from '@auth0/auth0-react';
import { createRoot } from "react-dom/client";

const ChineseDurak = () => {
  const isDev = import.meta.env.DEV;
  
  if(isDev) {
    return (
      <StoreProvider>
        <MainView />
      </StoreProvider>
    ); 
  }

  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_PROD_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_PROD_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin
      }}
    >
      <StoreProvider>
        <MainView />
      </StoreProvider>
    </Auth0Provider>
  );
}

createRoot(document.getElementById("root")!).render(<StoreProvider>
  <ChineseDurak />
</StoreProvider>);
