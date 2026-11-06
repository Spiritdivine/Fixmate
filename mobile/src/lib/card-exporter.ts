import { Platform, Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as Clipboard from 'expo-clipboard';
import { captureRef } from 'react-native-view-shot';

export interface CardExportOptions {
  cardRef: any;
  user: any;
  referralCode: string;
  shareUrl: string;
  selectedColorHex: string;
  selectedPattern: string;
}

export interface ExportResult {
  success: boolean;
  action: 'SAVED' | 'SHARED' | 'COPIED_LINK' | 'SHARE_FALLBACK';
  message: string;
}

/**
 * Capture an image URI from a React Native ref across both ViewShot components
 * and raw native view handles.
 */
export async function captureComponentSnapshot(ref: any): Promise<string> {
  if (!ref?.current) {
    throw new Error('Card component is still rendering, please try again.');
  }

  // 1. If ref is attached to a ViewShot instance
  if (typeof ref.current.capture === 'function') {
    return await ref.current.capture();
  }

  // 2. If ref is attached to a native View
  return await captureRef(ref.current, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  });
}

/**
 * Web Canvas Generator:
 * On Web browsers where native ViewShot and MediaLibrary native modules do not exist,
 * renders an ultra-crisp 2x retina Canvas representation of the card and returns a data URL.
 */
export async function generateWebCardDataUrl(
  user: any,
  referralCode: string,
  shareUrl: string,
  selectedColorHex: string,
  selectedPattern: string
): Promise<string> {
  if (typeof document === 'undefined') {
    throw new Error('Web DOM is not available.');
  }

  const isArtisan = user?.role === 'ARTISAN';
  const displayName = isArtisan
    ? user?.artisanProfile?.businessName || user?.artisanProfile?.title || 'Master Artisan'
    : user?.clientProfile?.firstName
    ? `${user.clientProfile.firstName} ${user.clientProfile.lastName || ''}`.trim()
    : 'Artifix Client';

  const tradeTitle = isArtisan
    ? user?.artisanProfile?.trade || 'Verified Professional'
    : 'Verified Client';

  const rating = Number(user?.artisanProfile?.ratingAvg || 4.9).toFixed(1);
  const avatarUrl =
    user?.avatarUrl ||
    user?.artisanProfile?.avatarUrl ||
    user?.clientProfile?.avatarUrl ||
    user?.avatar ||
    null;

  // 2x Retina Resolution
  const width = 640;
  const height = 948;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not initialize 2D Canvas context.');

  // Helper: Rounded Rectangle
  const drawRoundedRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    fill: string
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };

  // 1. Outer Background Card
  drawRoundedRect(0, 0, width, height, 72, selectedColorHex);

  // 2. Pattern Overlay
  ctx.save();
  ctx.beginPath();
  drawRoundedRect(0, 0, width, height, 72, 'transparent');
  ctx.clip();

  if (selectedPattern === 'grid') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1.5;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  } else if (selectedPattern === 'dots') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let x = 20; x < width; x += 36) {
      for (let y = 20; y < height; y += 36) {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (selectedPattern === 'diagonal') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 2.5;
    for (let x = -height; x < width + height; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + height, height);
      ctx.stroke();
    }
  } else if (selectedPattern === 'rings') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(width, 0, width * 0.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(width, 0, width * 0.7, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // 3. Inner White Rounded Body
  const innerMargin = 24;
  const innerTop = 150;
  const innerW = width - innerMargin * 2;
  const innerH = height - innerTop - innerMargin;
  drawRoundedRect(innerMargin, innerTop, innerW, innerH, 56, '#FFFFFF');

  // 4. Hero Avatar Pod
  const avatarSize = 176;
  const avatarX = width / 2;
  const avatarY = innerTop;

  ctx.save();
  // White border ring for avatar
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarSize / 2 + 7, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  // Avatar clipping circle
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
  ctx.clip();

  if (avatarUrl) {
    try {
      const img = new (window as any).Image();
      img.crossOrigin = 'anonymous';
      img.src = avatarUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; // Continue on error
      });
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(
          img,
          avatarX - avatarSize / 2,
          avatarY - avatarSize / 2,
          avatarSize,
          avatarSize
        );
      } else {
        ctx.fillStyle = selectedColorHex;
        ctx.fillRect(avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
      }
    } catch {
      ctx.fillStyle = selectedColorHex;
      ctx.fillRect(avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
    }
  } else {
    ctx.fillStyle = selectedColorHex;
    ctx.fillRect(avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayName.slice(0, 2).toUpperCase(), avatarX, avatarY);
  }
  ctx.restore();

  // Emerald Verified Checkmark Badge
  const badgeX = avatarX + avatarSize / 2 - 16;
  const badgeY = avatarY + avatarSize / 2 - 16;
  const badgeR = 26;
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeR + 4, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
  ctx.fillStyle = '#10B981';
  ctx.fill();

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(badgeX - 10, badgeY - 1);
  ctx.lineTo(badgeX - 3, badgeY + 7);
  ctx.lineTo(badgeX + 11, badgeY - 7);
  ctx.stroke();

  // 5. Typography Details
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(displayName, width / 2, innerTop + 140);

  ctx.fillStyle = selectedColorHex;
  ctx.font = '600 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(tradeTitle, width / 2, innerTop + 185);

  ctx.fillStyle = '#111827';
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`${rating} ★`, width / 2, innerTop + 225);

  // 6. QR Code Pod Container
  const qrBoxSize = 310;
  const qrBoxX = (width - qrBoxSize) / 2;
  const qrBoxY = innerTop + 265;
  drawRoundedRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 40, '#FFFFFF');

  ctx.strokeStyle = '#D1FAE5';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Generate QR Code via clean SVG-to-image or public reliable API
  const qrTargetUrl = shareUrl || `https://artisan.ng/join?ref=${referralCode}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    qrTargetUrl
  )}&color=${encodeURIComponent(selectedColorHex.replace('#', ''))}&bgcolor=FFFFFF`;

  try {
    const qrImg = new (window as any).Image();
    qrImg.crossOrigin = 'anonymous';
    qrImg.src = qrApiUrl;
    await new Promise((resolve) => {
      qrImg.onload = resolve;
      qrImg.onerror = resolve;
    });
    if (qrImg.complete && qrImg.naturalWidth > 0) {
      ctx.drawImage(qrImg, qrBoxX + 25, qrBoxY + 25, 260, 260);
    }
  } catch (e) {
    console.warn('[WebCardExporter] QR draw warning:', e);
  }

  // 7. Footer Callout Text
  ctx.fillStyle = '#4B5563';
  ctx.font = '500 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Scan to hire on Artifix', width / 2, innerTop + qrBoxSize + 325);

  return canvas.toDataURL('image/png');
}

