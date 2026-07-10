export type LiveCameraPublisherProps = {
  whipPublishUrl: string;
  publishing: boolean;
  onReady?: () => void;
  onConnected?: () => void;
  onError?: (message: string) => void;
};
