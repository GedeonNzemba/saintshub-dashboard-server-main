import { useState, useEffect } from 'react';
import { MusicItem } from '../types';

const API_BASE_URL = 'https://saintshub-bible-api.onrender.com';

export const useMusicData = () => {
  const [albums, setAlbums] = useState<MusicItem[]>([]);
  const [artists, setArtists] = useState<MusicItem[]>([]);
  const [allTracks, setAllTracks] = useState<MusicItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [albumsRes, artistsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/music/albums`),
        fetch(`${API_BASE_URL}/music/artists`)
      ]);

      const albumsData = await albumsRes.json();
      const artistsData = await artistsRes.json();

      let allTracksArray: MusicItem[] = [];

      if (albumsData.success) {
        setAlbums(albumsData.data);
        const allTracksPromises = albumsData.data.map(album => 
          fetch(`${API_BASE_URL}/music/albums/${encodeURIComponent(album.name)}`).then(res => res.json())
        );
        const allTracksResults = await Promise.all(allTracksPromises);
        const albumTracks = allTracksResults
          .filter(result => result.success)
          .flatMap(result => result.data)
          .filter(track => track.name.toLowerCase().endsWith('.mp3'));
        allTracksArray = [...albumTracks];
      }

      if (artistsData.success) {
        setArtists(artistsData.data);
        const artistTracksPromises = artistsData.data.map(artist => 
          fetch(`${API_BASE_URL}/music/artists/${encodeURIComponent(artist.name)}`).then(res => res.json())
        );
        const artistTracksResults = await Promise.all(artistTracksPromises);
        const artistTracks = artistTracksResults
          .filter(result => result.success)
          .flatMap(result => result.data)
          .filter(track => track.name.toLowerCase().endsWith('.mp3'))
          .map(track => ({
            ...track,
            key: track.key.replace('album/', 'artist/')
          }));
        allTracksArray = [...allTracksArray, ...artistTracks];
      }

      setAllTracks(allTracksArray);
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load music data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  return {
    albums,
    artists,
    allTracks,
    isLoading,
    error,
  };
};