/**
 * Universal Save Card To Photos / Gallery:
 * - On Web: Automatically triggers browser PNG file download.
 * - On Native: Requests write-only permission. If granted, saves to camera roll.
 *   If denied or fails, gracefully opens native share sheet so user can tap "Save Image".
 */
export async function saveProfileCard(options: CardExportOptions): Promise<ExportResult> {
  const { user, referralCode, shareUrl, selectedColorHex, selectedPattern, cardRef } = options;

  // PLATFORM: WEB
  if (Platform.OS === 'web') {
    try {
      const dataUrl = await generateWebCardDataUrl(
        user,
        referralCode,
        shareUrl,
        selectedColorHex,
        selectedPattern
      );

      const link = document.createElement('a');
      link.download = `artifix-profile-card-${referralCode || 'pass'}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return {
        success: true,
        action: 'SAVED',
        message: '🎉 Profile card downloaded successfully!',
      };
    } catch (err: any) {
      console.error('[saveProfileCard Web] Error:', err);
      return {
        success: false,
        action: 'SAVED',
        message: `Failed to download card: ${err.message || 'Canvas export error'}`,
      };
    }
  }

  // PLATFORM: NATIVE (iOS / Android)
  let capturedUri: string | null = null;
  try {
    capturedUri = await captureComponentSnapshot(cardRef);
  } catch (snapErr: any) {
    console.error('[saveProfileCard Native Snapshot] Error:', snapErr);
    throw new Error(snapErr.message || 'Snapshot capture failed');
  }

  try {
    // 1. Try direct MediaLibrary save with writeOnly permission
    let permission = await MediaLibrary.getPermissionsAsync(true);
    if (!permission.granted && permission.status !== 'granted') {
      permission = await MediaLibrary.requestPermissionsAsync(true);
    }

    const isPermitted =
      permission.granted ||
      permission.status === 'granted' ||
      (permission as any).accessPrivileges === 'limited' ||
      (permission as any).accessPrivileges === 'all';

    if (isPermitted) {
      await MediaLibrary.saveToLibraryAsync(capturedUri);
      return {
        success: true,
        action: 'SAVED',
        message: '🎉 Card saved to your Photos album!',
      };
    }
  } catch (mediaErr: any) {
    console.warn('[saveProfileCard Native MediaLibrary] Warning, falling back to share sheet:', mediaErr.message);
  }

  // 2. Fallback: If MediaLibrary permission was denied, open native share sheet!
  // The native OS share sheet (iOS/Android) has a built-in "Save Image" button with NO permissions required!
  try {
    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (isSharingAvailable) {
      await Sharing.shareAsync(capturedUri, {
        mimeType: 'image/png',
        dialogTitle: 'Save or Share your Profile Card',
        UTI: 'public.png',
      });
      return {
        success: true,
        action: 'SHARE_FALLBACK',
        message: '💡 Tap "Save Image" in the share sheet to save directly!',
      };
    }
  } catch (shareFallbackErr: any) {
    console.warn('[saveProfileCard Share Fallback] Warning:', shareFallbackErr);
  }

  return {
    success: false,
    action: 'SAVED',
    message: 'Storage permission was denied. Please allow photo access in device Settings.',
  };
}

/**
 * Universal Share Profile Card:
 * - On Web: Uses Web Share API if available; otherwise copies referral link to clipboard.
 * - On Native: Uses expo-sharing with fallback to React Native Share.
 */
export async function shareProfileCard(options: CardExportOptions): Promise<ExportResult> {
  const { user, referralCode, shareUrl, selectedColorHex, selectedPattern, cardRef } = options;
  const isArtisan = user?.role === 'ARTISAN';
  const displayName = isArtisan
    ? user?.artisanProfile?.businessName || user?.artisanProfile?.title || 'Master Artisan'
    : user?.clientProfile?.firstName || 'An Artifix Member';

  const shareText = `Connect with ${displayName} on Artifix — Nigeria's safest escrow platform for verified artisans!\nUse code: ${referralCode}`;
  const targetUrl = shareUrl || `https://artisan.ng/join?ref=${referralCode}`;

  // PLATFORM: WEB
  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} on Artifix`,
          text: shareText,
          url: targetUrl,
        });
        return {
          success: true,
          action: 'SHARED',
          message: 'Shared successfully!',
        };
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return { success: true, action: 'SHARED', message: '' };
        }
      }
    }

    // Web Fallback: Copy link
    await Clipboard.setStringAsync(targetUrl);
    return {
      success: true,
      action: 'COPIED_LINK',
      message: '📋 Profile invite link copied to clipboard!',
    };
  }

  // PLATFORM: NATIVE (iOS / Android)
  let capturedUri: string | null = null;
  try {
    capturedUri = await captureComponentSnapshot(cardRef);
  } catch (snapErr: any) {
    console.error('[shareProfileCard Snapshot] Error:', snapErr);
  }

  if (capturedUri) {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(capturedUri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your Artifix Profile Card',
          UTI: 'public.png',
        });
        return {
          success: true,
          action: 'SHARED',
          message: 'Profile card ready to share!',
        };
      }
    } catch (sharingErr: any) {
      console.warn('[shareProfileCard Sharing Native] Warning:', sharingErr);
    }
  }

  // Native Fallback: Built-in React Native Share
  try {
    await Share.share({
      title: 'Artifix Profile Card',
      message: `${shareText}\n\n${targetUrl}`,
      url: capturedUri || targetUrl,
    });
    return {
      success: true,
      action: 'SHARED',
      message: 'Share dialog opened!',
    };
  } catch (reactNativeShareErr: any) {
    console.error('[shareProfileCard React Native Share] Error:', reactNativeShareErr);
    await Clipboard.setStringAsync(targetUrl);
    return {
      success: true,
      action: 'COPIED_LINK',
      message: '📋 Profile link copied to clipboard!',
    };
  }
}
