interface VideoInfo {
    thumbnailUrl: string;
    videoId: string;
    platform: 'youtube' | 'vimeo' | null;
}

export const getVideoInfo = (url: string): VideoInfo => {
    if (!url) {
        return {
            thumbnailUrl: '',
            videoId: '',
            platform: null
        };
    }

    // YouTube URL patterns
    const youtubePatterns = [
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^/?]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^/?]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([^/?&]+)/,  // Live stream pattern
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^/?&]+)/,     // Alternative format
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^/?&]+)/ // Shorts format
    ];

    // Clean the URL by removing any additional parameters
    const cleanUrl = url.split('?')[0];
    console.log('Clean URL:', cleanUrl); // Debug log

    // Check YouTube patterns
    for (const pattern of youtubePatterns) {
        const match = url.match(pattern);
        console.log('Checking pattern:', pattern, 'Match:', match); // Debug log
        if (match && match[1]) {
            const videoId = match[1].split('?')[0]; // Remove any query parameters
            return {
                thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                videoId: videoId,
                platform: 'youtube'
            };
        }
    }

    // Vimeo patterns remain unchanged
    const vimeoPatterns = [
        /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/([0-9]+)/,
        /(?:https?:\/\/)?(?:www\.)?player\.vimeo\.com\/video\/([0-9]+)/
    ];

    // Check Vimeo patterns
    for (const pattern of vimeoPatterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return {
                thumbnailUrl: `https://vumbnail.com/${match[1]}.jpg`,
                videoId: match[1],
                platform: 'vimeo'
            };
        }
    }

    return {
        thumbnailUrl: '',
        videoId: '',
        platform: null
    };
};

export const isValidVideoUrl = (url: string): boolean => {
    const { platform } = getVideoInfo(url);
    return platform !== null;
};
