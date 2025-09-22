import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StreamingPlayerManager as NewStreamingPlayerManager } from './players';
import { Eye, Share2, Download, Zap, Activity } from 'lucide-react';

interface StreamingPlayerManagerProps {
  videoUrl?: string;
  isLive?: boolean;
  title?: string;
  className?: string;
  showPlayerSelector?: boolean;
  enableSocialSharing?: boolean;
  enableViewerCounter?: boolean;
  enableWatermark?: boolean;
  streamStats?: {
    viewers?: number;
    bitrate?: number;
    uptime?: string;
    quality?: string;
    isRecording?: boolean;
  };
}

const StreamingPlayerManager: React.FC<StreamingPlayerManagerProps> = ({
  videoUrl,
  isLive = false,
  title,
  className = '',
  showPlayerSelector = true,
  enableSocialSharing = true,
  enableViewerCounter = true,
  enableWatermark = true,
  streamStats
}) => {
  const { user, getToken } = useAuth();
  const [selectedPlayer, setSelectedPlayer] = useState('html5');
  const [playerConfig, setPlayerConfig] = useState({
    autoplay: false,
    muted: false,
    loop: false,
    aspectRatio: '16:9' as '16:9' | '4:3' | '1:1' | 'auto'
  });
  const [watermarkConfig, setWatermarkConfig] = useState({
    enabled: enableWatermark,
    url: '',
    position: 'bottom-right' as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center',
    opacity: 50,
    size: 'medium' as 'small' | 'medium' | 'large',
    clickable: false,
    link: ''
  });
  const [socialConfig, setSocialConfig] = useState({
    enabled: enableSocialSharing,
    platforms: ['facebook', 'twitter', 'whatsapp'] as Array<
      'facebook' | 'twitter' | 'pinterest' | 'telegram' | 'whatsapp'
    >,
    shareUrl: window.location.href
  });
  const [viewerConfig] = useState({
    enabled: enableViewerCounter,
    endpoint: `/api/espectadores/tempo-real`,
    interval: 30000
  });
  const [qualityLevels, setQualityLevels] = useState<
    Array<{ label: string; src: string; bitrate: number; resolution: string }>
  >([]);
  const [logos, setLogos] = useState<Array<{ id: number; nome: string; url: string }>>([]);

  const userLogin =
    user?.usuario || (user?.email ? user.email.split('@')[0] : `user_${user?.id || 'usuario'}`);

  useEffect(() => {
    loadLogos();
    loadQualityLevels();
  }, []);

  const loadLogos = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/logos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setLogos(data);
      if (data.length > 0 && enableWatermark) {
        setWatermarkConfig(prev => ({
          ...prev,
          url: data[0].url,
          enabled: true
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar logos:', error);
    }
  };

  const loadQualityLevels = async () => {
    const userBitrateLimit = user?.bitrate || 2500;
    const levels = [{ label: 'Auto', src: videoUrl || '', bitrate: 0, resolution: 'Auto' }];
    if (userBitrateLimit >= 800) {
      levels.push({ label: '480p', src: videoUrl || '', bitrate: 800, resolution: '854x480' });
    }
    if (userBitrateLimit >= 1500) {
      levels.push({ label: '720p', src: videoUrl || '', bitrate: 1500, resolution: '1280x720' });
    }
    if (userBitrateLimit >= 2500) {
      levels.push({ label: '1080p', src: videoUrl || '', bitrate: 2500, resolution: '1920x1080' });
    }
    if (userBitrateLimit >= 4000) {
      levels.push({ label: '1080p+', src: videoUrl || '', bitrate: 4000, resolution: '1920x1080' });
    }
    setQualityLevels(levels);
  };

  const buildExternalPlayerUrl = (videoPath: string) => {
    if (!videoPath) return '';
    if (videoPath.includes('play.php') || videoPath.includes('/api/players/iframe')) {
      return videoPath;
    }
    const cleanPath = videoPath.replace(/^\/+/, '').replace(/^(content\/|streaming\/)?/, '');
    const pathParts = cleanPath.split('/');
    if (pathParts.length >= 3) {
      const userLogin = pathParts[0];
      const folderName = pathParts[1];
      const fileName = pathParts[2];
      const finalFileName = fileName.endsWith('.mp4')
        ? fileName
        : fileName.replace(/\.[^/.]+$/, '.mp4');
      // SEMPRE usar domínio do Wowza, NUNCA o domínio da aplicação
      const domain = 'stmv1.udicast.com';
      return `https://${domain}:1443/play.php?login=${userLogin}&video=${folderName}/${finalFileName}`;
    }
    return '';
  };

  const generatePlayerCode = () => {
    const baseUrl = window.location.origin;
    let playerUrl = '';
    if (videoUrl) {
      const cleanPath = videoUrl.replace(/^\/+/, '').replace(/^(content\/|streaming\/)?/, '');
      const pathParts = cleanPath.split('/');
      if (pathParts.length >= 3) {
        const userLogin = pathParts[0];
        const folderName = pathParts[1];
        const fileName = pathParts[2];
        const finalFileName = fileName.endsWith('.mp4')
          ? fileName
          : fileName.replace(/\.[^/.]+$/, '.mp4');
        const domain =
          window.location.hostname === 'localhost' ? 'stmv1.udicast.com' : 'samhost.wcore.com.br';
        playerUrl = `https://${domain}:1443/play.php?login=${userLogin}&video=${folderName}/${finalFileName}`;
      } else {
        playerUrl = `${baseUrl}/api/players/iframe?stream=${userLogin}_live`;
      }
    } else {
      playerUrl = `${baseUrl}/api/players/iframe?stream=${userLogin}_live`;
    }
    switch (selectedPlayer) {
      case 'html5':
        return `<!-- Player iFrame Otimizado -->
<iframe 
  src="${playerUrl}" 
  width="640" 
  height="360" 
  frameborder="0" 
  allowfullscreen
  allow="autoplay; fullscreen; picture-in-picture">
</iframe>`;
    <NewStreamingPlayerManager
      className={className}
      showPlayerSelector={showPlayerSelector}
      enableSocialSharing={enableSocialSharing}
      enableViewerCounter={enableViewerCounter}
      enableWatermark={enableWatermark}
      autoDetectStream={true}
    />
  );
};

export default StreamingPlayerManager;