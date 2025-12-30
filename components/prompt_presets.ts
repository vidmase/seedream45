import { Zap, Monitor, Aperture, Palette, Layers, Sparkles, Sun, Camera, Film, Settings, Image, Maximize, CloudRain, Snowflake, Moon, Flame, Wind, Ghost, Radiation, Lightbulb, Beaker } from 'lucide-react';

export interface PromptPreset {
    id: string;
    label: string;
    value: string; // For actions, this uses JSON: "{\"key\": \"size\", \"val\": \"16:9\"}"
    type: 'Style' | 'Quality' | 'Lighting' | 'Camera' | 'Action' | 'Environment' | 'Color' | 'Composition' | 'Material';
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
    { id: 'GodRays', label: 'God Rays', value: 'volumetric lighting, sun beams, god rays, atmospheric haze, crystalline rays', type: 'Lighting', icon: Sun },
    { id: 'Bioluminescent', label: 'Bioluminescent', value: 'bioluminescent glow, organic neon, glowing plants, ethereal underwater light', type: 'Lighting', icon: Wind },
    { id: 'Cyberlight', label: 'Cyberlight', value: 'intense cyber lighting, sharp neon contrasts, synthwave aesthetics, hyper-glowing accents', type: 'Lighting', icon: Zap },
    { id: 'Moonlit', label: 'Moonlit Glow', value: 'moonlight, silver glow, cool night atmosphere, deep shadows, celestial light', type: 'Lighting', icon: Moon },
    { id: 'Firelight', label: 'Firelight', value: 'warm firelight, flickering embers, glowing furnace, intimate orange shadows', type: 'Lighting', icon: Flame },
    { id: 'Prismatic', label: 'Prismatic/Rainbow', value: 'prismatic light, rainbow refraction, prism effects, caustic reflections, glass dispersion', type: 'Lighting', icon: Sparkles },
    { id: 'EtherealGlow', label: 'Ethereal Glow', value: 'ethereal glow, soft dreamlike lighting, heavenly aura, haze, bloom effect', type: 'Lighting', icon: Ghost },
    { id: 'Rembrandt', label: 'Rembrandt Light', value: 'rembrandt lighting, moody chiaroscuro, classic portrait light, dramatic triangle shadow', type: 'Lighting', icon: Camera },
    { id: 'RimLight', label: 'Rim Lighting', value: 'intense rim lighting, silhouette highlight, glowing outlines, professional separation light', type: 'Lighting', icon: Sun },
    { id: 'HardShadow', label: 'Noir/Hard Shadow', value: 'film noir lighting, Venetian blind shadows, dramatic high contrast, mysterious silhouettes', type: 'Lighting', icon: Maximize },
    { id: 'AtomicGlow', label: 'Atomic/Toxic Glow', value: 'hazardous green glow, radioactive luminescence, toxic atmosphere, eerie light', type: 'Lighting', icon: Radiation },
    { id: 'SoftFocus', label: 'Soft Focus Glow', value: 'dreamy soft focus, lens bloom, ethereal atmosphere, glowing edges', type: 'Lighting', icon: Aperture },

    // Environment & Atmosphere
    { id: 'GoldenHour', label: 'Golden Hour', value: 'golden hour lighting, warm sunlight, long shadows, magic hour', type: 'Environment', icon: Sun },
    { id: 'BlueHour', label: 'Blue Hour', value: 'blue hour, deep blue sky, twilight, cool atmosphere', type: 'Environment', icon: Film },
    { id: 'Foggy', label: 'Foggy/Misty', value: 'foggy atmosphere, mysterious, misty, low visibility, atmospheric depth', type: 'Environment', icon: Layers },
    { id: 'Rainy', label: 'Rainy Day', value: 'rainy weather, wet surfaces, raindrops, gloomy lighting, reflections', type: 'Environment', icon: CloudRain },
    { id: 'Snowy', label: 'Snowy Scene', value: 'snowy weather, white landscape, falling snow, cold atmosphere', type: 'Environment', icon: Snowflake },

    // Color Grading
    { id: 'Vintage', label: 'Vintage Filter', value: 'vintage style, film grain, faded colors, nostalgic, retro look', type: 'Color', icon: Palette },
    { id: 'Pastel', label: 'Pastel Colors', value: 'pastel color palette, soft colors, gentle tones, dreamy', type: 'Color', icon: Palette },
    { id: 'HighContrast', label: 'High Contrast', value: 'high contrast, bold shadows, vibrant highlights, dramatic', type: 'Color', icon: Palette },
    { id: 'Monochrome', label: 'Black & White', value: 'monochrome, black and white, high contrast, film noir style', type: 'Color', icon: Palette },
    { id: 'TealOrange', label: 'Teal & Orange', value: 'teal and orange color grading, cinematic look, complementary colors', type: 'Color', icon: Palette },

