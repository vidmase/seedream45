import { Zap, Monitor, Aperture, Palette, Layers, Sparkles, Sun, Camera, Film, Settings, Image, Maximize } from 'lucide-react';

export interface PromptPreset {
    id: string;
    label: string;
    value: string; // For actions, this uses JSON: "{\"key\": \"size\", \"val\": \"16:9\"}"
    type: 'Style' | 'Quality' | 'Lighting' | 'Camera' | 'Action';
    icon?: any;
}

export const PROMPT_PRESETS: PromptPreset[] = [
    // Actions - Canvas Control
    { id: 'Square', label: 'Set Square (1:1)', value: JSON.stringify({ key: 'size', val: '1:1' }), type: 'Action', icon: Settings },
    { id: 'Wide', label: 'Set Widescreen (16:9)', value: JSON.stringify({ key: 'size', val: '16:9' }), type: 'Action', icon: Maximize },
    { id: 'Portrait', label: 'Set Portrait (9:16)', value: JSON.stringify({ key: 'size', val: '9:16' }), type: 'Action', icon: Image },
    { id: 'Photo', label: 'Set Photo (3:2)', value: JSON.stringify({ key: 'size', val: '3:2' }), type: 'Action', icon: Camera },
    { id: '4K', label: 'Enable 4K Mode', value: JSON.stringify({ key: 'resolution', val: '4K' }), type: 'Action', icon: Monitor },
    { id: '2K', label: 'Enable 2K Mode', value: JSON.stringify({ key: 'resolution', val: '2K' }), type: 'Action', icon: Monitor },

    // Styles
    { id: 'Cyberpunk', label: 'Cyberpunk', value: 'cyberpunk style, neon lights, futuristic, high tech', type: 'Style', icon: Zap },
    { id: 'Anime', label: 'Anime', value: 'anime style, vibrant colors, cel shaded, studio ghibli inspired', type: 'Style', icon: Palette },
    { id: 'Photoreal', label: 'Photorealistic', value: 'photorealistic, 8k uhd, highly detailed, dramatic lighting', type: 'Style', icon: Camera },
    { id: 'OilPaint', label: 'Oil Painting', value: 'oil painting style, textured brushstrokes, classical art', type: 'Style', icon: Palette },
    { id: '3DRender', label: '3D Render', value: '3d render, unreal engine 5, octane render, ray tracing', type: 'Style', icon: Layers },

    // Quality
    { id: 'UHD', label: '4K Ultra HD', value: 'masterpiece, best quality, 4k, 8k, highres, sharp focus', type: 'Quality', icon: Monitor },
    { id: 'Detailed', label: 'Hyper Detailed', value: 'intricate details, hyperdetailed, complex textures', type: 'Quality', icon: Sparkles },

    // Lighting
    { id: 'Cinematic', label: 'Cinematic Light', value: 'cinematic lighting, volumetric atmosphere, dramatic shadows, ray tracing', type: 'Lighting', icon: Film },
    { id: 'Studio', label: 'Studio Light', value: 'studio lighting, soft box, rim lighting, professional photography', type: 'Lighting', icon: Sun },
    { id: 'Neon', label: 'Neon Glow', value: 'neon lighting, glowing, vibrant colored lights, darker background', type: 'Lighting', icon: Zap },

    // Camera
    { id: 'Bokeh', label: 'Bokeh', value: 'depth of field, bokeh background, blurred background, f/1.8', type: 'Camera', icon: Aperture },
    { id: 'WideAngle', label: 'Wide Angle', value: 'wide angle lens, panoramic view, distortion', type: 'Camera', icon: Aperture },
    { id: 'Macro', label: 'Macro', value: 'macro shot, extreme close up, microscopic detail', type: 'Camera', icon: Aperture },
];
