/// <reference types="vite/client" />

declare module "*.mp3" {
  const src: string;
  export default src;
}

declare module "*.MP3" {
  const src: string;
  export default src;
}
