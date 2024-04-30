main.floors.MT55=
{
    "floorId": "MT55",
    "title": "苍蓝之殿-左下",
    "name": "55",
    "width": 15,
    "height": 15,
    "canFlyTo": true,
    "canFlyFrom": true,
    "canUseQuickShop": true,
    "cannotViewMap": false,
    "images": [],
    "ratio": 8,
    "defaultGround": "T650",
    "bgm": "palaceSouth.mp3",
    "firstArrive": [],
    "eachArrive": [],
    "parallelDo": "",
    "events": {
        "6,7": [
            {
                "type": "function",
                "async": true,
                "function": "function(){\nMota.require('module', 'Mechanism').BluePalace.doorConvert(6, 7);\n}"
            }
        ]
    },
    "changeFloor": {
        "14,7": {
            "floorId": "MT54",
            "loc": [
                0,
                7
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
    [648,648,648,648,648,648,648, 91,648,648,648,648,648,648,648],
    [648,  0,  0,648,  0,  0,648,  0,578,  0,  0,648,  0,  0,648],
    [648,  0,  0,648,  0,  0,219,  0,648,  0,  0,648,  0,  0,648],
    [648,601,648,648,648,648,648,563,648,648,648,648,657,648,648],
    [648,103,  0,594,  0,  0,648,  0,  0,  0,  0,648, 33, 27,648],
    [648,  0,  0,648,  0,  0,648,648,648,648,656,648, 29, 33,648],
    [648,657,648,648,648,648,648,  0, 27,  0,482,648,648,243,648],
    [648,  0,  0,  0,  0,  0,660,381,103,648,648,648,  0,  0, 94],
    [648,648,648,648,492,648,648,  0, 28,656,  0,  0,  0,  0,648],
    [648,  0,  0,601,  0,  0,648,494,648,648,657,648,648,648,648],
    [648,  0,  0,648,  0,  0,492,  0,  0,  0,  0,648,  0,  0,648],
    [648,240,648,648,648,492,648,243,648,648,648,648,  0,  0,648],
    [648,  0,  0,648,  0,  0,648,  0,648,  0,  0,648,648,220,648],
    [648,  0,  0,249,  0,  0,648,  0,657,  0,  0,  0,  0,  0,648],
    [648,648,648,648,648,648,648,648,648,648,648,648,648,648,648]
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