export type PublisherMessage =
  | { type: 'ready' }
  | { type: 'connected' }
  | { type: 'error'; message: string }
  | { type: 'thumbnail'; dataUrl: string }
  | {
      type: 'devices';
      videoDevices: Array<{ deviceId: string; label: string }>;
      audioDevices: Array<{ deviceId: string; label: string }>;
    };

export type LiveCameraPublisherProps = {
  whipPublishUrl: string;
  streamId?: string;
  publishing: boolean;
  selectedVideoDeviceId?: string;
  selectedAudioDeviceId?: string;
  cameraEnabled?: boolean;
  micEnabled?: boolean;
  onReady?: () => void;
  onConnected?: () => void;
  onError?: (message: string) => void;
  onDevices?: (devices: {
    videoDevices: Array<{ deviceId: string; label: string }>;
    audioDevices: Array<{ deviceId: string; label: string }>;
  }) => void;
};
