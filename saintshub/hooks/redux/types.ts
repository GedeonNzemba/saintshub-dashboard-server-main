import { DeaconImagesState } from './dashboard/deaconImages';
import { TrusteeImagesState } from './dashboard/trusteeImages';

export interface RootState {
  reducer: {
    todos: any;
    modal: any;
    churchTabSlice: any;
    getPastorWifesImage: { pastorWifeImage: string };
    getGalleries: { churchGallery: string[] };
    getPastServices: { pastServices: any[] };
    getSongs: { songs: any[] };
    getChurchData: any;
    getChurchSermonData: any;
    sermonsSongsSlice: any;
    liveModal: any;
    bottomSheet: any;
    sermonsSlice: any;
    getProfileImage: any;
    getPastorWIfeIMage: any;
    getLogo: any;
    getPrincipalImage: any;
    getChurchImage: any;
    getChurchBanners: any;
    updateUserData: any;
    detachedBottomSheet: any;
    mainDrawer: any;
    loading: any;
    deaconImages: DeaconImagesState;
    trusteeImages: TrusteeImagesState;
  }
}
