import React, { createElement } from "react";
import { unmountComponentAtNode } from "react-dom";
import { createRoot } from "react-dom/client";
import "@webcomponents/webcomponentsjs/webcomponents-loader.js";
import "@webcomponents/webcomponentsjs/custom-elements-es5-adapter.js";

// Inpiration
// https://github.com/SIL0RAK/convert-react-to-web-component

const getAsPascalCase = (text: string) =>
  text
    .split("-")
    .map((str, index) =>
      index !== 0 ? `${str.charAt(0).toUpperCase()}${str.substring(1)}` : str
    )
    .join("");

const getAsSnakeCase = (text: string) =>
  text
    .split(/(?=[A-Z])/)
    .join("-")
    .toLowerCase();

interface IOptions {
  attributes?: Array<string>;
  name?: string;
  middleware: (prop: string) => string | unknown;
  shadowDom?: ShadowRootMode;
}

const webComponentFactory = (
  Component: React.FunctionComponent,
  options?: IOptions
) =>
  class WebComponent extends HTMLElement {
    private props: Record<string, unknown>;

    constructor() {
      super();

      this.props = {};
      // if useShadowDom enabled create shadow root and use it as mountPoint for react app
      if (options.shadowDom) {
        this.attachShadow({ mode: options.shadowDom });
      }
    }

    static get observedAttributes() {
      return options?.attributes ? options?.attributes.map(getAsSnakeCase) : [];
    }

    connectedCallback() {
      this.createView();
    }

    disconnectedCallback() {
      unmountComponentAtNode(this);
    }

    attributeChangedCallback(name: string, _oldValue: any, newValue: string) {
      this.props[getAsPascalCase(name)] =
        options?.middleware(newValue) || newValue;
    }

    private createView() {
      if (this.isConnected) {
        const mountPoint = options.shadowDom ? this.shadowRoot : this;
        const root = createRoot(mountPoint);
        root.render(
          createElement(Component, { ...this.props })
        );
      }
    }
  };

const addWebComponentToCustomElements = (
  WebComponent: CustomElementConstructor,
  name: string
) => {
  if (customElements.get(name) === undefined) {
    customElements.define(name, WebComponent);
  }
};

const create = (Component: React.FunctionComponent, options?: IOptions) => {
  const WebComponent = webComponentFactory(Component, options);

  const webComponentName = options?.name || getAsSnakeCase(Component.name);

  addWebComponentToCustomElements(WebComponent, webComponentName);
};

export default create;
