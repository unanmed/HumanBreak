import fs from 'fs/promises';

(async function () {
    // 1. 声明道具
    const item = await fs.readFile('./public/project/items.js', 'utf-8');
    const itemData = JSON.parse(item.split('\n').slice(1).join('')) as any;

    let itemDec = 'interface ItemDeclaration {\n';
    for (const id in itemData) {
        itemDec += `    ${id}: '${itemData[id].cls}';\n`;
    }
    itemDec += '}';

    // 2. 声明公共事件
    const event = await fs.readFile('./public/project/events.js', 'utf-8');
    const eventData = JSON.parse(event.split('\n').slice(1).join('')) as any;

    let eventDec = 'type EventDeclaration = \n';
    for (const id in eventData.commonEvent) {
        eventDec += `    | '${id}'\n`;
    }

    // 3. 声明数字id映射与cls映射
    const map = await fs.readFile('./public/project/maps.js', 'utf-8');
    const mapData = JSON.parse(map.split('\n').slice(1).join('')) as any;

    let id2num = 'interface IdToNumber {\n';
    let num2id = 'interface NumberToId {\n';
    let id2cls = 'interface IdToCls {\n';
    for (const num in mapData) {
        const { id, cls } = mapData[num];
        id2num += `    ${id}: ${num};\n`;
        num2id += `    ${num}: '${id}';\n`;
        id2cls += `    ${id}: '${cls}';\n`;
    }
    id2cls += '}';
    id2num += '}';
    num2id += '}';

    // 4. 声明楼层id，图片，动画，音效，文件别名，背景音乐，字体
    const data = await fs.readFile('./public/project/data.js', 'utf-8');
    const d = (JSON.parse(data.split('\n').slice(1).join('')) as any).main;

    let floorId = 'type FloorIds =\n';
    let imgs = 'type ImageIds =\n';
    let anis = 'type AnimationIds =\n';
    let sounds = 'type SoundIds =\n';
    let names = 'interface NameMap {\n';
    let bgms = 'type BgmIds =\n';
    let fonts = 'type FontIds =\n';

    floorId += d.floorIds.map((v: string) => `    | '${v}'\n`).join('');
    imgs += d.images.map((v: string) => `    | '${v}'\n`).join('');
    anis += d.animates.map((v: string) => `    | '${v}'\n`).join('');
    sounds += d.sounds.map((v: string) => `    | '${v}'\n`).join('');
    bgms += d.bgms.map((v: string) => `    | '${v}'\n`).join('');
    fonts += d.fonts.map((v: string) => `    | '${v}'\n`).join('');
    for (const name in d.nameMap) {
        names += `    '${name}': '${d.nameMap[name]}';\n`;
    }
    names += '}';

    // 5. 写入文件
    await fs.writeFile('./src/source/cls.d.ts', id2cls, 'utf-8');
    await fs.writeFile('./src/source/events.d.ts', eventDec, 'utf-8');
    await fs.writeFile('./src/source/items.d.ts', itemDec, 'utf-8');
    await fs.writeFile(
        './src/source/maps.d.ts',
        `${id2num}\n${num2id}`,
        'utf-8'
    );
    await fs.writeFile(
        './src/source/data.d.ts',
        `
${floorId}
${d.images.length > 0 ? imgs : 'type ImageIds = never\n'}
${d.animates.length > 0 ? anis : 'type AnimationIds = never\n'}
${d.sounds.length > 0 ? sounds : 'type SoundIds = never\n'}
${d.bgms.length > 0 ? bgms : 'type BgmIds = never\n'}
${d.fonts.length > 0 ? fonts : 'type FontIds = never\n'}
${names}
`,
        'utf-8'
    );
})();
