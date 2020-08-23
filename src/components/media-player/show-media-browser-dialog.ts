import { fireEvent } from "../../common/dom/fire_event";
import { MediaPlayerBrowseAction } from "../../data/media-player";

export interface MediaPlayerBrowseDialogParams {
  action: MediaPlayerBrowseAction;
  entityId: string;
  mediaContentId?: string;
  mediaContentType?: string;
}

export const showMediaBrowserDialog = (
  element: HTMLElement,
  dialogParams: MediaPlayerBrowseDialogParams
): void => {
  fireEvent(element, "show-dialog", {
    dialogTag: "dialog-media-player-browse",
    dialogImport: () =>
      import(
        /* webpackChunkName: "dialog-media-player-browse" */ "./dialog-media-player-browse"
      ),
    dialogParams,
  });
};
