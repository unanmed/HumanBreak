main.floors.MT80=
{
    "floorId": "MT80",
    "title": "苍蓝之殿-左上",
    "name": "80",
    "width": 15,
    "height": 15,
    "canFlyTo": true,
    "canFlyFrom": true,
    "canUseQuickShop": true,
    "cannotViewMap": false,
    "images": [],
    "ratio": 8,
    "defaultGround": "T650",
    "bgm": "palaceNorth.mp3",
    "firstArrive": [],
    "eachArrive": [],
    "parallelDo": "",
    "events": {
        "7,2": [
            {
                "type": "function",
                "async": true,
                "function": "function(){\nMota.require('module', 'Mechanism').BluePalace.doorConvert(7, 2);\n}"
            }
        ]
    },
    "changeFloor": {
        "14,7": {
            "floorId": "MT79",
            "loc": [
                0,
                7
            ]
        },
        "7,14": {
            "floorId": "MT83",
            "loc": [
                7,
                0
            ]
        }
    },
    "beforeBattle": {},
    "afterBattle": {},
    "afterGetItem": {},
    "afterOpenDoor": {},
    "autoEvent": {},
    "cannotMove": {},
    "cannotMoveIn": {},
    "map": [
    [648,648,648,648,648,648,648,648,648,648,648,648,648,648,648],
    [648,381,  0, 33,  0,492,376, 93,513,  0,618,482,376,482,648],
    [648,648,648,648,682,648,648,660,648,  0,648,648,648,378,648],
    [648,  0, 33,648,  0,484,648,648,648,491,648,396,648,381,648],
    [648, 27, 29,658,376,103,672,  0,657,  0,494,403,599, 21,648],
    [648,648,648,648,492,648,648,494,648,232,648,648,648,648,648],
    [648,484,618,  0, 27,648, 28,  0,648,  0,482,  0,578,  0,648],
    [648,  0,648, 21,482,648,482, 29,658,  0, 29,103,648,  0, 94],
    [648,376,648,  0, 28,682, 27,  0,648,492,648,682,648,484,648],
    [648,494,648,648,648,648,659,648,648,484,648,  0,648,  0,648],
    [648,378,648,  0,484,682,  0,376,494, 28,658,484,657,  0,648],
    [648,381,648,492,648,648,648,232,648,648,648,  0,648,492,648],
    [648,484,648,482,  0, 28,648,103,  0,  0,648,682,648, 33,648],
    [648,  0,671,  0, 29,  0,677,  0,484,  0,677, 34,578, 33,648],
    [648,648,648,648,648,648,648, 93,648,648,648,648,648,648,648]
],
    "bgmap": [

],
    "fgmap": [

],
    "bg2map": [

],
    "fg2map": [

]
}