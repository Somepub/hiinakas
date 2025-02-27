//import "preact/debug";
import React from "react";
import { StoreProvider } from "@stores/stores";
import { MainView } from "@views/mainview";
import "./theme.scss";
import { createRoot } from "react-dom/client";

const Hiinakas = () => {
  return (
    <>
      <StoreProvider>
        <MainView />
      </StoreProvider>
    </>
  );
};

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<Hiinakas />);
}
