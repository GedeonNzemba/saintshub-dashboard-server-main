import todos from './todoSlice';
import modal from './videoModalSlice'
import liveModal from './liveModal';
import churchTabSlice from './churchTabSlice';
import getProfileImage from './registration/getProfileImage';
import getPrincipalImage from './dashboard/getPrincipalImage';
import getPastorWIfeIMage from './dashboard/getPastorWIfeIMage';
import getLogo from "./dashboard/getChurchLogo";
import getPastorWifesImage from './dashboard/getPastorWIfeIMage';
import getGalleries from './dashboard/getGalleries';
import getSongs from './dashboard/getSongs';
import getPastServices from './dashboard/getPastServices';
// import getChurchBannerImage from './dashboard/getChurchBannerImage';
import getChurchBanners from './dashboard/getChurchBanners';
import getChurchImage from './dashboard/getChurchImage';
import trusteeImages from './dashboard/trusteeImages';
import updateUserData from './user/userData';
import bottomSheet from './bottomSheet';
import detachedBottomSheet from './detachedBottomSheet';
import sermonsSlice from './sermonsSlices';
import sermonsSongsSlice from './sermonSongsSlice'
import getChurchData from './church/church';
import getChurchSermonData from './church/sermons';
import mainDrawer from "./drawer/mainDrawer"
import loading from "./loader/Loader"
import deaconImages from './dashboard/deaconImages';
import { combineReducers } from 'redux';

export default combineReducers({ todos, modal, churchTabSlice, getPastorWifesImage, getGalleries, getPastServices, getSongs, getChurchData, getChurchSermonData, sermonsSongsSlice, liveModal, bottomSheet, sermonsSlice, getProfileImage, getPastorWIfeIMage, getLogo, getPrincipalImage, getChurchImage, getChurchBanners, updateUserData, detachedBottomSheet, mainDrawer, loading, deaconImages, trusteeImages })