    // Composition
    { id: 'Symmetrical', label: 'Symmetrical', value: 'symmetrical composition, balanced, centered subject, reflection', type: 'Composition', icon: Maximize },
    { id: 'RuleOfThirds', label: 'Rule of Thirds', value: 'rule of thirds composition, off-center placement, balanced weight', type: 'Composition', icon: Maximize },
    { id: 'TopDown', label: 'Top-Down View', value: 'top-down perspective, flat lay, overhead view', type: 'Composition', icon: Maximize },
    { id: 'MacroDetail', label: 'Macro Detail', value: 'macro photography, extreme close-up, intricate details, tiny textures', type: 'Composition', icon: Sparkles },

    // Materials
    { id: 'Glassy', label: 'Glassy/Glossy', value: 'reflective glass surface, glossy finish, transparent, refractive', type: 'Material', icon: Sparkles },
    { id: 'Metallic', label: 'Metallic', value: 'metallic surface, brushed metal, chrome reflections, industrial', type: 'Material', icon: Layers },
    { id: 'Holographic', label: 'Holographic', value: 'holographic shimmer, iridescent colors, pearlescent finish', type: 'Material', icon: Zap },

    // Camera Angles & Perspectives
    { id: 'LongShot', label: 'Long Shot', value: 'long shot, establishing shot, wide view, full scene visible, environmental context', type: 'Camera', icon: Aperture },
    { id: 'MediumShot', label: 'Medium Shot', value: 'medium shot, waist up framing, conversational distance, balanced composition', type: 'Camera', icon: Aperture },
    { id: 'CloseUp', label: 'Close-Up', value: 'close-up shot, face detail, emotional intensity, shallow depth of field', type: 'Camera', icon: Aperture },
    { id: 'ExtremeCloseUp', label: 'Extreme Close-Up', value: 'extreme close-up, macro detail, eyes or specific feature, dramatic tension', type: 'Camera', icon: Aperture },
    { id: 'POV', label: 'POV Shot', value: 'point of view shot, first person perspective, subjective camera, immersive', type: 'Camera', icon: Aperture },
    { id: 'CowboyAngle', label: 'Cowboy Angle', value: 'cowboy shot, mid-thigh framing, western style, action ready stance', type: 'Camera', icon: Aperture },
    { id: 'HipLevel', label: 'Hip Level Shot', value: 'hip level shot, low camera position, dynamic perspective, powerful stance', type: 'Camera', icon: Aperture },
    { id: 'KneeLevel', label: 'Knee Level Shot', value: 'knee level shot, low angle, imposing figure, dramatic perspective', type: 'Camera', icon: Aperture },
    { id: 'TrackingShot', label: 'Tracking Shot', value: 'tracking shot, dolly movement, following subject, cinematic motion', type: 'Camera', icon: Aperture },
    { id: 'ShoulderLevel', label: 'Shoulder Level', value: 'shoulder level shot, natural eye line, conversational framing, intimate', type: 'Camera', icon: Aperture },
    { id: 'Telephoto', label: 'Telephoto Zoom', value: 'telephoto lens, compressed perspective, shallow depth, isolated subject', type: 'Camera', icon: Aperture },
    { id: 'MacroAngle', label: 'Macro Perspective', value: 'macro perspective, extreme detail, microscopic view, texture focus', type: 'Camera', icon: Aperture },
    { id: 'WideAngle', label: 'Wide-Angle', value: 'wide angle lens, panoramic view, spatial distortion, environmental context', type: 'Camera', icon: Aperture },
    { id: 'DutchAngle', label: 'Dutch Angle', value: 'dutch angle, tilted camera, diagonal horizon, tension and unease', type: 'Camera', icon: Aperture },
    { id: 'LowAngle', label: 'Low Angle', value: 'low angle shot, looking up, powerful subject, dominant presence', type: 'Camera', icon: Aperture },
    { id: 'WormsEye', label: "Worm's Eye View", value: "worm's eye view, extreme low angle, ground level, towering perspective", type: 'Camera', icon: Aperture },
    { id: 'HighAngle', label: 'High Angle', value: 'high angle shot, looking down, vulnerable subject, diminished power', type: 'Camera', icon: Aperture },
    { id: 'BirdsEye', label: "Bird's Eye View", value: "bird's eye view, aerial perspective, top-down, overhead shot", type: 'Camera', icon: Aperture },
    { id: 'EyeLevel', label: 'Eye-Level Shot', value: 'eye level shot, neutral perspective, natural viewing angle, balanced', type: 'Camera', icon: Aperture },
    { id: 'PedestalShot', label: 'Pedestal Shot', value: 'pedestal shot, vertical camera movement, rising or lowering, reveal', type: 'Camera', icon: Aperture },
    { id: 'Bokeh', label: 'Bokeh Effect', value: 'depth of field, bokeh background, blurred background, f/1.8', type: 'Camera', icon: Aperture },
];
