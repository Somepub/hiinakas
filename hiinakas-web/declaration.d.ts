declare module "*.scss" {
    const content: Record<string, string>;
    export default content;
}

declare module "*.png" {
    const value: any;
    export = value;
}

declare module "*.jpg" {
    const value: any;
    export = value;
}

declare module "*.wav" {
    const value: any;
    export default value;
  }