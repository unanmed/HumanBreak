import { FloorItemDetail } from '@/plugin/fx/itemDetail';
import { FloorDamageExtends } from './preset/damage';
import { LayerDoorAnimate } from './preset/floor';
import { HeroRenderer } from './preset/hero';
import { LayerGroup, FloorLayer } from './preset/layer';
import { MotaRenderer } from './render';
import { LayerShadowExtends } from '../fx/shadow';
import { LayerGroupFilter } from '@/plugin/fx/gameCanvas';
import { LayerGroupAnimate } from './preset/animate';
import { LayerGroupPortal } from '@/plugin/fx/portal';
import { LayerGroupHalo } from '@/plugin/fx/halo';
import { FloorViewport } from './preset/viewport';
import { Container } from './container';
import { PopText } from '@/plugin/fx/pop';
import { FloorChange } from '@/plugin/fallback';

let main: MotaRenderer;

Mota.require('var', 'loading').once('coreInit', () => {
    const render = new MotaRenderer();
    main = render;
    render.hide();

    const mapDraw = new Container();
    const layer = new LayerGroup();
    const pop = new PopText('static');
    const floorChange = new FloorChange('static');
    mapDraw.id = 'map-draw';
    layer.id = 'layer-main';
    pop.id = 'pop-main';
    floorChange.id = 'floor-change';

    mapDraw.setHD(true);
    mapDraw.setAntiAliasing(false);
    mapDraw.size(core._PX_, core._PY_);
    floorChange.size(480, 480);
    floorChange.setHD(true);
    floorChange.setZIndex(10);
    floorChange.setTips(tips);
    pop.setZIndex(80);

    ['bg', 'bg2', 'event', 'fg', 'fg2'].forEach(v => {
        layer.addLayer(v as FloorLayer);
    });

    const damage = new FloorDamageExtends();
    const hero = new HeroRenderer();
    const detail = new FloorItemDetail();
    const door = new LayerDoorAnimate();
    const shadow = new LayerShadowExtends();
    const filter = new LayerGroupFilter();
    const animate = new LayerGroupAnimate();
    const portal = new LayerGroupPortal();
    const halo = new LayerGroupHalo();
    const viewport = new FloorViewport();
    layer.extends(damage);
    layer.extends(detail);
    layer.extends(filter);
    layer.extends(portal);
    layer.extends(halo);
    layer.getLayer('event')?.extends(hero);
    layer.getLayer('event')?.extends(door);
    layer.getLayer('event')?.extends(shadow);
    layer.extends(animate);
    layer.extends(viewport);

    render.appendChild(mapDraw);
    mapDraw.appendChild(layer);
    layer.appendChild(pop);
    mapDraw.appendChild(floorChange);
    console.log(render);
});

Mota.require('var', 'hook').on('reset', () => {
    main.show();
});

Mota.require('var', 'hook').on('restart', () => {
    main.hide();
});

const tips = [
    '按下C可以查看鼠标位置怪物临界',
    '按下E可以查看鼠标位置怪物属性',
    '将鼠标移动到光环怪上以查看其产生的光环',
    '字体太大？试试在背包的系统设置里面调整字体大小吧！',
    '字体太小？试试在背包的系统设置里面调整字体大小吧！',
    '按键不合心意？试试在背包的系统设置里面自定义快捷键',
    '拖动状态栏左上角可以移动状态栏哦！',
    '拖动状态栏右下角可以缩放状态栏哦！',
    '按下M键，鼠标位置的怪物的信息就会被你看光啦！',
    '咱就是说，要不要试一下工具栏的最后一个按钮？',
    '要不要试试工具栏倒数第二个按钮呢？',
    '想自定义工具栏？去背包的系统设置看看吧！',
    '冷知识：临界界面可以拖动滚动条来查看减伤情况',
    '可以用滚轮或者双指缩放小地图！',
    '楼传的最左侧一栏可以选择区域！',
    '冷知识：装备栏左栏最上面可以修改装备排序',
    '冷冷冷知识：装备栏左栏最上面右侧可以更改顺序或倒序',
    '第一章使用跳跃技能可是要扣血的！要注意！',
    '按H查看本游戏的百科全书',
    '给别人炫耀一下自己的成就点吧！虽然不能记榜（',
    '抱团属性会在怪物右上角显示加成数量！',
    '乾坤挪移属性绘制怪物左上角显示“乾”字！',
    '电脑端可以试试按F11全屏游玩！',
    '手机端要不试试横屏玩？',
    '不在楼梯边也可以使用楼传！',
    '技能树的右下角可以切换章节！',
    '开启自动切换技能就会自动帮你选择最优技能了！',
    '魔塔不仅有撤回，还有恢复，按W或6就可以了！',
    '觉得卡顿？可以去试着设置里面关闭一些特性！',
    '从第二章开始，怪物负伤量不会超过其生命的1/4',
    '生命回复不会超过防御的十分之一'
];
