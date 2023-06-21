interface MotaConfig {
    name: string;
    resourceName?: string;
    zip?: Record<string, string[]>;
}

function defineConfig(config: MotaConfig): MotaConfig {
    return config;
}

export default defineConfig({
    // 这里修改塔的name，请保持与全塔属性的完全相同，否则发布之后可能无法进行游玩
    name: 'HumanBreak',
    resourceName: 'HumanBreakRes',
    zip: {
        'resource.zip': [
            'autotiles/*',
            'tilesets/*',
            'images/*',
            'animates/*',
            'sounds/*',
            'fonts/*'
        ],
        'weather.zip': [
            'materials/fog.png',
            'materials/cloud.png',
            'materials/sun.png'
        ],
        'materials.zip': [
            'materials/animates.png',
            'materials/enemy48.png',
            'materials/enemys.png',
            'materials/icons.png',
            'materials/items.png',
            'materials/npc48.png',
            'materials/npcs.png',
            'materials/terrains.png'
        ]
    }
});
