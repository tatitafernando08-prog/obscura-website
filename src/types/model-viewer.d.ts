import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        'camera-controls'?: boolean;
        'camera-orbit'?: string;
        'field-of-view'?: string;
        'shadow-intensity'?: string;
        exposure?: string;
        'shadow-softness'?: string;
        'environment-image'?: string;
      };
    }
  }
}

export {};
